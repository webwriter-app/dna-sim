import type {ReactiveController} from "lit"
import {jsonData} from "@webwriter/lit/data"

import {
  DEFAULT_LESSON,
  LESSON_BLOCK_DEFAULTS,
  LESSON_FORMAT,
  isLessonBlock,
  readLesson,
  type Lesson,
  type LessonBlock,
} from "../model/lesson-data"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/** The authored lesson (DNA sequence and target protein) and its JSON data block. */
export class LessonController implements ReactiveController {
  value: Lesson = DEFAULT_LESSON
  /** Sequence received through the `sequence-from` effect; shown instead of the authored one while set. */
  linkedSequence: string | null = null
  private shown = DEFAULT_LESSON.dnaSequence
  private readonly data: ReturnType<typeof jsonData<LessonBlock>>

  constructor(private readonly host: WebwriterDnaSimulation) {
    this.data = jsonData<LessonBlock>(host, {
      defaults: LESSON_BLOCK_DEFAULTS,
      validate: isLessonBlock,
      changed: () => {
        this.sync()
        host.refreshDrawer()
      },
    })
    host.addController(this)
  }

  hostDisconnected() {}

  get canEdit() {
    return this.host.editable && this.host.dataReady && !this.data.invalid
  }

  write(patch: Partial<Lesson>) {
    if (!this.canEdit) return
    this.data.set({format: LESSON_FORMAT, version: 1, ...this.value, ...patch})
    this.data.flush()
    this.sync()
    this.host.refreshDrawer()
  }

  restoreDefaults() {
    this.write(DEFAULT_LESSON)
  }

  /** Read the lesson from the block (or the legacy attributes) and apply what changed. */
  sync(reset = false) {
    const {host} = this
    if (host.data !== null && !host.dataReady && !reset) return
    const lesson = readLesson(host, host.dataReady && !this.data.invalid ? this.data.get() : null)
    const shown = this.linkedSequence || lesson.dnaSequence
    const changedSequence = shown !== this.shown
    const changedTarget = lesson.mutationTargetProtein !== this.value.mutationTargetProtein
    this.value = lesson
    this.shown = shown
    if (reset || changedSequence) host.flow.useDnaSequence(shown)
    if (changedTarget) {
      host.mutationEdits.feedback = null
      host.phaseCompletion.revoke("Mutations")
    }
    if (reset || changedSequence || changedTarget) host.requestUpdate()
  }
}
