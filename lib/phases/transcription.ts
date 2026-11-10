import type {MsgFn} from "@lit/localize"

/** How students enter mRNA during transcription. */
export type MrnaInputMode = "batch" | "stepwise"

/** How batch mode validates the full sequence (Gesamte Sequenz). */
export type MrnaBatchVerifyMode = "instant" | "sequential"

/** Default: validate each base as it is entered. */
export const DEFAULT_MRNA_INPUT_MODE: MrnaInputMode = "stepwise"

/** Default batch verify: check everything at once on Prüfen. */
export const DEFAULT_MRNA_BATCH_VERIFY_MODE: MrnaBatchVerifyMode = "instant"

export function normalizeMrnaInputMode(
  raw: string | null | undefined,
): MrnaInputMode {
  const value = String(raw ?? "").trim().toLowerCase()
  if (
    value === "batch" ||
    value === "ganze sequenz" ||
    value === "gesamte sequenz" ||
    value === "whole sequence" ||
    value === "full sequence"
  ) {
    return "batch"
  }
  if (
    value === "stepwise" ||
    value === "base für base" ||
    value === "base fur base" ||
    value === "base by base" ||
    value === "schritt für schritt" ||
    value === "schritt fur schritt" ||
    value === "step by step"
  ) {
    return "stepwise"
  }
  return DEFAULT_MRNA_INPUT_MODE
}

export function normalizeMrnaBatchVerifyMode(
  raw: string | null | undefined,
): MrnaBatchVerifyMode {
  const value = String(raw ?? "").trim().toLowerCase()
  if (
    value === "sequential" ||
    value === "mit animation" ||
    value === "with animation" ||
    value === "schrittweise mit animation" ||
    value === "sequential with animation"
  ) {
    return "sequential"
  }
  if (
    value === "instant" ||
    value === "sofort" ||
    value === "sofort prüfen" ||
    value === "verify instantly"
  ) {
    return "instant"
  }
  return DEFAULT_MRNA_BATCH_VERIFY_MODE
}

export const MRNA_INPUT_MODE_ATTRIBUTE = "mrna-input-mode"
export const MRNA_BATCH_VERIFY_MODE_ATTRIBUTE = "mrna-batch-verify-mode"

const MRNA_INPUT_MODE_ATTR_NAMES = [
  MRNA_INPUT_MODE_ATTRIBUTE,
  "mrnainputmode",
  "mrnaInputMode",
] as const

const MRNA_BATCH_VERIFY_MODE_ATTR_NAMES = [
  MRNA_BATCH_VERIFY_MODE_ATTRIBUTE,
  "mrnabatchverifymode",
  "mrnaBatchVerifyMode",
] as const

/** Read mRNA input mode from any attribute name WebWriter may use. */
export function readMrnaInputModeAttr(el: Element): MrnaInputMode | null {
  for (const name of MRNA_INPUT_MODE_ATTR_NAMES) {
    const raw = el.getAttribute(name)
    if (raw !== null) return normalizeMrnaInputMode(raw)
  }
  return null
}

/** Read batch verify mode from any attribute name WebWriter may use. */
export function readMrnaBatchVerifyModeAttr(el: Element): MrnaBatchVerifyMode | null {
  for (const name of MRNA_BATCH_VERIFY_MODE_ATTR_NAMES) {
    const raw = el.getAttribute(name)
    if (raw !== null) return normalizeMrnaBatchVerifyMode(raw)
  }
  return null
}

export function mrnaEmptyMessage(msg: MsgFn): string {
  return msg("Please enter an mRNA sequence using A, U, C, and G.")
}

export function mrnaIncompleteMessage(msg: MsgFn): string {
  return msg("Please enter the complete sequence first.")
}

export function mrnaIncorrectMessage(msg: MsgFn): string {
  return msg("The sequence is not correct. Please try again.")
}

export function mrnaWrongBaseMessage(msg: MsgFn): string {
  return msg("This base does not fit here. Please try again.")
}

/** Template DNA (3′→5′) to RNA base pairing for transcription. */
export const DNA_TO_RNA: Record<string, string> = {
  A: "U",
  T: "A",
  C: "G",
  G: "C",
}

export function expectedRnaBase(templateDna: string, index: number): string | null {
  const base = templateDna[index]
  if (!base) return null
  return DNA_TO_RNA[base] ?? null
}

export function isTranscriptionComplete(
  templateLength: number,
  mrnaBuilt: string,
): boolean {
  return templateLength > 0 && mrnaBuilt.length >= templateLength
}

export function expectedMrnaFromDna(templateDna: string): string {
  return templateDna
    .split("")
    .map((base) => DNA_TO_RNA[base] ?? "")
    .join("")
}

export function sanitizeMrnaInput(raw: string): string {
  return raw.toUpperCase().replace(/[^AUCG]/g, "")
}

export type MrnaVerifyResult =
  | {ok: true; matchLength: number}
  | {ok: false; position: number; expected: string; got: string}

/** Verify typed RNA against the template from the current build index. */
export function verifyMrnaInput(
  typed: string,
  templateDna: string,
  fromIndex: number,
): MrnaVerifyResult {
  const clean = sanitizeMrnaInput(typed)
  if (!clean) {
    return {ok: false, position: fromIndex + 1, expected: "?", got: ""}
  }

  let matchLength = 0
  for (let i = 0; i < clean.length; i++) {
    const expected = expectedRnaBase(templateDna, fromIndex + i)
    if (!expected) break
    if (clean[i] !== expected) {
      return {ok: false, position: fromIndex + i + 1, expected, got: clean[i]}
    }
    matchLength++
  }
  return {ok: true, matchLength}
}

export function mrnaInputErrorMessage(msg: MsgFn, result: Extract<MrnaVerifyResult, {ok: false}>): string {
  if (!result.got) {
    return mrnaEmptyMessage(msg)
  }
  return mrnaIncorrectMessage(msg)
}

export function mrnaIncompleteMessageForDraft(
  msg: MsgFn,
  _typedLength: number,
  _requiredLength: number,
): string {
  return mrnaIncompleteMessage(msg)
}
