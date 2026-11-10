import {str, type MsgFn} from "@lit/localize"

import adenineSvg from "../../assets/base-adenine.svg"
import thymineSvg from "../../assets/base-thymine.svg"
import cytosineSvg from "../../assets/base-cytosine.svg"
import guanineSvg from "../../assets/base-guanine.svg"

/** Valid DNA template bases used across the simulation. */
export type DnaBase = "A" | "C" | "T" | "G"

/** Display / insertion order used by the Mutations menu. */
export const DNA_BASE_ORDER: readonly DnaBase[] = ["A", "T", "G", "C"]

/** Base icons used by the Mutations context menu and the steps dropdown. */
export const DNA_BASE_ICONS: Record<DnaBase, string> = {
  A: adenineSvg,
  T: thymineSvg,
  C: cytosineSvg,
  G: guanineSvg,
}

/** Watson–Crick complement (DNA). */
export const COMP_DNA_BASE: Record<DnaBase, DnaBase> = {
  A: "T",
  T: "A",
  C: "G",
  G: "C",
}

const DNA_BASES = new Set<string>(["A", "C", "T", "G"])

/** Normalize a single base; returns null if not A/C/T/G. */
export function sanitizeDnaBase(raw: string): DnaBase | null {
  const base = raw.toUpperCase()
  return DNA_BASES.has(base) ? (base as DnaBase) : null
}

export function complementDnaBase(base: string): DnaBase | null {
  const b = sanitizeDnaBase(base)
  return b === null ? null : COMP_DNA_BASE[b]
}

/**
 * Map a base the user chose for the *clicked* strand into the template-strand
 * value we actually store in `dnaSequence`.
 */
export function templateBaseForStrandEdit(
  chosenBase: string,
  strand: "template" | "complement",
): DnaBase | null {
  const chosen = sanitizeDnaBase(chosenBase)
  if (chosen === null) return null
  return strand === "complement" ? COMP_DNA_BASE[chosen] : chosen
}

/** Alternate bases offered for substitution (excludes the current base). */
export function substitutionTargets(current: string): DnaBase[] {
  const base = sanitizeDnaBase(current)
  if (base === null) return [...DNA_BASE_ORDER]
  return DNA_BASE_ORDER.filter((b) => b !== base)
}

/**
 * Replace the base at `index`. Returns the new sequence, or null if the
 * index/base is invalid or the base is unchanged.
 */
export function substituteDnaBase(
  sequence: string,
  index: number,
  base: string,
): string | null {
  const nextBase = sanitizeDnaBase(base)
  if (nextBase === null) return null
  if (index < 0 || index >= sequence.length) return null
  if (sequence[index] === nextBase) return null
  return sequence.slice(0, index) + nextBase + sequence.slice(index + 1)
}

/**
 * Insert `base` before `index` (0 … length inclusive).
 * Returns the new sequence, or null if invalid.
 */
export function insertDnaBase(
  sequence: string,
  index: number,
  base: string,
): string | null {
  const nextBase = sanitizeDnaBase(base)
  if (nextBase === null) return null
  if (index < 0 || index > sequence.length) return null
  return sequence.slice(0, index) + nextBase + sequence.slice(index)
}

/**
 * Remove the base at `index`. Returns the new sequence, or null if invalid.
 */
export function deleteDnaBase(sequence: string, index: number): string | null {
  if (index < 0 || index >= sequence.length) return null
  return sequence.slice(0, index) + sequence.slice(index + 1)
}

export type MutationStepKind = "substitution" | "insertion" | "deletion"

export type MutationStep = {
  kind: MutationStepKind
  /** 0-based template index at the time of the edit. */
  index: number
  from?: DnaBase
  to?: DnaBase
}

/** Compact chip label, 1-based position on the template (3′ → 5′). */
export function formatMutationStepKindLabel(msg: MsgFn, step: MutationStep): string {
  const pos = step.index + 1
  if (step.kind === "substitution") return msg(str`Sub ${pos}`)
  if (step.kind === "insertion") return msg(str`Ins ${pos}`)
  return msg(str`Del ${pos}`)
}

/** Compact chip label including bases, 1-based position on the template (3′ → 5′). */
export function formatMutationStepLabel(msg: MsgFn, step: MutationStep): string {
  const prefix = formatMutationStepKindLabel(msg, step)
  if (step.kind === "substitution") {
    return `${prefix} ${step.from ?? "?"}→${step.to ?? "?"}`
  }
  if (step.kind === "insertion") {
    return `${prefix} ${step.to ?? "?"}`
  }
  return prefix
}

export function applyMutationStep(sequence: string, step: MutationStep): string | null {
  if (step.kind === "substitution") {
    return step.to ? substituteDnaBase(sequence, step.index, step.to) : null
  }
  if (step.kind === "insertion") {
    return step.to ? insertDnaBase(sequence, step.index, step.to) : null
  }
  return deleteDnaBase(sequence, step.index)
}

/** Replay `steps` onto `start` in order. Stops at the first invalid edit. */
export function replayMutationSteps(
  start: string,
  steps: readonly MutationStep[],
): string {
  let sequence = start
  for (const step of steps) {
    const next = applyMutationStep(sequence, step)
    if (next === null) break
    sequence = next
  }
  return sequence
}
