import type {ReactiveController, ReactiveControllerHost} from "lit"

import {
  DEFAULT_MRNA_BATCH_VERIFY_MODE,
  DEFAULT_MRNA_INPUT_MODE,
  expectedRnaBase,
  isTranscriptionComplete,
  mrnaEmptyMessage,
  mrnaIncompleteMessageForDraft,
  mrnaIncorrectMessage,
  mrnaWrongBaseMessage,
  normalizeMrnaBatchVerifyMode,
  normalizeMrnaInputMode,
  readMrnaBatchVerifyModeAttr,
  readMrnaInputModeAttr,
  sanitizeMrnaInput,
  verifyMrnaInput,
  type MrnaBatchVerifyMode,
  type MrnaInputMode,
} from "./transcription.js"

export type MrnaRejectAnim = {
  index: number
  base: string
  phase: "enter" | "error" | "exit"
}

/** What the transcription controller needs from the widget. */
export interface TranscriptionHost {
  readonly dnaSequence: string
  readonly currentPhase: string
  readonly hasUpdated: boolean
  mrnaInputMode: MrnaInputMode
  mrnaBatchVerifyMode: MrnaBatchVerifyMode
  getAttribute(name: string): string | null
  requestUpdate(): void
  showErrorAlert(message: string): void
  playSlotSnapFade(): void
  /** Called when transcription has fully completed and final base animation settled. */
  onTranscriptionCompleteReady(): void
  /** Focus the batch mRNA field after the next host render (input must be enabled). */
  focusMrnaInput(): void
}

/**
 * Owns all mRNA/transcription state and logic: typing, verifying, step
 * animations, batch verify, and the mrnaInputMode/mrnaBatchVerifyMode
 * side-panel attribute sync. A real ReactiveController (like WorkspaceController) —
 * state lives here, not on the widget.
 */
export class TranscriptionController implements ReactiveController {
  transcriptionStep = 0
  snappedPolymerase = false
  mrnaBuilt = ""
  mrnaDraft = ""
  mrnaCheckpoint = 0
  awaitingRnaBase = false
  batchVerifyRunning = false
  mrnaEnteringIndex: number | null = null
  mrnaSuccessIndex: number | null = null
  mrnaRejectAnim: MrnaRejectAnim | null = null

  private _appliedInputMode: MrnaInputMode = DEFAULT_MRNA_INPUT_MODE
  private _appliedBatchVerifyMode: MrnaBatchVerifyMode = DEFAULT_MRNA_BATCH_VERIFY_MODE
  private _batchVerifyDraft: string | null = null
  private _animDone: (() => void) | null = null
  /** When false, reject flash runs without the mid-animation alert (caller shows it after). */
  private _rejectAlertDuring = true
  private _modeObserver: MutationObserver | null = null

  constructor(private readonly _host: ReactiveControllerHost & TranscriptionHost) {
    _host.addController(this)
  }

  hostConnected() {
    this.syncInputModeFromDom(false)
    this.syncBatchVerifyModeFromDom(false)
    this._modeObserver = new MutationObserver(() => {
      let changed = false
      if (this.syncInputModeFromDom(false)) changed = true
      if (this.syncBatchVerifyModeFromDom(false)) changed = true
      if (changed) this._host.requestUpdate()
    })
    this._modeObserver.observe(this._host as unknown as Node, {attributes: true})
  }

  hostDisconnected() {
    this._modeObserver?.disconnect()
    this._modeObserver = null
    this._clearStepAnim()
    this._cancelBatchVerify()
  }

  // ── Mode (side-panel option) sync ────────────────────────────────────────

  get activeInputMode(): MrnaInputMode {
    return this._appliedInputMode
  }

  get activeBatchVerifyMode(): MrnaBatchVerifyMode {
    return this._appliedBatchVerifyMode
  }

  private _resolveInputMode(preferProperty: boolean): MrnaInputMode {
    if (preferProperty) {
      return normalizeMrnaInputMode(this._host.mrnaInputMode)
    }
    return readMrnaInputModeAttr(this._host as unknown as Element) ?? normalizeMrnaInputMode(this._host.mrnaInputMode)
  }

  /** Sync side-panel changes (attribute or property) into live logic. Returns true if the mode changed. */
  syncInputModeFromDom(preferProperty = false): boolean {
    const nextMode = this._resolveInputMode(preferProperty)
    if (nextMode === this._appliedInputMode) {
      if (this._host.mrnaInputMode !== nextMode) {
        this._host.mrnaInputMode = nextMode
      }
      return false
    }

    const modeChangedAfterMount = this._host.hasUpdated
    this._appliedInputMode = nextMode
    this._host.mrnaInputMode = nextMode

    if (modeChangedAfterMount) {
      this._resetInput()
    }
    return true
  }

  private _resolveBatchVerifyMode(preferProperty: boolean): MrnaBatchVerifyMode {
    if (preferProperty) {
      return normalizeMrnaBatchVerifyMode(this._host.mrnaBatchVerifyMode)
    }
    return (
      readMrnaBatchVerifyModeAttr(this._host as unknown as Element) ??
      normalizeMrnaBatchVerifyMode(this._host.mrnaBatchVerifyMode)
    )
  }

  /** Sync side-panel batch verify mode into live logic. Returns true if the mode changed. */
  syncBatchVerifyModeFromDom(preferProperty = false): boolean {
    const nextMode = this._resolveBatchVerifyMode(preferProperty)
    if (nextMode === this._appliedBatchVerifyMode) {
      if (this._host.mrnaBatchVerifyMode !== nextMode) {
        this._host.mrnaBatchVerifyMode = nextMode
      }
      return false
    }

    this._appliedBatchVerifyMode = nextMode
    this._host.mrnaBatchVerifyMode = nextMode
    if (this.batchVerifyRunning) {
      this._cancelBatchVerify()
    }
    return true
  }

  private _resetInput() {
    this._cancelBatchVerify()
    const polymeraseSnapped = this.snappedPolymerase
    this._clearStepAnim()
    this.mrnaBuilt = ""
    this.mrnaDraft = ""
    this.mrnaCheckpoint = 0
    this.transcriptionStep = 0
    this.awaitingRnaBase = polymeraseSnapped
    this._host.requestUpdate()
  }

  // ── Derived state ────────────────────────────────────────────────────────

  get isComplete(): boolean {
    return isTranscriptionComplete(this._host.dnaSequence.length, this.mrnaBuilt)
  }

  get baseAnimEnabled(): boolean {
    if (this._host.currentPhase !== "Transcription") return false
    if (this.activeInputMode === "stepwise") return true
    return this.activeInputMode === "batch" && this.batchVerifyRunning
  }

  /** RNA polymerase is at the fork and transcription can proceed. */
  get started(): boolean {
    return (
      this._host.currentPhase === "Transcription" &&
      this._host.dnaSequence.length > 0 &&
      this.snappedPolymerase
    )
  }

  stepAnimActive(): boolean {
    return (
      this.mrnaEnteringIndex !== null ||
      this.mrnaSuccessIndex !== null ||
      this.mrnaRejectAnim !== null
    )
  }

  /** Matches a CSS @keyframes name on the element that owns the animation. */
  private _animEnded(e: AnimationEvent, name: string): boolean {
    return e.target === e.currentTarget && e.animationName === name
  }

  // ── Fork snap / unsnap ───────────────────────────────────────────────────

  snap() {
    this.snappedPolymerase = true
    this.awaitingRnaBase = true
    this._host.playSlotSnapFade()
    this._host.requestUpdate()
  }

  unsnap() {
    this.snappedPolymerase = false
    this.awaitingRnaBase = false
    this._host.requestUpdate()
  }

  // ── mRNA step animation ──────────────────────────────────────────────────

  private _clearStepAnim() {
    this._animDone = null
    this.mrnaEnteringIndex = null
    this.mrnaSuccessIndex = null
    this.mrnaRejectAnim = null
  }

  private _finishAnim() {
    const done = this._animDone
    this._animDone = null
    done?.()
    if (this.isComplete) this._host.onTranscriptionCompleteReady()
    this._host.requestUpdate()
  }

  private _pauseInputDuringAnim() {
    this.awaitingRnaBase = false
  }

  private _resumeInputAfterAnim() {
    if (
      this.snappedPolymerase &&
      !isTranscriptionComplete(this._host.dnaSequence.length, this.mrnaBuilt)
    ) {
      this.awaitingRnaBase = true
    }
  }

  private _applyVisualStep() {
    if (isTranscriptionComplete(this._host.dnaSequence.length, this.mrnaBuilt)) {
      this.transcriptionStep = this._host.dnaSequence.length
      this.awaitingRnaBase = false
      return
    }

    this.transcriptionStep = this.mrnaBuilt.length
    if (this.snappedPolymerase) {
      this.awaitingRnaBase = true
    }
  }

  private _playBaseAccepted(index: number, onComplete?: () => void) {
    this._clearStepAnim()
    this._animDone = onComplete ?? null
    this.mrnaEnteringIndex = index
    this._host.requestUpdate()
  }

  private _playBaseRejected(
    base: string,
    onComplete?: () => void,
    opts?: {alertDuring?: boolean},
  ) {
    this._clearStepAnim()
    this._animDone = onComplete ?? null
    this._rejectAlertDuring = opts?.alertDuring !== false
    this.mrnaRejectAnim = {index: this.mrnaBuilt.length, base, phase: "enter"}
    this._host.requestUpdate()
  }

  /** Bound event handler — passed directly into the strand template's @animationend. */
  readonly onBaseAnimationEnd = (e: AnimationEvent) => {
    if (this._animEnded(e, "mrna-base-enter")) {
      if (this.mrnaRejectAnim?.phase === "enter") {
        this.mrnaRejectAnim = {...this.mrnaRejectAnim, phase: "error"}
        if (this._rejectAlertDuring) {
          this._host.showErrorAlert(mrnaWrongBaseMessage())
        }
        this._host.requestUpdate()
        return
      }
      if (this.mrnaEnteringIndex !== null) {
        this.mrnaSuccessIndex = this.mrnaEnteringIndex
        this.mrnaEnteringIndex = null
        this._host.requestUpdate()
      }
      return
    }

    if (this._animEnded(e, "mrna-base-success") && this.mrnaSuccessIndex !== null) {
      this.mrnaSuccessIndex = null
      this._finishAnim()
      return
    }

    if (this._animEnded(e, "mrna-base-reject-shake") && this.mrnaRejectAnim?.phase === "error") {
      this.mrnaRejectAnim = {...this.mrnaRejectAnim, phase: "exit"}
      this._host.requestUpdate()
      return
    }

    if (this._animEnded(e, "mrna-base-reject-exit") && this.mrnaRejectAnim) {
      this.mrnaRejectAnim = null
      this._finishAnim()
    }
  }

  private _syncProgress() {
    this._applyVisualStep()
  }

  // ── Typed / stepwise input ────────────────────────────────────────────────

  private _clampDraft(raw: string): string {
    return sanitizeMrnaInput(raw).slice(0, this._host.dnaSequence.length)
  }

  private _handleInputBatch(value: string) {
    if (this.batchVerifyRunning || this.stepAnimActive()) {
      this._host.requestUpdate()
      return
    }
    this.mrnaDraft = this._clampDraft(value)
    this._host.requestUpdate()
  }

  private _handleInputStepwise(value: string) {
    if (this.stepAnimActive()) {
      // Ignore keystrokes typed while the previous base is still being validated/animated
      this._host.requestUpdate()
      return
    }

    const raw = sanitizeMrnaInput(value)

    if (raw.length < this.mrnaBuilt.length) {
      this._clearStepAnim()
      this.mrnaBuilt = raw
      this._syncProgress()
      this._host.requestUpdate()
      return
    }

    if (!raw.startsWith(this.mrnaBuilt)) {
      this._host.requestUpdate()
      return
    }

    const pending = raw.slice(this.mrnaBuilt.length)
    for (const base of pending) {
      if (this.mrnaBuilt.length >= this._host.dnaSequence.length) break
      if (!this._tryAppendVerifiedBase(base)) {
        this._host.requestUpdate()
        return
      }
    }

    this._host.requestUpdate()
  }

  handleInput(value: string) {
    if (this.activeInputMode === "batch") {
      this._handleInputBatch(value)
    } else {
      this._handleInputStepwise(value)
    }
  }

  private _tryAppendVerifiedBase(base: string): boolean {
    const expected = expectedRnaBase(this._host.dnaSequence, this.mrnaBuilt.length)
    if (!expected || base !== expected) {
      if (this.activeInputMode === "stepwise") {
        this._pauseInputDuringAnim()
        this._playBaseRejected(base, () => {
          this._resumeInputAfterAnim()
          this._host.requestUpdate()
        })
      } else {
        this._host.showErrorAlert(mrnaWrongBaseMessage())
      }
      return false
    }

    const index = this.mrnaBuilt.length
    this.mrnaBuilt += base
    this.mrnaCheckpoint = Math.max(this.mrnaCheckpoint, this.mrnaBuilt.length)

    if (this.activeInputMode === "stepwise") {
      this._pauseInputDuringAnim()
      this._playBaseAccepted(index, () => {
        this._applyVisualStep()
        this._host.requestUpdate()
      })
    } else {
      this._syncProgress()
    }
    return true
  }

  clear() {
    if (this.batchVerifyRunning) {
      this._cancelBatchVerify()
    }
    if (this.activeInputMode === "batch") {
      this.mrnaDraft = ""
    } else {
      this._clearStepAnim()
      this.mrnaBuilt = ""
      this._syncProgress()
    }
    this._host.requestUpdate()
  }

  appendBase(base: string) {
    if (this.activeInputMode === "batch") {
      if (this.batchVerifyRunning || this.stepAnimActive()) return
      if (this.mrnaDraft.length >= this._host.dnaSequence.length) return
      this.mrnaDraft = this._clampDraft(this.mrnaDraft + base)
      this._host.requestUpdate()
      return
    }

    if (this.mrnaBuilt.length >= this._host.dnaSequence.length) return
    if (this.stepAnimActive()) return
    this._tryAppendVerifiedBase(base)
    this._host.requestUpdate()
  }

  // ── Batch verify ──────────────────────────────────────────────────────────

  private _cancelBatchVerify() {
    this.batchVerifyRunning = false
    this._batchVerifyDraft = null
    this._clearStepAnim()
  }

  private _finishBatchVerifySuccess() {
    this.batchVerifyRunning = false
    this._batchVerifyDraft = null
    this.mrnaDraft = this.mrnaBuilt
    this._applyVisualStep()
    this._host.requestUpdate()
  }

  private _finishBatchVerifyFailure() {
    this.batchVerifyRunning = false
    this._batchVerifyDraft = null
    this._clearStepAnim()
    this.mrnaBuilt = ""
    this.mrnaDraft = ""
    this.transcriptionStep = 0
    this._resumeInputAfterAnim()
    this._host.requestUpdate()
    this._host.focusMrnaInput()
  }

  private _runNextBatchVerifyStep(index: number) {
    const draft = this._batchVerifyDraft
    if (!draft || !this.batchVerifyRunning) return

    const targetLen = this._host.dnaSequence.length
    const base = draft[index]
    const expected = expectedRnaBase(this._host.dnaSequence, index)

    if (!expected || base !== expected) {
      this._playBaseRejected(base, () => {
        this._finishBatchVerifyFailure()
      })
      this._host.requestUpdate()
      return
    }

    this.mrnaBuilt += base
    this._playBaseAccepted(index, () => {
      this._applyVisualStep()

      if (index + 1 >= targetLen) {
        this.mrnaCheckpoint = targetLen
        this._finishBatchVerifySuccess()
      } else {
        this._runNextBatchVerifyStep(index + 1)
      }
      this._host.requestUpdate()
    })
    this._host.requestUpdate()
  }

  private _verifyBatchInstant() {
    const targetLen = this._host.dnaSequence.length
    if (!this.mrnaDraft.length) {
      this._host.showErrorAlert(mrnaEmptyMessage())
      return
    }
    if (this.mrnaDraft.length < targetLen) {
      this._host.showErrorAlert(mrnaIncompleteMessageForDraft(this.mrnaDraft.length, targetLen))
      return
    }

    const result = verifyMrnaInput(this.mrnaDraft, this._host.dnaSequence, 0)
    if (result.ok === false) {
      if (this.batchVerifyRunning || this.stepAnimActive()) return
      const failIndex = Math.max(0, result.position - 1)
      const wrongBase = result.got || this.mrnaDraft[failIndex] || "?"
      this.batchVerifyRunning = true
      this._pauseInputDuringAnim()
      this.mrnaBuilt = this.mrnaDraft.slice(0, failIndex)
      this._applyVisualStep()
      this._playBaseRejected(
        wrongBase,
        () => {
          this._finishBatchVerifyFailure()
          this._host.showErrorAlert(mrnaIncorrectMessage())
        },
        {alertDuring: false},
      )
      return
    }
    if (result.matchLength < targetLen) {
      this._host.showErrorAlert(mrnaIncompleteMessageForDraft(this.mrnaDraft.length, targetLen))
      return
    }

    this.mrnaBuilt = this.mrnaDraft
    this.mrnaCheckpoint = targetLen
    this._syncProgress()
    if (this.isComplete) this._host.onTranscriptionCompleteReady()
    this._host.requestUpdate()
  }

  private _verifyBatchSequential() {
    if (this.batchVerifyRunning || this.stepAnimActive()) return

    const targetLen = this._host.dnaSequence.length
    if (!this.mrnaDraft.length) {
      this._host.showErrorAlert(mrnaEmptyMessage())
      return
    }
    if (this.mrnaDraft.length < targetLen) {
      this._host.showErrorAlert(mrnaIncompleteMessageForDraft(this.mrnaDraft.length, targetLen))
      return
    }

    this.batchVerifyRunning = true
    this._batchVerifyDraft = this.mrnaDraft
    this._pauseInputDuringAnim()
    this._clearStepAnim()
    this.mrnaBuilt = ""
    this.transcriptionStep = 0
    this._host.requestUpdate()

    this._runNextBatchVerifyStep(0)
  }

  private _verifyBatch() {
    if (this.activeBatchVerifyMode === "sequential") {
      this._verifyBatchSequential()
    } else {
      this._verifyBatchInstant()
    }
  }

  verify() {
    if (!this.started || !this.awaitingRnaBase) return
    if (this.activeInputMode !== "batch") return
    if (this.batchVerifyRunning || this.stepAnimActive()) return
    this._verifyBatch()
  }

  /** Restart transcription input while keeping RNA polymerase at the fork. */
  retryAttempt() {
    if (!this.snappedPolymerase) return
    this._cancelBatchVerify()
    this._clearStepAnim()
    this.mrnaBuilt = ""
    this.mrnaDraft = ""
    this.mrnaCheckpoint = 0
    this.transcriptionStep = 0
    this.awaitingRnaBase = true
    this._host.requestUpdate()
  }

  // ── Reset / clamp (sequence changes) ─────────────────────────────────────

  clamp(maxStep: number) {
    if (this.mrnaBuilt.length > maxStep) {
      this.mrnaBuilt = this.mrnaBuilt.slice(0, maxStep)
    }
    if (this.mrnaDraft.length > maxStep) {
      this.mrnaDraft = this.mrnaDraft.slice(0, maxStep)
    }
    this.mrnaCheckpoint = Math.max(0, Math.min(this.mrnaCheckpoint, maxStep))
    this.transcriptionStep = Math.max(0, Math.min(this.transcriptionStep, maxStep))

    if (!this.snappedPolymerase) {
      this.awaitingRnaBase = false
      this.mrnaBuilt = ""
      this.mrnaDraft = ""
      this.mrnaCheckpoint = 0
      this.transcriptionStep = 0
    } else if (maxStep > 0 && this.mrnaBuilt.length >= maxStep) {
      this.transcriptionStep = maxStep
      this.awaitingRnaBase = false
      this.mrnaCheckpoint = Math.max(this.mrnaCheckpoint, maxStep)
    } else {
      this.transcriptionStep = this.mrnaBuilt.length
      this.awaitingRnaBase = true
    }
  }

  reset() {
    this.transcriptionStep = 0
    this.snappedPolymerase = false
    this.mrnaBuilt = ""
    this.mrnaDraft = ""
    this.mrnaCheckpoint = 0
    this.awaitingRnaBase = false
  }
}
