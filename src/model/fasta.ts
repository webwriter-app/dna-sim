export const FASTA_MAX_BASES = 2000
export const FASTA_MIN_BASES = 3
const LINE_WIDTH = 70

export type FastaError =
  | {kind: "empty"}
  | {kind: "invalid", character: string, position: number}
  | {kind: "short", min: number}
  | {kind: "long", max: number}

export type FastaResult = {sequence: string, header: string} | {error: FastaError}

/**
 * Reads the first record of a FASTA file. Blank lines and `;` comments are skipped, a missing
 * header is accepted, and an RNA sequence (U without T) is read as its DNA equivalent.
 */
export function parseFasta(text: string): FastaResult {
  const lines = text.replace(/^﻿/, "").split(/\r\n|\r|\n/)
  let header = ""
  let sequence = ""
  let started = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(";")) continue
    if (trimmed.startsWith(">")) {
      if (started) break
      header = trimmed.slice(1).trim()
      started = true
      continue
    }
    started = true
    sequence += trimmed.replace(/\s+/g, "")
  }
  sequence = sequence.toUpperCase()
  if (!sequence) return {error: {kind: "empty"}}
  if (sequence.includes("U") && !sequence.includes("T")) sequence = sequence.replaceAll("U", "T")
  const bad = sequence.search(/[^ACGT]/)
  if (bad >= 0) return {error: {kind: "invalid", character: sequence[bad], position: bad + 1}}
  if (sequence.length < FASTA_MIN_BASES) return {error: {kind: "short", min: FASTA_MIN_BASES}}
  if (sequence.length > FASTA_MAX_BASES) return {error: {kind: "long", max: FASTA_MAX_BASES}}
  return {sequence, header}
}

export function formatFasta(sequence: string, header: string): string {
  const rows = sequence.match(new RegExp(`.{1,${LINE_WIDTH}}`, "g")) ?? []
  return `>${header}\n${rows.join("\n")}\n`
}
