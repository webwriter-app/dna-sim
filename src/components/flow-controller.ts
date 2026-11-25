import {str} from "@lit/localize"
import type {ReactiveController} from "lit"

import {localizedPhaseCompleteMessage, localizedPhaseLabel} from "./localize-text"
import {canSelectVisiblePhase, scaledDurationMs, sanitizeDnaSequence, type SimulationPhase} from "../model/widget-options"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/** Replication unzip interval at 1×. */
const REPLICATION_STEP_MS = 350

/**
 * Phase navigation, the replication timer and the resets: everything that moves the
 * simulation from one state to another.
 */
export class FlowController implements ReactiveController {
  private _animationStep = 0
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(private readonly host: WebwriterDnaSimulation) {
    host.addController(this)
  }

  hostDisconnected() {}

  get animationStep() { return this._animationStep }
  set animationStep(value: number) {
    if (value === this._animationStep) return
    this._animationStep = value
    this.host.requestUpdate()
  }

  get maxAnimationStep(): number {
    return this.host.dnaSequence.length
  }

  get timerRunning() { return this.timer !== null }

  scaleAnimMs(ms: number): number {
    return scaledDurationMs(ms, this.host.animationSpeed)
  }

  clampAnimationStep() {
    const max = this.maxAnimationStep
    this.animationStep = Math.max(0, Math.min(this.animationStep, max))
    this.host.transcription.clamp(max)
    this.host.translation.clamp()
  }

  startTimer() {
    const {host} = this
    this.stopTimer()
    if (host.currentPhase !== "Replication" || !host.enzymes.snappedHelicase) return
    if (this.animationStep >= this.maxAnimationStep) return
    this.timer = setInterval(() => {
      if (this.animationStep >= this.maxAnimationStep) {
        this.stopTimer()
        host.enzymes.maybeScheduleHelicaseExit()
        host.requestUpdate()
        return
      }
      this.animationStep++
      if (this.animationStep >= this.maxAnimationStep) {
        this.stopTimer()
        host.enzymes.maybeScheduleHelicaseExit()
      }
      host.requestUpdate()
    }, this.scaleAnimMs(REPLICATION_STEP_MS))
  }

  stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  resetAnimation() {
    const {host} = this
    this.stopTimer()
    this.animationStep = 0
    host.enzymes.clearSnappedHelicase()
    host.enzymes.cancelPolymeraseExit()
    host.transcription.reset()
    host.translation.reset()
    host.moleculeDrag.clear()
    host.phaseCompletion.reset()
    host.codonDrawer.close()
  }

  setDnaSequence(value: string) {
    if (this.host.editable) this.host.lessonDnaSequence = value
    else this.useDnaSequence(sanitizeDnaSequence(value))
  }

  useDnaSequence(next: string) {
    const {host} = this
    const previousSequence = host.dnaSequence
    host.mutationEdits.useSequence(next)
    if (next === previousSequence) {
      host.requestUpdate()
      return
    }
    const prevCodon = host.translation.codonIndex
    host.dnaSequence = next

    const isLengthOnlyEdit =
      host.dnaSequence.length > 0 &&
      (host.dnaSequence.startsWith(previousSequence) || previousSequence.startsWith(host.dnaSequence))

    if (isLengthOnlyEdit) {
      this.clampAnimationStep()
      if (!host.transcription.isComplete) host.phaseCompletion.revoke("Transcription")
      if (!host.translation.complete) host.phaseCompletion.revoke("Translation")
    } else {
      this.resetAnimation()
    }

    host.workspace.resetView(this.defaultZoomForPhase(host.currentPhase))
    if (
      host.currentPhase === "Translation" &&
      host.translation.snappedRibosome &&
      host.translation.codonIndex !== prevCodon
    ) {
      host.afterRender(() => host.codonDrawer.centerOnActiveCodon())
    }
    host.requestUpdate()
  }

  defaultZoomForPhase(phase: string): number {
    return phase === "Translation" ? 75 : 100
  }

  setPhase(phase: string) {
    const {host} = this
    if (phase === host.currentPhase) return
    if (!host.view.visiblePhases.includes(phase as SimulationPhase)) return
    if (
      !canSelectVisiblePhase(
        phase,
        host.currentPhase,
        host.view.visiblePhases,
        {has: (p) => host.phaseCompletion.hasCompleted(p)},
        host.canonicalPhaseOrder,
      )
    ) {
      return
    }

    this.enterPhase(phase)
  }

  enterPhase(phase: string) {
    const {host} = this
    this.stopTimer()
    if (host.currentPhase === "Replication") host.enzymes.cancelHelicaseExit()
    if (host.currentPhase === "Transcription") host.enzymes.cancelPolymeraseExit()
    host.moleculeDrag.cancelActiveDrag()
    host.moleculeDrag.dropFeedback = "none"
    host.alerts.errorMessage = ""
    host.moleculeDrag.slotSnapFadeOut = false

    host.currentPhase = phase
    host.mutations.dismiss()
    this.clampAnimationStep()
    host.workspace.resetView(this.defaultZoomForPhase(phase))
    host.requestUpdate()
  }

  /** Fall back to the first visible phase when the current one was switched off. */
  ensureCurrentPhaseEnabled() {
    const {host} = this
    const enabled = host.view.visiblePhases
    if (!enabled.length) return
    if (enabled.includes(host.currentPhase as SimulationPhase)) return
    host.navbar.activeTab = "phasen"
    this.enterPhase(enabled[0])
    if (host.hasUpdated) host.navbar.syncView(host.renderRoot)
  }

  private nextVisiblePhase(phase: string): string | null {
    const enabled = this.host.view.visiblePhases
    const i = enabled.indexOf(phase as SimulationPhase)
    return i >= 0 ? enabled[i + 1] ?? null : enabled[0] ?? null
  }

  notifyPhaseComplete(phase: string) {
    const {host} = this
    const next = this.nextVisiblePhase(phase)
    host.phaseCompletion.notify(
      phase,
      next ?? "",
      localizedPhaseCompleteMessage(
        host.msg,
        phase,
        next,
        phase === "Mutations" ? host.mutationEdits.steps.length : undefined,
      ),
    )
  }

  onTranslationComplete() {
    const {host} = this
    if (host.translation.endedWithoutStop) {
      const next = this.nextVisiblePhase("Translation")
      const runoff = host.msg("The sequence ended without a stop codon.")
      if (!next) {
        host.phaseCompletion.notify("Translation", "", host.msg(str`${runoff} Lesson complete`))
        return
      }
      host.phaseCompletion.notify(
        "Translation",
        next,
        host.msg(str`${runoff} Continue to ${localizedPhaseLabel(host.msg, next)}?`),
      )
      return
    }
    this.notifyPhaseComplete("Translation")
  }

  onPhaseCompleteContinue = () => {
    const nextPhase = this.host.phaseCompletion.toast?.nextPhase
    this.host.phaseCompletion.dismiss()
    if (nextPhase) this.setPhase(nextPhase)
  }

  onPhaseCompleteDismiss = () => {
    this.host.phaseCompletion.dismiss()
  }

  /** Cross-phase DNA edits must not keep Transcription/Translation marked as complete. */
  invalidateTranscriptionAndTranslationCompletion() {
    const {host} = this
    host.phaseCompletion.revoke("Transcription")
    host.phaseCompletion.revoke("Translation")
    host.enzymes.cancelPolymeraseExit()
    host.transcription.reset()
    host.translation.reset()
    // Mutations uses the same codon drawer as the amino-acid list; keep it
    // open so applying a substitution/insertion/deletion does not force a reopen.
    if (host.currentPhase === "Mutations") return
    host.codonDrawer.close()
  }

  /** Wipe all progress and return to the lesson sequence. */
  clearAll() {
    const {host} = this
    host.mutations.dismiss()
    host.lesson.sync()
    host.dnaSequence = host.lesson.value.dnaSequence
    host.mutationEdits.useSequence(host.dnaSequence)
    host.mutationEdits.feedback = null
    this.resetAnimation()
  }

  enterFirstVisiblePhaseAfterFullReset() {
    const {host} = this
    const first = host.view.visiblePhases[0]
    host.navbar.activeTab = "phasen"
    if (first && first !== host.currentPhase) {
      host.currentPhase = first
    }
    host.mutations.dismiss()
    this.clampAnimationStep()
  }

  resetReplicationPhase() {
    this.host.enzymes.cancelHelicaseExit()
    this.animationStep = 0
    this.startTimer()
  }

  resetTranscriptionPhase() {
    const {host} = this
    host.enzymes.cancelPolymeraseExit()
    if (host.transcription.snappedPolymerase) {
      host.transcription.retryAttempt()
    } else {
      host.transcription.reset()
    }
  }

  resetTranslationPhase() {
    this.host.translation.reset()
    this.host.codonDrawer.close()
  }

  resetMutationsPhase() {
    this.host.mutations.dismiss()
    this.host.mutationEdits.restart()
  }
}
