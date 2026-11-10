import type {MsgFn} from "@lit/localize"

import helicaseSvg from "../../assets/helicase.svg"
import rnaPolymeraseSvg from "../../assets/rna-polymerase.svg"
import ribosomeSvg from "../../assets/ribosome.svg"
import moleculeSquareSvg from "../../assets/molecule-square.svg"
import moleculeDiamondSvg from "../../assets/molecule-diamond.svg"
import moleculeHexagonSvg from "../../assets/molecule-hexagon.svg"
import moleculeCapsuleSvg from "../../assets/molecule-capsule.svg"
import {localizedMoleculeName} from "../localize-text.js"

/** A draggable enzyme / factor in the Biomolekül-Baukasten. */
export interface BaukastenMolecule {
  id: string
  name: string
  icon: string
}

type MoleculeCatalogEntry = {
  id: string
  icon: string
}

/** Fixed catalog of every molecule the toolkit can show. **/
const MOLECULE_CATALOG: Record<string, MoleculeCatalogEntry> = {
  helicase: {id: "helicase", icon: helicaseSvg},
  "dna-polymerase": {id: "dna-polymerase", icon: moleculeSquareSvg},
  primase: {id: "primase", icon: moleculeDiamondSvg},
  ligase: {id: "ligase", icon: moleculeHexagonSvg},
  telomerase: {id: "telomerase", icon: moleculeCapsuleSvg},
  "rna-polymerase": {id: "rna-polymerase", icon: rnaPolymeraseSvg},
  activator: {id: "activator", icon: moleculeDiamondSvg},
  repressor: {id: "repressor", icon: moleculeHexagonSvg},
  spliceosome: {id: "spliceosome", icon: moleculeCapsuleSvg},
  ribosome: {id: "ribosome", icon: ribosomeSvg},
  "release-factor": {id: "release-factor", icon: moleculeSquareSvg},
  "peptidyl-transferase": {id: "peptidyl-transferase", icon: moleculeHexagonSvg},
  "initiation-factor": {id: "initiation-factor", icon: moleculeCapsuleSvg},
}

function withLocalizedName(msg: MsgFn, entry: MoleculeCatalogEntry): BaukastenMolecule {
  return {id: entry.id, icon: entry.icon, name: localizedMoleculeName(msg, entry.id)}
}

/** Molecule ids shown in each phase toolkit (canonical order before shuffle). */
const PHASE_MOLECULE_IDS: Record<string, readonly string[]> = {
  Replication: [
    "helicase",
    "dna-polymerase",
    "primase",
    "ligase",
    "telomerase",
  ],
  Transcription: [
    "rna-polymerase",
    "activator",
    "repressor",
    "dna-polymerase",
    "spliceosome",
  ],
  Translation: [
    "ribosome",
    "release-factor",
    "primase",
    "peptidyl-transferase",
    "initiation-factor",
  ],
  Mutations: [],
}

function shuffleIds(ids: readonly string[]): string[] {
  const next = [...ids]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

/** Builds a once-per-load display order for every phase. **/
export function createBaukastenOrder(): Readonly<Record<string, readonly string[]>> {
  const order: Record<string, readonly string[]> = {}
  for (const [phase, ids] of Object.entries(PHASE_MOLECULE_IDS)) {
    order[phase] = ids.length > 1 ? shuffleIds(ids) : [...ids]
  }
  return order
}

/** Molecules for a phase, using a pre-shuffled order from `createBaukastenOrder()`. */
export function baukastenForPhase(
  msg: MsgFn,
  phase: string,
  order?: Readonly<Record<string, readonly string[]>>,
): BaukastenMolecule[] {
  const ids = order?.[phase] ?? PHASE_MOLECULE_IDS[phase] ?? []
  return ids
    .map((id) => MOLECULE_CATALOG[id])
    .filter((m): m is MoleculeCatalogEntry => Boolean(m))
    .map(entry => withLocalizedName(msg, entry))
}

export const MOLECULE_DRAG_TYPE = "application/x-dna-molecule"
export const MOLECULE_DRAG_SOURCE = "application/x-dna-molecule-source"

export type MoleculeDragSource = "baukasten" | "slot"

export function moleculeById(msg: MsgFn, id: string): BaukastenMolecule | undefined {
  const entry = MOLECULE_CATALOG[id]
  return entry ? withLocalizedName(msg, entry) : undefined
}

export function moleculeIcon(id: string): string {
  return MOLECULE_CATALOG[id]?.icon ?? ""
}
