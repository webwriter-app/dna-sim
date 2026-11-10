import {str, type MsgFn} from "@lit/localize"

import {PHASE_ENABLE_KEYS} from "./widget-options.js"

/** Display name for a simulation phase. IDs stay English; this is UI-only. */
export function localizedPhaseLabel(msg: MsgFn, phase: string): string {
  switch (phase) {
    case "Replication":
      return msg("Replication")
    case "Transcription":
      return msg("Transcription")
    case "Translation":
      return msg("Translation")
    case "Mutations":
      return msg("Mutations")
    default:
      return phase
  }
}

export function localizedMoleculeName(msg: MsgFn, id: string): string {
  switch (id) {
    case "helicase":
      return msg("Helicase")
    case "dna-polymerase":
      return msg("DNA Polymerase")
    case "primase":
      return msg("Primase")
    case "ligase":
      return msg("Ligase")
    case "telomerase":
      return msg("Telomerase")
    case "rna-polymerase":
      return msg("RNA Polymerase")
    case "activator":
      return msg("Activator")
    case "repressor":
      return msg("Repressor")
    case "spliceosome":
      return msg("Spliceosome")
    case "ribosome":
      return msg("Ribosome")
    case "release-factor":
      return msg("Release Factor")
    case "peptidyl-transferase":
      return msg("Peptidyl Transferase")
    case "initiation-factor":
      return msg("Initiation Factor")
    default:
      return id
  }
}

/** Full amino-acid name for the codon-list view. Three-letter codes stay as-is. */
export function localizedAminoAcidFullName(msg: MsgFn, threeLetter: string): string {
  switch (threeLetter) {
    case "Phe":
      return msg("Phenylalanine")
    case "Leu":
      return msg("Leucine")
    case "Ile":
      return msg("Isoleucine")
    case "Met":
      return msg("Methionine")
    case "Val":
      return msg("Valine")
    case "Ser":
      return msg("Serine")
    case "Pro":
      return msg("Proline")
    case "Thr":
      return msg("Threonine")
    case "Ala":
      return msg("Alanine")
    case "Tyr":
      return msg("Tyrosine")
    case "His":
      return msg("Histidine")
    case "Gln":
      return msg("Glutamine")
    case "Asn":
      return msg("Asparagine")
    case "Lys":
      return msg("Lysine")
    case "Asp":
      return msg("Aspartate")
    case "Glu":
      return msg("Glutamate")
    case "Cys":
      return msg("Cysteine")
    case "Trp":
      return msg("Tryptophan")
    case "Arg":
      return msg("Arginine")
    case "Gly":
      return msg("Glycine")
    case "Stop":
      return msg("Stop")
    default:
      return threeLetter
  }
}

export function localizedPhaseEnableLabel(
  msg: MsgFn,
  key: (typeof PHASE_ENABLE_KEYS)[number],
): string {
  switch (key) {
    case "enableReplication":
      return msg("Replication")
    case "enableTranscription":
      return msg("Transcription")
    case "enableTranslation":
      return msg("Translation")
    case "enableMutations":
      return msg("Mutations")
  }
}

export function localizedPhaseEnableDescription(
  msg: MsgFn,
  key: (typeof PHASE_ENABLE_KEYS)[number],
): string {
  switch (key) {
    case "enableReplication":
      return msg("Show DNA replication in the simulation.")
    case "enableTranscription":
      return msg("Show DNA → mRNA in the simulation.")
    case "enableTranslation":
      return msg("Show mRNA → protein in the simulation.")
    case "enableMutations":
      return msg("Substitute, insert, or delete DNA bases.")
  }
}

export function localizedPhaseCompleteMessage(
  msg: MsgFn,
  phase: string,
  next: string | null,
  mutationSteps?: number,
): string {
  const nextLabel = next ? localizedPhaseLabel(msg, next) : ""
  if (phase === "Mutations") {
    const n = mutationSteps ?? 0
    if (!next) {
      return n === 1
        ? msg("Mutations complete in 1 step. Lesson complete")
        : msg(str`Mutations complete in ${n} steps. Lesson complete`)
    }
    return n === 1
      ? msg(str`Mutations complete in 1 step — continue to ${nextLabel}?`)
      : msg(str`Mutations complete in ${n} steps — continue to ${nextLabel}?`)
  }
  if (!next) return msg("Lesson complete")
  return msg(str`${localizedPhaseLabel(msg, phase)} complete — continue to ${nextLabel}?`)
}
