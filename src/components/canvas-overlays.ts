import {html} from "lit"

import {CANVAS_ERROR_ALERT_MS, CANVAS_INFO_ALERT_MS} from "./canvas-alert"
import {PHASE_COMPLETE_TOAST_MS} from "./phase-complete-toast"
import resetIcon from "@tabler/icons/outline/arrow-back-up.svg"
import {MOLECULE_DROP_SIZE} from "../model/molecule-drop"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

export function renderCanvasOverlays(w: WebwriterDnaSimulation) {
  const hint = w.phaseHintText()
  const errorOpen = Boolean(
    w.alerts.errorMessage && w.moleculeDrag.dropFeedback !== "error",
  )
  const showCodonToggle = w.view.showCodonReference
  return html`
    ${errorOpen
      ? html`
        <dna-canvas-alert
          variant="error"
          .message=${w.alerts.errorMessage}
          .duration=${CANVAS_ERROR_ALERT_MS}
          @dna-canvas-alert-dismiss=${w.alerts.onErrorAlertDismiss}>
        </dna-canvas-alert>
      `
      : null}
    ${w.phaseCompletion.toast
      ? html`
        <dna-phase-complete-toast
          .message=${w.phaseCompletion.toast.message}
          .duration=${PHASE_COMPLETE_TOAST_MS}
          .showContinue=${Boolean(w.phaseCompletion.toast.nextPhase)}
          @dna-phase-complete-continue=${w.flow.onPhaseCompleteContinue}
          @dna-phase-complete-dismiss=${w.flow.onPhaseCompleteDismiss}>
        </dna-phase-complete-toast>
      `
      : null}
    ${hint && w.showInfoCards
      ? html`
        <dna-canvas-info-button
          ?active=${w.alerts.hintOpen}
          @dna-canvas-info-toggle=${w.alerts.onHintToggle}>
        </dna-canvas-info-button>
        ${w.alerts.hintOpen
          ? html`
            <dna-canvas-alert
              data-hint
              variant="info"
              .message=${hint}
              .duration=${CANVAS_INFO_ALERT_MS}
              @dna-canvas-alert-dismiss=${w.alerts.onInfoAlertDismiss}>
            </dna-canvas-alert>
          `
          : null}
      `
      : null}
    <button
      type="button"
      class="phase-reset-btn ${showCodonToggle ? "has-codon-toggle" : ""}"
      aria-label="${w.msg("Start over")}"
      title="${w.msg("Start over")}"
      @click=${() => w.resetFlow.requestPhase()}>
      <sl-icon src="${resetIcon}"></sl-icon>
    </button>
    ${w.mutationMenu.render()}
  `
}

export function renderPointerDragGhost(w: WebwriterDnaSimulation) {
  if (!w.moleculeDrag.pointerDrag) return null
  const {molecule, canvasX, canvasY} = w.moleculeDrag.pointerDrag
  const size = MOLECULE_DROP_SIZE
  return html`
    <div
      class="molecule-drag-ghost"
      style="left:${canvasX}px; top:${canvasY}px; width:${size}px; height:${size}px">
      <img src="${molecule.icon}" width="${size}" height="${size}" alt="" draggable="false"/>
    </div>
  `
}

export function renderDiscardGhost(w: WebwriterDnaSimulation) {
  if (!w.moleculeDrag.discardGhost) return null
  const {icon, x, y} = w.moleculeDrag.discardGhost
  const size = MOLECULE_DROP_SIZE
  return html`
    <div
      class="molecule-discard-ghost"
      style="left:${x}px; top:${y}px; width:${size}px; height:${size}px"
      @animationend="${w.moleculeDrag.onDiscardGhostAnimationEnd}">
      <img src="${icon}" width="${size}" height="${size}" alt="" draggable="false"/>
    </div>
  `
}