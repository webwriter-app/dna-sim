import {canPlaceHelicaseAtFork, canPlacePolymeraseAtFork, canPlaceRibosomeAtCodon, canRemoveHelicaseFromFork, canRemovePolymeraseFromFork, canRemoveRibosomeFromCodon, replicationDropActive, transcriptionDropActive, translationDropActive} from "../model/molecule-drop"
import {moleculeIcon} from "./baukasten"
import {renderStrand} from "./render-strand"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

export function renderStrandContent(w: WebwriterDnaSimulation) {
  const repDropActive = replicationDropActive(w.currentPhase, w.dnaSequence.length)
  const txDropActive = transcriptionDropActive(w.currentPhase, w.dnaSequence.length)
  const tlDropActive = translationDropActive(w.currentPhase, w.dnaSequence.length)

  const repCanPlace = canPlaceHelicaseAtFork(
    w.currentPhase,
    w.dnaSequence.length,
    w.flow.animationStep,
    w.enzymes.snappedHelicase,
  )
  const txCanPlace = canPlacePolymeraseAtFork(
    w.currentPhase,
    w.dnaSequence.length,
    w.transcription.transcriptionStep,
    w.transcription.snappedPolymerase,
  )
  const tlCanPlace = canPlaceRibosomeAtCodon(
    w.currentPhase,
    w.dnaSequence.length,
    w.translation.codonIndex,
    w.translation.snappedRibosome,
  )

  const dragFeedbackOpen =
    w.moleculeDrag.dropFeedback === "error" ||
    w.moleculeDrag.pointerDrag !== null ||
    w.moleculeDrag.slotSnapFadeOut

  const showEnzymeDropSlot =
    (repDropActive && (repCanPlace || dragFeedbackOpen)) ||
    (txDropActive && (txCanPlace || dragFeedbackOpen)) ||
    (tlDropActive && (tlCanPlace || dragFeedbackOpen))

  const snappedMolecule =
    w.currentPhase === "Replication" && w.enzymes.snappedHelicase
      ? {
          id: "helicase",
          icon: moleculeIcon("helicase"),
          removable:
            canRemoveHelicaseFromFork(w.enzymes.snappedHelicase, w.flow.animationStep) &&
            !w.enzymes.helicaseExiting,
          exiting: w.enzymes.helicaseExiting,
        }
      : w.currentPhase === "Transcription" && w.transcription.snappedPolymerase
        ? {
            id: "rna-polymerase",
            icon: moleculeIcon("rna-polymerase"),
            removable: canRemovePolymeraseFromFork(
              w.transcription.snappedPolymerase,
              w.transcription.transcriptionStep,
            ) && !w.enzymes.polymeraseExiting,
            exiting: w.enzymes.polymeraseExiting,
          }
        : null

  const mrnaBaseAnimEnabled = w.transcription.baseAnimEnabled

  return renderStrand(w.msg, {
    dnaSequence: w.currentPhase === "Mutations" ? w.mutationsSequence : w.dnaSequence,
    currentPhase: w.currentPhase,
    animationStep: w.flow.animationStep,
    markCodons: w.markCodons && (w.currentPhase === "Mutations" || w.currentPhase === "Translation"),
    markStopCodons: w.markStopCodons && (w.currentPhase === "Mutations" || w.currentPhase === "Translation"),
    polypeptideCompare: null,
    moleculeDrop: showEnzymeDropSlot
      ? {
          hover: w.moleculeDrag.dropSlotHover,
          feedback: w.moleculeDrag.dropFeedback,
          snappingOut: w.moleculeDrag.slotSnapFadeOut,
        }
      : null,
    snappedMolecule,
    transcription: w.currentPhase === "Transcription"
      ? {
          mrnaSequence: w.transcription.mrnaBuilt,
          transcriptionStep: w.transcription.transcriptionStep,
          awaitingRnaBase: w.transcription.awaitingRnaBase,
          stepwiseAnim: mrnaBaseAnimEnabled,
          baseAnim: mrnaBaseAnimEnabled
            ? {
                enteringIndex: w.transcription.mrnaEnteringIndex,
                successIndex: w.transcription.mrnaSuccessIndex,
              }
            : null,
          rejectAnim: mrnaBaseAnimEnabled ? w.transcription.mrnaRejectAnim : null,
        }
      : null,
    translation: w.currentPhase === "Translation"
      ? {
          mrnaSequence: w.translation.mrnaSequence,
          codonIndex: w.translation.codonIndex,
          visualCodonIndex: w.translation.visualCodonIndex,
          snappedRibosome: w.translation.snappedRibosome,
          removable:
            canRemoveRibosomeFromCodon(
              w.translation.snappedRibosome,
              w.translation.codonIndex,
            ) &&
            w.translation.polypeptide.length === 0 &&
            !w.translation.complete,
          polypeptide: w.translation.polypeptide,
          polypeptideLinkAngles: w.translation.polypeptideLinkAngles,
          polypeptideAnchorCodonIndex: w.translation.polypeptideAnchorCodonIndex,
          awaitingAminoAcid: w.translation.awaitingAminoAcid,
          aminoDropHover: w.translation.aminoDropHover,
          aminoDropHidden: w.translation.aminoDropHidden,
          aminoDropReveal: w.translation.aminoDropReveal,
          complete: w.translation.complete,
          ribosomeClosing: w.translation.ribosomeClosing,
          ribosomeFillVisible: w.translation.ribosomeFillVisible,
          ribosomeShellVisible: w.translation.ribosomeShellVisible,
          ribosomeHalvesPhase: w.translation.ribosomeHalvesPhase,
          incomingTrna: w.translation.incomingTrna,
          dockedTrnas: w.translation.dockedTrnas,
        }
      : null,
    mutations: w.currentPhase === "Mutations"
      ? {
          selectedIndex: w.mutations.selectedIndex,
          selectedStrand: w.mutations.selectedStrand,
          onBaseClick: w.mutationMenu.onBaseClick,
          onBaseKeyDown: w.mutationMenu.onBaseKeyDown,
        }
      : null,
    dropHandlers: {
      onSlotDragEnter: w.moleculeDrag.onSlotDragEnter,
      onSlotDragOver: w.moleculeDrag.onSlotDragOver,
      onSlotDragLeave: w.moleculeDrag.onSlotDragLeave,
      onSlotDrop: w.enzymes.onSlotDrop,
      onSnappedPointerDown: w.enzymes.onSnappedPointerDown,
      onSnappedKeyDown: w.enzymes.onSnappedKeyDown,
      onDropSlotAnimationEnd: w.moleculeDrag.onDropSlotAnimationEnd,
      onMrnaBaseAnimationEnd: w.transcription.onBaseAnimationEnd,
      onReplicationSplitTransitionEnd: w.enzymes.onReplicationSplitTransitionEnd,
      onSnappedMoleculeAnimationEnd: w.enzymes.onSnappedMoleculeAnimationEnd,
      onSnappedMoleculeTransitionEnd: w.enzymes.onSnappedMoleculeTransitionEnd,
    },
  })
}