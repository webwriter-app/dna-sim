import {MOLECULE_DROP_SIZE} from "./molecule-drop"

/** Base-pair grid — enzyme drop slots are positioned from this same grid. */
export const BASE_SIZE = 44
export const BASE_GAP = 8
export const BOND_H = 24
export const REPL_ANIM_DIST = 50
/** Extra vertical space between template DNA and mRNA row (room for polymerase). */
export const TRANSCRIPTION_GAP = 40
/** Vertical padding above/below mRNA; subunits overlap ~10px into the base row. */
export const RIBOSOME_PAD = 40
export const MOLECULE_DROP_GAP = 10

export interface ForkSlotRect {
  left: number
  top: number
  size: number
}

export function forkSlotRect(animationStep: number, strandH: number): ForkSlotRect {
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

export function codonSlotStyle(codonIndex: number, strandH: number) {
  const rect = codonSlotRect(codonIndex, strandH)
  return `left:${rect.left}px; top:${rect.top}px; width:${rect.width}px; height:${rect.height}px`
}


export const TRNA_ASPECT_RATIO = 0.7
/** Rendered box the tRNA graphic occupies — same width as a codon so its 3 anticodon legs line up with the bases above it. */
export const TRNA_WIDTH = 3 * BASE_SIZE + 2 * BASE_GAP
export const TRNA_HEIGHT = Math.round(TRNA_WIDTH * TRNA_ASPECT_RATIO)
/** Anticodon/amino-acid icons match the mRNA strand's base size exactly. */
export const TRNA_BASE_SIZE = BASE_SIZE
/** Resting gap between the tRNA's anticodon bases and the mRNA codon bases
 * above them (center-to-center) — keeps the two rows visibly separate. */
export const TRNA_DOCK_GAP = 60
/** Fractional (0–1) anchor points inside the tRNA's bounding box, after it is
 * flipped vertically so the legs face up toward the codon.
 * - `x` is snapped to the same grid the mRNA bases use (`baseCenterX`, 22 /
 *   74 / 126 out of the 148px codon width) rather than the artwork's raw
 *   leg-tip position, so each anticodon base lines up exactly — same
 *   vertical line — with the codon base it pairs with above it.
 * - `y` still comes from where the artwork's leg tips / head actually sit,
 *   measured from its path data. */
export const TRNA_ANTICODON_POINTS = [
  {x: 22 / TRNA_WIDTH, y: 0.0143},
  {x: 74 / TRNA_WIDTH, y: 0.0097},
  {x: 126 / TRNA_WIDTH, y: 0.0143},
]
export const TRNA_AMINO_POINT = {x: 0.5, y: 0.9903}
/** Center-to-center distance between linked amino acids in the growing chain. */
export const POLYPEPTIDE_AA_GAP = 50
/** Same size as the badge on the tRNA so docking does not shrink residues. */
export const POLYPEPTIDE_AA_SIZE = TRNA_BASE_SIZE

/**
 * Angle (0–180°) for placing an older amino acid relative to the newer one:
 * 0 = left, 90 = below, 180 = right.
 */
export function polypeptideLinkOffset(angleDeg: number): {x: number; y: number} {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: -Math.cos(rad) * POLYPEPTIDE_AA_GAP,
    y: Math.sin(rad) * POLYPEPTIDE_AA_GAP,
  }
}

/** Positions for a chain: newest at `attach`, each older one a gap away at its stored random angle. */
export function polypeptideResiduePositions(
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
export const RIBOSOME_ASPECT_RATIO = 0.6
/** Logical box: exactly 3 codons (9 bases) wide, used for codon-grid math (slots, dropzone, polypeptide anchor). */
export const RIBOSOME_WIDTH = 9 * BASE_SIZE + 8 * BASE_GAP
export const RIBOSOME_HEIGHT = Math.round(RIBOSOME_WIDTH * RIBOSOME_ASPECT_RATIO)
/** The artwork's narrow "waist" (where mRNA docks) is much smaller than its full bounding box, so it must render bigger than the logical box for 9 bases to fit inside it. */
export const RIBOSOME_ART_SCALE = 1.45
export const RIBOSOME_ART_WIDTH = Math.round(RIBOSOME_WIDTH * RIBOSOME_ART_SCALE)
export const RIBOSOME_ART_HEIGHT = Math.round(RIBOSOME_ART_WIDTH * RIBOSOME_ASPECT_RATIO)
/** How far down the artwork's own height (not the logical box) the mRNA row docks, just below its top/bottom-section notch. */
export const RIBOSOME_STRAND_ART_Y_FRACTION = 0.2
/** How far each subunit travels vertically when splitting apart after stop (px). Top goes up, bottom goes down. */
export const RIBOSOME_SPLIT_DIST = 120


export function baseCenterX(index: number): number {
  return index * (BASE_SIZE + BASE_GAP) + BASE_SIZE / 2
}

export function rowGap(phase: string): number {
  return phase === "Transcription" ? TRANSCRIPTION_GAP : BOND_H
}

export function baseCenterY(
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
