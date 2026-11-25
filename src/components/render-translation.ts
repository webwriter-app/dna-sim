import {html, type TemplateResult} from "lit"
import {keyed} from "lit/directives/keyed.js"
import {ifDefined} from "lit/directives/if-defined.js"
import type {MsgFn} from "@lit/localize"
import {RNA_ICON, enzymeStep, slotStyle, stopCodonClass, codonDividerClass, renderEnzymeSlot} from "./render-strand-shared"

import {localizedMoleculeName} from "./localize-text"

import trnaSvg from "../assets/trna.svg"
import ribosomeBorderSvg from "../assets/ribosome-border.svg"
import ribosomeFillSvg from "../assets/ribosome-fill.svg"
import ribosomeFillTopSvg from "../assets/ribosome-fill-top.svg"
import ribosomeFillBottomSvg from "../assets/ribosome-fill-bottom.svg"
import ribosomeInsideSvg from "../assets/ribosome-inside.svg"

import {renderAminoAcidBadge} from "./amino-acid"
import {codonAt} from "../model/translation"

import {BASE_SIZE, BASE_GAP, RIBOSOME_PAD, forkSlotRect, codonSlotRect, TRNA_WIDTH, TRNA_HEIGHT, TRNA_BASE_SIZE, TRNA_DOCK_GAP, TRNA_ANTICODON_POINTS, TRNA_AMINO_POINT, POLYPEPTIDE_AA_SIZE, polypeptideResiduePositions, RIBOSOME_WIDTH, RIBOSOME_HEIGHT, RIBOSOME_ART_WIDTH, RIBOSOME_ART_HEIGHT, RIBOSOME_STRAND_ART_Y_FRACTION, RIBOSOME_SPLIT_DIST, baseCenterX} from "../model/strand-geometry"
import type {IncomingTrnaUI, StrandViewModel} from "../model/strand-view-model"

export function ribosomeRect(
  codonIndex: number,
  strandH: number,
): {left: number; top: number; width: number; height: number} {
  const codon = codonSlotRect(codonIndex, strandH)
  const codonRowY = RIBOSOME_PAD + BASE_SIZE / 2
  const artTop = codonRowY - RIBOSOME_STRAND_ART_Y_FRACTION * RIBOSOME_ART_HEIGHT
  const logicalTop = artTop + (RIBOSOME_ART_HEIGHT - RIBOSOME_HEIGHT) / 2
  return {
    left: codon.left + codon.width - RIBOSOME_WIDTH,
    top: logicalTop,
    width: RIBOSOME_WIDTH,
    height: RIBOSOME_HEIGHT,
  }
}

export function ribosomeRectStyle(rect: {left: number; top: number; width: number; height: number}) {
  return `left:${rect.left}px; top:${rect.top}px; width:${rect.width}px; height:${rect.height}px`
}

/** Inflates the logical ribosome box up to the bigger artwork size, keeping it centered on the same point. */
export function ribosomeArtRect(
  logical: {left: number; top: number; width: number; height: number},
): {left: number; top: number; width: number; height: number} {
  const cx = logical.left + logical.width / 2
  const cy = logical.top + logical.height / 2
  return {
    left: cx - RIBOSOME_ART_WIDTH / 2,
    top: cy - RIBOSOME_ART_HEIGHT / 2,
    width: RIBOSOME_ART_WIDTH,
    height: RIBOSOME_ART_HEIGHT,
  }
}

/** Fill layer of the snapped ribosome — sits behind the mRNA row so the strand looks threaded through it. */
export function renderRibosomeInside(
  vm: StrandViewModel,
  strandH: number,
): TemplateResult | null {
  const tx = vm.translation
  if (!tx?.snappedRibosome) return null
  if (tx.ribosomeShellVisible === false) return null

  const rect = ribosomeArtRect(ribosomeRect(tx.visualCodonIndex ?? tx.codonIndex, strandH))
  return html`
    <img
      class="ribosome-inside"
      style="${ribosomeRectStyle(rect)}"
      src="${ribosomeInsideSvg}"
      alt=""
      aria-hidden="true"
      draggable="false"/>
  `
}

/** Outline + interactive layer of the snapped ribosome — sits above the mRNA row, carrying the grab handle and dropzone. */
export function renderRibosomeBorder(
  msg: MsgFn,
  vm: StrandViewModel,
  strandH: number,
): TemplateResult | null {
  const tx = vm.translation
  if (!tx?.snappedRibosome) return null

  const h = vm.dropHandlers
  const locked = !tx.removable
  const onDown = tx.removable ? h?.onSnappedPointerDown : undefined
  const rect = ribosomeRect(tx.visualCodonIndex ?? tx.codonIndex, strandH)
  const dropClass = [
    tx.awaitingAminoAcid ? "is-aa-drop-target" : "",
    tx.aminoDropHover ? "is-aa-drop-hover" : "",
    tx.aminoDropHidden ? "is-aa-drop-hidden" : "",
    tx.aminoDropReveal ? "is-aa-drop-reveal" : "",
  ].filter(Boolean).join(" ")

  const artStyle = `width:${RIBOSOME_ART_WIDTH}px; height:${RIBOSOME_ART_HEIGHT}px`
  const halfStyle = `${artStyle}; --ribosome-split-dist: ${RIBOSOME_SPLIT_DIST}px`
  const halvesPhase = tx.ribosomeHalvesPhase ?? "hidden"
  const showHalves = halvesPhase === "ready" || halvesPhase === "split"
  const splitting = halvesPhase === "split"
  const shellVisible = tx.ribosomeShellVisible !== false

  return html`
    <div
      class="ribosome-snapped ${locked ? "is-locked" : ""} ${tx.ribosomeClosing ? "is-closing" : ""}"
      style="${ribosomeRectStyle(rect)}">
      ${shellVisible
        ? html`
          <img
            class="ribosome-border"
            style="${artStyle}"
            src="${ribosomeBorderSvg}"
            alt="${msg("Ribosome")}"
            draggable="false"
            tabindex=${ifDefined(tx.removable ? "0" : undefined)}
            role=${ifDefined(tx.removable ? "button" : undefined)}
            @keydown="${tx.removable ? h?.onSnappedKeyDown : undefined}"
            @pointerdown="${onDown}"/>
        `
        : null}
      ${tx.ribosomeFillVisible
        ? html`
          <img
            class="ribosome-fill is-visible"
            style="${artStyle}"
            src="${ribosomeFillSvg}"
            alt=""
            aria-hidden="true"
            draggable="false"/>
        `
        : null}
      ${showHalves
        ? html`
          <img
            class="ribosome-half ribosome-half-top ${splitting ? "is-splitting" : ""}"
            style="${halfStyle}"
            src="${ribosomeFillTopSvg}"
            alt=""
            aria-hidden="true"
            draggable="false"/>
          <img
            class="ribosome-half ribosome-half-bottom ${splitting ? "is-splitting" : ""}"
            style="${halfStyle}"
            src="${ribosomeFillBottomSvg}"
            alt=""
            aria-hidden="true"
            draggable="false"/>
        `
        : null}
      ${tx.awaitingAminoAcid || tx.aminoDropHidden || tx.aminoDropReveal
        ? html`
          <div
            class="ribosome-aa-dropzone ${dropClass}"
            aria-hidden="true">
          </div>
        `
        : null}
    </div>
  `
}

/** World position of the amino-acid attachment for a codon slot (no tRNA required). */
export function codonAminoWorldPos(codonIndex: number, strandH: number): {x: number; y: number} {
  const rect = codonSlotRect(codonIndex, strandH)
  const codonRowY = RIBOSOME_PAD + BASE_SIZE / 2
  const left = rect.left + rect.width / 2 - TRNA_WIDTH / 2
  const anticodonY = codonRowY + TRNA_DOCK_GAP
  const top = anticodonY - TRNA_ANTICODON_POINTS[1].y * TRNA_HEIGHT
  return {
    x: left + TRNA_AMINO_POINT.x * TRNA_WIDTH,
    y: top + TRNA_AMINO_POINT.y * TRNA_HEIGHT,
  }
}

/** World position of a tRNA's amino-acid attachment inside `.strand-pairs-wrap`. */
export function trnaAminoWorldPos(
  trna: IncomingTrnaUI,
  strandH: number,
): {x: number; y: number} {
  return codonAminoWorldPos(trna.codonIndex, strandH)
}

/** Newest correctly matched tRNA that has finished its check (carries the growing chain). */
export function polypeptideCarrierTrna(vm: StrandViewModel): IncomingTrnaUI | null {
  const candidates = [
    ...(vm.translation?.dockedTrnas ?? []),
    ...(vm.translation?.incomingTrna ? [vm.translation.incomingTrna] : []),
  ].filter(
    (t) => t.correct && (t.phase === "success" || t.phase === "bound"),
  )
  if (candidates.length === 0) return null
  return candidates.reduce((best, t) =>
    t.codonIndex > best.codonIndex ? t : best,
  )
}

/** How many polypeptide residues are visually on the carrier (exclude AA still riding an entering tRNA). */
export function committedPolypeptideLength(vm: StrandViewModel): number {
  const polypeptide = vm.translation?.polypeptide ?? []
  if (polypeptide.length === 0) return 0
  const incoming = vm.translation?.incomingTrna
  const pendingOnIncoming =
    !!incoming &&
    incoming.correct &&
    (incoming.phase === "enter" || incoming.phase === "error")
  return pendingOnIncoming ? Math.max(0, polypeptide.length - 1) : polypeptide.length
}

/** Growing chain hangs off the newest docked tRNA; older residues fan out on a 0–180° arc. */
export function renderPolypeptideChain(
  msg: MsgFn,
  vm: StrandViewModel,
  strandH: number,
): TemplateResult | null {
  const polypeptide = vm.translation?.polypeptide ?? []
  if (polypeptide.length === 0) return null

  const frozenAt = vm.translation?.polypeptideAnchorCodonIndex
  const carrier = polypeptideCarrierTrna(vm)
  const chainLen =
    frozenAt != null && frozenAt >= 0
      ? polypeptide.length
      : committedPolypeptideLength(vm)
  if (chainLen === 0) return null

  const attach =
    frozenAt != null && frozenAt >= 0
      ? codonAminoWorldPos(frozenAt, strandH)
      : carrier
        ? trnaAminoWorldPos(carrier, strandH)
        : null
  if (!attach) return null

  const chain = polypeptide.slice(0, chainLen)
  const linkAngles = (vm.translation?.polypeptideLinkAngles ?? []).slice(
    0,
    Math.max(0, chainLen - 1),
  )
  const positions = polypeptideResiduePositions(attach, chain.length, linkAngles)
  const bondKey =
    frozenAt != null && frozenAt >= 0
      ? `frozen-${frozenAt}-${chainLen}`
      : `${carrier?.id ?? "x"}-${chainLen}`
  const bondsAnchored = frozenAt != null && frozenAt >= 0

  return html`
    <div class="polypeptide-on-trna ${bondsAnchored ? "is-frozen" : ""}" aria-label="${msg("Polypeptide")}">
      ${keyed(
        bondKey,
        html`${positions.slice(0, -1).map((a, i) => {
          const b = positions[i + 1]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len = Math.hypot(dx, dy)
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI
          return html`
            <div
              class="polypeptide-bond ${bondsAnchored ? "is-anchored" : ""}"
              style="left:${a.x}px; top:${a.y}px; width:${len}px; transform:rotate(${angle}deg)"
              aria-hidden="true">
            </div>
          `
        })}`,
      )}
      ${chain.map((aa, i) => {
        const p = positions[i]
        return html`
          <div
            class="polypeptide-residue"
            style="left:${p.x}px; top:${p.y}px">
            ${renderAminoAcidBadge(aa, POLYPEPTIDE_AA_SIZE)}
          </div>
        `
      })}
    </div>
  `
}

/** Show the cargo badge on the tRNA only while it is still arriving / wrong — after a match the chain renderer owns it. */
export function shouldShowTrnaAminoTag(trna: IncomingTrnaUI): boolean {
  if (!trna.correct) return true
  return trna.phase === "enter" || trna.phase === "error"
}

/** tRNA sliding up from below the ribosome to test/deliver an amino acid. */
export function renderTrnaMolecule(
  trna: IncomingTrnaUI,
  strandH: number,
) {
  const rect = codonSlotRect(trna.codonIndex, strandH)
  const codonRowY = RIBOSOME_PAD + BASE_SIZE / 2
  const left = rect.left + rect.width / 2 - TRNA_WIDTH / 2
  // Dock below the mRNA base row with a visible gap — the anticodon bases
  // should approach the codon, not sit on top of it.
  const anticodonY = codonRowY + TRNA_DOCK_GAP
  const top = anticodonY - TRNA_ANTICODON_POINTS[1].y * TRNA_HEIGHT

  const phaseClass =
    trna.phase === "enter" ? "is-trna-enter" :
    trna.phase === "success" ? "is-trna-success" :
    trna.phase === "error" ? "is-trna-error" :
    trna.phase === "bound" ? "is-trna-bound" :
    "is-trna-exit"

  // Remount on exit so the fall-away CSS animation always starts cleanly.
  return keyed(
    trna.phase === "exit" ? `${trna.id}-exit` : trna.id,
    html`
      <div
        class="trna-incoming ${phaseClass}"
        style="left:${left}px; top:${top}px; width:${TRNA_WIDTH}px; height:${TRNA_HEIGHT}px"
        aria-hidden="true">
        <img class="trna-body" src="${trnaSvg}" alt="" draggable="false"/>
        ${trna.anticodon.split("").map((base, i) => {
          const pt = TRNA_ANTICODON_POINTS[i]
          if (!pt) return null
          return html`
            <img
              class="trna-anticodon-base"
              style="left:${pt.x * 100}%; top:${pt.y * 100}%"
              src="${RNA_ICON[base] ?? ""}"
              width="${TRNA_BASE_SIZE}" height="${TRNA_BASE_SIZE}" alt="${base}" draggable="false"/>
          `
        })}
        ${shouldShowTrnaAminoTag(trna)
          ? html`
            <span
              class="trna-amino-tag"
              style="left:${TRNA_AMINO_POINT.x * 100}%; top:${TRNA_AMINO_POINT.y * 100}%">
              ${renderAminoAcidBadge(trna.aminoAcid, TRNA_BASE_SIZE)}
            </span>
          `
          : null}
      </div>
    `,
  )
}

export function renderTranslationTrnas(
  vm: StrandViewModel,
  strandH: number,
): TemplateResult | null {
  const incoming = vm.translation?.incomingTrna
  const docked = vm.translation?.dockedTrnas ?? []
  if (!incoming && docked.length === 0) return null

  return html`
    ${docked.map((trna) => renderTrnaMolecule(trna, strandH))}
    ${incoming ? renderTrnaMolecule(incoming, strandH) : null}
  `
}

/** Base-pair "rungs" between a correctly-matched tRNA's anticodon and the mRNA codon, same idea as .bp-bond in Replication. */
export function renderTrnaBonds(
  vm: StrandViewModel,
): TemplateResult | null {
  const candidates = [
    ...(vm.translation?.dockedTrnas ?? []),
    ...(vm.translation?.incomingTrna ? [vm.translation.incomingTrna] : []),
  ].filter((t) => t.phase === "success" || t.phase === "bound")

  if (candidates.length === 0) return null

  const codonRowY = RIBOSOME_PAD + BASE_SIZE / 2
  const anticodonY = codonRowY + TRNA_DOCK_GAP
  const trnaTop = anticodonY - TRNA_ANTICODON_POINTS[1].y * TRNA_HEIGHT

  return html`${candidates.map((trna) => {
    const activeStart = trna.codonIndex * 3
    return TRNA_ANTICODON_POINTS.map((pt, i) => {
      const x = baseCenterX(activeStart + i)
      const baseY = trnaTop + pt.y * TRNA_HEIGHT
      return html`
        <div
          class="trna-bond"
          style="left:${x}px; top:${codonRowY}px; height:${baseY - codonRowY}px"
          aria-hidden="true">
        </div>
      `
    })
  })}`
}

export function renderSnappedMolecule(
  msg: MsgFn,
  vm: StrandViewModel,
  strandH: number,
): TemplateResult | null {
  const snapped = vm.snappedMolecule
  if (!snapped) return null
  if (
    vm.currentPhase !== "Replication" &&
    vm.currentPhase !== "Transcription"
  ) {
    return null
  }

  const rect = forkSlotRect(enzymeStep(vm), strandH)
  const h = vm.dropHandlers
  const locked = !snapped.removable
  const exitClass = snapped.exiting ? "is-molecule-exit" : ""
  return html`
    <div
      class="molecule-snapped ${locked ? "is-locked" : ""} ${exitClass}"
      style="${slotStyle(rect)}"
      @transitionend="${h?.onSnappedMoleculeTransitionEnd}"
      @animationend="${h?.onSnappedMoleculeAnimationEnd}">
      <img
        src="${snapped.icon}"
        width="${rect.size}"
        height="${rect.size}"
        alt="${localizedMoleculeName(msg, snapped.id)}"
        draggable="false"
        tabindex=${ifDefined(snapped.removable ? "0" : undefined)}
        role=${ifDefined(snapped.removable ? "button" : undefined)}
        @keydown="${snapped.removable ? h?.onSnappedKeyDown : undefined}"
        @pointerdown="${snapped.removable ? h?.onSnappedPointerDown : undefined}"/>
    </div>
  `
}

export function renderTranslationStrand(msg: MsgFn, vm: StrandViewModel): TemplateResult {
  const mrna = vm.translation?.mrnaSequence ?? ""
  if (!mrna) {
    return html`<div class="strand-empty">${msg("Enter a sequence to start")}</div>`
  }

  const n = mrna.length
  const pairsW = n * BASE_SIZE + (n - 1) * BASE_GAP
  const strandH = RIBOSOME_PAD + BASE_SIZE + RIBOSOME_PAD
  const codonIndex = vm.translation?.codonIndex ?? 0
  const activeStart = codonIndex * 3
  const activeEnd = activeStart + 3

  const pairs = mrna.split("").map((base, i) => {
    const inActiveCodon = i >= activeStart && i < activeEnd
    const ownCodon = codonAt(mrna, Math.floor(i / 3))
    return html`
      <div class="bp-col ${inActiveCodon ? "is-active-codon" : ""} ${stopCodonClass(vm.markStopCodons, ownCodon)} ${codonDividerClass(vm.markCodons, i, n)}">
        <div class="bp-spacer" style="height:${RIBOSOME_PAD}px"></div>
        <div class="bp-bottom bp-rna">
          <span class="mrna-base">
            <img
              class="mrna-base-icon"
              src="${RNA_ICON[base] ?? ""}"
              width="44"
              height="44"
              alt="${base}"
              draggable="false"/>
          </span>
        </div>
        <div class="bp-spacer" style="height:${RIBOSOME_PAD}px"></div>
      </div>
    `
  })

  return html`
    <div class="strand-outer">
      <div class="strand-inner">
        <div class="strand-polarity" style="height:${strandH}px">
          <span style="margin-top:${RIBOSOME_PAD}px">5'</span>
        </div>

        <div class="strand-pairs-wrap" style="height:${strandH}px; width:${pairsW}px">
          ${renderEnzymeSlot(msg, vm, strandH)}
          ${renderRibosomeInside(vm, strandH)}
          ${renderTrnaBonds(vm)}
          ${renderTranslationConnectors(mrna)}
          <div class="strand-pairs">${pairs}</div>
          ${renderTranslationTrnas(vm, strandH)}
          ${renderPolypeptideChain(msg, vm, strandH)}
          ${renderRibosomeBorder(msg, vm, strandH)}
        </div>

        <div class="strand-polarity" style="height:${strandH}px">
          <span style="margin-top:${RIBOSOME_PAD}px">3'</span>
        </div>
      </div>
    </div>
  `
}

/** Backbone connectors for a single Translation mRNA row (with ribosome pad offset). */
function renderTranslationConnectors(mrna: string): TemplateResult | null {
  const n = mrna.length
  if (n < 2) return null
  const railY = RIBOSOME_PAD + BASE_SIZE / 2

  return html`${Array.from({length: n - 1}, (_, i) => {
    const x1 = baseCenterX(i)
    const x2 = baseCenterX(i + 1)
    const length = x2 - x1
    return html`
      <div
        class="strand-connector"
        style="left:${x1}px; top:${railY}px; width:${length}px; transform:rotate(0deg)">
      </div>
    `
  })}`
}
