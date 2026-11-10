import type {ReactiveController, ReactiveControllerHost} from "lit"

import {
  MOLECULE_DRAG_SOURCE,
  MOLECULE_DRAG_TYPE,
  type BaukastenMolecule,
  type MoleculeDragSource,
} from "./baukasten.js"
import {MOLECULE_DROP_SIZE, type DropFeedback} from "./molecule-drop.js"

export type PointerDragState = {
  molecule: BaukastenMolecule
  canvasX: number
  canvasY: number
  pointerId: number
}

export type DiscardGhostState = {icon: string; x: number; y: number}

/** What the drag controller needs from the widget. */
export interface MoleculeDragHost {
  readonly renderRoot: HTMLElement | DocumentFragment
  requestUpdate(): void
  stopTimer(): void
  showErrorAlert(message: string): void
  setErrorAlertDismiss(onDismiss: () => void): void
}

/**
 * Owns generic Baukasten drag/drop mechanics: native HTML5 drag-and-drop from
 * the toolbar, pointer-drag-to-remove from the fork slot, drop-slot hover and
 * error feedback, and the discard/snap-fade ghost animations.
 *
 * Phase-specific decisions (which enzyme is involved, whether it can be
 * placed/removed) stay with the widget, which calls into this controller for
 * the mechanics and passes the outcome back via small callbacks.
 */
export class MoleculeDragController implements ReactiveController {
  draggingMolecule: BaukastenMolecule | null = null
  dropSlotHover = false
  dropFeedback: DropFeedback = "none"
  pointerDrag: PointerDragState | null = null
  discardGhost: DiscardGhostState | null = null
  slotSnapFadeOut = false

  private _slotDragDepth = 0
  private _dragSource: MoleculeDragSource | null = null

  constructor(private readonly _host: ReactiveControllerHost & MoleculeDragHost) {
    _host.addController(this)
  }

  hostDisconnected() {
    this.clear()
  }

  /** Matches a CSS @keyframes name on the element that owns the animation. */
  private _animEnded(e: AnimationEvent, name: string): boolean {
    return e.target === e.currentTarget && e.animationName === name
  }

  // ── Baukasten → fork (native HTML5 drag-and-drop) ────────────────────────

  onDragStart(e: DragEvent, molecule: BaukastenMolecule) {
    e.dataTransfer?.setData(MOLECULE_DRAG_TYPE, molecule.id)
    e.dataTransfer?.setData(MOLECULE_DRAG_SOURCE, "baukasten")
    e.dataTransfer?.setData("text/plain", molecule.name)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "copy"
      const chip = e.currentTarget instanceof HTMLElement ? e.currentTarget : null
      const dragImage =
        chip?.querySelector(".baukasten-molecule") ?? (e.target as Element | null)
      if (dragImage) e.dataTransfer.setDragImage(dragImage, 18, 18)
    }
    this._dragSource = "baukasten"
    this.draggingMolecule = molecule
    this.dropFeedback = "none"
    this._host.requestUpdate()
  }

  onDragEnd() {
    this.clear()
    this._host.requestUpdate()
  }

  readonly onSlotDragEnter = (e: DragEvent) => {
    if (!this.draggingMolecule) return
    e.preventDefault()
    this._slotDragDepth++
    this.dropSlotHover = true
    this._host.requestUpdate()
  }

  readonly onSlotDragOver = (e: DragEvent) => {
    if (!this.draggingMolecule) return
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
    this.dropSlotHover = true
  }

  readonly onSlotDragLeave = (e: DragEvent) => {
    if (!this.draggingMolecule) return
    this._slotDragDepth = Math.max(0, this._slotDragDepth - 1)
    if (this._slotDragDepth === 0) {
      this.dropSlotHover = false
      this._host.requestUpdate()
    }
  }

  /** Reads the dropped molecule id from a drop event and resets drag state. Call before deciding whether the drop is valid. */
  takeDraggedMoleculeId(e: DragEvent): string | null {
    const molecule = this.draggingMolecule
    const droppedId = e.dataTransfer?.getData(MOLECULE_DRAG_TYPE) || molecule?.id || null
    this._slotDragDepth = 0
    this.dropSlotHover = false
    this.clear()
    return molecule ? droppedId : null
  }

  showDropError(message: string, _moleculeId: string) {
    this.dropFeedback = "error"
    this._host.showErrorAlert(message)
    this._host.requestUpdate()
  }

  // ── Fork slot animations ─────────────────────────────────────────────────

  playSlotSnapFade() {
    this.slotSnapFadeOut = true
    this._host.requestUpdate()
  }

  readonly onDropSlotAnimationEnd = (e: AnimationEvent) => {
    if (this._animEnded(e, "drop-slot-error")) {
      this.dropFeedback = "none"
      this._host.requestUpdate()
      return
    }

    if (this._animEnded(e, "drop-slot-fade-out")) {
      this.slotSnapFadeOut = false
      this._host.requestUpdate()
    }
  }

  // ── Pointer-drag-to-remove (snapped molecule at the fork) ────────────────

  private _canvasPoint(clientX: number, clientY: number) {
    const area = this._host.renderRoot.querySelector(".canvas-area") as HTMLElement | null
    if (!area) return {x: clientX, y: clientY}
    const r = area.getBoundingClientRect()
    return {x: clientX - r.left, y: clientY - r.top}
  }

  private _pointerDragPosition(clientX: number, clientY: number) {
    const p = this._canvasPoint(clientX, clientY)
    const half = MOLECULE_DROP_SIZE / 2
    return {canvasX: p.x - half, canvasY: p.y - half}
  }

  private _isOverEnzymeSlot(clientX: number, clientY: number): boolean {
    const slot = this._host.renderRoot.querySelector(
      ".molecule-drop-slot:not(.molecule-drop-slot--rna)",
    ) as HTMLElement | null
    if (!slot) return false
    const r = slot.getBoundingClientRect()
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
  }

  /** Start dragging a snapped molecule off the fork with the pointer. `onReSnap` fires if it's released back over the slot. */
  beginPointerRemove(e: PointerEvent, molecule: BaukastenMolecule, onReSnap: () => void) {
    e.preventDefault()
    e.stopPropagation()

    const pointerId = e.pointerId
    const {canvasX, canvasY} = this._pointerDragPosition(e.clientX, e.clientY)

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      ev.preventDefault()
      const pos = this._pointerDragPosition(ev.clientX, ev.clientY)
      this.pointerDrag = {...this.pointerDrag!, canvasX: pos.canvasX, canvasY: pos.canvasY}
      this.dropSlotHover = this._isOverEnzymeSlot(ev.clientX, ev.clientY)
      this._host.requestUpdate()
    }

    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", end)
      window.removeEventListener("pointercancel", end)
      this._finishPointerRemove(ev, onReSnap)
    }

    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", end)
    window.addEventListener("pointercancel", end)

    this._host.stopTimer()
    this.pointerDrag = {molecule, canvasX, canvasY, pointerId}
    this.dropFeedback = "none"
    this.dropSlotHover = false
    this._host.requestUpdate()
  }

  private _finishPointerRemove(e: PointerEvent, onReSnap: () => void) {
    if (!this.pointerDrag || e.pointerId !== this.pointerDrag.pointerId) return

    e.preventDefault()

    const overSlot = this._isOverEnzymeSlot(e.clientX, e.clientY)
    const drag = this.pointerDrag
    this.pointerDrag = null
    this.dropSlotHover = false

    if (overSlot) {
      onReSnap()
    } else {
      this.discardGhost = {icon: drag.molecule.icon, x: drag.canvasX, y: drag.canvasY}
      this._host.stopTimer()
    }

    this._host.requestUpdate()
  }

  readonly onDiscardGhostAnimationEnd = (e: AnimationEvent) => {
    if (!this._animEnded(e, "molecule-discard-out")) return
    this.discardGhost = null
    this._host.requestUpdate()
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  clear() {
    this.draggingMolecule = null
    this._dragSource = null
    this.dropSlotHover = false
    this._slotDragDepth = 0
  }

  /** Cancel in-progress drags without clearing snapped molecule state (e.g. phase switch). */
  cancelActiveDrag() {
    this.clear()
    this.pointerDrag = null
    this.discardGhost = null
  }
}
