import type {DropFeedback} from "./molecule-drop"

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
  onSnappedKeyDown?: (e: KeyboardEvent) => void
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
  onBaseKeyDown?: (index: number, strand: MutationStrandSide, e: KeyboardEvent) => void
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
