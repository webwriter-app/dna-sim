import {GENETIC_CODE, isStartCodon, isStopCodon} from "./translation.js"

/** Drag MIME for amino acids pulled from the codon wheel. */
export const AMINO_DRAG_TYPE = "application/x-dna-amino-acid"

export const AA_ONE_LETTER: Record<string, string> = {
  Phe: "F", Leu: "L", Ile: "I", Met: "M", Val: "V",
  Ser: "S", Pro: "P", Thr: "T", Ala: "A", Tyr: "Y",
  His: "H", Gln: "Q", Asn: "N", Lys: "K", Asp: "D",
  Glu: "E", Cys: "C", Trp: "W", Arg: "R", Gly: "G",
  Stop: "*",
}

/** Full English names, for the searchable list view. */
export const AA_FULL_NAME: Record<string, string> = {
  Phe: "Phenylalanine", Leu: "Leucine", Ile: "Isoleucine", Met: "Methionine", Val: "Valine",
  Ser: "Serine", Pro: "Proline", Thr: "Threonine", Ala: "Alanine", Tyr: "Tyrosine",
  His: "Histidine", Gln: "Glutamine", Asn: "Asparagine", Lys: "Lysine", Asp: "Aspartate",
  Glu: "Glutamate", Cys: "Cysteine", Trp: "Tryptophan", Arg: "Arginine", Gly: "Glycine",
}

/** Base colors matching the tool's nucleotide palette (--color-*). */
export const BASE_COLORS: Record<string, {fill: string; stroke: string}> = {
  A: {fill: "#239d46", stroke: "#166534"},
  U: {fill: "#e07428", stroke: "#9a3412"},
  C: {fill: "#b4d7f5", stroke: "#3b82c4"},
  G: {fill: "#f1e21a", stroke: "#a16207"},
}

/** First-base order on the wheel (clockwise from top-left, like school charts). */
export const FIRST_BASES = ["G", "U", "C", "A"] as const
/** Second / third base order within each sector. */
export const INNER_BASES = ["U", "C", "A", "G"] as const

export type AminoDragPayload = {
  aminoAcid: string
  oneLetter: string
  /** Codons covered by this outer-ring segment. */
  codons: string[]
}

/** One drawable arc segment on the wheel. */
export type WheelArc = {
  id: string
  kind: "base1" | "base2" | "base3" | "amino"
  label: string
  startDeg: number
  endDeg: number
  fill: string
  stroke: string
  /** Present on outer amino segments — used for drag. */
  drag?: AminoDragPayload
  isStart?: boolean
  isStop?: boolean
}

/**
 * Degrees from top, clockwise. G occupies the top-left quadrant
 * (225°–315°), then U, C, A — matching common school wheels.
 */
const FIRST_START_DEG = 225

function normalizeDeg(d: number): number {
  let x = d % 360
  if (x < 0) x += 360
  return x
}

/** Build all ring arcs for an SVG codon wheel. */
export function buildCodonWheelArcs(): WheelArc[] {
  const arcs: WheelArc[] = []
  const firstSpan = 90
  const secondSpan = firstSpan / INNER_BASES.length
  const thirdSpan = secondSpan / INNER_BASES.length

  FIRST_BASES.forEach((b1, i1) => {
    const s1 = FIRST_START_DEG + i1 * firstSpan
    const e1 = s1 + firstSpan
    const c1 = BASE_COLORS[b1]
    arcs.push({
      id: `b1-${b1}`,
      kind: "base1",
      label: b1,
      startDeg: s1,
      endDeg: e1,
      fill: c1.fill,
      stroke: c1.stroke,
    })

    INNER_BASES.forEach((b2, i2) => {
      const s2 = s1 + i2 * secondSpan
      const e2 = s2 + secondSpan
      const c2 = BASE_COLORS[b2]
      arcs.push({
        id: `b2-${b1}${b2}`,
        kind: "base2",
        label: b2,
        startDeg: s2,
        endDeg: e2,
        fill: c2.fill,
        stroke: c2.stroke,
      })

      // Merge consecutive third-base wedges that share the same amino acid
      // into one outer draggable label (like Phe spanning UUU+UUC).
      type Run = {amino: string; codons: string[]; startDeg: number; endDeg: number}
      const runs: Run[] = []

      INNER_BASES.forEach((b3, i3) => {
        const s3 = s2 + i3 * thirdSpan
        const e3 = s3 + thirdSpan
        const codon = `${b1}${b2}${b3}`
        const amino = GENETIC_CODE[codon] ?? "?"
        const c3 = BASE_COLORS[b3]
        arcs.push({
          id: `b3-${codon}`,
          kind: "base3",
          label: b3,
          startDeg: s3,
          endDeg: e3,
          fill: c3.fill,
          stroke: c3.stroke,
        })

        const last = runs[runs.length - 1]
        if (last && last.amino === amino) {
          last.codons.push(codon)
          last.endDeg = e3
        } else {
          runs.push({amino, codons: [codon], startDeg: s3, endDeg: e3})
        }
      })

      for (const run of runs) {
        const one = AA_ONE_LETTER[run.amino] ?? "?"
        arcs.push({
          id: `aa-${run.codons.join("-")}`,
          kind: "amino",
          label: run.amino,
          startDeg: run.startDeg,
          endDeg: run.endDeg,
          fill: "#f8fafc",
          stroke: "#334155",
          drag: {
            aminoAcid: run.amino,
            oneLetter: one,
            codons: run.codons,
          },
          isStart: run.codons.some(isStartCodon),
          isStop: run.codons.some(isStopCodon),
        })
      }
    })
  })

  return arcs
}

/** Polar point: 0° = top, clockwise. */
export function polar(
  cx: number,
  cy: number,
  r: number,
  degFromTopClockwise: number,
): {x: number; y: number} {
  const rad = ((normalizeDeg(degFromTopClockwise) - 90) * Math.PI) / 180
  return {x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad)}
}

/** SVG donut-slice path between two radii. */
export function donutSlicePath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const span = endDeg - startDeg
  const large = Math.abs(span) > 180 ? 1 : 0
  // Sweep flag 1 = clockwise in SVG when y increases downward.
  const p0 = polar(cx, cy, outerR, startDeg)
  const p1 = polar(cx, cy, outerR, endDeg)
  const p2 = polar(cx, cy, innerR, endDeg)
  const p3 = polar(cx, cy, innerR, startDeg)
  return [
    `M ${p0.x} ${p0.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ")
}

export function midDeg(startDeg: number, endDeg: number): number {
  return (startDeg + endDeg) / 2
}

/** One row in the searchable amino-acid list view. */
export type AminoAcidEntry = {
  threeLetter: string
  oneLetter: string
  fullName: string
  codons: string[]
  isStart: boolean
}

/** All 20 amino acids (Stop excluded — it isn't one), sorted alphabetically by full name. */
export function buildAminoAcidList(): AminoAcidEntry[] {
  const codonsByAmino = new Map<string, string[]>()
  for (const [codon, amino] of Object.entries(GENETIC_CODE)) {
    if (amino === "Stop") continue
    const codons = codonsByAmino.get(amino) ?? []
    codons.push(codon)
    codonsByAmino.set(amino, codons)
  }

  const entries: AminoAcidEntry[] = [...codonsByAmino.entries()].map(([threeLetter, codons]) => ({
    threeLetter,
    oneLetter: AA_ONE_LETTER[threeLetter] ?? "?",
    fullName: AA_FULL_NAME[threeLetter] ?? threeLetter,
    codons: [...codons].sort(),
    isStart: codons.some(isStartCodon),
  }))

  entries.sort((a, b) => a.fullName.localeCompare(b.fullName))
  return entries
}
