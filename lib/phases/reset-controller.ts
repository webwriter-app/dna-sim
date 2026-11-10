import type {ReactiveController, ReactiveControllerHost} from "lit"
import {msg, str} from "@lit/localize"

import {localizedPhaseLabel} from "../localize-text.js"

export type ResetConfirmKind = "simulation" | "phase"

/**
 * What the reset controller needs from the widget. Phase-specific side effects
 * stay on the host; this controller owns confirm-dialog state and the reset
 * sequencing (including recenter-after-drawer-close for a full wipe).
 */
export interface ResetHost {
  requestUpdate(): void
  readonly updateComplete: Promise<unknown>
  readonly currentPhase: string
  readonly renderRoot: ParentNode
  /** Whether the Translation codon drawer is open (affects full-reset recenter). */
  readonly codonDrawerOpen: boolean

  clearAllSimulationState(): void
  enterFirstVisiblePhaseAfterFullReset(): void
  resetCanvasView(zoom: number): void
  defaultZoomForPhase(phase: string): number

  stopTimer(): void
  resetReplicationPhase(): void
  resetTranscriptionPhase(): void
  resetTranslationPhase(): void
  resetMutationsPhase(): void
  clearPhaseCompletionNotified(phase: string): void
}

/**
 * Confirm-dialog state + reset orchestration for "Reset all" and per-phase
 * "Start over". Keeps that flow out of the main widget file.
 */
export class ResetController implements ReactiveController {
  confirmKind: ResetConfirmKind | null = null

  constructor(private readonly _host: ReactiveControllerHost & ResetHost) {
    _host.addController(this)
  }

  hostDisconnected() {}

  get confirmOpen(): boolean {
    return this.confirmKind !== null
  }

  get confirmLabel(): string {
    return this.confirmKind === "phase" ? msg("Start over") : msg("Reset all")
  }

  get confirmMessage(): string {
    if (this.confirmKind === "phase") {
      return msg(str`Are you sure you want to reset the ${localizedPhaseLabel(this._host.currentPhase)} phase?`)
    }
    return msg("Are you sure you want to reset all of your progress?")
  }

  get confirmActionLabel(): string {
    return this.confirmKind === "phase" ? msg("Start over") : msg("Reset all")
  }

  requestSimulation() {
    this.confirmKind = "simulation"
    this._host.requestUpdate()
  }

  requestPhase() {
    this.confirmKind = "phase"
    this._host.requestUpdate()
  }

  closeConfirm() {
    if (this.confirmKind === null) return
    this.confirmKind = null
    this._host.requestUpdate()
  }

  confirm() {
    const kind = this.confirmKind
    this.confirmKind = null
    this._host.requestUpdate()
    if (kind === "simulation") this.resetSimulation()
    else if (kind === "phase") this.resetCurrentPhase()
  }

  /** Wipe every phase and return to the first visible phase, then recenter like a double-click. */
  resetSimulation() {
    const drawerWasOpen = this._host.codonDrawerOpen
    this._host.clearAllSimulationState()
    this._host.enterFirstVisiblePhaseAfterFullReset()
    this._host.requestUpdate()

    const recenter = () => {
      this._host.resetCanvasView(this._host.defaultZoomForPhase(this._host.currentPhase))
    }

    void this._host.updateComplete.then(() => {
      requestAnimationFrame(() => {
        if (!drawerWasOpen) {
          recenter()
          return
        }

        const drawer = this._host.renderRoot.querySelector(".codon-drawer")
        if (!(drawer instanceof HTMLElement)) {
          recenter()
          return
        }

        const onEnd = (e: TransitionEvent) => {
          if (e.target !== drawer || e.propertyName !== "width") return
          drawer.removeEventListener("transitionend", onEnd)
          recenter()
        }
        drawer.addEventListener("transitionend", onEnd)

        requestAnimationFrame(() => {
          if (getComputedStyle(drawer).width === "0px") {
            drawer.removeEventListener("transitionend", onEnd)
            recenter()
          }
        })
      })
    })
  }

  /** Restart only the currently selected phase. */
  resetCurrentPhase() {
    this._host.stopTimer()
    switch (this._host.currentPhase) {
      case "Replication":
        this._host.resetReplicationPhase()
        break
      case "Transcription":
        this._host.resetTranscriptionPhase()
        break
      case "Translation":
        this._host.resetTranslationPhase()
        break
      case "Mutations":
        this._host.resetMutationsPhase()
        break
      default:
        break
    }
    this._host.clearPhaseCompletionNotified(this._host.currentPhase)
    this._host.requestUpdate()
  }
}
