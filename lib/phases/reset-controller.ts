import type {ReactiveController, ReactiveControllerHost} from "lit"
import {str, type MsgFn} from "@lit/localize"

import {localizedPhaseLabel} from "../localize-text.js"

export type ResetConfirmKind = "simulation" | "phase"

/**
 * What the reset controller needs from the widget. Phase-specific side effects
 * stay on the host; this controller owns confirm-dialog state and the reset
 * sequencing (including recenter-after-drawer-close for a full wipe).
 */
export interface ResetHost {
  readonly msg: MsgFn
  requestUpdate(): void
  afterRender(callback: () => void): void
  readonly currentPhase: string

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

  hostDisconnected() { this.confirmKind = null }

  get confirmOpen(): boolean {
    return this.confirmKind !== null
  }

  get confirmLabel(): string {
    return this.confirmKind === "phase" ? this._host.msg("Start over") : this._host.msg("Reset all")
  }

  get confirmMessage(): string {
    if (this.confirmKind === "phase") {
      return this._host.msg(str`Are you sure you want to reset the ${localizedPhaseLabel(this._host.msg, this._host.currentPhase)} phase?`)
    }
    return this._host.msg("Are you sure you want to reset all of your progress?")
  }

  get confirmActionLabel(): string {
    return this.confirmKind === "phase" ? this._host.msg("Start over") : this._host.msg("Reset all")
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
    this._host.clearAllSimulationState()
    this._host.enterFirstVisiblePhaseAfterFullReset()
    this._host.requestUpdate()
    this._host.afterRender(() => {
      this._host.resetCanvasView(this._host.defaultZoomForPhase(this._host.currentPhase))
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
