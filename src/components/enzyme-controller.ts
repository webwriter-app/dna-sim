import type {ReactiveController} from "lit"

import {moleculeById} from "./baukasten"
import {
  canPlacePolymeraseAtFork,
  canPlaceRibosomeAtCodon,
  canRemoveHelicaseFromFork,
  canRemovePolymeraseFromFork,
  canRemoveRibosomeFromCodon,
  dropErrorMessage,
  expectedMoleculeId,
} from "../model/molecule-drop"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/**
 * The enzyme in the fork slot (helicase, RNA polymerase, ribosome): placing and
 * removing it by drag, and the exit animations that end Replication and Transcription.
 */
export class EnzymeController implements ReactiveController {
  private _snappedHelicase = false
  private _helicaseExiting = false
  private _polymeraseExiting = false
  polymeraseAwaitingSettle = false
  /** Waiting for the fork base-pair split transition before playing exit. */
  helicaseAwaitingSplitSettle = false

  constructor(private readonly host: WebwriterDnaSimulation) {
    host.addController(this)
  }

  hostDisconnected() {}

  get snappedHelicase() { return this._snappedHelicase }
  set snappedHelicase(value: boolean) {
    if (value === this._snappedHelicase) return
    this._snappedHelicase = value
    this.host.requestUpdate()
  }
  get helicaseExiting() { return this._helicaseExiting }
  set helicaseExiting(value: boolean) {
    if (value === this._helicaseExiting) return
    this._helicaseExiting = value
    this.host.requestUpdate()
  }
  get polymeraseExiting() { return this._polymeraseExiting }
  set polymeraseExiting(value: boolean) {
    if (value === this._polymeraseExiting) return
    this._polymeraseExiting = value
    this.host.requestUpdate()
  }

  snapHelicaseAtFork() {
    this.snappedHelicase = true
    this.host.moleculeDrag.playSlotSnapFade()
    this.host.flow.startTimer()
  }

  clearSnappedHelicase() {
    this.cancelHelicaseExit()
    this.snappedHelicase = false
    this.host.moleculeDrag.slotSnapFadeOut = false
    this.host.moleculeDrag.pointerDrag = null
    this.host.moleculeDrag.discardGhost = null
  }

  cancelHelicaseExit() {
    this.helicaseAwaitingSplitSettle = false
    this.helicaseExiting = false
  }

  cancelPolymeraseExit() {
    this.polymeraseAwaitingSettle = false
    this.polymeraseExiting = false
  }

  /**
   * After the last base pair splits, wait for its transform transition, then
   * play the helicase exit and show the replication-complete toast.
   */
  maybeScheduleHelicaseExit() {
    if (this.host.currentPhase !== "Replication") return
    if (!this.snappedHelicase || this.helicaseExiting) return
    if (this.helicaseAwaitingSplitSettle) return
    if (this.host.flow.maxAnimationStep === 0 || this.host.flow.animationStep < this.host.flow.maxAnimationStep) return

    this.helicaseAwaitingSplitSettle = true
    this.host.requestUpdate()
    this.host.afterRender(() => this.observeHelicaseSplitSettle())
  }

  observeHelicaseSplitSettle() {
    if (!this.helicaseAwaitingSplitSettle || !this.helicaseExitPreconditionsMet()) {
      this.helicaseAwaitingSplitSettle = false
      return
    }

    const target = this.forkSplitTransitionTarget()
    if (!target) {
      this.beginHelicaseExit()
      return
    }

    // If the split is already settled (no transform this step),
    // no transitionend will fire — detect that and proceed immediately.
    this.host.nextFrame(() => {
      if (!this.helicaseAwaitingSplitSettle) return
      if (!this.forkSplitTransitionRunning(target)) {
        this.beginHelicaseExit()
      }
    })
  }

  helicaseExitPreconditionsMet(): boolean {
    return (
      this.host.currentPhase === "Replication" &&
      this.snappedHelicase &&
      this.host.flow.maxAnimationStep > 0 &&
      this.host.flow.animationStep >= this.host.flow.maxAnimationStep
    )
  }

  /** Top subunit of the fork pair that just finished splitting. */
  forkSplitTransitionTarget(): HTMLElement | null {
    const index = this.host.flow.animationStep - 1
    if (index < 0) return null
    const col = this.host.renderRoot.querySelector(`[data-bp-index="${index}"]`)
    return col?.querySelector(".bp-top") as HTMLElement | null
  }

  forkSplitTransitionRunning(el: Element): boolean {
    return el.getAnimations().some(
      (a) => a instanceof CSSTransition && a.transitionProperty === "transform",
    )
  }

  onReplicationSplitTransitionEnd = (e: TransitionEvent) => {
    if (!this.helicaseAwaitingSplitSettle) return
    if (e.propertyName !== "transform") return
    if (e.target !== e.currentTarget) return

    const col = (e.currentTarget as HTMLElement).closest("[data-bp-index]")
    const index = col ? Number(col.getAttribute("data-bp-index")) : -1
    if (index !== this.host.flow.animationStep - 1) return
    if (!this.helicaseExitPreconditionsMet()) return

    this.beginHelicaseExit()
  }

  beginHelicaseExit() {
    if (this.helicaseExiting) return
    if (!this.helicaseExitPreconditionsMet()) {
      this.helicaseAwaitingSplitSettle = false
      return
    }

    this.helicaseAwaitingSplitSettle = false
    this.helicaseExiting = true
    this.host.requestUpdate()
    this.host.afterRender(() => this.observeHelicaseExit())
  }

  observeHelicaseExit() {
    if (!this.helicaseExiting) return

    const el = this.host.renderRoot.querySelector(".molecule-snapped.is-molecule-exit")
    if (!el) {
      this.finishHelicaseExit()
      return
    }

    this.host.nextFrame(() => {
      if (!this.helicaseExiting) return
      const running = el.getAnimations().some(
        (a) => a instanceof CSSAnimation && a.animationName.includes("molecule-exit-up-right"),
      )
      if (!running) this.finishHelicaseExit()
    })
  }

  onSnappedMoleculeAnimationEnd = (e: AnimationEvent) => {
    if (e.target !== e.currentTarget) return
    if (!e.animationName.includes("molecule-exit-up-right")) return
    if (this.helicaseExiting) {
      this.finishHelicaseExit()
      return
    }
    if (this.polymeraseExiting) {
      this.finishPolymeraseExit()
    }
  }

  finishHelicaseExit() {
    if (!this.helicaseExiting) return
    this.helicaseExiting = false
    this.helicaseAwaitingSplitSettle = false
    this.snappedHelicase = false
    this.host.requestUpdate()
    this.host.flow.notifyPhaseComplete("Replication")
  }

  maybeStartPolymeraseExit() {
    if (this.host.currentPhase !== "Transcription") return
    if (!this.host.transcription.snappedPolymerase) return
    if (!this.host.transcription.isComplete) return
    if (this.host.transcription.stepAnimActive() || this.host.transcription.batchVerifyRunning) return
    if (this.polymeraseExiting || this.polymeraseAwaitingSettle) return

    this.polymeraseAwaitingSettle = true
    this.host.requestUpdate()
    this.host.afterRender(() => this.observePolymeraseSettle())
  }

  observePolymeraseSettle() {
    if (!this.polymeraseAwaitingSettle) return

    const el = this.host.renderRoot.querySelector(".molecule-snapped")
    if (!el) {
      this.beginPolymeraseExit()
      return
    }

    this.host.nextFrame(() => {
      if (!this.polymeraseAwaitingSettle) return
      const moving = el.getAnimations().some(
        (a) => a instanceof CSSTransition && (a.transitionProperty === "left" || a.transitionProperty === "top"),
      )
      if (!moving) this.beginPolymeraseExit()
    })
  }

  beginPolymeraseExit() {
    if (!this.polymeraseAwaitingSettle || this.polymeraseExiting) return
    if (
      this.host.currentPhase !== "Transcription" ||
      !this.host.transcription.snappedPolymerase ||
      !this.host.transcription.isComplete
    ) {
      this.polymeraseAwaitingSettle = false
      return
    }

    this.polymeraseAwaitingSettle = false
    this.polymeraseExiting = true
    this.host.requestUpdate()
    this.host.afterRender(() => this.observePolymeraseExit())
  }

  observePolymeraseExit() {
    if (!this.polymeraseExiting) return

    const el = this.host.renderRoot.querySelector(".molecule-snapped.is-molecule-exit")
    if (!el) {
      this.finishPolymeraseExit()
      return
    }

    this.host.nextFrame(() => {
      if (!this.polymeraseExiting) return
      const running = el.getAnimations().some(
        (a) => a instanceof CSSAnimation && a.animationName.includes("molecule-exit-up-right"),
      )
      if (!running) this.finishPolymeraseExit()
    })
  }

  finishPolymeraseExit() {
    if (!this.polymeraseExiting && !this.polymeraseAwaitingSettle) return
    this.polymeraseAwaitingSettle = false
    this.polymeraseExiting = false
    this.host.transcription.unsnap()
    this.host.flow.notifyPhaseComplete("Transcription")
  }

  onSnappedMoleculeTransitionEnd = (e: TransitionEvent) => {
    if (!this.polymeraseAwaitingSettle) return
    if (e.target !== e.currentTarget) return
    if (e.propertyName !== "left" && e.propertyName !== "top") return
    this.beginPolymeraseExit()
  }

  // ── Biomolekül-Baukasten ─────────────────────────────────────────────────

  snappedEnzymeId(): string | null {
    if (this.host.currentPhase === "Replication" && this.snappedHelicase) return "helicase"
    if (this.host.currentPhase === "Transcription" && this.host.transcription.snappedPolymerase) return "rna-polymerase"
    if (this.host.currentPhase === "Translation" && this.host.translation.snappedRibosome) return "ribosome"
    return null
  }

  enzymeSlotOccupied(): boolean {
    if (this.host.currentPhase === "Replication") return this.snappedHelicase
    if (this.host.currentPhase === "Transcription") return this.host.transcription.snappedPolymerase
    if (this.host.currentPhase === "Translation") return this.host.translation.snappedRibosome
    return false
  }

  canRemoveSnappedEnzyme(): boolean {
    if (this.host.currentPhase === "Replication") {
      return canRemoveHelicaseFromFork(this.snappedHelicase, this.host.flow.animationStep) && !this.helicaseExiting
    }
    if (this.host.currentPhase === "Transcription") {
      return (
        canRemovePolymeraseFromFork(
          this.host.transcription.snappedPolymerase,
          this.host.transcription.transcriptionStep,
        ) && !this.polymeraseExiting
      )
    }
    if (this.host.currentPhase === "Translation") {
      return (
        canRemoveRibosomeFromCodon(this.host.translation.snappedRibosome, this.host.translation.codonIndex) &&
        this.host.translation.polypeptide.length === 0 &&
        !this.host.translation.complete
      )
    }
    return false
  }

  onSnappedPointerDown = (e: PointerEvent) => {
    if (!this.canRemoveSnappedEnzyme() || e.button !== 0) return

    const enzymeId = this.snappedEnzymeId()
    const molecule = enzymeId ? moleculeById(this.host.msg, enzymeId) : undefined
    if (!molecule) return

    if (this.host.currentPhase === "Replication") {
      this.snappedHelicase = false
    } else if (this.host.currentPhase === "Transcription") {
      this.host.transcription.unsnap()
    } else if (this.host.currentPhase === "Translation") {
      this.host.translation.unsnap()
      this.host.codonDrawer.setOpen(false)
    }

    this.host.moleculeDrag.beginPointerRemove(e, molecule, () => {
      if (molecule.id === "helicase") {
        this.snapHelicaseAtFork()
      } else if (molecule.id === "rna-polymerase") {
        this.host.transcription.snap()
      } else if (molecule.id === "ribosome") {
        this.host.translation.snap()
        this.host.codonDrawer.openForRibosome()
      }
    })
  }

  expectedEnzymeId(): string | null {
    if (this.host.currentPhase === "Replication") {
      return expectedMoleculeId(
        this.host.currentPhase,
        this.host.dnaSequence.length,
        this.host.flow.animationStep,
        this.snappedHelicase,
      )
    }
    if (
      this.host.currentPhase === "Transcription" &&
      canPlacePolymeraseAtFork(
        this.host.currentPhase,
        this.host.dnaSequence.length,
        this.host.transcription.transcriptionStep,
        this.host.transcription.snappedPolymerase,
      )
    ) {
      return "rna-polymerase"
    }
    if (
      this.host.currentPhase === "Translation" &&
      canPlaceRibosomeAtCodon(
        this.host.currentPhase,
        this.host.dnaSequence.length,
        this.host.translation.codonIndex,
        this.host.translation.snappedRibosome,
      )
    ) {
      return "ribosome"
    }
    return null
  }

  onSlotDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedId = this.host.moleculeDrag.takeDraggedMoleculeId(e)

    if (!droppedId || this.enzymeSlotOccupied()) {
      this.host.requestUpdate()
      return
    }

    const expected = this.expectedEnzymeId()

    if (droppedId === expected && expected === "helicase") {
      this.snapHelicaseAtFork()
      this.host.requestUpdate()
      return
    }

    if (droppedId === expected && expected === "rna-polymerase") {
      this.host.transcription.snap()
      this.host.requestUpdate()
      return
    }

    if (droppedId === expected && expected === "ribosome") {
      this.host.translation.snap()
      this.host.requestUpdate()
      this.host.codonDrawer.openForRibosome()
      return
    }

    this.host.moleculeDrag.showDropError(
      dropErrorMessage(this.host.msg, this.host.currentPhase, expected),
      droppedId,
    )
    this.host.requestUpdate()
  }}
