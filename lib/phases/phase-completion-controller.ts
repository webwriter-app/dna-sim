import type {ReactiveController, ReactiveControllerHost} from "lit"

export interface PhaseCompletionHost {
  requestUpdate(): void
}

export interface PhaseCompleteToast {
  phase: string
  nextPhase: string
  message: string
}

/** Tracks phase-complete toasts and which phases stay unlocked this session. */
export class PhaseCompletionController implements ReactiveController {
  toast: PhaseCompleteToast | null = null

  private readonly _notified = new Set<string>()
  private readonly _unlocked = new Set<string>()

  constructor(private readonly _host: ReactiveControllerHost & PhaseCompletionHost) {
    _host.addController(this)
  }

  hostDisconnected() {}

  /** Show the toast for `phase` the first time this is called for it this session. No-ops afterwards. */
  notify(phase: string, nextPhase: string, message: string) {
    if (this._notified.has(phase)) return
    this._notified.add(phase)
    this._unlocked.add(phase)
    this.toast = {phase, nextPhase, message}
    this._host.requestUpdate()
  }

  /** Whether this phase has been completed at least once (skip-ahead stays allowed after a local retry). */
  hasCompleted(phase: string): boolean {
    return this._unlocked.has(phase)
  }

  /** Convenience for phases whose "complete" state is a derived boolean re-checked on every render. */
  checkComplete(phase: string, nextPhase: string, isComplete: boolean, message: string) {
    if (isComplete) this.notify(phase, nextPhase, message)
  }

  dismiss() {
    if (!this.toast) return
    this.toast = null
    this._host.requestUpdate()
  }

  /** Allow a phase to show its completion toast again after a phase-local retry. Unlock stays. */
  clearNotified(phase: string) {
    this._notified.delete(phase)
    if (this.toast?.phase === phase) this.toast = null
  }

  /** Sequence changed: this phase must be completed again before skip-ahead. */
  revoke(phase: string) {
    this._notified.delete(phase)
    this._unlocked.delete(phase)
    if (this.toast?.phase === phase) this.toast = null
    this._host.requestUpdate()
  }

  /** Full reset (e.g. widget sequence reset) — also clears "already shown" history. */
  reset() {
    this._notified.clear()
    this._unlocked.clear()
    this.toast = null
  }
}
