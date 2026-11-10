import {expectedMrnaFromDna} from "./transcription.js"

/** mRNA (5′→3′) transcribed from the template DNA (3′→5′). */
export function mrnaFromTemplate(templateDna: string): string {
  return expectedMrnaFromDna(templateDna)
}

/** Complete codon count for an mRNA sequence (trailing incomplete bases ignored). */
export function codonCount(mrna: string): number {
  return Math.floor(mrna.length / 3)
}

/** Codon at index (0-based), or null if incomplete / out of range. */
export function codonAt(mrna: string, codonIndex: number): string | null {
  const start = codonIndex * 3
  if (start + 3 > mrna.length) return null
  return mrna.slice(start, start + 3)
}

export function isStartCodon(codon: string): boolean {
  return codon === "AUG"
}

export const STOP_CODONS = new Set(["UAA", "UAG", "UGA"])

export function isStopCodon(codon: string): boolean {
  return STOP_CODONS.has(codon)
}

/**
 * Standard genetic code (codon → amino-acid short name).
 * Used by later steps (codon card / tRNA matching); kept here so Step 1
 * already shares the same source of truth.
 */
export const GENETIC_CODE: Record<string, string> = {
  UUU: "Phe", UUC: "Phe", UUA: "Leu", UUG: "Leu",
  CUU: "Leu", CUC: "Leu", CUA: "Leu", CUG: "Leu",
  AUU: "Ile", AUC: "Ile", AUA: "Ile", AUG: "Met",
  GUU: "Val", GUC: "Val", GUA: "Val", GUG: "Val",
  UCU: "Ser", UCC: "Ser", UCA: "Ser", UCG: "Ser",
  CCU: "Pro", CCC: "Pro", CCA: "Pro", CCG: "Pro",
  ACU: "Thr", ACC: "Thr", ACA: "Thr", ACG: "Thr",
  GCU: "Ala", GCC: "Ala", GCA: "Ala", GCG: "Ala",
  UAU: "Tyr", UAC: "Tyr", UAA: "Stop", UAG: "Stop",
  CAU: "His", CAC: "His", CAA: "Gln", CAG: "Gln",
  AAU: "Asn", AAC: "Asn", AAA: "Lys", AAG: "Lys",
  GAU: "Asp", GAC: "Asp", GAA: "Glu", GAG: "Glu",
  UGU: "Cys", UGC: "Cys", UGA: "Stop", UGG: "Trp",
  CGU: "Arg", CGC: "Arg", CGA: "Arg", CGG: "Arg",
  AGU: "Ser", AGC: "Ser", AGA: "Arg", AGG: "Arg",
  GGU: "Gly", GGC: "Gly", GGA: "Gly", GGG: "Gly",
}

export function aminoAcidForCodon(codon: string): string | null {
  return GENETIC_CODE[codon] ?? null
}

/** In-frame triplets from mRNA base 0, plus leftover bases and the translated chain. */
export type ReadingFrame = {
  mrna: string
  /** Complete triplets (length 3), including a stop and any full codons after it. */
  codons: string[]
  /** Sense amino acids up to — but not including — the first in-frame stop. */
  polypeptide: string[]
  hasStop: boolean
  /** 0-based index into `codons` of the first stop, or `null`. */
  stopCodonIndex: number | null
  /** Leftover mRNA bases after the last complete codon (`length % 3`). */
  incompleteTail: string
}

/** Reading frame from transcribed mRNA, always starting at base 0. */
export function readingFrameFromMrna(mrna: string): ReadingFrame {
  const codons: string[] = []
  for (let i = 0; i + 3 <= mrna.length; i += 3) {
    codons.push(mrna.slice(i, i + 3))
  }
  const incompleteTail = mrna.slice(codons.length * 3)

  let stopCodonIndex: number | null = null
  const polypeptide: string[] = []
  for (let i = 0; i < codons.length; i++) {
    const codon = codons[i]
    if (isStopCodon(codon)) {
      stopCodonIndex = i
      break
    }
    const amino = aminoAcidForCodon(codon)
    if (amino && amino !== "Stop") polypeptide.push(amino)
  }

  return {
    mrna,
    codons,
    polypeptide,
    hasStop: stopCodonIndex !== null,
    stopCodonIndex,
    incompleteTail,
  }
}

/** Reading frame of a template DNA strand (3′→5′), via its mRNA. */
export function readingFrameFromTemplate(templateDna: string): ReadingFrame {
  return readingFrameFromMrna(mrnaFromTemplate(templateDna))
}

/** RNA↔RNA base pairing (mRNA codon to tRNA anticodon), same position, no reversal. */
export const RNA_COMPLEMENT: Record<string, string> = {A: "U", U: "A", C: "G", G: "C"}

/** Anticodon bases a tRNA carries to pair with `codon` (position-for-position). */
export function anticodonForCodon(codon: string): string {
  return codon
    .split("")
    .map((base) => RNA_COMPLEMENT[base] ?? "?")
    .join("")
}

/** First codon (table order) that encodes `aminoAcid` — used to depict a plausible tRNA when the wrong amino acid is dropped. */
export function firstCodonForAminoAcid(aminoAcid: string): string | null {
  for (const [codon, amino] of Object.entries(GENETIC_CODE)) {
    if (amino === aminoAcid) return codon
  }
  return null
}
