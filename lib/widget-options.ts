import {
  formatPolypeptide,
  mutationTargetChain,
  normalizeMutationGoalMode,
  type MutationGoalMode,
} from "./phases/mutation-goals.js"

export const CANONICAL_PHASES = [
  "Replication",
  "Transcription",
  "Translation",
  "Mutations",
] as const

export type SimulationPhase = (typeof CANONICAL_PHASES)[number]

export type PhaseSetMode = "all" | "custom"

export const DEFAULT_PHASE_SET_MODE: PhaseSetMode = "all"

export type PhaseEnableFlags = {
  enableReplication: boolean
  enableTranscription: boolean
  enableTranslation: boolean
  enableMutations: boolean
}

export const ALL_PHASES_ENABLED: PhaseEnableFlags = {
  enableReplication: true,
  enableTranscription: true,
  enableTranslation: true,
  enableMutations: true,
}

export const PHASE_ENABLE_KEYS = [
  "enableReplication",
  "enableTranscription",
  "enableTranslation",
  "enableMutations",
] as const

export function normalizePhaseSetMode(
  raw: string | null | undefined,
): PhaseSetMode {
  if (raw === "custom" || raw === "all") return raw
  return DEFAULT_PHASE_SET_MODE
}

export const PHASE_SET_MODE_ATTRIBUTE = "phasesetmode"

export const PHASE_SET_MODE_ATTR_NAMES = [
  PHASE_SET_MODE_ATTRIBUTE,
  "phaseSetMode",
  "phase-set-mode",
] as const

export function readPhaseSetModeAttr(el: Element): PhaseSetMode | undefined {
  const name = PHASE_SET_MODE_ATTR_NAMES.find((n) => el.hasAttribute(n))
  if (!name) return undefined
  return normalizePhaseSetMode(el.getAttribute(name))
}

export function phaseEnableHideAttribute(
  key: (typeof PHASE_ENABLE_KEYS)[number],
): string {
  const kebab = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  return `hide-${kebab}`
}

export function phaseEnableAttribute(
  key: (typeof PHASE_ENABLE_KEYS)[number],
): string {
  return key.toLowerCase()
}

/** `undefined` if this flag was never persisted. */
export function readPhaseEnableFlag(
  el: Element,
  key: (typeof PHASE_ENABLE_KEYS)[number],
): boolean | undefined {
  if (
    el.hasAttribute(phaseEnableHideAttribute(key)) ||
    el.hasAttribute(`hide${key.toLowerCase()}`)
  ) {
    return false
  }
  return readPersistedBooleanAttr(el, key)
}

/** WebWriter Booleans use attribute presence. Hide-* keeps OFF for student view. */
export function writePhaseEnableFlag(
  el: Element,
  key: (typeof PHASE_ENABLE_KEYS)[number],
  on: boolean,
): void {
  for (const name of persistedBooleanAttributeNames(key)) {
    if (name !== phaseEnableAttribute(key)) el.removeAttribute(name)
  }
  el.removeAttribute(`hide${key.toLowerCase()}`)
  writeToggle(el, phaseEnableAttribute(key), phaseEnableHideAttribute(key), on)
}

export function resolvePhaseEnableFlags(
  mode: PhaseSetMode,
  flags: PhaseEnableFlags,
): PhaseEnableFlags {
  return mode === "custom" ? flags : ALL_PHASES_ENABLED
}

/**
 * Parse a persisted boolean attribute.
 * Default-true options must store `"true"` / `"false"`. Lit's Boolean type
 * drops the attribute at `false`, so the JS default `true` would win again.
 * Missing attributes keep `defaultWhenMissing` (true for these options).
 */
export function booleanFromAttribute(
  value: string | null | undefined,
  defaultWhenMissing = true,
): boolean {
  if (value == null) return defaultWhenMissing
  return value !== "false"
}

/** Always persist both states so student view does not fall back to defaults. */
export function booleanToAttribute(value: boolean): "true" | "false" {
  return value ? "true" : "false"
}

function writeToggle(el: Element, attribute: string, hideAttribute: string, on: boolean) {
  if (on) el.setAttribute(attribute, "")
  else el.removeAttribute(attribute)
  el.toggleAttribute(hideAttribute, !on)
}

export const SHOW_INFO_CARDS_ATTRIBUTE = "showinfocards"
export const HIDE_INFO_CARDS_ATTRIBUTE = "hide-info-cards"

/** Teacher OFF must survive WebWriter stripping a default-true Boolean attribute. */
export function readShowInfoCards(el: Element): boolean {
  if (
    el.hasAttribute(HIDE_INFO_CARDS_ATTRIBUTE) ||
    el.hasAttribute("hideinfocards")
  ) {
    return false
  }
  const parsed = readPersistedBooleanAttr(el, "showInfoCards")
  return parsed === undefined ? true : parsed
}

export function writeShowInfoCards(el: Element, on: boolean): void {
  for (const name of persistedBooleanAttributeNames("showInfoCards")) {
    if (name !== SHOW_INFO_CARDS_ATTRIBUTE) el.removeAttribute(name)
  }
  el.removeAttribute("hideinfocards")
  writeToggle(el, SHOW_INFO_CARDS_ATTRIBUTE, HIDE_INFO_CARDS_ATTRIBUTE, on)
}

export const SHOW_SEQUENCE_TAB_ATTRIBUTE = "showsequencetab"
export const HIDE_SEQUENCE_TAB_ATTRIBUTE = "hide-sequence-tab"

/** Teacher OFF must survive WebWriter stripping a default-true Boolean attribute. */
export function readShowSequenceTab(el: Element): boolean {
  if (
    el.hasAttribute(HIDE_SEQUENCE_TAB_ATTRIBUTE) ||
    el.hasAttribute("hidesequencetab")
  ) {
    return false
  }
  const parsed = readPersistedBooleanAttr(el, "showSequenceTab")
  return parsed === undefined ? true : parsed
}

export function writeShowSequenceTab(el: Element, on: boolean): void {
  for (const name of persistedBooleanAttributeNames("showSequenceTab")) {
    if (name !== SHOW_SEQUENCE_TAB_ATTRIBUTE) el.removeAttribute(name)
  }
  el.removeAttribute("hidesequencetab")
  writeToggle(el, SHOW_SEQUENCE_TAB_ATTRIBUTE, HIDE_SEQUENCE_TAB_ATTRIBUTE, on)
}

export function persistedBooleanAttributeNames(key: string): string[] {
  const kebab = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  return [...new Set([key, key.toLowerCase(), kebab])]
}

/** `undefined` if the attribute is absent; otherwise the persisted boolean. */
export function readPersistedBooleanAttr(
  el: Element,
  key: string,
): boolean | undefined {
  const name = persistedBooleanAttributeNames(key).find((n) => el.hasAttribute(n))
  if (!name) return undefined
  return booleanFromAttribute(el.getAttribute(name))
}

export function writePersistedBoolean(el: Element, name: string, on: boolean): void {
  el.setAttribute(name, booleanToAttribute(on))
}

export function enabledPhasesFromFlags(flags: PhaseEnableFlags): SimulationPhase[] {
  const list: SimulationPhase[] = []
  if (flags.enableReplication) list.push("Replication")
  if (flags.enableTranscription) list.push("Transcription")
  if (flags.enableTranslation) list.push("Translation")
  if (flags.enableMutations) list.push("Mutations")
  return list
}

export function resolveVisiblePhases(
  mode: PhaseSetMode,
  flags: PhaseEnableFlags,
): SimulationPhase[] {
  if (mode !== "custom") return [...CANONICAL_PHASES]
  const enabled = enabledPhasesFromFlags(flags)
  return enabled.length ? enabled : ["Replication"]
}

export function firstEnabledPhase(flags: PhaseEnableFlags): SimulationPhase {
  return enabledPhasesFromFlags(flags)[0] ?? "Replication"
}

export function nextEnabledPhase(
  flags: PhaseEnableFlags,
  current: string,
): SimulationPhase | null {
  const enabled = enabledPhasesFromFlags(flags)
  const i = enabled.indexOf(current as SimulationPhase)
  if (i < 0) return enabled[0] ?? null
  return enabled[i + 1] ?? null
}

  /** Forward jumps require every earlier visible phase to be complete; going back is always allowed. */
export function canSelectVisiblePhase(
  target: string,
  current: string,
  visible: readonly string[],
  completed: {has(phase: string): boolean},
  lockOrder: boolean,
): boolean {
  if (!visible.includes(target)) return false
  if (target === current || !lockOrder) return true
  const targetIndex = visible.indexOf(target)
  const currentIndex = visible.indexOf(current)
  if (currentIndex >= 0 && targetIndex <= currentIndex) return true
  for (let i = 0; i < targetIndex; i++) {
    if (!completed.has(visible[i])) return false
  }
  return true
}

export function lockedPhaseEnableKey(
  flags: PhaseEnableFlags,
): (typeof PHASE_ENABLE_KEYS)[number] | null {
  const on = PHASE_ENABLE_KEYS.filter((key) => flags[key])
  return on.length === 1 ? on[0] : null
}

export const DEFAULT_ANIMATION_SPEED = 1
export const MIN_ANIMATION_SPEED = 0.5
export const MAX_ANIMATION_SPEED = 2
export const ANIMATION_SPEED_STEP = 0.1

export const CROSS_PHASE_MUTATIONS_ATTRIBUTE = "crossphasemutations"
export const HIDE_CROSS_PHASE_MUTATIONS_ATTRIBUTE = "hide-cross-phase-mutations"

/** Teacher OFF must survive WebWriter stripping a default-true Boolean attribute. */
export function readCrossPhaseMutations(el: Element): boolean {
  if (
    el.hasAttribute(HIDE_CROSS_PHASE_MUTATIONS_ATTRIBUTE) ||
    el.hasAttribute("hidecrossphasemutations")
  ) {
    return false
  }
  const parsed = readPersistedBooleanAttr(el, "crossPhaseMutations")
  return parsed === undefined ? true : parsed
}

export function writeCrossPhaseMutations(el: Element, on: boolean): void {
  for (const name of persistedBooleanAttributeNames("crossPhaseMutations")) {
    if (name !== CROSS_PHASE_MUTATIONS_ATTRIBUTE) el.removeAttribute(name)
  }
  el.removeAttribute("hidecrossphasemutations")
  writeToggle(el, CROSS_PHASE_MUTATIONS_ATTRIBUTE, HIDE_CROSS_PHASE_MUTATIONS_ATTRIBUTE, on)
}

export const MARK_CODONS_ATTRIBUTE = "markcodons"
export const HIDE_MARK_CODONS_ATTRIBUTE = "hide-mark-codons"

/** Teacher OFF must survive WebWriter stripping a default-true Boolean attribute. */
export function readMarkCodons(el: Element): boolean {
  if (
    el.hasAttribute(HIDE_MARK_CODONS_ATTRIBUTE) ||
    el.hasAttribute("hidemarkcodons")
  ) {
    return false
  }
  const parsed = readPersistedBooleanAttr(el, "markCodons")
  return parsed === undefined ? true : parsed
}

export function writeMarkCodons(el: Element, on: boolean): void {
  for (const name of persistedBooleanAttributeNames("markCodons")) {
    if (name !== MARK_CODONS_ATTRIBUTE) el.removeAttribute(name)
  }
  el.removeAttribute("hidemarkcodons")
  writeToggle(el, MARK_CODONS_ATTRIBUTE, HIDE_MARK_CODONS_ATTRIBUTE, on)
}

export const MARK_STOP_CODONS_ATTRIBUTE = "markstopcodons"
export const HIDE_MARK_STOP_CODONS_ATTRIBUTE = "hide-mark-stop-codons"

/** Teacher OFF must survive WebWriter stripping a default-true Boolean attribute. */
export function readMarkStopCodons(el: Element): boolean {
  if (
    el.hasAttribute(HIDE_MARK_STOP_CODONS_ATTRIBUTE) ||
    el.hasAttribute("hidemarkstopcodons")
  ) {
    return false
  }
  const parsed = readPersistedBooleanAttr(el, "markStopCodons")
  return parsed === undefined ? true : parsed
}

export function writeMarkStopCodons(el: Element, on: boolean): void {
  for (const name of persistedBooleanAttributeNames("markStopCodons")) {
    if (name !== MARK_STOP_CODONS_ATTRIBUTE) el.removeAttribute(name)
  }
  el.removeAttribute("hidemarkstopcodons")
  writeToggle(el, MARK_STOP_CODONS_ATTRIBUTE, HIDE_MARK_STOP_CODONS_ATTRIBUTE, on)
}

export const CANONICAL_PHASE_ORDER_ATTRIBUTE = "canonicalphaseorder"
export const HIDE_CANONICAL_PHASE_ORDER_ATTRIBUTE = "hide-canonical-phase-order"

/** Default off: missing attributes stay off; hide-* keeps OFF if WW writes the positive attr. */
export function readCanonicalPhaseOrder(el: Element): boolean {
  if (
    el.hasAttribute(HIDE_CANONICAL_PHASE_ORDER_ATTRIBUTE) ||
    el.hasAttribute("hidecanonicalphaseorder")
  ) {
    return false
  }
  const parsed = readPersistedBooleanAttr(el, "canonicalPhaseOrder")
  return parsed === undefined ? false : parsed
}

export function writeCanonicalPhaseOrder(el: Element, on: boolean): void {
  for (const name of persistedBooleanAttributeNames("canonicalPhaseOrder")) {
    if (name !== CANONICAL_PHASE_ORDER_ATTRIBUTE) el.removeAttribute(name)
  }
  el.removeAttribute("hidecanonicalphaseorder")
  writeToggle(el, CANONICAL_PHASE_ORDER_ATTRIBUTE, HIDE_CANONICAL_PHASE_ORDER_ATTRIBUTE, on)
}

export const MUTATION_GOAL_MODE_ATTRIBUTE = "mutationgoalmode"
export const MUTATION_TARGET_PROTEIN_ATTRIBUTE = "mutation-target-protein"
const MUTATION_GOAL_MODE_ATTR_NAMES = [
  MUTATION_GOAL_MODE_ATTRIBUTE,
  "mutationGoalMode",
  "mutation-goal-mode",
] as const

const MUTATION_TARGET_PROTEIN_ATTR_NAMES = [
  MUTATION_TARGET_PROTEIN_ATTRIBUTE,
  "mutationTargetProtein",
  "mutationtargetprotein",
] as const

export function readMutationGoalModeAttr(el: Element): MutationGoalMode | undefined {
  const name = MUTATION_GOAL_MODE_ATTR_NAMES.find((n) => el.hasAttribute(n))
  if (!name) return undefined
  return normalizeMutationGoalMode(el.getAttribute(name))
}

export function readMutationTargetProtein(el: Element): string | undefined {
  const name = MUTATION_TARGET_PROTEIN_ATTR_NAMES.find((n) => el.hasAttribute(n))
  if (!name) return undefined
  return formatPolypeptide(mutationTargetChain(el.getAttribute(name)))
}

export const DEFAULT_DNA_SEQUENCE = "TACGAAATT"

/** Keep only template bases A/C/T/G, matching `setDnaSequence`. */
export function sanitizeDnaSequence(raw: unknown): string {
  return String(raw ?? "").toUpperCase().replace(/[^ACTG]/g, "")
}

export const DNA_SEQUENCE_ATTRIBUTE = "dna-sequence"

export const DNA_SEQUENCE_ATTR_NAMES = [
  DNA_SEQUENCE_ATTRIBUTE,
  "dnasequence",
  "dnaSequence",
] as const

/** `undefined` if no DNA attribute is present. */
export function readPersistedDnaSequence(el: Element): string | undefined {
  const name = DNA_SEQUENCE_ATTR_NAMES.find((n) => el.hasAttribute(n))
  if (!name) return undefined
  return sanitizeDnaSequence(el.getAttribute(name))
}

export function normalizeAnimationSpeed(raw: unknown): number {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""))
  if (!Number.isFinite(n)) return DEFAULT_ANIMATION_SPEED
  const clamped = Math.min(MAX_ANIMATION_SPEED, Math.max(MIN_ANIMATION_SPEED, n))
  return Math.round(clamped * 10) / 10
}

/** Convert a 1× duration in ms to the current speed. */
export function scaledDurationMs(baseMs: number, speed: number): number {
  const scale = normalizeAnimationSpeed(speed)
  return Math.max(1, Math.round(baseMs / scale))
}

