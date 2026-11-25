import {computed, signal} from "@webwriter/lit"

import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/** The widget's public read-only signals and the source of its `sequence-from` effect. */
export class PublishedSignals {
  private readonly _phase = signal("Replication")
  private readonly _sequence = signal("")
  private readonly _complete = signal(false)
  readonly source = signal<{get(): unknown} | null>(null)

  readonly signals = {
    phase: computed(() => this._phase.get()),
    sequence: computed(() => this._sequence.get()),
    complete: computed(() => this._complete.get()),
  }

  update(widget: WebwriterDnaSimulation) {
    this._phase.set(widget.currentPhase)
    this._sequence.set(widget.dnaSequence)
    const visible = widget.view.visiblePhases
    this._complete.set(visible.length > 0 && visible.every(phase => widget.phaseCompletion.hasCompleted(phase)))
  }
}
