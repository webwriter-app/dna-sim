import {formatPolypeptide, mutationTargetChain} from "./mutation-goals"
import {DEFAULT_DNA_SEQUENCE, readMutationTargetProtein, readPersistedDnaSequence, sanitizeDnaSequence} from "./widget-options"

export const LESSON_DATA_TYPE = "application/json"
export const LESSON_FORMAT = "webwriter-dna-simulation"

export const DEFAULT_LESSON = {
  dnaSequence: DEFAULT_DNA_SEQUENCE,
  mutationTargetProtein: "",
}

export type Lesson = typeof DEFAULT_LESSON

/** The data block as `jsonData` holds it. Keys the block lacks stay undefined, so the first write stores all of them. */
export type LessonBlock = {
  format?: string
  version?: number
  dnaSequence?: string
  mutationTargetProtein?: string
}

export const LESSON_BLOCK_DEFAULTS: LessonBlock = {}

/** A lesson block, or an empty one (no block yet). Anything else is left intact and not written. */
export function isLessonBlock(value: LessonBlock): boolean {
  if (value.format === undefined) {
    return value.version === undefined && value.dnaSequence === undefined && value.mutationTargetProtein === undefined
  }
  return value.format === LESSON_FORMAT && value.version === 1 &&
    typeof value.dnaSequence === "string" && typeof value.mutationTargetProtein === "string"
}

/** The lesson of a valid block, or of the legacy attributes while there is none. */
export function readLesson(widget: Element, block: LessonBlock | null): Lesson {
  return block?.format === LESSON_FORMAT ? {
    dnaSequence: sanitizeDnaSequence(block.dnaSequence),
    mutationTargetProtein: formatPolypeptide(mutationTargetChain(block.mutationTargetProtein)),
  } : {
    dnaSequence: readPersistedDnaSequence(widget) ?? DEFAULT_LESSON.dnaSequence,
    mutationTargetProtein: readMutationTargetProtein(widget) ?? DEFAULT_LESSON.mutationTargetProtein,
  }
}
