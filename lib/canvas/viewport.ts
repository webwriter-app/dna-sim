/**
 * Pan/zoom viewport controller — pure logic, no Lit dependency.
 *
 * Mouse:  wheel = pan, Ctrl+wheel = zoom at cursor, Shift+drag / middle-button = pan
 * Touch:  one finger on empty area = pan, two fingers = pinch zoom
 */

export const MIN_ZOOM = 25
export const MAX_ZOOM = 200
export const ZOOM_SENSITIVITY = 3
export const PAN_SENSITIVITY = 1

type Drag = { px: number; py: number; ox: number; oy: number }
type Pinch = { dist: number; zoom: number; cx: number; cy: number; panX: number; panY: number }

export interface ViewportCallbacks {
  getZoom: () => number
  setZoom: (zoom: number) => void
  isEnabled: () => boolean
  onChange: () => void
  /** User-driven pan/zoom only (not programmatic center/reset). */
  onUserPanZoom?: () => void
}

export class ViewportController {
  panX = 0
  panY = 0
  isPanning = false

  private _drag: Drag | null = null
  private _pointers = new Map<number, { x: number; y: number }>()
  private _pinch: Pinch | null = null

  constructor(private readonly cb: ViewportCallbacks) {}

  private get _zoom() {
    return this.cb.getZoom()
  }

  private get _scale() {
    return this._zoom / 100
  }

  /** Convert a screen point (relative to viewport element) to world coordinates. */
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.panX) / this._scale,
      y: (sy - this.panY) / this._scale,
    }
  }

  /** Convert world coordinates to screen point (relative to viewport element). */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx * this._scale + this.panX,
      y: wy * this._scale + this.panY,
    }
  }

  wheel(e: WheelEvent, viewportEl: HTMLElement) {
    if (!this.cb.isEnabled()) return

    const rect = viewportEl.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    e.preventDefault()

    // Ctrl+wheel (or trackpad pinch) → zoom centered on cursor
    if (e.ctrlKey) {
      this._zoomAtPoint(mx, my, e.deltaY < 0 ? ZOOM_SENSITIVITY : -ZOOM_SENSITIVITY)
      return
    }

    // Plain wheel → pan
    this.panX -= e.deltaX * PAN_SENSITIVITY
    this.panY -= e.deltaY * PAN_SENSITIVITY
    this._notifyUserPanZoom()
  }

  pointerDown(e: PointerEvent, isBackground: boolean) {
    if (!this.cb.isEnabled()) return

    this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (this._pointers.size === 2) {
      this._startPinch(e.currentTarget as HTMLElement)
      this._drag = null
      this.isPanning = false
      return
    }

    const mousePan = e.button === 1 || (e.button === 0 && e.shiftKey)
    const touchPan = e.pointerType === "touch" && e.button === 0 && isBackground
    if (!mousePan && !touchPan) return

    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    this._drag = { px: e.clientX, py: e.clientY, ox: this.panX, oy: this.panY }
    this.isPanning = true
    this._notifyUserPanZoom()
  }

  pointerMove(e: PointerEvent, viewportEl: HTMLElement) {
    if (this._pointers.has(e.pointerId)) {
      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    if (this._pointers.size === 2 && this._pinch) {
      this._updatePinch(viewportEl)
      return
    }

    if (!this._drag) return
    this.panX = this._drag.ox + (e.clientX - this._drag.px)
    this.panY = this._drag.oy + (e.clientY - this._drag.py)
    this._notifyUserPanZoom()
  }

  pointerUp(e: PointerEvent) {
    this._pointers.delete(e.pointerId)
    if (this._pointers.size < 2) this._pinch = null

    if (this._drag) {
      this._drag = null
      this.isPanning = false
      this.cb.onChange()
    }
  }

  /** Center content within the viewport at the current zoom level. */
  center(
    viewportW: number,
    viewportH: number,
    contentW: number,
    contentH: number,
    bottomReserve = 0,
  ) {
    const scale = this._scale
    const effectiveH = Math.max(0, viewportH - bottomReserve)
    this.panX = (viewportW - contentW * scale) / 2
    this.panY = (effectiveH - contentH * scale) / 2
    this.cb.onChange()
  }

  /**
   * Pan so a world-space point lands at the center of the (usable) viewport.
   * Does not change zoom. Caller should clamp afterwards if needed.
   */
  centerOnPoint(
    worldX: number,
    worldY: number,
    viewportW: number,
    viewportH: number,
    bottomReserve = 0,
  ) {
    const scale = this._scale
    const effectiveH = Math.max(0, viewportH - bottomReserve)
    this.panX = viewportW / 2 - worldX * scale
    this.panY = effectiveH / 2 - worldY * scale
    this.cb.onChange()
  }

  reset(
    viewportW: number,
    viewportH: number,
    contentW: number,
    contentH: number,
    bottomReserve = 0,
    zoom = 100,
  ) {
    this.cb.setZoom(zoom)
    this.center(viewportW, viewportH, contentW, contentH, bottomReserve)
  }

  /** Keep pan within sensible bounds so content cannot drift out of reach. */
  clampPan(
    viewportW: number,
    viewportH: number,
    contentW: number,
    contentH: number,
    bottomReserve = 0,
  ) {
    const scale = this._scale
    const worldW = contentW * scale
    const effectiveH = Math.max(0, viewportH - bottomReserve)
    this.panX = this._clampPanAxis(this.panX, viewportW, worldW)
    this.panY = this._clampPanAxis(this.panY, effectiveH, contentH * scale)
  }

  /** Keep pan within bounds, but allow dragging until only a thin strip of content remains visible. */
  private _clampPanAxis(pan: number, viewSize: number, worldSize: number): number {
    const keepVisible = 40
    const maxPan = viewSize - keepVisible
    const minPan = keepVisible - worldSize
    return Math.max(minPan, Math.min(maxPan, pan))
  }

  private _zoomAtPoint(mx: number, my: number, delta: number) {
    const prev = this._zoom
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta))
    if (next === prev) return

    const s0 = prev / 100
    const s1 = next / 100
    const wx = (mx - this.panX) / s0
    const wy = (my - this.panY) / s0

    this.cb.setZoom(next)
    this.panX = mx - wx * s1
    this.panY = my - wy * s1
    this._notifyUserPanZoom()
  }

  private _startPinch(viewportEl: HTMLElement) {
    const pts = [...this._pointers.values()]
    const dx = pts[1].x - pts[0].x
    const dy = pts[1].y - pts[0].y
    const rect = viewportEl.getBoundingClientRect()
    const cx = (pts[0].x + pts[1].x) / 2 - rect.left
    const cy = (pts[0].y + pts[1].y) / 2 - rect.top

    this._pinch = {
      dist: Math.hypot(dx, dy),
      zoom: this._zoom,
      cx,
      cy,
      panX: this.panX,
      panY: this.panY,
    }
  }

  private _updatePinch(viewportEl: HTMLElement) {
    if (!this._pinch) return
    const pts = [...this._pointers.values()]
    const dx = pts[1].x - pts[0].x
    const dy = pts[1].y - pts[0].y
    const dist = Math.hypot(dx, dy)
    if (dist < 1 || this._pinch.dist < 1) return

    const ratio = dist / this._pinch.dist
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this._pinch.zoom * ratio))
    const s0 = this._pinch.zoom / 100
    const s1 = next / 100
    const { cx, cy, panX, panY } = this._pinch
    const wx = (cx - panX) / s0
    const wy = (cy - panY) / s0

    this.cb.setZoom(next)
    this.panX = cx - wx * s1
    this.panY = cy - wy * s1
    this._notifyUserPanZoom()
  }

  private _notifyUserPanZoom() {
    this.cb.onUserPanZoom?.()
    this.cb.onChange()
  }
}
