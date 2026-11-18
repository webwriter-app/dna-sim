import {html, type TemplateResult} from "lit"
import {str, type MsgFn} from "@lit/localize"
import {ifDefined} from "lit/directives/if-defined.js"
import {RNA_ICON, DNA_ICON, stopCodonClass, codonDividerClass, renderEnzymeSlot} from "./render-strand-shared"



import {renderAminoAcidBadge} from "./amino-acid"
import {codonAt, mrnaFromTemplate} from "../model/translation"

import {BASE_SIZE, BASE_GAP, BOND_H, REPL_ANIM_DIST, TRANSCRIPTION_GAP, baseCenterX, baseCenterY} from "../model/strand-geometry"
import type {MutationStrandSide, StrandViewModel} from "../model/strand-view-model"
import {renderSnappedMolecule, renderTranslationStrand} from "./render-translation"

const COMP_BASE: Record<string, string> = {A: "T", T: "A", C: "G", G: "C"}

/** trna.svg's own aspect ratio */


function showDnaComplement(phase: string): boolean {
  return phase === "Replication" || phase === "Mutations"
}

function showMrnaRow(phase: string): boolean {
  return phase === "Transcription"
}

function showTranslationMrna(phase: string): boolean {
  return phase === "Translation"
}



function renderPolypeptideCompare(
  msg: MsgFn,
  compare: {before: string[]; after: string[]},
): TemplateResult {
  const row = (label: string, chain: string[]) => html`
    <div class="polypeptide-compare-row">
      <span class="polypeptide-compare-label">${label}</span>
      <div class="polypeptide-compare-chain">
        ${chain.length
          ? chain.map((amino) => renderAminoAcidBadge(amino, 28))
          : html`<span class="polypeptide-compare-empty">—</span>`}
      </div>
    </div>
  `
  return html`
    <div class="polypeptide-compare" aria-label="${msg("Protein before and after")}">
      ${row(msg("Before"), compare.before)}
      ${row(msg("After"), compare.after)}
    </div>
  `
}


function renderStrandConnectors(
  strand: "top" | "bottom",
  dnaSequence: string,
  phase: string,
  animationStep: number,
  transcriptionStep = 0,
): TemplateResult | null {
  const n =
    phase === "Transcription" && strand === "bottom"
      ? transcriptionStep
      : dnaSequence.length
  if (n < 2) return null

  return html`${Array.from({length: n - 1}, (_, i) => {
    const x1 = baseCenterX(i)
    const y1 = baseCenterY(strand, i, phase, animationStep)
    const x2 = baseCenterX(i + 1)
    const y2 = baseCenterY(strand, i + 1, phase, animationStep)
    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)

    return html`
      <div
        class="strand-connector"
        style="left:${x1}px; top:${y1}px; width:${length}px; transform:rotate(${angle}deg)">
      </div>
    `
  })}`
}






/** Logical ribosome bounding box, spanning 3 codon-wide slots with the active codon always in the rightmost one. */
/** Renders the DNA strand markup for the pan/zoom canvas. */
export function renderStrand(msg: MsgFn, vm: StrandViewModel): TemplateResult {
  const {dnaSequence, currentPhase, animationStep, transcription} = vm

  if (showTranslationMrna(currentPhase)) {
    return renderTranslationStrand(msg, vm)
  }

  if (!dnaSequence) {
    return html`<div class="strand-empty">${msg("Enter a sequence to start")}</div>`
  }

  const complement = showDnaComplement(currentPhase)
  const mrnaRow = showMrnaRow(currentPhase)
  const mrna = transcription?.mrnaSequence ?? ""
  const stepwiseAnim = transcription?.stepwiseAnim ?? false
  const baseAnim = transcription?.baseAnim
  const rejectAnim = transcription?.rejectAnim
  const txStep = transcription?.transcriptionStep ?? 0

  const mrnaBaseClass = (index: number) => {
    if (!stepwiseAnim || !baseAnim) return "mrna-base"
    const classes = ["mrna-base"]
    if (baseAnim.enteringIndex === index) classes.push("is-entering")
    if (baseAnim.successIndex === index) classes.push("is-success")
    return classes.join(" ")
  }

  const mrnaRejectClass = (index: number) => {
    if (!stepwiseAnim || !rejectAnim || rejectAnim.index !== index) return "mrna-base"
    const classes = ["mrna-base"]
    if (rejectAnim.phase === "enter") classes.push("is-entering")
    if (rejectAnim.phase === "error") classes.push("is-reject-error")
    if (rejectAnim.phase === "exit") classes.push("is-reject-exit")
    return classes.join(" ")
  }

  const renderMrnaBase = (base: string, className: string) => {
    const icon = RNA_ICON[base] ?? ""
    return html`
      <span class="${className}" @animationend="${vm.dropHandlers?.onMrnaBaseAnimationEnd}">
        <img
          class="mrna-base-shape-glow"
          src="${icon}"
          width="44"
          height="44"
          alt=""
          aria-hidden="true"
          draggable="false"/>
        <img
          class="mrna-base-icon"
          src="${icon}"
          width="44"
          height="44"
          alt="${base}"
          draggable="false"/>
      </span>
    `
  }

  const renderMrnaSlot = (index: number) => {
    if (index < mrna.length) {
      return renderMrnaBase(mrna[index], mrnaBaseClass(index))
    }
    if (rejectAnim && rejectAnim.index === index) {
      return renderMrnaBase(rejectAnim.base, mrnaRejectClass(index))
    }
    return html`<div class="bp-spacer"></div>`
  }

  const mutationsActive = currentPhase === "Mutations"
  const mutationSelectedIndex = mutationsActive ? (vm.mutations?.selectedIndex ?? null) : null
  const mutationSelectedStrand = mutationsActive ? (vm.mutations?.selectedStrand ?? null) : null
  const onMutationBaseClick = mutationsActive ? vm.mutations?.onBaseClick : undefined
  const onMutationBaseKey = mutationsActive ? vm.mutations?.onBaseKeyDown : undefined
  const mutationsMrna =
    mutationsActive && vm.markStopCodons ? mrnaFromTemplate(dnaSequence) : ""

  const pairs = dnaSequence.split("").map((base, i) => {
    const comp = COMP_BASE[base] ?? "A"
    const split = currentPhase === "Replication" && i < animationStep
    const topY = split ? -REPL_ANIM_DIST : 0
    const botY = split ? REPL_ANIM_DIST : 0
    const transcribed = mrnaRow && i < txStep
    const topSelected =
      mutationSelectedIndex === i && mutationSelectedStrand === "template"
    const bottomSelected =
      mutationSelectedIndex === i && mutationSelectedStrand === "complement"

    const replSplitHandler =
      currentPhase === "Replication" ? vm.dropHandlers?.onReplicationSplitTransitionEnd : undefined

    const mutationClick = (strand: MutationStrandSide) =>
      onMutationBaseClick
        ? (e: MouseEvent) => onMutationBaseClick(i, strand, e)
        : undefined

    const baseKey = (strand: MutationStrandSide) =>
      onMutationBaseKey
        ? (e: KeyboardEvent) => onMutationBaseKey(i, strand, e)
        : undefined
    const baseLabel = (base: string) =>
      onMutationBaseKey ? msg(str`Base ${i + 1}: ${base}`) : undefined

    const topClick = mutationClick("template")
    const bottomClick = mutationClick("complement")

    return html`
      <div class="bp-col ${transcribed ? "is-transcribed" : ""} ${stopCodonClass(mutationsActive && vm.markStopCodons, codonAt(mutationsMrna, Math.floor(i / 3)))} ${codonDividerClass(mutationsActive ? vm.markCodons : false, i, dnaSequence.length)}" data-bp-index="${i}">
        <div
          class="bp-top ${topSelected ? "is-mutation-selected" : ""}"
          style="transform:translateY(${topY}px)"
          tabindex=${ifDefined(onMutationBaseKey ? "0" : undefined)}
          role=${ifDefined(onMutationBaseKey ? "button" : undefined)}
          aria-label=${ifDefined(baseLabel(base))}
          @keydown=${baseKey("template")}
          @click=${topClick}
          @contextmenu=${topClick ? (e: MouseEvent) => e.preventDefault() : undefined}
          @transitionend="${replSplitHandler}">
          <img src="${DNA_ICON[base] ?? ""}" width="44" height="44" alt="${base}" draggable="false"/>
        </div>
        ${mrnaRow
          ? html`<div class="bp-spacer bp-spacer--bond" style="height:${TRANSCRIPTION_GAP}px"></div>`
          : html`<div class="bp-bond" style="opacity:${split ? 0 : 1}"></div>`}
        ${complement
          ? html`
            <div
              class="bp-bottom ${bottomSelected ? "is-mutation-selected" : ""}"
              style="transform:translateY(${botY}px)"
              tabindex=${ifDefined(onMutationBaseKey ? "0" : undefined)}
              role=${ifDefined(onMutationBaseKey ? "button" : undefined)}
              aria-label=${ifDefined(baseLabel(comp))}
              @keydown=${baseKey("complement")}
              @click=${bottomClick}
              @contextmenu=${bottomClick ? (e: MouseEvent) => e.preventDefault() : undefined}
              @transitionend="${replSplitHandler}">
              <img src="${DNA_ICON[comp] ?? ""}" width="44" height="44" alt="${comp}" draggable="false"/>
            </div>`
          : mrnaRow
            ? html`
              <div class="bp-bottom bp-rna">
                ${renderMrnaSlot(i)}
              </div>`
            : html`<div class="bp-spacer"></div>`
        }
      </div>
    `
  })

  const n = dnaSequence.length
  const pairsW = n * BASE_SIZE + (n - 1) * BASE_GAP
  const gap = complement ? BOND_H : mrnaRow ? TRANSCRIPTION_GAP : 0
  const strandH = BASE_SIZE + gap + (complement || mrnaRow ? BASE_SIZE : 0)

  const inRep = currentPhase === "Replication"
  const leftEndSplit = inRep && animationStep > 0
  const rightEndSplit = inRep && animationStep >= n
  const leftTopY = leftEndSplit ? -REPL_ANIM_DIST : 0
  const leftBotY = leftEndSplit ? REPL_ANIM_DIST : 0
  const rightTopY = rightEndSplit ? -REPL_ANIM_DIST : 0
  const rightBotY = rightEndSplit ? REPL_ANIM_DIST : 0

  return html`
    <div class="strand-outer ${vm.polypeptideCompare ? "has-polypeptide-compare" : ""}">
      <div class="strand-inner">
        <div class="strand-polarity" style="height:${strandH}px">
          <span style="transform:translateY(${leftTopY}px)">3'</span>
          ${complement || mrnaRow ? html`<span style="transform:translateY(${leftBotY}px)">5'</span>` : ""}
        </div>

        <div class="strand-pairs-wrap" style="height:${strandH}px; width:${pairsW}px">
          ${complement || mrnaRow
            ? renderStrandConnectors("top", dnaSequence, currentPhase, animationStep)
            : null}
          ${complement
            ? renderStrandConnectors("bottom", dnaSequence, currentPhase, animationStep)
            : mrnaRow && txStep >= 2
              ? renderStrandConnectors("bottom", dnaSequence, currentPhase, animationStep, txStep)
              : null}
          ${renderEnzymeSlot(msg, vm, strandH)}
          ${renderSnappedMolecule(msg, vm, strandH)}
          <div class="strand-pairs ${mutationsActive ? "is-mutations" : ""}">${pairs}</div>
        </div>

        <div class="strand-polarity" style="height:${strandH}px">
          <span style="transform:translateY(${rightTopY}px)">5'</span>
          ${complement || mrnaRow ? html`<span style="transform:translateY(${rightBotY}px)">3'</span>` : ""}
        </div>
      </div>
      ${mutationsActive && vm.polypeptideCompare
        ? renderPolypeptideCompare(msg, vm.polypeptideCompare)
        : null}
    </div>
  `
}
