import {html, type TemplateResult} from "lit"
import {keyed} from "lit/directives/keyed.js"
import type {MsgFn} from "@lit/localize"

import {localizedMoleculeName} from "./localize-text.js"

import adenineSvg from "../assets/base-adenine.svg"
import thymineSvg from "../assets/base-thymine.svg"
import cytosineSvg from "../assets/base-cytosine.svg"
import guanineSvg from "../assets/base-guanine.svg"
import uracilSvg from "../assets/base-uracil.svg"
import trnaSvg from "../assets/trna.svg"
import ribosomeBorderSvg from "../assets/ribosome-border.svg"
import ribosomeFillSvg from "../assets/ribosome-fill.svg"
import ribosomeFillTopSvg from "../assets/ribosome-fill-top.svg"
import ribosomeFillBottomSvg from "../assets/ribosome-fill-bottom.svg"
import ribosomeInsideSvg from "../assets/ribosome-inside.svg"

import {
  MOLECULE_DROP_SIZE,
  replicationDropActive,
  transcriptionDropActive,
  translationDropActive,
  type DropFeedback,
} from "./molecules/molecule-drop.js"
import {renderAminoAcidBadge} from "./molecules/amino-acid.js"
import {codonAt, isStopCodon, mrnaFromTemplate} from "./phases/translation.js"

/** Base-pair grid — enzyme drop slots are positioned from this same grid. */
const BASE_SIZE = 44
const BASE_GAP = 8
const BOND_H = 24
const REPL_ANIM_DIST = 50
/** Extra vertical space between template DNA and mRNA row (room for polymerase). */
const TRANSCRIPTION_GAP = 40
/** Vertical padding above/below mRNA; subunits overlap ~10px into the base row. */
const RIBOSOME_PAD = 40
const MOLECULE_DROP_GAP = 10

interface ForkSlotRect {
  left: number
  top: number
  size: number
}

function forkSlotRect(animationStep: number, strandH: number): ForkSlotRect {
  const size = MOLECULE_DROP_SIZE
  return {
    left: animationStep * (BASE_SIZE + BASE_GAP) - size - MOLECULE_DROP_GAP,
    top: (strandH - size) / 2,
    size,
  }
}

/** Drop / snap rect spanning one codon (3 bases) on the Translation mRNA row. */
export function codonSlotRect(codonIndex: number, strandH: number): {left: number; top: number; width: number; height: number} {
  const width = 3 * BASE_SIZE + 2 * BASE_GAP
  const height = BASE_SIZE + RIBOSOME_PAD * 2
  return {
    left: codonIndex * 3 * (BASE_SIZE + BASE_GAP),
    top: Math.max(0, (strandH - height) / 2),
    width,
    height,
  }
}

/** World-space center of a Translation codon slot inside `.strand-pairs-wrap`. */
export function translationCodonCenter(codonIndex: number): {x: number; y: number} {
  const strandH = RIBOSOME_PAD + BASE_SIZE + RIBOSOME_PAD
  const rect = codonSlotRect(codonIndex, strandH)
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function codonSlotStyle(codonIndex: number, strandH: number) {
  const rect = codonSlotRect(codonIndex, strandH)
  return `left:${rect.left}px; top:${rect.top}px; width:${rect.width}px; height:${rect.height}px`
}

const COMP_BASE: Record<string, string> = {A: "T", T: "A", C: "G", G: "C"}
const DNA_ICON: Record<string, string> = {
  A: adenineSvg,
  T: thymineSvg,
  C: cytosineSvg,
  G: guanineSvg,
}
const RNA_ICON: Record<string, string> = {
  A: adenineSvg,
  U: uracilSvg,
  C: cytosineSvg,
  G: guanineSvg,
}

/** trna.svg's own aspect ratio */
const TRNA_ASPECT_RATIO = 0.7
/** Rendered box the tRNA graphic occupies — same width as a codon so its 3 anticodon legs line up with the bases above it. */
const TRNA_WIDTH = 3 * BASE_SIZE + 2 * BASE_GAP
const TRNA_HEIGHT = Math.round(TRNA_WIDTH * TRNA_ASPECT_RATIO)
/** Anticodon/amino-acid icons match the mRNA strand's base size exactly. */
const TRNA_BASE_SIZE = BASE_SIZE
/** Resting gap between the tRNA's anticodon bases and the mRNA codon bases
 * above them (center-to-center) — keeps the two rows visibly separate. */
const TRNA_DOCK_GAP = 60
/** Fractional (0–1) anchor points inside the tRNA's bounding box, after it is
 * flipped vertically so the legs face up toward the codon.
 * - `x` is snapped to the same grid the mRNA bases use (`baseCenterX`, 22 /
 *   74 / 126 out of the 148px codon width) rather than the artwork's raw
 *   leg-tip position, so each anticodon base lines up exactly — same
 *   vertical line — with the codon base it pairs with above it.
 * - `y` still comes from where the artwork's leg tips / head actually sit,
 *   measured from its path data. */
const TRNA_ANTICODON_POINTS = [
  {x: 22 / TRNA_WIDTH, y: 0.0143},
  {x: 74 / TRNA_WIDTH, y: 0.0097},
  {x: 126 / TRNA_WIDTH, y: 0.0143},
]
const TRNA_AMINO_POINT = {x: 0.5, y: 0.9903}
/** Center-to-center distance between linked amino acids in the growing chain. */
const POLYPEPTIDE_AA_GAP = 50
/** Same size as the badge on the tRNA so docking does not shrink residues. */
const POLYPEPTIDE_AA_SIZE = TRNA_BASE_SIZE

/**
 * Angle (0–180°) for placing an older amino acid relative to the newer one:
 * 0 = left, 90 = below, 180 = right.
 */
function polypeptideLinkOffset(angleDeg: number): {x: number; y: number} {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: -Math.cos(rad) * POLYPEPTIDE_AA_GAP,
    y: Math.sin(rad) * POLYPEPTIDE_AA_GAP,
  }
}

/** Positions for a chain: newest at `attach`, each older one a gap away at its stored random angle. */
function polypeptideResiduePositions(
  attach: {x: number; y: number},
  count: number,
  linkAngles: readonly number[],
): {x: number; y: number}[] {
  if (count <= 0) return []
  const positions: {x: number; y: number}[] = new Array(count)
  positions[count - 1] = {x: attach.x, y: attach.y}
  for (let i = count - 2; i >= 0; i--) {
    const angle = linkAngles[i] ?? 90
    const offset = polypeptideLinkOffset(angle)
    positions[i] = {
      x: positions[i + 1].x + offset.x,
      y: positions[i + 1].y + offset.y,
    }
  }
  return positions
}

/** ribosome.svg's own aspect ratio (viewBox 14.890749 × 8.8112679, height/width, rounded). */
const RIBOSOME_ASPECT_RATIO = 0.6
/** Logical box: exactly 3 codons (9 bases) wide, used for codon-grid math (slots, dropzone, polypeptide anchor). */
const RIBOSOME_WIDTH = 9 * BASE_SIZE + 8 * BASE_GAP
const RIBOSOME_HEIGHT = Math.round(RIBOSOME_WIDTH * RIBOSOME_ASPECT_RATIO)
/** The artwork's narrow "waist" (where mRNA docks) is much smaller than its full bounding box, so it must render bigger than the logical box for 9 bases to fit inside it. */
const RIBOSOME_ART_SCALE = 1.45
const RIBOSOME_ART_WIDTH = Math.round(RIBOSOME_WIDTH * RIBOSOME_ART_SCALE)
const RIBOSOME_ART_HEIGHT = Math.round(RIBOSOME_ART_WIDTH * RIBOSOME_ASPECT_RATIO)
/** How far down the artwork's own height (not the logical box) the mRNA row docks, just below its top/bottom-section notch. */
const RIBOSOME_STRAND_ART_Y_FRACTION = 0.2
/** How far each subunit travels vertically when splitting apart after stop (px). Top goes up, bottom goes down. */
const RIBOSOME_SPLIT_DIST = 120

export interface MoleculeDropUI {
  hover: boolean
  feedback: DropFeedback
  snappingOut?: boolean
}

export interface SnappedMoleculeUI {
  id: string
  icon: string
  removable?: boolean
  exiting?: boolean
}

export interface TranscriptionBaseAnim {
  enteringIndex: number | null
  successIndex: number | null
}

export type TranscriptionRejectPhase = "enter" | "error" | "exit"

export interface TranscriptionRejectAnim {
  index: number
  base: string
  phase: TranscriptionRejectPhase
}

export interface TranscriptionUI {
  mrnaSequence: string
  transcriptionStep: number
  awaitingRnaBase: boolean
  stepwiseAnim?: boolean
  baseAnim?: TranscriptionBaseAnim | null
  rejectAnim?: TranscriptionRejectAnim | null
}

export type TrnaAnimPhase = "enter" | "success" | "error" | "bound" | "exit"

export interface IncomingTrnaUI {
  id: number
  codonIndex: number
  /** 3 anticodon bases, aligned left-to-right with the codon underneath. */
  anticodon: string
  aminoAcid: string
  phase: TrnaAnimPhase
  /** True when this tRNA matched its codon. */
  correct: boolean
}

export interface TranslationUI {
  mrnaSequence: string
  codonIndex: number
  /** Codon index the ribosome should visually render at — lags `codonIndex` until it's time to shift focus. */
  visualCodonIndex?: number
  snappedRibosome: boolean
  removable?: boolean
  /** Growing chain of accepted amino acids (three-letter names). */
  polypeptide?: readonly string[]
  /** Random 0–180° angles between consecutive polypeptide residues. */
  polypeptideLinkAngles?: readonly number[]
  /** Freeze the chain at this codon’s amino attachment (set during stop termination). */
  polypeptideAnchorCodonIndex?: number | null
  /** Large subunit is an active amino-acid drop target. */
  awaitingAminoAcid?: boolean
  aminoDropHover?: boolean
  /** Dropzone is faded/shrunk until hover ends or ribosome settle finishes. */
  aminoDropHidden?: boolean
  /** Play the bounce-in reveal on the dropzone. */
  aminoDropReveal?: boolean
  /** Translation finished (stop codon or last sense codon filled). */
  complete?: boolean
  /** Termination close sequence is active (raises z-index while fill/halves animate). */
  ribosomeClosing?: boolean
  /** Solid combined fill currently shown over the border. */
  ribosomeFillVisible?: boolean
  /** Border + inside layers (hidden after the solid fill finishes fading in). */
  ribosomeShellVisible?: boolean
  /** Separate subunit halves: hidden | ready (over fill) | split (flying apart). */
  ribosomeHalvesPhase?: "hidden" | "ready" | "split"
  /** tRNA sliding in from below to test/deliver an amino acid. */
  incomingTrna?: IncomingTrnaUI | null
  /** Correct tRNAs in the ribosome (FIFO queue, max 2 bound at once). */
  dockedTrnas?: readonly IncomingTrnaUI[]
}

export interface StrandDropHandlers {
  onSlotDragEnter?: (e: DragEvent) => void
  onSlotDragOver?: (e: DragEvent) => void
  onSlotDragLeave?: (e: DragEvent) => void
  onSlotDrop?: (e: DragEvent) => void
  onSnappedPointerDown?: (e: PointerEvent) => void
  onDropSlotAnimationEnd?: (e: AnimationEvent) => void
  onMrnaBaseAnimationEnd?: (e: AnimationEvent) => void
  /** Fires when a replication base-pair split transform transition finishes. */
  onReplicationSplitTransitionEnd?: (e: TransitionEvent) => void
  /** Fires when the snapped enzyme exit animation finishes. */
  onSnappedMoleculeAnimationEnd?: (e: AnimationEvent) => void
  /** Fires when snapped molecule left/top transition settles. */
  onSnappedMoleculeTransitionEnd?: (e: TransitionEvent) => void
}

/** Which DNA strand base was clicked in Mutations (template = top row). */
export type MutationStrandSide = "template" | "complement"

export interface MutationsUI {
  selectedIndex: number | null
  selectedStrand: MutationStrandSide | null
  onBaseClick?: (index: number, strand: MutationStrandSide, e: MouseEvent) => void
}

export interface StrandViewModel {
  dnaSequence: string
  currentPhase: string
  animationStep: number
  /** Subtle triplet dividers (Mutations + Translation). */
  markCodons?: boolean
  /** Highlight in-frame stop triplets in Mutations and Translation. */
  markStopCodons?: boolean
  moleculeDrop?: MoleculeDropUI | null
  snappedMolecule?: SnappedMoleculeUI | null
  transcription?: TranscriptionUI | null
  translation?: TranslationUI | null
  mutations?: MutationsUI | null
  dropHandlers?: StrandDropHandlers
  /** Original vs current polypeptide under the Mutations strand. */
  polypeptideCompare?: {before: string[]; after: string[]} | null
}

function showDnaComplement(phase: string): boolean {
  return phase === "Replication" || phase === "Mutations"
}

function showMrnaRow(phase: string): boolean {
  return phase === "Transcription"
}

function showTranslationMrna(phase: string): boolean {
  return phase === "Translation"
}

function codonDividerClass(mark: boolean | undefined, index: number, length: number): string {
  if (!mark) return ""
  if ((index + 1) % 3 !== 0 || index + 1 >= length) return ""
  return "has-codon-divider"
}

function stopCodonClass(mark: boolean | undefined, codon: string | null): string {
  if (!mark || !codon || !isStopCodon(codon)) return ""
  return "is-stop-codon"
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

function baseCenterX(index: number): number {
  return index * (BASE_SIZE + BASE_GAP) + BASE_SIZE / 2
}

function rowGap(phase: string): number {
  return phase === "Transcription" ? TRANSCRIPTION_GAP : BOND_H
}

function baseCenterY(
  strand: "top" | "bottom",
  index: number,
  phase: string,
  animationStep: number,
): number {
  const split = phase === "Replication" && index < animationStep
  const offset = split ? (strand === "top" ? -REPL_ANIM_DIST : REPL_ANIM_DIST) : 0
  const gap = rowGap(phase)
  const railY = strand === "top" ? BASE_SIZE / 2 : BASE_SIZE + gap + BASE_SIZE / 2
  return railY + offset
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

function slotStyle(rect: {left: number; top: number; size: number}) {
  return `left:${rect.left}px; top:${rect.top}px; width:${rect.size}px; height:${rect.size}px`
}

function enzymeDropActive(vm: StrandViewModel): boolean {
  return replicationDropActive(vm.currentPhase, vm.dnaSequence.length) ||
    transcriptionDropActive(vm.currentPhase, vm.dnaSequence.length) ||
    translationDropActive(vm.currentPhase, vm.dnaSequence.length)
}

function enzymeStep(vm: StrandViewModel): number {
  if (vm.currentPhase === "Transcription") {
    return vm.transcription?.transcriptionStep ?? 0
  }
  return vm.animationStep
}

function renderEnzymeSlot(
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

/** Logical ribosome bounding box, spanning 3 codon-wide slots with the active codon always in the rightmost one. */
function ribosomeRect(
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

function ribosomeRectStyle(rect: {left: number; top: number; width: number; height: number}) {
  return `left:${rect.left}px; top:${rect.top}px; width:${rect.width}px; height:${rect.height}px`
}

/** Inflates the logical ribosome box up to the bigger artwork size, keeping it centered on the same point. */
function ribosomeArtRect(
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
function renderRibosomeInside(
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
function renderRibosomeBorder(
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
function codonAminoWorldPos(codonIndex: number, strandH: number): {x: number; y: number} {
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
function trnaAminoWorldPos(
  trna: IncomingTrnaUI,
  strandH: number,
): {x: number; y: number} {
  return codonAminoWorldPos(trna.codonIndex, strandH)
}

/** Newest correctly matched tRNA that has finished its check (carries the growing chain). */
function polypeptideCarrierTrna(vm: StrandViewModel): IncomingTrnaUI | null {
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
function committedPolypeptideLength(vm: StrandViewModel): number {
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
function renderPolypeptideChain(
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
function shouldShowTrnaAminoTag(trna: IncomingTrnaUI): boolean {
  if (!trna.correct) return true
  return trna.phase === "enter" || trna.phase === "error"
}

/** tRNA sliding up from below the ribosome to test/deliver an amino acid. */
function renderTrnaMolecule(
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

function renderTranslationTrnas(
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
function renderTrnaBonds(
  vm: StrandViewModel,
  strandH: number,
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

function renderSnappedMolecule(
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
        @pointerdown="${snapped.removable ? h?.onSnappedPointerDown : undefined}"/>
    </div>
  `
}

function renderTranslationStrand(msg: MsgFn, vm: StrandViewModel): TemplateResult {
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
          ${renderTrnaBonds(vm, strandH)}
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

    const topClick = mutationClick("template")
    const bottomClick = mutationClick("complement")

    return html`
      <div class="bp-col ${transcribed ? "is-transcribed" : ""} ${stopCodonClass(mutationsActive && vm.markStopCodons, codonAt(mutationsMrna, Math.floor(i / 3)))} ${codonDividerClass(mutationsActive ? vm.markCodons : false, i, dnaSequence.length)}" data-bp-index="${i}">
        <div
          class="bp-top ${topSelected ? "is-mutation-selected" : ""}"
          style="transform:translateY(${topY}px)"
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
