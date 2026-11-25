import {html, type TemplateResult} from "lit"
import {isStopCodon} from "../model/translation"
import type {MsgFn} from "@lit/localize"

import adenineSvg from "../assets/base-adenine.svg"
import thymineSvg from "../assets/base-thymine.svg"
import cytosineSvg from "../assets/base-cytosine.svg"
import guanineSvg from "../assets/base-guanine.svg"
import uracilSvg from "../assets/base-uracil.svg"
import {replicationDropActive, transcriptionDropActive, translationDropActive} from "../model/molecule-drop"
import {forkSlotRect, codonSlotStyle} from "../model/strand-geometry"
import type {StrandViewModel} from "../model/strand-view-model"

export const RNA_ICON: Record<string, string> = {
  A: adenineSvg,
  U: uracilSvg,
  C: cytosineSvg,
  G: guanineSvg,
}
export const DNA_ICON: Record<string, string> = {
  A: adenineSvg,
  T: thymineSvg,
  C: cytosineSvg,
  G: guanineSvg,
}
export function enzymeStep(vm: StrandViewModel): number {
  if (vm.currentPhase === "Transcription") {
    return vm.transcription?.transcriptionStep ?? 0
  }
  return vm.animationStep
}
export function enzymeDropActive(vm: StrandViewModel): boolean {
  return replicationDropActive(vm.currentPhase, vm.dnaSequence.length) ||
    transcriptionDropActive(vm.currentPhase, vm.dnaSequence.length) ||
    translationDropActive(vm.currentPhase, vm.dnaSequence.length)
}
export function slotStyle(rect: {left: number; top: number; size: number}) {
  return `left:${rect.left}px; top:${rect.top}px; width:${rect.size}px; height:${rect.size}px`
}
export function stopCodonClass(mark: boolean | undefined, codon: string | null): string {
  if (!mark || !codon || !isStopCodon(codon)) return ""
  return "is-stop-codon"
}
export function codonDividerClass(mark: boolean | undefined, index: number, length: number): string {
  if (!mark) return ""
  if ((index + 1) % 3 !== 0 || index + 1 >= length) return ""
  return "has-codon-divider"
}
export function renderEnzymeSlot(
  msg: MsgFn,
  vm: StrandViewModel,
  strandH: number,
): TemplateResult | null {
  const drop = vm.moleculeDrop
  if (!drop || !enzymeDropActive(vm)) return null

  const h = vm.dropHandlers
  const feedbackClass = drop.feedback === "error" ? "is-error" : ""

  if (vm.currentPhase === "Translation") {
    const codonIndex = vm.translation?.codonIndex ?? 0
    return html`
      <div
        class="molecule-drop-slot molecule-drop-slot--codon ${drop.hover ? "is-hover" : ""} ${feedbackClass} ${drop.snappingOut ? "is-snapping-out" : ""}"
        style="${codonSlotStyle(codonIndex, strandH)}"
        aria-label="${msg("Translation codon")}"
        @dragenter="${h?.onSlotDragEnter}"
        @dragover="${h?.onSlotDragOver}"
        @dragleave="${h?.onSlotDragLeave}"
        @drop="${h?.onSlotDrop}"
        @animationend="${h?.onDropSlotAnimationEnd}">
      </div>
    `
  }

  const rect = forkSlotRect(enzymeStep(vm), strandH)
  const label = vm.currentPhase === "Transcription"
    ? msg("Transcription fork")
    : msg("Replication fork")

  return html`
    <div
      class="molecule-drop-slot ${drop.hover ? "is-hover" : ""} ${feedbackClass} ${drop.snappingOut ? "is-snapping-out" : ""}"
      style="${slotStyle(rect)}"
      aria-label="${label}"
      @dragenter="${h?.onSlotDragEnter}"
      @dragover="${h?.onSlotDragOver}"
      @dragleave="${h?.onSlotDragLeave}"
      @drop="${h?.onSlotDrop}"
      @animationend="${h?.onDropSlotAnimationEnd}">
    </div>
  `
}
