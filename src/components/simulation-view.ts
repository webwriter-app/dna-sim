import {
  formatMutationStepKindLabel,
} from "./mutations"
import {baukastenForPhase, createBaukastenOrder, type BaukastenMolecule} from "./baukasten"
import type {NavbarMrnaInput} from "./navbar-controller"
import {readingFrameFromTemplate} from "../model/translation"
import {
  formatPolypeptide,
  hasMutationProteinGoal,
  mutationTargetChain,
  normalizeMutationGoalMode,
  startMatchesMutationGoal,
} from "../model/mutation-goals"
import {canSelectVisiblePhase, normalizePhaseSetMode, resolveVisiblePhases, type SimulationPhase} from "../model/widget-options"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/** Read-only state the navbar, hints and canvas derive from the widget's settings and controllers. */
export class SimulationView {
  /** Toolkit chip order — shuffled once when the widget instance is created. */
  private readonly baukastenOrder = createBaukastenOrder()

  constructor(private readonly host: WebwriterDnaSimulation) {}

  /** Whether the author is editing (as opposed to a learner using the widget). */
  get teacherEditing(): boolean {
    return this.host.editable
  }

  get animationEnabled(): boolean {
    return this.host.currentPhase === "Replication" && this.host.dnaSequence.length > 0
  }

  get transcriptionEnabled(): boolean {
    return this.host.currentPhase === "Transcription" && this.host.dnaSequence.length > 0
  }

  get sequenceTabVisible() {
    return this.host.showSequenceTab || this.teacherEditing
  }

  get sequenceTabDna() {
    return this.host.editable ? this.host.lessonDnaSequence : this.host.dnaSequence
  }

  /** Sequence-tab hints for authors only — never shown in student view. */
  get sequenceTabWarnings(): readonly string[] {
    const {host} = this
    if (!this.teacherEditing) return []
    if (!this.sequenceTabDna) return []
    const frame = readingFrameFromTemplate(this.sequenceTabDna)
    const parts: string[] = []
    if (this.sequenceTabDna.length % 3 !== 0) {
      parts.push(host.msg("Sequence length is not divisible by 3."))
    }
    if (frame.codons.length > 0 && !frame.hasStop) {
      parts.push(host.msg("No stop codon in the sequence."))
    }
    const chain = mutationTargetChain(host.mutationTargetProtein)
    if (
      normalizeMutationGoalMode(host.mutationGoalMode) === "target-protein" &&
      chain.length > 0 &&
      startMatchesMutationGoal({
        mode: "target-protein",
        startDna: this.sequenceTabDna,
        targetProteinRaw: formatPolypeptide(chain),
      })
    ) {
      parts.push(host.msg("Sequence already matches the target protein."))
    }
    return parts
  }

  get visiblePhases(): readonly SimulationPhase[] {
    return resolveVisiblePhases(
      normalizePhaseSetMode(this.host.phaseSetMode),
      this.host.phaseFlags,
    )
  }

  get lockedPhases(): readonly SimulationPhase[] {
    const {host} = this
    if (!host.canonicalPhaseOrder) return []
    const visible = this.visiblePhases
    return visible.filter(
      (phase) =>
        !canSelectVisiblePhase(
          phase,
          host.currentPhase,
          visible,
          {has: (p) => host.phaseCompletion.hasCompleted(p)},
          true,
        ),
    )
  }

  get mrnaInput(): NavbarMrnaInput {
    const {transcription} = this.host
    return {
      value: transcription.activeInputMode === "batch" ? transcription.mrnaDraft : transcription.mrnaBuilt,
      busy: transcription.stepAnimActive() || transcription.batchVerifyRunning,
      isBatchMode: transcription.activeInputMode === "batch",
    }
  }

  get showPhaseBar(): boolean {
    const {transcription} = this.host
    return (
      this.host.currentPhase === "Transcription" &&
      transcription.snappedPolymerase &&
      (transcription.awaitingRnaBase ||
        transcription.stepAnimActive() ||
        transcription.batchVerifyRunning ||
        transcription.isComplete)
    )
  }

  get baukastenMolecules(): BaukastenMolecule[] {
    return baukastenForPhase(this.host.msg, this.host.currentPhase, this.baukastenOrder)
  }

  get draggingMoleculeId(): string | null {
    return this.host.moleculeDrag.draggingMolecule?.id ?? null
  }

  get showCodonReference(): boolean {
    return this.host.currentPhase === "Mutations" || this.host.translation.showCodonCard
  }

  get showMutationVerify(): boolean {
    return this.mutationShowGoal && hasMutationProteinGoal(this.host.mutationTargetProtein)
  }

  get mutationShowGoal(): boolean {
    return (
      this.host.currentPhase === "Mutations" &&
      normalizeMutationGoalMode(this.host.mutationGoalMode) === "target-protein"
    )
  }

  get mutationStepItems() {
    return this.host.mutationEdits.steps.map((step, stepIndex) => ({
      label: formatMutationStepKindLabel(this.host.msg, step),
      stepIndex,
      kind: step.kind,
      from: step.from,
      to: step.to,
    }))
  }

  get mutationTargetChain(): string[] {
    return mutationTargetChain(this.host.mutationTargetProtein)
  }

  get mutationShowNow(): boolean {
    return this.host.currentPhase === "Mutations" && this.teacherEditing
  }

  get mutationCurrentChain(): string[] {
    return readingFrameFromTemplate(this.host.mutationsSequence).polypeptide
  }

  get mutationNowEmptyReason(): "short" | "stop" | "empty" {
    if (this.host.mutationsSequence.length < 3) return "short"
    const frame = readingFrameFromTemplate(this.host.mutationsSequence)
    if (frame.stopCodonIndex === 0) return "stop"
    return "empty"
  }

  get mutationTeacherEditing(): boolean {
    return this.mutationShowGoal && this.teacherEditing
  }

  get showToolkitTab(): boolean {
    return this.host.currentPhase !== "Mutations"
  }

  get showProteinTab(): boolean {
    return this.host.currentPhase === "Mutations"
  }
}
