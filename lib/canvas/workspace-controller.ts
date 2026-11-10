import type {ReactiveController, ReactiveControllerHost} from "lit"
import {html, type TemplateResult} from "lit"

import {translationCodonCenter} from "../render-strand.js"
import {ViewportController} from "./viewport.js"

/** World-px nudge for Translation codon centering. Positive = strand shifts right / down on screen. */
const TRANSLATION_CENTER_NUDGE_X = 0
const TRANSLATION_CENTER_NUDGE_Y = -120

export interface WorkspaceControllerOptions {
  getZoomLevel: () => number
  setZoomLevel: (zoom: number) => void
  getPanEnabled: () => boolean
  getBottomReserve?: () => number
  /** Fired on viewport click (e.g. clear Mutations selection when clicking away). */
  onViewportClick?: (e: MouseEvent) => void
  /** Fired on user pan/zoom (dismiss overlays that are screen-anchored). */
  onUserPanZoom?: () => void
}

/**
 * Lit reactive controller — pan/zoom canvas logic shared by the widget.
 * Renders inside the host's shadow DOM (no nested custom element / slot issues).
 */
export class WorkspaceController implements ReactiveController {
  private _host: ReactiveControllerHost
  readonly vp: ViewportController

  private _resizeObserver: ResizeObserver | null = null
  private _centerRaf = 0
  private _didInitialCenter = false
  private _wheelTarget: HTMLElement | null = null
  private _isAdjusting = false
  private _adjustTimer: ReturnType<typeof setTimeout> | null = null

  constructor(host: ReactiveControllerHost, private readonly opts: WorkspaceControllerOptions) {
    this._host = host
    this.vp = new ViewportController({
      getZoom: opts.getZoomLevel,
      setZoom: opts.setZoomLevel,
      isEnabled: opts.getPanEnabled,
      onChange: () => {
        this._clampToBounds()
        host.requestUpdate()
      },
      onUserPanZoom: () => opts.onUserPanZoom?.(),
    })
    host.addController(this)
  }

  hostConnected() {
    this._scheduleCenter()
  }

  hostDisconnected() {
    this._wheelTarget?.removeEventListener("wheel", this._onWheel)
    this._wheelTarget = null
    this._resizeObserver?.disconnect()
    this._resizeObserver = null
    if (this._centerRaf) cancelAnimationFrame(this._centerRaf)
    if (this._adjustTimer) clearTimeout(this._adjustTimer)
  }

  hostUpdated() {
    this._ensureObserver()
    this._ensureWheelListener()
    this._scheduleCenter()
  }

  private _ensureWheelListener() {
    const vp = this._viewportEl
    if (!vp || vp === this._wheelTarget) return
    this._wheelTarget?.removeEventListener("wheel", this._onWheel)
    this._wheelTarget = vp
    vp.addEventListener("wheel", this._onWheel, {passive: false})
  }

  resetView(zoom = 100) {
    const vp = this._viewportEl
    const content = this._contentEl
    if (!vp || !content) return
    this.vp.reset(
      vp.clientWidth,
      vp.clientHeight,
      content.offsetWidth,
      content.offsetHeight,
      this._bottomReserve(),
      zoom,
    )
  }

  /** Re-clamp pan against the current viewport size (e.g. after a layout reflow) without resetting zoom. */
  refresh() {
    this._beginAdjust()
    this._clampToBounds()
    this._host.requestUpdate()
    this._endAdjustSoon()
  }

  /**
   * Pan so a world point (relative to `.workspace-content` / stage space)
   * sits in the middle of the visible canvas.
   */
  centerOnWorldPoint(worldX: number, worldY: number) {
    requestAnimationFrame(() => requestAnimationFrame(() => this._panToWorld(worldX, worldY)))
  }

  /**
   * Center the active Translation codon using target layout math (codon index
   * + pairs-wrap origin), not the live ribosome rect — that rect lags during
   * the CSS left/top transition after a successful amino-acid drop.
   */
  centerOnTranslationCodon(codonIndex: number, widthInset = 0) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const content = this._contentEl
      const wrap = content?.querySelector(".strand-pairs-wrap") as HTMLElement | null
      if (!content || !wrap) {
        this.refresh()
        return
      }

      const scale = Math.max(this.opts.getZoomLevel() / 100, 0.01)
      const contentRect = content.getBoundingClientRect()
      const wrapRect = wrap.getBoundingClientRect()
      const wrapWorldX = (wrapRect.left - contentRect.left) / scale
      const wrapWorldY = (wrapRect.top - contentRect.top) / scale
      const local = translationCodonCenter(codonIndex)
      // Positive values shift the strand right / down on screen.
      this._panToWorld(
        wrapWorldX + local.x - TRANSLATION_CENTER_NUDGE_X,
        wrapWorldY + local.y - TRANSLATION_CENTER_NUDGE_Y,
        widthInset,
      )
    }))
  }

  /**
   * Center the polypeptide chain after stop-codon ribosome release.
   */
  centerOnTranslationPolypeptide(widthInset = 0) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const vp = this._viewportEl
      const content = this._contentEl
      if (!vp || !content) {
        this.refresh()
        return
      }

      const residues = content.querySelectorAll(".polypeptide-residue")
      if (residues.length === 0) {
        this.refresh()
        return
      }

      let minL = Infinity
      let minT = Infinity
      let maxR = -Infinity
      let maxB = -Infinity
      residues.forEach((node) => {
        const r = (node as HTMLElement).getBoundingClientRect()
        minL = Math.min(minL, r.left)
        minT = Math.min(minT, r.top)
        maxR = Math.max(maxR, r.right)
        maxB = Math.max(maxB, r.bottom)
      })

      const scale = Math.max(this.opts.getZoomLevel() / 100, 0.01)
      const vpRect = vp.getBoundingClientRect()
      const screenCx = (minL + maxR) / 2 - vpRect.left
      const screenCy = (minT + maxB) / 2 - vpRect.top
      const worldX = (screenCx - this.vp.panX) / scale
      const worldY = (screenCy - this.vp.panY) / scale
      this._panToWorld(worldX, worldY, widthInset)
    }))
  }

  /**
   * Pan so the center of the first matching element (inside the workspace
   * content) sits in the middle of the visible canvas.
   */
  centerOnSelector(selector: string) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const vp = this._viewportEl
      const content = this._contentEl
      if (!vp || !content) return

      const el = content.querySelector(selector) as HTMLElement | null
      if (!el) {
        this.refresh()
        return
      }

      // Prefer authored style left/top/width/height (target layout) over
      // getBoundingClientRect, which lags during CSS left/top transitions.
      const styleLeft = parseFloat(el.style.left)
      const styleTop = parseFloat(el.style.top)
      const styleW = parseFloat(el.style.width)
      const styleH = parseFloat(el.style.height)
      let worldX: number
      let worldY: number
      if (
        Number.isFinite(styleLeft) &&
        Number.isFinite(styleTop) &&
        Number.isFinite(styleW) &&
        Number.isFinite(styleH)
      ) {
        // Position relative to stage (transform root), not offsetParent-walk
        // to content — content is unpositioned and skipped by offsetParent.
        const stage = content.parentElement
        worldX = styleLeft + styleW / 2
        worldY = styleTop + styleH / 2
        let node = el.offsetParent as HTMLElement | null
        while (node && node !== stage) {
          worldX += node.offsetLeft
          worldY += node.offsetTop
          node = node.offsetParent as HTMLElement | null
        }
      } else {
        const scale = this.opts.getZoomLevel() / 100
        const vpRect = vp.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        const screenCx = elRect.left + elRect.width / 2 - vpRect.left
        const screenCy = elRect.top + elRect.height / 2 - vpRect.top
        worldX = (screenCx - this.vp.panX) / scale
        worldY = (screenCy - this.vp.panY) / scale
      }

      this._panToWorld(worldX, worldY)
    }))
  }

  private _panToWorld(worldX: number, worldY: number, widthInset = 0) {
    const vp = this._viewportEl
    if (!vp) return
    this._beginAdjust()
    this.vp.centerOnPoint(
      worldX,
      worldY,
      Math.max(0, vp.clientWidth - widthInset),
      vp.clientHeight,
      this._bottomReserve(),
    )
    this._clampToBounds()
    this._host.requestUpdate()
    this._endAdjustSoon()
  }

  private _beginAdjust() {
    this._isAdjusting = true
    if (this._adjustTimer) clearTimeout(this._adjustTimer)
  }

  private _endAdjustSoon() {
    if (this._adjustTimer) clearTimeout(this._adjustTimer)
    this._adjustTimer = setTimeout(() => {
      this._isAdjusting = false
      this._host.requestUpdate()
    }, 320)
  }

  render(content: TemplateResult): TemplateResult {
    const vp = this.vp
    const scale = this.opts.getZoomLevel() / 100

    return html`
      <div class="workspace-root" @dblclick="${this._onDblClick}">
        <div
          class="workspace-viewport ${vp.isPanning ? "is-panning" : ""}"
          tabindex="0"
          @click="${this._onViewportClick}"
          @pointerdown="${this._onPointerDown}"
          @pointermove="${this._onPointerMove}"
          @pointerup="${this._onPointerUp}"
          @pointercancel="${this._onPointerUp}">
          <div
            class="workspace-stage ${this._isAdjusting ? "is-adjusting" : ""}"
            style="transform:translate(${vp.panX}px,${vp.panY}px) scale(${scale})">
            <div class="workspace-content">
              ${content}
            </div>
          </div>
        </div>

        <div class="zoom-indicator">${this.opts.getZoomLevel()}%</div>
      </div>
    `
  }

  private get _viewportEl(): HTMLElement | null {
    return (this._host as unknown as {renderRoot: HTMLElement}).renderRoot
      ?.querySelector(".workspace-viewport") ?? null
  }

  private get _contentEl(): HTMLElement | null {
    return (this._host as unknown as {renderRoot: HTMLElement}).renderRoot
      ?.querySelector(".workspace-content") ?? null
  }

  private _ensureObserver() {
    const vp = this._viewportEl
    const content = this._contentEl
    if (!vp || !content) return

    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(() => this._scheduleCenter())
      this._resizeObserver.observe(vp)
      this._resizeObserver.observe(content)
    }
  }

  private _scheduleCenter() {
    if (this._centerRaf) cancelAnimationFrame(this._centerRaf)
    this._centerRaf = requestAnimationFrame(() => {
      this._centerRaf = requestAnimationFrame(() => this._maybeCenter())
    })
  }

  private _maybeCenter() {
    const vp = this._viewportEl
    const content = this._contentEl
    if (
      !vp ||
      !content ||
      vp.clientHeight === 0 ||
      content.offsetWidth === 0 ||
      content.offsetHeight === 0
    ) {
      return
    }

    if (!this._didInitialCenter) {
      this._didInitialCenter = true
      this.vp.center(
        vp.clientWidth,
        vp.clientHeight,
        content.offsetWidth,
        content.offsetHeight,
        this._bottomReserve(),
      )
    }
  }

  private _bottomReserve(): number {
    return this.opts.getBottomReserve?.() ?? 0
  }

  private _clampToBounds() {
    const vp = this._viewportEl
    const content = this._contentEl
    if (!vp || !content || content.offsetWidth === 0 || content.offsetHeight === 0) return
    this.vp.clampPan(
      vp.clientWidth,
      vp.clientHeight,
      content.offsetWidth,
      content.offsetHeight,
      this._bottomReserve(),
    )
  }

  private _isBackgroundTarget(e: PointerEvent): boolean {
    const t = e.target as HTMLElement
    return (
      t.classList.contains("workspace-root") ||
      t.classList.contains("workspace-viewport") ||
      t.classList.contains("workspace-stage") ||
      t.classList.contains("workspace-content")
    )
  }

  private _onDblClick = (e: MouseEvent) => {
    e.preventDefault()
    const vp = this._viewportEl
    const content = this._contentEl
    if (!vp || !content) return
    this.vp.center(
      vp.clientWidth,
      vp.clientHeight,
      content.offsetWidth,
      content.offsetHeight,
      this._bottomReserve(),
    )
    // Recenter moves the strand under a screen-fixed menu — dismiss like pan/zoom.
    this.opts.onUserPanZoom?.()
  }

  private _onViewportClick = (e: MouseEvent) => {
    this.opts.onViewportClick?.(e)
  }

  private _onWheel = (e: WheelEvent) => {
    const vp = this._viewportEl
    if (!vp) return
    this.vp.wheel(e, vp)
  }

  private _onPointerDown = (e: PointerEvent) => {
    this.vp.pointerDown(e, this._isBackgroundTarget(e))
  }

  private _onPointerMove = (e: PointerEvent) => {
    const vp = this._viewportEl
    if (!vp) return
    this.vp.pointerMove(e, vp)
  }

  private _onPointerUp = (e: PointerEvent) => {
    this.vp.pointerUp(e)
  }
}
