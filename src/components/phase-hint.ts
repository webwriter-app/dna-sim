import {str, type MsgFn} from "@lit/localize"

import {formatPolypeptide} from "../model/mutation-goals"

/** What the hint text depends on; the widget fills it from its controllers. */
export interface PhaseHintState {
  currentPhase: string
  dnaSequenceLength: number
  replicationEnabled: boolean
  snappedHelicase: boolean
  transcriptionEnabled: boolean
  transcription: {
    snappedPolymerase: boolean
    awaitingRnaBase: boolean
    activeInputMode: string
    activeBatchVerifyMode: string
  }
  translation: {
    snappedRibosome: boolean
    complete: boolean
    polypeptide: readonly string[]
    endedWithoutStop: boolean
    awaitingMoreSequence: boolean
    expectedAminoAcid: string | null
    currentCodon: string | null
  }
  mutationShowGoal: boolean
  mutationTargetChain: readonly string[]
  teacherEditing: boolean
}

/** The instruction shown behind the info button for the current phase, or null when there is none. */
export function phaseHintText(msg: MsgFn, s: PhaseHintState): string | null {
  if (s.currentPhase === "Replication") {
    if (!s.replicationEnabled || s.snappedHelicase) return null
    return msg("Place the correct molecule at the fork to start.")
  }

  if (s.currentPhase === "Transcription") {
    if (!s.transcriptionEnabled) return null
    if (!s.transcription.snappedPolymerase) {
      return msg("Place RNA polymerase at the fork to start.")
    }
    if (s.transcription.awaitingRnaBase) {
      if (s.transcription.activeInputMode === "stepwise") {
        return msg("Enter mRNA above, one base at a time.")
      }
      return s.transcription.activeBatchVerifyMode === "sequential"
        ? msg("Enter the full mRNA above and tap Verify. Bases are checked one by one.")
        : msg("Enter the full mRNA above and tap Verify.")
    }
  }

  if (s.currentPhase === "Translation") {
    if (s.dnaSequenceLength < 3) {
      return msg("Add at least 3 bases to the template.")
    }
    if (!s.translation.snappedRibosome) {
      return msg("Place the ribosome on the first codon.")
    }
    if (s.translation.complete) {
      const chain = s.translation.polypeptide.join("-") || "—"
      if (s.translation.endedWithoutStop) {
        return msg(str`Done without stop codon. Protein: ${chain}`)
      }
      return msg(str`Done. Protein: ${chain}`)
    }
    if (s.translation.awaitingMoreSequence) {
      return msg("Add more bases to continue.")
    }
    const expected = s.translation.expectedAminoAcid
    const codon = s.translation.currentCodon ?? "?"
    if (expected) {
      return msg(str`Drag the amino acid for ${codon} onto the ribosome.`)
    }
    return msg("Open the codon wheel and drag the matching amino acid onto the ribosome.")
  }

  if (s.currentPhase === "Mutations") {
    let assignment: string
    if (s.mutationShowGoal) {
      const protein = formatPolypeptide(s.mutationTargetChain)
      if (s.teacherEditing && !protein) {
        assignment = msg("Choose a target protein in the list.")
      } else if (protein) {
        assignment = msg(str`Change the DNA to produce ${protein}. Then tap Verify.`)
      } else {
        assignment = msg("Change the DNA to match the target. Then tap Verify.")
      }
    } else {
      assignment = msg("Tap a base to substitute, insert, or delete.")
    }
    return assignment
  }

  return null
}