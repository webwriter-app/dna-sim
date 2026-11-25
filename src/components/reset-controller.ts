import type {ReactiveController} from "lit"
import {str} from "@lit/localize"

import {localizedPhaseLabel} from "./localize-text"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

export type ResetConfirmKind = "simulation" | "phase"

/**
 * Confirm-dialog state + reset orchestration for "Reset all" and per-phase
 * "Start over". Keeps that flow out of the main widget file.
 */
export class ResetController implements ReactiveController {
  confirmKind: ResetConfirmKind | null = null

  constructor(private readonly _host: WebwriterDnaSimulation) {
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
    this._host.flow.clearAll()
    this._host.flow.enterFirstVisiblePhaseAfterFullReset()
    this._host.requestUpdate()
    this._host.afterRender(() => {
      this._host.workspace.resetView(this._host.flow.defaultZoomForPhase(this._host.currentPhase))
    })
  }

  /** Restart only the currently selected phase. */
  resetCurrentPhase() {
    this._host.flow.stopTimer()
    switch (this._host.currentPhase) {
      case "Replication":
        this._host.flow.resetReplicationPhase()
        break
      case "Transcription":
        this._host.flow.resetTranscriptionPhase()
        break
      case "Translation":
        this._host.flow.resetTranslationPhase()
        break
      case "Mutations":
        this._host.flow.resetMutationsPhase()
        break
      default:
        break
    }
    this._host.phaseCompletion.clearNotified(this._host.currentPhase)
    this._host.requestUpdate()
  }
}
