import {str, type MsgFn} from "@lit/localize"

import {localizedPhaseLabel} from "../localize-text.js"
import {
  DnaSimulationNavbar,
  type MutationNowEmptyReason,
  type NavbarMutationStep,
  type NavbarAction,
  type NavbarModel,
  type NavTab,
} from "../../components/simulation-navbar/simulation-navbar.js"
import type {BaukastenMolecule} from "../molecules/baukasten.js"

/** mRNA input box state, as far as the navbar cares. */
export interface NavbarMrnaInput {
  value: string
  busy: boolean
  isBatchMode: boolean
}

/**
 * Everything the navbar needs from the simulation. The widget implements
 * this directly (`implements NavbarHost`).
 */
export interface NavbarHost {
  readonly msg: MsgFn
  readonly currentPhase: string
  readonly dnaSequence: string
  readonly sequenceTabDna: string
  readonly mrnaInput: NavbarMrnaInput
  readonly showPhaseBar: boolean
  readonly visiblePhases: readonly string[]
  readonly lockedPhases: readonly string[]
  readonly sequenceTabVisible: boolean
  readonly sequenceTabWarnings: readonly string[]
  readonly baukastenMolecules: readonly BaukastenMolecule[]
  readonly draggingMoleculeId: string | null
  readonly showMutationVerify: boolean
  readonly mutationStepItems: readonly NavbarMutationStep[]
  readonly mutationShowGoal: boolean
  readonly mutationShowNow: boolean
  readonly mutationCurrentChain: readonly string[]
  readonly mutationNowEmptyReason: MutationNowEmptyReason
  readonly mutationTargetChain: readonly string[]
  readonly mutationTeacherEditing: boolean
  readonly showToolkitTab: boolean
  readonly showProteinTab: boolean

  requestUpdate(): void
  setPhase(phase: string): void
  setDnaSequence(value: string): void
  appendDnaBase(base: string): void
  setMrnaInput(value: string): void
  clearMrnaInput(): void
  verifyMrnaInput(): void
  appendMrnaBase(base: string): void
  startMoleculeDrag(nativeEvent: DragEvent, moleculeId: string): void
  endMoleculeDrag(): void
  requestResetSimulation(): void
  verifyMutationGoal(): void
  rewindMutationStep(stepIndex: number): void
  addMutationTargetAmino(amino: string): void
  removeMutationTargetAmino(index: number): void
  openCodonDrawer(): void
}

function buildModel(
  activeTab: NavTab,
  host: NavbarHost,
): NavbarModel {
  const {msg} = host
  const filledLength = host.mrnaInput.value.length
  const molecules = host.baukastenMolecules

  return {
    activeTab,
    currentPhase: host.currentPhase,
    phases: host.visiblePhases,
    lockedPhases: host.lockedPhases,
    showSequenceTab: host.sequenceTabVisible,
    dnaSequence: host.sequenceTabDna,
    sequenceWarnings: host.sequenceTabWarnings,
    showPhaseBar: host.showPhaseBar,
    mrnaInputValue: host.mrnaInput.value,
    mrnaInputBusy: host.mrnaInput.busy,
    canAppendMrnaBase: filledLength < host.dnaSequence.length && !host.mrnaInput.busy,
    showMrnaVerify: host.mrnaInput.isBatchMode,
    canVerifyMrna:
      host.mrnaInput.isBatchMode &&
      filledLength === host.dnaSequence.length &&
      host.dnaSequence.length > 0 &&
      !host.mrnaInput.busy,
    mrnaRemaining: host.dnaSequence.length - filledLength,
    showMutationVerify: host.showMutationVerify,
    mutationSteps: [...host.mutationStepItems],
    mutationShowGoal: host.mutationShowGoal,
    mutationShowNow: host.mutationShowNow,
    mutationCurrentChain: [...host.mutationCurrentChain],
    mutationNowEmptyReason: host.mutationNowEmptyReason,
    mutationTargetChain: [...host.mutationTargetChain],
    mutationTeacherEditing: host.mutationTeacherEditing,
    showToolkitTab: host.showToolkitTab,
    showProteinTab: host.showProteinTab,
    baukastenMolecules: molecules.map((mol) => ({
      id: mol.id,
      name: mol.name,
      icon: mol.icon,
      isDragging: host.draggingMoleculeId === mol.id,
    })),
    baukastenEmptyMessage: molecules.length
      ? null
      : msg(str`No molecules are available for "${localizedPhaseLabel(msg, host.currentPhase)}" yet.`),
  }
}

/** Navbar logic: tab state, view-model, and action handling for dna-simulation-navbar. */
export class NavbarController {
  activeTab: NavTab = "phasen"

  constructor(private readonly _host: NavbarHost) {}

  /** Pushes the current view-model into the navbar element. Call from widget's updated(). */
  syncView(root: ParentNode) {
    if (!this._host.sequenceTabVisible && this.activeTab === "sequenz") {
      this.activeTab = "phasen"
    }
    if (!this._host.showToolkitTab && this.activeTab === "baukasten") {
      this.activeTab = "phasen"
    }
    if (!this._host.showProteinTab && this.activeTab === "protein") {
      this.activeTab = "phasen"
    }
    const navbar = root.querySelector("dna-simulation-navbar")
    if (navbar instanceof DnaSimulationNavbar) {
      navbar.applyModel(buildModel(this.activeTab, this._host))
      navbar.requestUpdate()
    }
  }

  /** Handles dna-navbar-action events. Bind directly: `@dna-navbar-action=${navbar.onAction}`. */
  readonly onAction = (e: CustomEvent<NavbarAction>) => {
    const action = e.detail
    const host = this._host
    switch (action.action) {
      case "tab-change":
        if (action.tab === "sequenz" && !host.sequenceTabVisible) return
        if (action.tab === "baukasten" && !host.showToolkitTab) return
        if (action.tab === "protein" && !host.showProteinTab) return
        this.activeTab = action.tab
        host.requestUpdate()
        if (action.tab === "protein") host.openCodonDrawer()
        break
      case "phase-change":
        host.setPhase(action.phase)
        break
      case "sequence-input":
        if (!host.sequenceTabVisible) return
        host.setDnaSequence(action.value)
        break
      case "append-dna-base":
        if (!host.sequenceTabVisible) return
        host.appendDnaBase(action.base)
        break
      case "mrna-input":
        host.setMrnaInput(action.value)
        break
      case "mrna-clear":
        host.clearMrnaInput()
        break
      case "mrna-verify":
        host.verifyMrnaInput()
        break
      case "mrna-enter":
        if (host.mrnaInput.isBatchMode) host.verifyMrnaInput()
        break
      case "mrna-append-base":
        host.appendMrnaBase(action.base)
        break
      case "molecule-drag-start":
        host.startMoleculeDrag(action.nativeEvent, action.moleculeId)
        break
      case "molecule-drag-end":
        host.endMoleculeDrag()
        break
      case "reset-simulation":
        host.requestResetSimulation()
        break
      case "mutation-verify":
        host.verifyMutationGoal()
        break
      case "mutation-step-select":
        host.rewindMutationStep(action.stepIndex)
        break
      case "mutation-target-add":
        host.addMutationTargetAmino(action.amino)
        break
      case "mutation-target-remove":
        host.removeMutationTargetAmino(action.index)
        break
      case "open-codon-drawer":
        host.openCodonDrawer()
        break
    }
  }
}
