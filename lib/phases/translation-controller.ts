import type {ReactiveController, ReactiveControllerHost} from "lit"

import {
  aminoAcidForCodon,
  anticodonForCodon,
  codonAt,
  codonCount,
  firstCodonForAminoAcid,
  isStopCodon,
  mrnaFromTemplate,
} from "./translation.js"

/** What the translation controller needs from the widget. */
export interface TranslationHost {
  nextFrame(callback: () => void): void
  readonly dnaSequence: string
  readonly currentPhase: string
  requestUpdate(): void
  playSlotSnapFade(): void
  /** Scale a 1× duration (ms) by the global animation-speed option. */
  scaleAnimMs(ms: number): number
  /** Pan/center the canvas onto the active codon once it's time to shift visual focus. */
  focusActiveCodon(): void
  /** Fired when the visual focus lands on a stop codon — host should start tRNA release. */
  onStopCodonReached(): void
  /** Fired after the solid ribosome fill has fully faded in — host should start the subunit split. */
  onRibosomeFillComplete(): void
  /** Pan/center the canvas onto the polypeptide after ribosome subunits have split away. */
  focusPolypeptide(): void
  /** Fired once the whole stop-codon termination sequence (tRNA release, ribosome split, camera focus) has fully finished. */
  onTranslationComplete(): void
  /** Show the mismatch alert after a wrong amino acid's tRNA check finishes (or immediately when no tRNA plays). */
  showWrongAminoAcidAlert(): void
}

export type AminoPlaceResult = "ok" | "complete" | "wrong" | "ignored"

export type TrnaAnimPhase = "enter" | "success" | "error" | "bound" | "exit"

/** Visual phases for the stop-codon ribosome subunit split. */
export type RibosomeHalvesPhase = "hidden" | "ready" | "split"

/** A tRNA sliding in from below to test/deliver an amino acid on the current codon. */
export interface IncomingTrna {
  /** Stable id so Lit can keep DOM nodes across phase updates. */
  id: number
  codonIndex: number
  anticodon: string
  aminoAcid: string
  phase: TrnaAnimPhase
  /** True when this tRNA matched its codon (wrong ones always exit immediately). */
  correct: boolean
}

/**
 * Owns Translation-phase state: ribosome snap, amino-acid matching on the
 * large subunit, polypeptide growth, and codon advance / stop termination.
 */
export class TranslationController implements ReactiveController {
  snappedRibosome = false
  /** 0-based codon index the ribosome is sitting on (logical/game state, advances immediately). */
  codonIndex = 0
  /** 0-based codon index the ribosome should visually render at — lags `codonIndex` until `_advanceVisualFocus` catches it up. */
  visualCodonIndex = 0
  /** Bottom-right codon wheel panel open (mirrored from the card for hints later). */
  codonCardOpen = true
  /** Amino acids accepted so far (three-letter names, N→C). */
  polypeptide: string[] = []
  /** Random 0–180° link angles between consecutive residues (length = polypeptide.length - 1). */
  polypeptideLinkAngles: number[] = []
  /** When set, the polypeptide stays anchored at this codon instead of following a tRNA. */
  polypeptideAnchorCodonIndex: number | null = null
  /** True once a stop codon is reached or the last sense codon is filled (run-off). */
  complete = false
  /** Complete because the sequence ended with no in-frame stop — skip the split animation. */
  endedWithoutStop = false
  /** Termination close sequence is active (raises z-index while fill/halves animate). */
  ribosomeClosing = false
  /** Solid combined fill is shown (fades in, then removed once halves are layered on top). */
  ribosomeFillVisible = false
  /** Border + inside layers — hidden once the solid fill has finished fading in. */
  ribosomeShellVisible = true
  /** Separate top/bottom subunits: hidden → ready (over fill) → split (fly apart). */
  ribosomeHalvesPhase: RibosomeHalvesPhase = "hidden"
  private _terminating = false
  /** Large-subunit hover while an amino acid is dragged over it. */
  aminoDropHover = false
  /** Dropzone faded/shrunk (hover or committed until ribosome settle). */
  aminoDropHidden = false
  /** Brief bounce-in after the dropzone is revealed again. */
  aminoDropReveal = false
  /** tRNA currently sliding in / docking on the current codon. */
  incomingTrna: IncomingTrna | null = null
  /** FIFO queue of correctly matched tRNAs sitting in the ribosome (max `MAX_BOUND_TRNAS` bound at once). */
  dockedTrnas: IncomingTrna[] = []

  private _dropzoneHeld = false
  private _dropzoneRevealTimer: ReturnType<typeof setTimeout> | null = null
  private _dropzoneRevealClearTimer: ReturnType<typeof setTimeout> | null = null
  private _incomingTrnaTimers: ReturnType<typeof setTimeout>[] = []
  private _exitTrnaTimers: ReturnType<typeof setTimeout>[] = []
  private _stopSettleTimer: ReturnType<typeof setTimeout> | null = null
  private _closeTimers: ReturnType<typeof setTimeout>[] = []
  private _trnaIdSeq = 0
  private static readonly MAX_BOUND_TRNAS = 2
  /** Matches `.ribosome-snapped` left/top CSS transition; also covers camera pan settle. */
  private static readonly RIBOSOME_MOVE_MS = 450
  private static readonly TRNA_EXIT_MS = 600
  /** Matches `.ribosome-fill` opacity transition. */
  private static readonly RIBOSOME_FILL_FADE_MS = 1100
  private static readonly RIBOSOME_SPLIT_MS = 1450

  constructor(private readonly _host: ReactiveControllerHost & TranslationHost) {
    _host.addController(this)
  }

  private _ms(baseMs: number): number {
    return this._host.scaleAnimMs(baseMs)
  }

  hostDisconnected() {
    this._clearDropzoneTimers()
    this._clearTrnaTimers()
  }

  get mrnaSequence(): string {
    return mrnaFromTemplate(this._host.dnaSequence)
  }

  get maxCodonIndex(): number {
    return Math.max(0, codonCount(this.mrnaSequence) - 1)
  }

  get currentCodon(): string | null {
    return codonAt(this.mrnaSequence, this.codonIndex)
  }

  get expectedAminoAcid(): string | null {
    const codon = this.currentCodon
    if (!codon || isStopCodon(codon)) return null
    return aminoAcidForCodon(codon)
  }

  /** Show the codon-wheel toggle once a ribosome is on the mRNA. */
  get showCodonCard(): boolean {
    return this._host.currentPhase === "Translation" && this.snappedRibosome
  }

  /** Waiting for the student to drop the matching amino acid. */
  get awaitingAminoAcid(): boolean {
    return (
      this._host.currentPhase === "Translation" &&
      this.snappedRibosome &&
      !this.complete &&
      this.polypeptide.length === this.codonIndex &&
      this.expectedAminoAcid !== null
    )
  }

  /** Placed the current codon but the next full codon is not on the mRNA yet. */
  get awaitingMoreSequence(): boolean {
    return (
      this._host.currentPhase === "Translation" &&
      this.snappedRibosome &&
      !this.complete &&
      this.polypeptide.length > this.codonIndex
    )
  }

  /** Last full sense codon is filled and there is no further codon (stop or otherwise). */
  private _lastSenseCodonFilled(): boolean {
    if (this.polypeptide.length !== this.codonIndex + 1) return false
    if (this.codonIndex !== this.maxCodonIndex) return false
    const codon = this.currentCodon
    return !!codon && !isStopCodon(codon)
  }

  /** Translation can start once there is at least one full codon and a ribosome. */
  get started(): boolean {
    return (
      this._host.currentPhase === "Translation" &&
      this.mrnaSequence.length >= 3 &&
      this.snappedRibosome
    )
  }

  snap() {
    this.snappedRibosome = true
    this.codonIndex = 0
    this.visualCodonIndex = 0
    this.codonCardOpen = true
    this.polypeptide = []
    this.polypeptideLinkAngles = []
    this.polypeptideAnchorCodonIndex = null
    this._terminating = false
    this._resetRibosomeCloseVisuals()
    this.complete = false
    this.endedWithoutStop = false
    this.aminoDropHover = false
    this._resetDropzone()
    this._clearTrnaTimers()
    this.incomingTrna = null
    this.dockedTrnas = []

    const codon = this.currentCodon
    if (codon && isStopCodon(codon)) {
      this.complete = true
    }

    this._host.playSlotSnapFade()
    this._host.requestUpdate()
  }

  unsnap() {
    this.snappedRibosome = false
    this.codonIndex = 0
    this.visualCodonIndex = 0
    this.codonCardOpen = false
    this.polypeptide = []
    this.polypeptideLinkAngles = []
    this.polypeptideAnchorCodonIndex = null
    this._terminating = false
    this._resetRibosomeCloseVisuals()
    this.complete = false
    this.endedWithoutStop = false
    this.aminoDropHover = false
    this._resetDropzone()
    this._clearTrnaTimers()
    this.incomingTrna = null
    this.dockedTrnas = []
    this._host.requestUpdate()
  }

  setAminoDropHover(hover: boolean) {
    if (this.aminoDropHover === hover) return
    this.aminoDropHover = hover
    if (hover) {
      this.aminoDropHidden = true
      this.aminoDropReveal = false
    } else if (!this._dropzoneHeld) {
      this.aminoDropHidden = false
    }
    this._host.requestUpdate()
  }

  /**
   * Attempt to place an amino acid (three-letter name, or "Stop") on the
   * large subunit for the current codon.
   */
  tryPlaceAminoAcid(aminoAcid: string): AminoPlaceResult {
    if (!this.snappedRibosome || this.complete) return "ignored"
    // Already filled this codon — waiting for more template bases.
    if (this.polypeptide.length !== this.codonIndex) return "ignored"

    const codon = this.currentCodon
    if (!codon) return "ignored"
    const targetCodonIndex = this.codonIndex

    if (isStopCodon(codon)) {
      if (aminoAcid !== "Stop") {
        this._holdDropzone()
        this._host.showWrongAminoAcidAlert()
        this._scheduleDropzoneReveal(0)
        return "wrong"
      }
      this.complete = true
      this.aminoDropHover = false
      this._holdDropzone()
      this._host.requestUpdate()
      this._advanceVisualFocus()
      return "complete"
    }

    const expected = aminoAcidForCodon(codon)
    const correct = !!expected && aminoAcid === expected

    // Stop is never carried by a tRNA — only show the incoming molecule for
    // real amino acids, whether they turn out to fit this codon or not.
    let playedTrna = false
    if (aminoAcid !== "Stop") {
      const carriedCodon = correct ? codon : firstCodonForAminoAcid(aminoAcid)
      if (carriedCodon) {
        this._playTrnaAnimation(targetCodonIndex, anticodonForCodon(carriedCodon), aminoAcid, correct)
        playedTrna = true
      }
    }

    this._holdDropzone()

    if (!correct) {
      // With a tRNA check animation, wait until shake finishes before showing the alert.
      if (!playedTrna) {
        this._host.showWrongAminoAcidAlert()
        this._scheduleDropzoneReveal(0)
      }
      return "wrong"
    }

    this.polypeptide = [...this.polypeptide, aminoAcid]
    if (this.polypeptide.length >= 2) {
      this.polypeptideLinkAngles = [
        ...this.polypeptideLinkAngles,
        Math.random() * 180,
      ]
    }
    this.aminoDropHover = false

    if (this._tryAdvanceFromFilledCodon()) {
      this._host.requestUpdate()
      return this.complete ? "complete" : "ok"
    }

    if (this._tryCompleteRunOff()) {
      this._host.requestUpdate()
      if (!playedTrna) this._scheduleRunOffComplete()
      return "complete"
    }

    // No next full codon yet — keep the ribosome here until the sequence grows.
    this._host.requestUpdate()
    return "ok"
  }

  /**
   * Move the ribosome to the next codon. Returns false when already at the
   * last codon. Prefer `tryPlaceAminoAcid` for the normal student flow.
   */
  advance(): boolean {
    if (!this.snappedRibosome || this.complete) return false
    if (this.codonIndex >= this.maxCodonIndex) return false
    this.codonIndex += 1
    // No tRNA animation here, so sync the visual position right away.
    this.visualCodonIndex = this.codonIndex
    const codon = this.currentCodon
    if (codon && isStopCodon(codon)) this.complete = true
    this._host.requestUpdate()
    return true
  }

  clamp() {
    const max = this.maxCodonIndex
    if (this.mrnaSequence.length < 3) {
      this.snappedRibosome = false
      this.codonIndex = 0
      this.visualCodonIndex = 0
      this.codonCardOpen = false
      this.polypeptide = []
      this.polypeptideLinkAngles = []
      this.polypeptideAnchorCodonIndex = null
      this._terminating = false
      this._resetRibosomeCloseVisuals()
      this.complete = false
      this.endedWithoutStop = false
      return
    }

    this.codonIndex = Math.max(0, Math.min(this.codonIndex, max))
    if (this.polypeptide.length > this.codonIndex + 1) {
      this.polypeptide = this.polypeptide.slice(0, this.codonIndex + 1)
      this.polypeptideLinkAngles = this.polypeptideLinkAngles.slice(
        0,
        Math.max(0, this.polypeptide.length - 1),
      )
    }

    if (this.complete) {
      const codon = this.currentCodon
      const onStop = !!codon && isStopCodon(codon)
      if (onStop) {
        this.endedWithoutStop = false
      } else if (this.endedWithoutStop) {
        if (this.codonIndex < this.maxCodonIndex) {
          this.complete = false
          this.endedWithoutStop = false
        }
      } else {
        this.complete = false
      }
    }

    // If the current codon was already filled, advance as soon as more
    // complete codons appear on the mRNA.
    while (this._tryAdvanceFromFilledCodon()) {
      /* keep going across any newly available sense codons */
    }

    if (this._tryCompleteRunOff()) this._scheduleRunOffComplete()

    // Sequence-driven moves have no tRNA animation either, so stay in sync.
    this.visualCodonIndex = this.codonIndex
  }

  /**
   * After the amino acid for `codonIndex` is in `polypeptide`, move to the
   * next codon when it exists. Returns true if the index moved.
   */
  private _tryAdvanceFromFilledCodon(): boolean {
    if (this.complete) return false
    if (this.polypeptide.length !== this.codonIndex + 1) return false
    if (this.codonIndex >= this.maxCodonIndex) return false

    this.codonIndex += 1
    const next = this.currentCodon
    if (next && isStopCodon(next)) {
      this.complete = true
    }
    return true
  }

  private _tryCompleteRunOff(): boolean {
    if (this.complete || !this._lastSenseCodonFilled()) return false
    this.complete = true
    this.endedWithoutStop = true
    return true
  }

  reset() {
    this.snappedRibosome = false
    this.codonIndex = 0
    this.visualCodonIndex = 0
    this.codonCardOpen = false
    this.polypeptide = []
    this.polypeptideLinkAngles = []
    this.polypeptideAnchorCodonIndex = null
    this._terminating = false
    this._resetRibosomeCloseVisuals()
    this.complete = false
    this.endedWithoutStop = false
    this.aminoDropHover = false
    this._resetDropzone()
    this._clearTrnaTimers()
    this.incomingTrna = null
    this.dockedTrnas = []
  }

  /** Keep the dropzone faded out until ribosome settle / wrong-tRNA exit. */
  private _holdDropzone() {
    this._dropzoneHeld = true
    this.aminoDropHidden = true
    this.aminoDropReveal = false
    this._clearDropzoneTimers()
  }

  private _resetDropzone() {
    this._dropzoneHeld = false
    this.aminoDropHidden = false
    this.aminoDropReveal = false
    this._clearDropzoneTimers()
  }

  private _scheduleDropzoneReveal(delayMs: number) {
    this._clearDropzoneTimers()
    this._dropzoneRevealTimer = setTimeout(() => {
      this._dropzoneHeld = false
      this.aminoDropHidden = false
      if (!this.awaitingAminoAcid) {
        this.aminoDropReveal = false
        this._host.requestUpdate()
        return
      }
      this.aminoDropReveal = true
      this._host.requestUpdate()
      this._dropzoneRevealClearTimer = setTimeout(() => {
        this.aminoDropReveal = false
        this._host.requestUpdate()
      }, this._ms(450))
    }, delayMs)
  }

  private _clearDropzoneTimers() {
    if (this._dropzoneRevealTimer) {
      clearTimeout(this._dropzoneRevealTimer)
      this._dropzoneRevealTimer = null
    }
    if (this._dropzoneRevealClearTimer) {
      clearTimeout(this._dropzoneRevealClearTimer)
      this._dropzoneRevealClearTimer = null
    }
  }

  /** Slide a tRNA in from below the ribosome; wrong ones shake and fall away, correct ones join the bound queue. */
  private _playTrnaAnimation(
    codonIndex: number,
    anticodon: string,
    aminoAcid: string,
    correct: boolean,
  ) {
    // Only cancel the in-flight *incoming* sequence — docked exits keep running.
    this._clearIncomingTrnaTimers()
    const id = ++this._trnaIdSeq
    this.incomingTrna = {id, codonIndex, anticodon, aminoAcid, phase: "enter", correct}
    this._host.requestUpdate()

    this._incomingTrnaTimers.push(
      setTimeout(() => {
        if (!this.incomingTrna || this.incomingTrna.id !== id) return
        this.incomingTrna = {
          ...this.incomingTrna,
          phase: correct ? "success" : "error",
        }
        this._host.requestUpdate()

        this._incomingTrnaTimers.push(
          setTimeout(() => {
            if (!this.incomingTrna || this.incomingTrna.id !== id) return

            if (correct) {
              const bound: IncomingTrna = {...this.incomingTrna, phase: "bound"}
              this.incomingTrna = null
              this._enqueueBoundTrna(bound)
              this._host.requestUpdate()
              return
            }

            this._host.showWrongAminoAcidAlert()
            this.incomingTrna = {...this.incomingTrna, phase: "exit"}
            this._host.requestUpdate()

            this._incomingTrnaTimers.push(
              setTimeout(() => {
                if (this.incomingTrna?.id === id) {
                  this.incomingTrna = null
                  this._host.requestUpdate()
                }
                this._scheduleDropzoneReveal(0)
              }, this._ms(TranslationController.TRNA_EXIT_MS)),
            )
          }, this._ms(correct ? 600 : 650)),
        )
      }, this._ms(750)),
    )
  }

  /** Enqueue a newly matched tRNA, evicting the oldest first if the queue is full, then shift visual focus. */
  private _enqueueBoundTrna(bound: IncomingTrna) {
    this.dockedTrnas = [...this.dockedTrnas, bound]

    if (this._boundCount() > TranslationController.MAX_BOUND_TRNAS) {
      this._dequeueOldestBoundTrna(() => this._advanceVisualFocus())
    } else {
      this._advanceVisualFocus()
    }
  }

  /** Catch the ribosome's visual position up to `codonIndex` and tell the host to pan there. */
  private _advanceVisualFocus() {
    this.visualCodonIndex = this.codonIndex
    this._host.requestUpdate()
    this._host.focusActiveCodon()
    this._scheduleDropzoneReveal(this._ms(TranslationController.RIBOSOME_MOVE_MS))

    const codon = codonAt(this.mrnaSequence, this.visualCodonIndex)
    if (codon && isStopCodon(codon)) {
      // Wait for ribosome slide + camera pan to finish before releasing tRNAs.
      this._scheduleStopCodonReached()
    } else if (this.endedWithoutStop) {
      this._scheduleRunOffComplete()
    }
  }

  /**
   * After the ribosome and centering settle on the stop codon, fire the host
   * hook that starts the termination sequence.
   */
  private _scheduleStopCodonReached() {
    if (this._terminating || this._stopSettleTimer) return
    this._stopSettleTimer = setTimeout(() => {
      this._stopSettleTimer = null
      this._host.onStopCodonReached()
    }, this._ms(TranslationController.RIBOSOME_MOVE_MS))
  }

  /** Phase complete without the stop-codon split: sequence ran out of full codons. */
  private _scheduleRunOffComplete() {
    if (!this.endedWithoutStop || this._terminating || this._stopSettleTimer) return
    this._stopSettleTimer = setTimeout(() => {
      this._stopSettleTimer = null
      this._host.onTranslationComplete()
    }, this._ms(TranslationController.RIBOSOME_MOVE_MS))
  }

  /**
   * Freeze the polypeptide at its current attachment and release every remaining
   * bound tRNA oldest → newest. Called via TranslationHost.onStopCodonReached
   * after the stop codon has been centered.
   */
  releaseTrnasAtStop() {
    if (this._terminating) return
    this._terminating = true

    const carrier = [...this.dockedTrnas, ...(this.incomingTrna ? [this.incomingTrna] : [])]
      .filter((t) => t.correct && (t.phase === "success" || t.phase === "bound" || t.phase === "exit"))
      .reduce<IncomingTrna | null>(
        (best, t) => (!best || t.codonIndex > best.codonIndex ? t : best),
        null,
      )
    if (carrier) {
      this.polypeptideAnchorCodonIndex = carrier.codonIndex
    } else if (this.polypeptide.length > 0) {
      this.polypeptideAnchorCodonIndex = Math.max(0, this.codonIndex - 1)
    }

    // Paint the frozen chain before starting exit animations.
    this._host.requestUpdate()
    this._releaseBoundTrnasOldestFirst()
  }

  private _releaseBoundTrnasOldestFirst() {
    const oldest = this.dockedTrnas.find((t) => t.phase === "bound")
    if (!oldest) {
      this._startRibosomeClose()
      return
    }
    this._dequeueOldestBoundTrna(() => this._releaseBoundTrnasOldestFirst())
  }

  /** Solid fill fades in over the border once every docked tRNA has finished exiting. */
  private _startRibosomeClose() {
    if (this.ribosomeClosing) return
    this.ribosomeClosing = true
    this.ribosomeFillVisible = true
    this.ribosomeHalvesPhase = "hidden"
    this._host.requestUpdate()

    this._closeTimers.push(
      setTimeout(() => {
        this._host.onRibosomeFillComplete()
      }, this._ms(TranslationController.RIBOSOME_FILL_FADE_MS)),
    )
  }

  /**
   * Layer the top/bottom subunit SVGs over the solid fill (no visible change),
   * then drop the fill and play the split-away animation.
   * Called via TranslationHost.onRibosomeFillComplete.
   */
  beginRibosomeSplit() {
    if (!this.ribosomeClosing || this.ribosomeHalvesPhase !== "hidden") return

    // Fill is fully opaque — drop border/inside so only the solid fill (then halves) remain.
    this.ribosomeShellVisible = false
    this.ribosomeHalvesPhase = "ready"
    this._host.requestUpdate()

    // Wait until the halves have painted above the fill before removing it.
    this._host.nextFrame(() => {
      this._host.nextFrame(() => {
        if (this.ribosomeHalvesPhase !== "ready") return
        this.ribosomeFillVisible = false
        this._host.requestUpdate()

        this._host.nextFrame(() => {
          if (this.ribosomeHalvesPhase !== "ready") return
          this.ribosomeHalvesPhase = "split"
          this._host.requestUpdate()

          this._closeTimers.push(
            setTimeout(() => {
              this.ribosomeHalvesPhase = "hidden"
              this._host.requestUpdate()
              this._host.focusPolypeptide()
              this._host.onTranslationComplete()
            }, this._ms(TranslationController.RIBOSOME_SPLIT_MS)),
          )
        })
      })
    })
  }

  private _boundCount(): number {
    return this.dockedTrnas.filter((t) => t.phase === "bound").length
  }

  private _dequeueOldestBoundTrna(onEvicted?: () => void) {
    const oldest = this.dockedTrnas.find((t) => t.phase === "bound")
    if (!oldest) {
      onEvicted?.()
      return
    }
    const id = oldest.id
    this.dockedTrnas = this.dockedTrnas.map((t) =>
      t.id === id ? {...t, phase: "exit" as const} : t,
    )
    this._host.requestUpdate()
    this._exitTrnaTimers.push(
      setTimeout(() => {
        this.dockedTrnas = this.dockedTrnas.filter((t) => t.id !== id)
        this._host.requestUpdate()
        onEvicted?.()
      }, this._ms(TranslationController.TRNA_EXIT_MS)),
    )
  }

  private _clearIncomingTrnaTimers() {
    for (const timer of this._incomingTrnaTimers) clearTimeout(timer)
    this._incomingTrnaTimers = []
  }

  private _clearStopSettleTimer() {
    if (this._stopSettleTimer) {
      clearTimeout(this._stopSettleTimer)
      this._stopSettleTimer = null
    }
  }

  private _clearCloseTimers() {
    for (const timer of this._closeTimers) clearTimeout(timer)
    this._closeTimers = []
  }

  private _clearTrnaTimers() {
    this._clearIncomingTrnaTimers()
    this._clearStopSettleTimer()
    this._clearCloseTimers()
    for (const timer of this._exitTrnaTimers) clearTimeout(timer)
    this._exitTrnaTimers = []
  }

  private _resetRibosomeCloseVisuals() {
    this.ribosomeClosing = false
    this.ribosomeFillVisible = false
    this.ribosomeShellVisible = true
    this.ribosomeHalvesPhase = "hidden"
  }
}
