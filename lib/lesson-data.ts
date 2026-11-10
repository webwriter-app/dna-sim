import {formatPolypeptide, mutationTargetChain} from "./phases/mutation-goals.js"
import {DEFAULT_DNA_SEQUENCE, readMutationTargetProtein, readPersistedDnaSequence, sanitizeDnaSequence} from "./widget-options.js"

export const LESSON_DATA_TYPE = "application/json"
const LESSON_FORMAT = "webwriter-dna-simulation"

export const DEFAULT_LESSON = {
  dnaSequence: DEFAULT_DNA_SEQUENCE,
  mutationTargetProtein: "",
}

export type Lesson = typeof DEFAULT_LESSON

export function findLessonBlock(widget: Element) {
  return widget.querySelector<HTMLScriptElement>(':scope > script[slot="data"]')
}

export function readLessonBlock(block: HTMLScriptElement): Record<string, unknown> | null {
  if (block.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
      block.type !== LESSON_DATA_TYPE || block.hasAttribute("src")) return null
  try {
    const value = JSON.parse(block.textContent ?? "")
    if (value?.format === LESSON_FORMAT && value.version === 1 &&
        typeof value.dnaSequence === "string" && typeof value.mutationTargetProtein === "string") {
      return value
    }
  } catch {
    // Malformed or unsupported data is left intact.
  }
  return null
}

export function readLesson(widget: Element, block: HTMLScriptElement | null): Lesson {
  const data = block && readLessonBlock(block)
  return data ? {
    dnaSequence: sanitizeDnaSequence(data.dnaSequence),
    mutationTargetProtein: formatPolypeptide(mutationTargetChain(data.mutationTargetProtein)),
  } : {
    dnaSequence: readPersistedDnaSequence(widget) ?? DEFAULT_LESSON.dnaSequence,
    mutationTargetProtein: readMutationTargetProtein(widget) ?? DEFAULT_LESSON.mutationTargetProtein,
  }
}

export function serializeLesson(lesson: Lesson, existing?: Record<string, unknown>) {
  return JSON.stringify({...existing, format: LESSON_FORMAT, version: 1, ...lesson}).replace(/</g, "\\u003c")
}
