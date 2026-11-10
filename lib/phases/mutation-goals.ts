import {GENETIC_CODE, readingFrameFromTemplate} from "./translation.js"

export const MUTATION_GOAL_MODES = ["sandbox", "target-protein"] as const

export type MutationGoalMode = (typeof MUTATION_GOAL_MODES)[number]

export const DEFAULT_MUTATION_GOAL_MODE: MutationGoalMode = "sandbox"

export type DnaEditKind = "none" | "substitution" | "insertion" | "deletion" | "mixed"

export type MutationCheckReason =
  | "match"
  | "protein-mismatch"
  | "no-target"
  | "invalid-target"

export type MutationCheckResult = {
  passed: boolean
  editKind: DnaEditKind
  proteinChanged: boolean
  reason: MutationCheckReason
}

/** Three-letter amino-acid names from the genetic code, excluding Stop. */
export const AMINO_ACID_NAMES: readonly string[] = [
  ...new Set(
    Object.values(GENETIC_CODE).filter((name) => name !== "Stop"),
  ),
]

const AMINO_ACID_LOOKUP = new Map(
  AMINO_ACID_NAMES.map((name) => [name.toLowerCase(), name]),
)

export const AMINO_ACID_PICKER_NAMES: readonly string[] = [...AMINO_ACID_NAMES].sort(
  (a, b) => a.localeCompare(b),
)

export function mutationTargetChain(raw: unknown): string[] {
  const parsed = parseTargetProtein(raw)
  return parsed.ok ? parsed.chain : []
}

export function hasMutationProteinGoal(raw: unknown): boolean {
  return mutationTargetChain(raw).length > 0
}

export function normalizeMutationGoalMode(
  raw: string | null | undefined,
): MutationGoalMode {
  if (raw === "target-protein") return "target-protein"
  // Older "target-dna" lessons fall back to sandbox.
  return DEFAULT_MUTATION_GOAL_MODE
}

export function normalizeAminoAcidToken(raw: string): string | null {
  const key = raw.trim().toLowerCase()
  if (!key) return null
  return AMINO_ACID_LOOKUP.get(key) ?? null
}

export type ParsedTargetProtein = {
  ok: boolean
  chain: string[]
  invalid: string[]
}

/** Split on non-letters so `Met-Leu Phe` and `met,leu` all work. */
export function parseTargetProtein(raw: unknown): ParsedTargetProtein {
  const tokens = String(raw ?? "")
    .split(/[^A-Za-z]+/)
    .map((token) => token.trim())
    .filter(Boolean)
  const chain: string[] = []
  const invalid: string[] = []
  for (const token of tokens) {
    const amino = normalizeAminoAcidToken(token)
    if (amino) chain.push(amino)
    else invalid.push(token)
  }
  return {ok: invalid.length === 0, chain, invalid}
}

export function formatPolypeptide(chain: readonly string[]): string {
  return chain.length ? chain.join("-") : ""
}

export function polypeptidesEqual(
  a: readonly string[],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) return false
  return a.every((amino, i) => amino === b[i])
}

export function classifyDnaEdit(start: string, current: string): DnaEditKind {
  if (start === current) return "none"
  if (start.length === current.length) return "substitution"
  const min = Math.min(start.length, current.length)
  let prefixMismatch = false
  for (let i = 0; i < min; i++) {
    if (start[i] !== current[i]) {
      prefixMismatch = true
      break
    }
  }
  if (prefixMismatch) return "mixed"
  return current.length > start.length ? "insertion" : "deletion"
}

export function proteinChangedByEdit(startDna: string, currentDna: string): boolean {
  return !polypeptidesEqual(
    readingFrameFromTemplate(startDna).polypeptide,
    readingFrameFromTemplate(currentDna).polypeptide,
  )
}

export function evaluateMutationGoal(input: {
  mode: MutationGoalMode
  startDna: string
  currentDna: string
  targetProteinRaw: string
}): MutationCheckResult {
  const editKind = classifyDnaEdit(input.startDna, input.currentDna)
  const proteinChanged = proteinChangedByEdit(input.startDna, input.currentDna)
  const base = {editKind, proteinChanged}

  if (input.mode !== "target-protein") {
    return {...base, passed: false, reason: "no-target"}
  }

  const parsed = parseTargetProtein(input.targetProteinRaw)
  if (!parsed.ok) {
    return {...base, passed: false, reason: "invalid-target"}
  }
  if (!input.targetProteinRaw.trim() || parsed.chain.length === 0) {
    return {...base, passed: false, reason: "no-target"}
  }
  const current = readingFrameFromTemplate(input.currentDna).polypeptide
  if (polypeptidesEqual(current, parsed.chain)) {
    return {...base, passed: true, reason: "match"}
  }
  return {...base, passed: false, reason: "protein-mismatch"}
}

export function startMatchesMutationGoal(input: {
  mode: MutationGoalMode
  startDna: string
  targetProteinRaw: string
}): boolean {
  return evaluateMutationGoal({
    ...input,
    currentDna: input.startDna,
  }).passed
}
