import {html, type ReactiveController} from "lit"

import type {CodonCardAction, CodonDrawerTab} from "./codon-card"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/** Codon reference drawer beside the canvas: open/close state, centering and rendering. */
export class CodonDrawerController implements ReactiveController {
  open = false
  /** True while the drawer is playing its slide-out/fade-out exit — kept
   * expanded (and its content mounted) until the animation finishes. */
  closing = false
  tab: CodonDrawerTab = "wheel"
  private closeTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private readonly host: WebwriterDnaSimulation) {
    host.addController(this)
  }

  hostDisconnected() {}

  /** Close without the exit animation. */
  close() {
    this.open = false
    this.closing = false
    if (this.closeTimer) {
      clearTimeout(this.closeTimer)
      this.closeTimer = null
    }
  }

  onCodonCardAction = (e: CustomEvent<CodonCardAction>) => {
    if (e.detail.action === "amino-pick") {
      this.host.mutationEdits.addTargetAmino(e.detail.aminoAcid)
      return
    }
    if (this.host.currentPhase !== "Translation") return
    switch (e.detail.action) {
      case "amino-drag-start":
        this.host.translation.setAminoDropHover(false)
        break
      case "amino-drag-move":
        this.host.translation.setAminoDropHover(
          this.hitsLargeSubunit(e.detail.clientX, e.detail.clientY),
        )
        break
      case "amino-drag-end": {
        const {payload, clientX, clientY} = e.detail
        this.host.translation.setAminoDropHover(false)
        if (!this.hitsLargeSubunit(clientX, clientY)) break

        const result = this.host.translation.tryPlaceAminoAcid(payload.aminoAcid)
        if (result === "ok" || result === "complete") {
          this.host.requestUpdate()
        }
        break
      }
    }
  }

  hitsLargeSubunit(clientX: number, clientY: number): boolean {
    const zone =
      (this.host.renderRoot.querySelector(".ribosome-aa-dropzone") as HTMLElement | null) ??
      (this.host.renderRoot.querySelector(".ribosome-border") as HTMLElement | null)
    if (!zone) return false
    const r = zone.getBoundingClientRect()
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
  }

  toggle = (e?: Event) => {
    e?.preventDefault()
    e?.stopPropagation()
    this.setOpen(!this.open)
  }

  /** Matches the .codon-drawer transition in codon-drawer.styles.ts. */
  static readonly DRAWER_TRANSITION_MS = 320
  static readonly CODON_DRAWER_WIDTH_PX = 400

  /** Open the codon drawer after snapping the ribosome, forcing a recenter even if it was already open. */
  openForRibosome() {
    const alreadyOpen = this.open && !this.closing
    this.setOpen(true)
    if (alreadyOpen) {
      this.centerOnActiveCodon()
    }
  }

  setOpen(open: boolean) {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer)
      this.closeTimer = null
    }

    if (open) {
      if (this.open && !this.closing) return
      this.closing = false
      this.open = true
      this.host.requestUpdate()
      // Pan immediately toward the post-drawer layout so centering runs with the
      // drawer slide instead of waiting for the width transition to finish.
      this.host.afterRender(() => {
        if (this.host.translation.snappedRibosome) {
          const canvas = this.host.renderRoot.querySelector(".canvas-row")
          const sideBySide = canvas && getComputedStyle(canvas).flexDirection === "row"
          this.centerOnActiveCodon(sideBySide ? CodonDrawerController.CODON_DRAWER_WIDTH_PX : 0)
        } else {
          this.host.workspace.refresh()
        }
      })
      return
    }

    if (!this.open) return
    // Closing: the panel starts collapsing immediately, but keep
    // <dna-codon-card> mounted until it's actually finished shrinking so
    // it doesn't leave the panel visibly narrowing around empty space.
    this.open = false
    this.closing = true
    this.host.requestUpdate()
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null
      this.closing = false
      this.host.requestUpdate()
      this.host.workspace.refresh()
    }, CodonDrawerController.DRAWER_TRANSITION_MS)
  }

  onTransition = (event: TransitionEvent) => {
    if (event.target !== event.currentTarget || event.propertyName !== "height") return
    if (this.open && this.host.currentPhase === "Translation" && this.host.translation.snappedRibosome) {
      this.centerOnActiveCodon()
    }
  }

  /** Keep the ribosome's current codon in the middle of the visible canvas. */
  centerOnActiveCodon(widthInset = 0) {
    this.host.workspace.centerOnTranslationCodon(this.host.translation.codonIndex, widthInset)
  }

  centerOnPolypeptide(widthInset = 0) {
    if (this.host.translation.polypeptide.length === 0) return
    this.host.workspace.centerOnTranslationPolypeptide(widthInset)
  }

  setTab(tab: CodonDrawerTab) {
    this.tab = tab
    this.host.requestUpdate()
  }

  renderToggle() {
    const open = this.host.view.showCodonReference && this.open
    const msg = this.host.msg
    return html`
      <button
        type="button"
        class="codon-drawer-toggle ${open ? "is-open" : ""}"
        aria-expanded="${open}"
        aria-label="${open ? msg("Close codon reference") : msg("Open codon reference")}"
        title="${msg("Codon reference")}"
        @click=${this.toggle}>
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <line x1="2.5" y1="4" x2="13.5" y2="4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <line x1="2.5" y1="8" x2="13.5" y2="8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <line x1="2.5" y1="12" x2="13.5" y2="12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </button>
    `
  }

  renderDrawer() {
    const {host} = this
    const msg = host.msg
    const showCodon = host.view.showCodonReference
    const codonOpen = showCodon && this.open
    const codonVisible = showCodon && (this.open || this.closing)
    const listOnly = host.currentPhase === "Mutations"
    const tab: CodonDrawerTab = listOnly ? "list" : this.tab
    return html`
      <div class="codon-drawer ${codonOpen ? "is-open" : ""}" @transitionend=${this.onTransition}>
        <div class="codon-drawer-body">
          <div class="codon-drawer-header ${listOnly ? "codon-drawer-header--list" : ""} ${listOnly && host.view.mutationTeacherEditing ? "codon-drawer-header--tip" : ""}">
            ${listOnly
              ? html`
                <span class="drawer-title ${host.view.mutationTeacherEditing ? "is-teacher-tip" : ""}">
                  ${host.view.mutationTeacherEditing
                    ? msg("Click an amino acid to add it to the goal.")
                    : msg("Amino acids")}
                </span>
              `
              : html`
                <nav class="drawer-tabs" aria-label="${msg("Codon reference view")}">
                  <button
                    type="button"
                    class="drawer-tab ${tab === "wheel" ? "active" : ""}"
                    aria-pressed="${tab === "wheel"}"
                    @click=${() => this.setTab("wheel")}>
                    ${msg("Wheel")}
                  </button>
                  <button
                    type="button"
                    class="drawer-tab ${tab === "list" ? "active" : ""}"
                    aria-pressed="${tab === "list"}"
                    @click=${() => this.setTab("list")}>
                    ${msg("List")}
                  </button>
                </nav>
              `}
            <button
              type="button"
              class="codon-drawer-close"
              aria-label="${msg("Close codon reference")}"
              title="${msg("Close codon reference")}"
              @click=${() => this.setOpen(false)}>
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="codon-drawer-inner ${listOnly ? "is-flush-top" : ""}">
            ${codonVisible
              ? html`
                <dna-codon-card
                  .tab=${tab}
                  .allowDrag=${host.currentPhase === "Translation"}
                  .pickable=${host.view.mutationTeacherEditing}
                  @dna-codon-card-action=${this.onCodonCardAction}>
                </dna-codon-card>
              `
              : null}
          </div>
        </div>
      </div>
    `
  }
}
