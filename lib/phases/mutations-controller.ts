import type {ReactiveController, ReactiveControllerHost} from "lit"

import type {MutationStrandSide} from "../render-strand.js"
import {COMP_DNA_BASE, sanitizeDnaBase} from "./mutations.js"

export type MutationFlyout = "substitution" | "insertion"

/** What the mutations controller needs from the widget. */
export interface MutationsHost {
  requestUpdate(): void
  /** Sequence shown and edited in the Mutations tab (lesson DNA or a session copy). */
  readonly mutationsSequence: string
  readonly currentPhase: string
}

/**
 * Mutations-phase selection + context-menu state (including which submenu is open).
 */
export class MutationsController implements ReactiveController {
  selectedIndex: number | null = null
  selectedStrand: MutationStrandSide | null = null
  menuOpen = false
  flyout: MutationFlyout | null = null
  /**
   * Which side of the base the primary menu sits on (from sl-popup's live
   * placement). Submenus open outward on this same side.
   */
  menuSide: "left" | "right" = "right"

  constructor(private readonly _host: ReactiveControllerHost & MutationsHost) {
    _host.addController(this)
  }

  hostConnected() {
    window.addEventListener("keydown", this._onKeyDown)
  }

  hostDisconnected() {
    window.removeEventListener("keydown", this._onKeyDown)
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return
    if (this._host.currentPhase !== "Mutations") return
    if (!this.menuOpen && this.selectedIndex === null) return
    e.preventDefault()
    this.dismiss()
  }

  get currentBase(): string | null {
    if (this.selectedIndex === null) return null
    const base = this._host.mutationsSequence[this.selectedIndex]
    return base ?? null
  }

  /**
   * Base shown on the strand the user clicked (template or its complement).
   * Menu icons / substitute options use this, not always the template char.
   */
  get displayBase(): string | null {
    const template = this.currentBase
    if (template === null) return null
    if (this.selectedStrand !== "complement") return template
    return COMP_DNA_BASE[sanitizeDnaBase(template) ?? "A"]
  }

  /** Open (or move) the menu for a clicked base. */
  openAt(index: number, strand: MutationStrandSide) {
    if (this._host.currentPhase !== "Mutations") return
    if (index < 0 || index >= this._host.mutationsSequence.length) return
    this.selectedIndex = index
    this.selectedStrand = strand
    this.menuOpen = true
    this.flyout = null
    this.menuSide = "right"
    this._host.requestUpdate()
  }

  /** Reselect a logged edit; stale indices are clamped to the current length. */
  selectAt(index: number) {
    const len = this._host.mutationsSequence.length
    if (len <= 0) {
      this.dismiss()
      return
    }
    this.openAt(Math.max(0, Math.min(index, len - 1)), "template")
  }

  toggleFlyout(flyout: MutationFlyout) {
    this.flyout = this.flyout === flyout ? null : flyout
    this._host.requestUpdate()
  }

  /** Sync submenu direction from sl-popup's `data-current-placement`. */
  setMenuSideFromPlacement(placement: string) {
    const side = placement.startsWith("left") ? "left" : "right"
    if (this.menuSide === side) return
    this.menuSide = side
    this._host.requestUpdate()
  }

  /** Clear selection and close the menu. */
  dismiss() {
    if (
      this.selectedIndex === null &&
      this.selectedStrand === null &&
      !this.menuOpen &&
      this.flyout === null
    ) {
      return
    }
    this.selectedIndex = null
    this.selectedStrand = null
    this.menuOpen = false
    this.flyout = null
    this.menuSide = "right"
    this._host.requestUpdate()
  }

  /** Keep selection glow in range after sequence length changes. */
  clampSelection(sequenceLength: number) {
    if (this.selectedIndex === null) return
    if (sequenceLength <= 0) {
      this.dismiss()
      return
    }
    if (this.selectedIndex >= sequenceLength) {
      this.selectedIndex = sequenceLength - 1
      this._host.requestUpdate()
    }
  }
}
