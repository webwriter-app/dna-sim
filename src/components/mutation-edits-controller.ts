import type {ReactiveController} from "lit"

import {
  deleteDnaBase,
  insertDnaBase,
  replayMutationSteps,
  sanitizeDnaBase,
  substituteDnaBase,
  type MutationStep,
} from "./mutations"
import {
  evaluateMutationGoal,
  formatPolypeptide,
  hasMutationProteinGoal,
  mutationTargetChain,
  normalizeAminoAcidToken,
  parseTargetProtein,
  type MutationCheckResult,
} from "../model/mutation-goals"
import {DEFAULT_DNA_SEQUENCE} from "../model/widget-options"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/**
 * Mutations-phase editing: the working sequence, the recorded steps, the goal check
 * and the teacher's target protein.
 */
export class MutationEditsController implements ReactiveController {
  private _steps: MutationStep[] = []
  private _feedback: MutationCheckResult | null = null
  /** Sequence the steps replay from. */
  startSequence = DEFAULT_DNA_SEQUENCE
  /** Isolated Mutations-tab copy when cross-phase mutations are off. */
  workingCopy = DEFAULT_DNA_SEQUENCE

  constructor(private readonly host: WebwriterDnaSimulation) {
    host.addController(this)
  }

  hostDisconnected() {}

  get steps(): readonly MutationStep[] { return this._steps }

  get feedback() { return this._feedback }
  set feedback(value: MutationCheckResult | null) {
    if (value === this._feedback) return
    this._feedback = value
    this.host.requestUpdate()
  }

  clearSteps() {
    if (this._steps.length === 0) return
    this._steps = []
    this.host.requestUpdate()
  }

  private pushStep(step: MutationStep) {
    this._steps = [...this._steps, step]
    this.host.requestUpdate()
  }

  /** Restart from a new lesson sequence. */
  useSequence(next: string) {
    this.startSequence = next
    this.workingCopy = next
    this.clearSteps()
  }

  verifyGoal() {
    const {host} = this
    if (!host.view.mutationShowGoal) return
    if (!hasMutationProteinGoal(host.mutationTargetProtein)) return
    const result = evaluateMutationGoal({
      mode: "target-protein",
      startDna: this.startSequence,
      currentDna: host.mutationsSequence,
      targetProteinRaw: host.mutationTargetProtein,
    })
    this.feedback = result
    if (result.passed) {
      host.flow.notifyPhaseComplete("Mutations")
      host.requestUpdate()
      return
    }
    host.showErrorAlert(this.checkMessage(result))
  }

  rewindStep(stepIndex: number) {
    if (this.host.currentPhase !== "Mutations") return
    if (stepIndex < 0 || stepIndex >= this._steps.length) return
    const kept = this._steps.slice(0, stepIndex + 1)
    const next = replayMutationSteps(this.startSequence, kept)
    this._steps = kept
    this.feedback = null
    this.applySequenceEdit(next)
    const last = kept[kept.length - 1]
    if (last) this.host.mutations.selectAt(last.index)
    this.host.requestUpdate()
  }

  addTargetAmino(amino: string) {
    if (!this.host.view.mutationTeacherEditing) return
    const token = normalizeAminoAcidToken(amino)
    if (!token) return
    const chain = [...mutationTargetChain(this.host.mutationTargetProtein), token]
    this.setTargetProtein(formatPolypeptide(chain))
  }

  removeTargetAmino(index: number) {
    if (!this.host.view.mutationTeacherEditing) return
    const chain = mutationTargetChain(this.host.mutationTargetProtein).filter((_, i) => i !== index)
    this.setTargetProtein(formatPolypeptide(chain))
  }

  setTargetProtein(raw: unknown) {
    const target = parseTargetProtein(raw)
    if (target.ok) this.host.lesson.write({mutationTargetProtein: formatPolypeptide(target.chain)})
  }

  private checkMessage(result: MutationCheckResult): string {
    const {msg} = this.host
    if (result.reason === "no-target") {
      return msg("No target is set for this task.")
    }
    if (result.reason === "invalid-target") {
      return msg("The target protein is not valid. Use three-letter names such as Met-Leu-Phe.")
    }
    return msg("That is not the target yet.")
  }

  /**
   * Replace the DNA template base at `index` (Mutations phase).
   * No-ops if the index/base is invalid or unchanged.
   */
  substituteBase(index: number, base: string) {
    const seq = this.host.mutationsSequence
    const next = substituteDnaBase(seq, index, base)
    if (next === null) return
    const from = sanitizeDnaBase(seq[index] ?? "")
    const to = sanitizeDnaBase(base)
    this.pushStep({
      kind: "substitution",
      index,
      ...(from ? {from} : {}),
      ...(to ? {to} : {}),
    })
    this.applySequenceEdit(next)
  }

  /**
   * Insert a DNA template base before `index` (0 … length inclusive).
   * No-ops if the index/base is invalid.
   */
  insertBase(index: number, base: string) {
    const next = insertDnaBase(this.host.mutationsSequence, index, base)
    if (next === null) return
    const to = sanitizeDnaBase(base)
    this.pushStep({
      kind: "insertion",
      index,
      ...(to ? {to} : {}),
    })
    this.applySequenceEdit(next)
  }

  /**
   * Delete the DNA template base at `index`.
   * No-ops if the index is out of range.
   */
  deleteBase(index: number) {
    const seq = this.host.mutationsSequence
    const next = deleteDnaBase(seq, index)
    if (next === null) return
    const from = sanitizeDnaBase(seq[index] ?? "")
    this.pushStep({
      kind: "deletion",
      index,
      ...(from ? {from} : {}),
    })
    this.applySequenceEdit(next)
  }

  /** Mutation edits: shared `dnaSequence` or an isolated session copy. */
  applySequenceEdit(next: string) {
    if (this.host.crossPhaseMutations) {
      this.applyLessonSequenceEdit(next)
      return
    }
    if (next === this.workingCopy) return
    this.workingCopy = next
    this.host.mutations.clampSelection(next.length)
    this.feedback = null
    this.host.requestUpdate()
  }

  /** Shared path for lesson-DNA edits: clamp anim and drop stale tx/tl completion. */
  applyLessonSequenceEdit(next: string) {
    const {host} = this
    if (next === host.dnaSequence) return
    host.dnaSequence = next
    this.workingCopy = next
    host.mutations.clampSelection(next.length)
    host.flow.clampAnimationStep()
    host.flow.invalidateTranscriptionAndTranslationCompletion()
    this.feedback = null
    host.requestUpdate()
  }

  /** Reset to the start sequence (Start over in the Mutations phase). */
  restart() {
    this.feedback = null
    this.clearSteps()
    if (this.host.crossPhaseMutations) {
      this.applyLessonSequenceEdit(this.startSequence)
      this.workingCopy = this.startSequence
      return
    }
    this.workingCopy = this.host.dnaSequence
    this.host.requestUpdate()
  }
}
