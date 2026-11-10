import type {MsgFn} from "@lit/localize"

/** Drop target size on the canvas (matches Baukasten icon footprint). */
export const MOLECULE_DROP_SIZE = 40

export type DropFeedback = "none" | "success" | "error"

export function replicationDropActive(
  phase: string,
  sequenceLength: number,
): boolean {
  return phase === "Replication" && sequenceLength > 0
}

export function transcriptionDropActive(
  phase: string,
  sequenceLength: number,
): boolean {
  return phase === "Transcription" && sequenceLength > 0
}

/** Translation needs at least one full codon (3 mRNA bases = 3 template bases). */
export function translationDropActive(
  phase: string,
  sequenceLength: number,
): boolean {
  return phase === "Translation" && sequenceLength >= 3
}

/** Helicase may only be placed at the fork before replication has started. */
export function canPlaceHelicaseAtFork(
  phase: string,
  sequenceLength: number,
  animationStep: number,
  slotOccupied: boolean,
): boolean {
  return replicationDropActive(phase, sequenceLength) &&
    animationStep === 0 &&
    !slotOccupied
}

/** RNA polymerase may only be placed at the fork before transcription has started. */
export function canPlacePolymeraseAtFork(
  phase: string,
  sequenceLength: number,
  transcriptionStep: number,
  slotOccupied: boolean,
): boolean {
  return transcriptionDropActive(phase, sequenceLength) &&
    transcriptionStep === 0 &&
    !slotOccupied
}

/** RNA polymerase may only be removed while still at the start (step 0). */
export function canRemovePolymeraseFromFork(
  snapped: boolean,
  transcriptionStep: number,
): boolean {
  return snapped && transcriptionStep === 0
}

/** Helicase may only be removed while still at the start (step 0). */
export function canRemoveHelicaseFromFork(
  snapped: boolean,
  animationStep: number,
): boolean {
  return snapped && animationStep === 0
}

/** Ribosome may only be placed at the first codon before translation has started. */
export function canPlaceRibosomeAtCodon(
  phase: string,
  sequenceLength: number,
  codonIndex: number,
  slotOccupied: boolean,
): boolean {
  return translationDropActive(phase, sequenceLength) &&
    codonIndex === 0 &&
    !slotOccupied
}

/** Ribosome may only be removed while still at the first codon. */
export function canRemoveRibosomeFromCodon(
  snapped: boolean,
  codonIndex: number,
): boolean {
  return snapped && codonIndex === 0
}

export function expectedMoleculeId(
  phase: string,
  sequenceLength: number,
  animationStep: number,
  slotOccupied: boolean,
): string | null {
  if (!canPlaceHelicaseAtFork(phase, sequenceLength, animationStep, slotOccupied)) {
    return null
  }
  return "helicase"
}

export function dropErrorMessage(
  msg: MsgFn,
  phase: string,
  droppedId: string,
  expectedId: string | null,
): string {
  if (phase === "Transcription" || phase === "Translation") {
    if (!expectedId) {
      return msg("No molecule is needed at this position.")
    }
    return msg("Wrong molecule for this phase.")
  }
  if (phase !== "Replication") {
    return msg("No molecule can be placed in this phase.")
  }
  if (!expectedId) {
    return msg("Replication is complete at this position.")
  }
  return msg("Wrong molecule for this position.")
}
