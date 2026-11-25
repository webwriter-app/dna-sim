import {str} from "@lit/localize"

import {localizedPhaseLabel} from "./localize-text"
import {
  DnaSimulationNavbar,
  type NavbarAction,
  type NavbarModel,
  type NavTab,
} from "./simulation-navbar"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/** mRNA input box state, as far as the navbar cares. */
export interface NavbarMrnaInput {
  value: string
  busy: boolean
  isBatchMode: boolean
}

function buildModel(
  activeTab: NavTab,
  host: WebwriterDnaSimulation,
): NavbarModel {
  const {msg} = host
  const filledLength = host.view.mrnaInput.value.length
  const molecules = host.view.baukastenMolecules

  return {
    activeTab,
    currentPhase: host.currentPhase,
    phases: host.view.visiblePhases,
    lockedPhases: host.view.lockedPhases,
    showSequenceTab: host.view.sequenceTabVisible,
    dnaSequence: host.view.sequenceTabDna,
    sequenceWarnings: host.view.sequenceTabWarnings,
    showPhaseBar: host.view.showPhaseBar,
    mrnaInputValue: host.view.mrnaInput.value,
    mrnaInputBusy: host.view.mrnaInput.busy,
    canAppendMrnaBase: filledLength < host.dnaSequence.length && !host.view.mrnaInput.busy,
    showMrnaVerify: host.view.mrnaInput.isBatchMode,
    canVerifyMrna:
      host.view.mrnaInput.isBatchMode &&
      filledLength === host.dnaSequence.length &&
      host.dnaSequence.length > 0 &&
      !host.view.mrnaInput.busy,
    mrnaRemaining: host.dnaSequence.length - filledLength,
    showMutationVerify: host.view.showMutationVerify,
    mutationSteps: [...host.view.mutationStepItems],
    mutationShowGoal: host.view.mutationShowGoal,
    mutationShowNow: host.view.mutationShowNow,
    mutationCurrentChain: [...host.view.mutationCurrentChain],
    mutationNowEmptyReason: host.view.mutationNowEmptyReason,
    mutationTargetChain: [...host.view.mutationTargetChain],
    mutationTeacherEditing: host.view.mutationTeacherEditing,
    showToolkitTab: host.view.showToolkitTab,
    showProteinTab: host.view.showProteinTab,
    baukastenMolecules: molecules.map((mol) => ({
      id: mol.id,
      name: mol.name,
      icon: mol.icon,
      isDragging: host.view.draggingMoleculeId === mol.id,
    })),
    baukastenEmptyMessage: molecules.length
      ? null
      : msg(str`No molecules are available for "${localizedPhaseLabel(msg, host.currentPhase)}" yet.`),
  }
}

/** Navbar logic: tab state, view-model, and action handling for dna-simulation-navbar. */
export class NavbarController {
  activeTab: NavTab = "phasen"

  constructor(private readonly _host: WebwriterDnaSimulation) {}

  /** Pushes the current view-model into the navbar element. Call from widget's updated(). */
  syncView(root: ParentNode) {
    if (!this._host.view.sequenceTabVisible && this.activeTab === "sequenz") {
      this.activeTab = "phasen"
    }
    if (!this._host.view.showToolkitTab && this.activeTab === "baukasten") {
      this.activeTab = "phasen"
    }
    if (!this._host.view.showProteinTab && this.activeTab === "protein") {
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
        if (action.tab === "sequenz" && !host.view.sequenceTabVisible) return
        if (action.tab === "baukasten" && !host.view.showToolkitTab) return
        if (action.tab === "protein" && !host.view.showProteinTab) return
        this.activeTab = action.tab
        host.requestUpdate()
        if (action.tab === "protein") host.codonDrawer.setOpen(true)
        break
      case "phase-change":
        host.setPhase(action.phase)
        break
      case "sequence-input":
        if (!host.view.sequenceTabVisible) return
        host.setDnaSequence(action.value)
        break
      case "append-dna-base":
        if (!host.view.sequenceTabVisible) return
        host.setDnaSequence(host.view.sequenceTabDna + action.base)
        break
      case "mrna-input":
        host.transcription.syncModes()
        host.transcription.handleInput(action.value)
        break
      case "mrna-clear":
        host.transcription.clear()
        break
      case "mrna-verify":
        host.transcription.syncModes()
        host.transcription.verify()
        break
      case "mrna-enter":
        if (host.view.mrnaInput.isBatchMode) {
          host.transcription.syncModes()
          host.transcription.verify()
        }
        break
      case "mrna-append-base":
        host.transcription.syncModes()
        host.transcription.appendBase(action.base)
        break
      case "molecule-drag-start":
        host.startMoleculeDrag(action.nativeEvent, action.moleculeId)
        break
      case "molecule-place":
        host.enzymes.placeMolecule(action.moleculeId)
        break
      case "molecule-drag-end":
        host.moleculeDrag.onDragEnd()
        break
      case "reset-simulation":
        host.resetFlow.requestSimulation()
        break
      case "mutation-verify":
        host.mutationEdits.verifyGoal()
        break
      case "mutation-step-select":
        host.mutationEdits.rewindStep(action.stepIndex)
        break
      case "mutation-target-add":
        host.mutationEdits.addTargetAmino(action.amino)
        break
      case "mutation-target-remove":
        host.mutationEdits.removeTargetAmino(action.index)
        break
      case "open-codon-drawer":
        host.codonDrawer.setOpen(true)
        break
    }
  }
}
