import {html, type PropertyValues} from "lit"
import {LitElementWw} from "@webwriter/lit"
import {customElement, property, state} from "lit/decorators.js"
import {msg, str} from "@lit/localize"

import LOCALIZE from "../localization/generated"

import {widgetStyles} from "../lib/dna-simulation.styles.js"
import {shoelaceLight} from "../lib/shoelace-theme.js"
import {
  CANVAS_ERROR_ALERT_MS,
  CANVAS_INFO_ALERT_MS,
  DnaCanvasAlert,
} from "../components/canvas-alert/canvas-alert.js"
import {DnaCanvasInfoButton} from "../components/canvas-info-button/canvas-info-button.js"
import {
  DnaPhaseCompleteToast,
  PHASE_COMPLETE_TOAST_MS,
} from "../components/phase-complete-toast/phase-complete-toast.js"
import {DnaSimulationNavbar} from "../components/simulation-navbar/simulation-navbar.js"
import {DnaCodonCard, type CodonCardAction, type CodonDrawerTab} from "../components/codon-card/codon-card.js"
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.component.js"
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js"
import SlDetails from "@shoelace-style/shoelace/dist/components/details/details.component.js"
import SlSwitch from "@shoelace-style/shoelace/dist/components/switch/switch.component.js"
import SlSelect from "@shoelace-style/shoelace/dist/components/select/select.component.js"
import SlOption from "@shoelace-style/shoelace/dist/components/option/option.component.js"
import SlRange from "@shoelace-style/shoelace/dist/components/range/range.component.js"
import arrowCounterclockwiseIcon from "../assets/arrow-counterclockwise.svg"
import {WorkspaceController} from "../lib/canvas/workspace-controller.js"
import {NavbarController, type NavbarHost, type NavbarMrnaInput} from "../lib/navbar/navbar-controller.js"
import {
  TranscriptionController,
  type TranscriptionHost,
} from "../lib/phases/transcription-controller.js"
import {
  TranslationController,
  type TranslationHost,
} from "../lib/phases/translation-controller.js"
import {
  MoleculeDragController,
  type MoleculeDragHost,
} from "../lib/molecules/molecule-drag-controller.js"
import {PhaseCompletionController} from "../lib/phases/phase-completion-controller.js"
import {
  deleteDnaBase,
  DNA_BASE_ICONS,
  DNA_BASE_ORDER,
  formatMutationStepKindLabel,
  insertDnaBase,
  replayMutationSteps,
  sanitizeDnaBase,
  substituteDnaBase,
  substitutionTargets,
  templateBaseForStrandEdit,
  type DnaBase,
  type MutationStep,
} from "../lib/phases/mutations.js"
import {MutationsController} from "../lib/phases/mutations-controller.js"
import {ResetController, type ResetHost} from "../lib/phases/reset-controller.js"
import {renderStrand, type MutationStrandSide} from "../lib/render-strand.js"
import {
  canPlaceHelicaseAtFork,
  canPlacePolymeraseAtFork,
  canPlaceRibosomeAtCodon,
  canRemoveHelicaseFromFork,
  canRemovePolymeraseFromFork,
  canRemoveRibosomeFromCodon,
  dropErrorMessage,
  expectedMoleculeId,
  MOLECULE_DROP_SIZE,
  replicationDropActive,
  transcriptionDropActive,
  translationDropActive,
} from "../lib/molecules/molecule-drop.js"
import {
  baukastenForPhase,
  createBaukastenOrder,
  moleculeById,
  moleculeIcon,
  type BaukastenMolecule,
} from "../lib/molecules/baukasten.js"
import {
  DEFAULT_MRNA_BATCH_VERIFY_MODE,
  DEFAULT_MRNA_INPUT_MODE,
  MRNA_BATCH_VERIFY_MODE_ATTRIBUTE,
  MRNA_INPUT_MODE_ATTRIBUTE,
  normalizeMrnaBatchVerifyMode,
  normalizeMrnaInputMode,
  readMrnaBatchVerifyModeAttr,
  readMrnaInputModeAttr,
  writeMrnaBatchVerifyMode,
  writeMrnaInputMode,
  type MrnaBatchVerifyMode,
  type MrnaInputMode,
} from "../lib/phases/transcription.js"
import {readingFrameFromTemplate} from "../lib/phases/translation.js"
import {
  evaluateMutationGoal,
  formatPolypeptide,
  hasMutationProteinGoal,
  mutationTargetChain,
  normalizeAminoAcidToken,
  normalizeMutationGoalMode,
  startMatchesMutationGoal,
  type MutationCheckResult,
  type MutationGoalMode,
} from "../lib/phases/mutation-goals.js"
import {buildTeacherOptionsInput} from "../lib/build-teacher-options-input.js"
import {localizedPhaseCompleteMessage, localizedPhaseLabel} from "../lib/localize-text.js"
import {renderTeacherOptions, teacherOptionsStyles} from "../lib/teacher-options-renderer.js"
import {
  PHASE_ENABLE_KEYS,
  resolveVisiblePhases,
  canSelectVisiblePhase,
  normalizePhaseSetMode,
  DEFAULT_PHASE_SET_MODE,
  ALL_PHASES_ENABLED,
  PHASE_SET_MODE_ATTRIBUTE,
  readPhaseSetModeAttr,
  writePhaseSetMode,
  readPhaseEnableFlag,
  writePhaseEnableFlag,
  DEFAULT_ANIMATION_SPEED,
  DEFAULT_DNA_SEQUENCE,
  normalizeAnimationSpeed,
  scaledDurationMs,
  SHOW_INFO_CARDS_ATTRIBUTE,
  SHOW_SEQUENCE_TAB_ATTRIBUTE,
  CROSS_PHASE_MUTATIONS_ATTRIBUTE,
  MARK_CODONS_ATTRIBUTE,
  MARK_STOP_CODONS_ATTRIBUTE,
  CANONICAL_PHASE_ORDER_ATTRIBUTE,
  MUTATION_GOAL_MODE_ATTRIBUTE,
  MUTATION_TARGET_PROTEIN_ATTRIBUTE,
  LEGACY_MUTATION_TARGET_DNA_ATTRIBUTES,
  DNA_SEQUENCE_ATTRIBUTE,
  DNA_SEQUENCE_CONVERTER,
  sanitizeDnaSequence,
  writeDnaSequence,
  readPersistedDnaSequence,
  readShowInfoCards,
  readShowSequenceTab,
  readCrossPhaseMutations,
  readMarkCodons,
  readMarkStopCodons,
  readCanonicalPhaseOrder,
  readMutationGoalModeAttr,
  readMutationTargetProtein,
  writeShowInfoCards,
  writeShowSequenceTab,
  writeCrossPhaseMutations,
  writeMarkCodons,
  writeMarkStopCodons,
  writeCanonicalPhaseOrder,
  writeMutationGoalMode,
  writeMutationTargetProtein,
  type PhaseEnableFlags,
  type PhaseSetMode,
  type SimulationPhase,
} from "../lib/widget-options.js"

/** Replication unzip interval at 1×. */
const REPLICATION_STEP_MS = 350

const MUTATION_DNA_ICON = DNA_BASE_ICONS

@customElement("webwriter-dna-simulation")
export class WebwriterDnaSimulation extends LitElementWw implements NavbarHost, TranscriptionHost, TranslationHost, MoleculeDragHost, ResetHost {

  localize = LOCALIZE

  static styles = [shoelaceLight, widgetStyles, teacherOptionsStyles]

  static scopedElements = {
    "dna-canvas-alert": DnaCanvasAlert,
    "dna-canvas-info-button": DnaCanvasInfoButton,
    "dna-phase-complete-toast": DnaPhaseCompleteToast,
    "dna-simulation-navbar": DnaSimulationNavbar,
    "dna-codon-card": DnaCodonCard,
    "sl-icon": SlIcon,
    "sl-button": SlButton,
    "sl-dialog": SlDialog,
    "sl-popup": SlPopup,
    "sl-details": SlDetails,
    "sl-switch": SlSwitch,
    "sl-select": SlSelect,
    "sl-option": SlOption,
    "sl-range": SlRange,
  }

  /** Custom inspector UI via `[part=options]`; do not auto-generate fields. */
  static override readonly options = {}

  @property({ type: String }) currentPhase = "Replication"

  @property({
    type: String,
    reflect: true,
    attribute: DNA_SEQUENCE_ATTRIBUTE,
    converter: DNA_SEQUENCE_CONVERTER,
  })
  dnaSequence = DEFAULT_DNA_SEQUENCE

  @property({ type: Number, reflect: true })
  animationSpeed = DEFAULT_ANIMATION_SPEED

  @property({
    type: Boolean,
    reflect: true,
    attribute: SHOW_INFO_CARDS_ATTRIBUTE,
  })
  showInfoCards = true

  @property({
    type: Boolean,
    reflect: true,
    attribute: SHOW_SEQUENCE_TAB_ATTRIBUTE,
  })
  showSequenceTab = true

  @property({
    type: Boolean,
    reflect: true,
    attribute: MARK_CODONS_ATTRIBUTE,
  })
  markCodons = true

  @property({
    type: Boolean,
    reflect: true,
    attribute: MARK_STOP_CODONS_ATTRIBUTE,
  })
  markStopCodons = true

  @property({
    type: Boolean,
    reflect: true,
    attribute: CANONICAL_PHASE_ORDER_ATTRIBUTE,
  })
  canonicalPhaseOrder = false

  @property({
    type: Boolean,
    reflect: true,
    attribute: CROSS_PHASE_MUTATIONS_ATTRIBUTE,
  })
  crossPhaseMutations = true

  @property({
    type: String,
    reflect: true,
    attribute: MUTATION_GOAL_MODE_ATTRIBUTE,
    converter: {
      fromAttribute: (value: string | null) => normalizeMutationGoalMode(value),
      toAttribute: (value: MutationGoalMode) => normalizeMutationGoalMode(value),
    },
  })
  mutationGoalMode: MutationGoalMode = "sandbox"

  @property({
    type: String,
    reflect: true,
    attribute: MUTATION_TARGET_PROTEIN_ATTRIBUTE,
  })
  mutationTargetProtein = ""

  get sequenceTabVisible() {
    return this.showSequenceTab || this._isTeacherEditing()
  }

  /** Sequence-tab hints for authors only — never shown in student view. */
  get sequenceTabWarnings(): readonly string[] {
    if (!this._isTeacherEditing()) return []
    if (!this.dnaSequence) return []
    const frame = readingFrameFromTemplate(this.dnaSequence)
    const parts: string[] = []
    if (this.dnaSequence.length % 3 !== 0) {
      parts.push(msg("Sequence length is not divisible by 3."))
    }
    if (frame.codons.length > 0 && !frame.hasStop) {
      parts.push(msg("No stop codon in the sequence."))
    }
    const chain = mutationTargetChain(this.mutationTargetProtein)
    if (
      normalizeMutationGoalMode(this.mutationGoalMode) === "target-protein" &&
      chain.length > 0 &&
      startMatchesMutationGoal({
        mode: "target-protein",
        startDna: this.dnaSequence,
        targetProteinRaw: formatPolypeptide(chain),
      })
    ) {
      parts.push(msg("Sequence already matches the target protein."))
    }
    return parts
  }

  /** Sequence the Mutations tab displays and edits. */
  get mutationsSequence(): string {
    return this.crossPhaseMutations ? this.dnaSequence : this._mutationsWorkingCopy
  }

  @property({ type: Number, reflect: true, attribute: "zoom-level" })
  zoomLevel = 100

  @property({ type: Boolean, attribute: "allow-student-pan" })
  allowStudentPan = true

  @property({
    type: String,
    attribute: MRNA_INPUT_MODE_ATTRIBUTE,
    reflect: true,
    converter: {
      fromAttribute: (value: string | null): MrnaInputMode =>
        normalizeMrnaInputMode(value),
      toAttribute: (value: MrnaInputMode) => value,
    },
  })
  mrnaInputMode: MrnaInputMode = DEFAULT_MRNA_INPUT_MODE

  @property({
    type: String,
    attribute: MRNA_BATCH_VERIFY_MODE_ATTRIBUTE,
    reflect: true,
    converter: {
      fromAttribute: (value: string | null): MrnaBatchVerifyMode =>
        normalizeMrnaBatchVerifyMode(value),
      toAttribute: (value: MrnaBatchVerifyMode) => value,
    },
  })
  mrnaBatchVerifyMode: MrnaBatchVerifyMode = DEFAULT_MRNA_BATCH_VERIFY_MODE

  @property({
    type: String,
    attribute: PHASE_SET_MODE_ATTRIBUTE,
    reflect: true,
    converter: {
      fromAttribute: (value: string | null): PhaseSetMode =>
        normalizePhaseSetMode(value),
      toAttribute: (value: PhaseSetMode) => value,
    },
  })
  phaseSetMode: PhaseSetMode = DEFAULT_PHASE_SET_MODE

  @property({
    type: Boolean,
    reflect: true,
    attribute: "enablereplication",
  })
  enableReplication = true

  @property({
    type: Boolean,
    reflect: true,
    attribute: "enabletranscription",
  })
  enableTranscription = true

  @property({
    type: Boolean,
    reflect: true,
    attribute: "enabletranslation",
  })
  enableTranslation = true

  @property({
    type: Boolean,
    reflect: true,
    attribute: "enablemutations",
  })
  enableMutations = true

  private get _phaseFlags(): PhaseEnableFlags {
    return {
      enableReplication: this.enableReplication,
      enableTranscription: this.enableTranscription,
      enableTranslation: this.enableTranslation,
      enableMutations: this.enableMutations,
    }
  }

  get visiblePhases(): readonly SimulationPhase[] {
    return resolveVisiblePhases(
      normalizePhaseSetMode(this.phaseSetMode),
      this._phaseFlags,
    )
  }

  get lockedPhases(): readonly SimulationPhase[] {
    if (!this.canonicalPhaseOrder) return []
    const visible = this.visiblePhases
    return visible.filter(
      (phase) =>
        !canSelectVisiblePhase(
          phase,
          this.currentPhase,
          visible,
          {has: (p) => this._phaseCompletion.hasCompleted(p)},
          true,
        ),
    )
  }

  @state() private animationStep = 0
  @state() private _dropErrorMessage = ""
  @state() private _mutationFeedback: MutationCheckResult | null = null
  @state() private _mutationSteps: MutationStep[] = []
  @state() private _snappedHelicase = false
  @state() private _helicaseExiting = false
  @state() private _polymeraseExiting = false
  private _polymeraseAwaitingSettle = false
  /** Waiting for the fork base-pair split transition before playing exit. */
  private _helicaseAwaitingSplitSettle = false
  @state() private _hintOpen = false
  @state() private _codonWheelOpen = false
  /** True while the drawer is playing its slide-out/fade-out exit — kept
   * expanded (and its content mounted) until the animation finishes. */
  @state() private _codonDrawerClosing = false
  @state() private _codonTab: CodonDrawerTab = "wheel"

  private _lastHintText: string | null = null
  private _errorAlertOnDismiss: (() => void) | null = null
  private _codonDrawerCloseTimer: ReturnType<typeof setTimeout> | null = null
  private _timer: ReturnType<typeof setInterval> | null = null
  private _layoutObserver: ResizeObserver | null = null
  private _observedNavbar: Element | null = null

  private _workspace = new WorkspaceController(this, {
    getZoomLevel: () => this.zoomLevel,
    setZoomLevel: (z) => { this.zoomLevel = z },
    getPanEnabled: () => this.allowStudentPan || this.hasAttribute("contenteditable"),
    onViewportClick: (e) => this._onMutationsViewportClick(e),
    onUserPanZoom: () => this._mutations.dismiss(),
  })

  private _navbar = new NavbarController(this)

  private _transcription = new TranscriptionController(this)

  private _translation = new TranslationController(this)

  private _mutations = new MutationsController(this)

  private _moleculeDrag = new MoleculeDragController(this)

  private _phaseCompletion = new PhaseCompletionController(this)

  private _reset = new ResetController(this)

  /** Lesson DNA as last set by the teacher (sequence tab / options). */
  private _lessonDnaSnapshot = DEFAULT_DNA_SEQUENCE
  /** Isolated Mutations-tab copy when cross-phase mutations are off. */
  private _mutationsWorkingCopy = DEFAULT_DNA_SEQUENCE

  /** Toolkit chip order — shuffled once when the widget instance is created. */
  private _baukastenOrder = createBaukastenOrder()

  connectedCallback() {
    super.connectedCallback()
    this.showInfoCards = readShowInfoCards(this)
    this.showSequenceTab = readShowSequenceTab(this)
    this.crossPhaseMutations = readCrossPhaseMutations(this)
    this.markCodons = readMarkCodons(this)
    this.markStopCodons = readMarkStopCodons(this)
    this.canonicalPhaseOrder = readCanonicalPhaseOrder(this)
    for (const name of LEGACY_MUTATION_TARGET_DNA_ATTRIBUTES) {
      this.removeAttribute(name)
    }
    const goalMode = readMutationGoalModeAttr(this)
    if (goalMode) this.mutationGoalMode = goalMode
    const targetProtein = readMutationTargetProtein(this)
    if (targetProtein !== undefined) this._setMutationTargetProtein(targetProtein)
    const dna = readPersistedDnaSequence(this)
    if (dna !== undefined) this.dnaSequence = dna
    this._lessonDnaSnapshot = this.dnaSequence
    this._mutationsWorkingCopy = this.dnaSequence
    const mrnaMode = readMrnaInputModeAttr(this)
    if (mrnaMode) this.mrnaInputMode = mrnaMode
    const batchVerify = readMrnaBatchVerifyModeAttr(this)
    if (batchVerify) this.mrnaBatchVerifyMode = batchVerify
    const phaseMode = readPhaseSetModeAttr(this)
    if (phaseMode) this.phaseSetMode = phaseMode
    this._hydratePhaseFlagsFromDom()
    this.addEventListener("selectstart", this._onSelectStart, true)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.removeEventListener("selectstart", this._onSelectStart, true)
    this._stopTimer()
    this._cancelHelicaseExit()
    this._cancelPolymeraseExit()
    this._layoutObserver?.disconnect()
    this._layoutObserver = null
    this._observedNavbar = null
    if (this._codonDrawerCloseTimer) {
      clearTimeout(this._codonDrawerCloseTimer)
      this._codonDrawerCloseTimer = null
    }
  }

  attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value)
    if (name === "contenteditable") this.requestUpdate()
  }

  protected firstUpdated(changed: PropertyValues<this>) {
    super.firstUpdated(changed)
    this._syncAnimSpeedCss()
    this._ensureCurrentPhaseEnabled()
    this._ensureLayoutObserver()
    this._syncCanvasRowHeight()
  }

  protected willUpdate(changed: PropertyValues<this>) {
    this._transcription.syncInputModeFromDom(changed.has("mrnaInputMode"))
    this._transcription.syncBatchVerifyModeFromDom(changed.has("mrnaBatchVerifyMode"))
    if (
      this.hasUpdated &&
      changed.has("phaseSetMode") &&
      normalizePhaseSetMode(this.phaseSetMode) === "custom" &&
      changed.get("phaseSetMode") !== "custom"
    ) {
      this._setAllPhaseFlags(true)
    }
    if (
      normalizePhaseSetMode(this.phaseSetMode) === "custom" &&
      !PHASE_ENABLE_KEYS.some((key) => this[key])
    ) {
      const lastOn = PHASE_ENABLE_KEYS.find((key) => changed.get(key) === true)
      this._setPhaseFlag(lastOn ?? "enableReplication", true)
    }
    if (
      changed.has("phaseSetMode") ||
      PHASE_ENABLE_KEYS.some((key) => changed.has(key))
    ) {
      this._ensureCurrentPhaseEnabled()
    }
    this._syncAnimSpeedCss()
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed)
    if (changed.has("showSequenceTab")) {
      writeShowSequenceTab(this, this.showSequenceTab)
    }
    if (changed.has("mrnaInputMode")) {
      this._transcription.syncInputModeFromDom(true)
    }
    if (changed.has("mrnaBatchVerifyMode")) {
      this._transcription.syncBatchVerifyModeFromDom(true)
    }
    if (changed.has("phaseSetMode")) {
      writePhaseSetMode(this, normalizePhaseSetMode(this.phaseSetMode))
    }
    if (PHASE_ENABLE_KEYS.some((key) => changed.has(key))) {
      for (const key of PHASE_ENABLE_KEYS) writePhaseEnableFlag(this, key, this[key])
    }
    if (
      changed.has("phaseSetMode") ||
      PHASE_ENABLE_KEYS.some((key) => changed.has(key))
    ) {
      this._ensureCurrentPhaseEnabled()
    }
    if (changed.has("animationSpeed")) {
      const next = normalizeAnimationSpeed(this.animationSpeed)
      if (next !== this.animationSpeed) this.animationSpeed = next
      else {
        this._syncAnimSpeedCss()
        if (this._timer) this._startTimer()
      }
    }
    if (changed.has("showInfoCards")) {
      if (!this.showInfoCards) this._hintOpen = false
      writeShowInfoCards(this, this.showInfoCards)
    }
    if (changed.has("crossPhaseMutations")) {
      writeCrossPhaseMutations(this, this.crossPhaseMutations)
    }
    if (changed.has("markCodons")) {
      writeMarkCodons(this, this.markCodons)
    }
    if (changed.has("markStopCodons")) {
      writeMarkStopCodons(this, this.markStopCodons)
    }
    if (changed.has("canonicalPhaseOrder")) {
      writeCanonicalPhaseOrder(this, this.canonicalPhaseOrder)
    }
    if (changed.has("mutationGoalMode")) {
      const next = normalizeMutationGoalMode(this.mutationGoalMode)
      if (next !== this.mutationGoalMode) this.mutationGoalMode = next
      else writeMutationGoalMode(this, next)
    }
    if (changed.has("mutationTargetProtein")) {
      writeMutationTargetProtein(this, this.mutationTargetProtein)
    }
    this._syncHintExpansion()
    this._navbar.syncView(this.renderRoot)
    const codonCard = this.renderRoot.querySelector("dna-codon-card")
    if (codonCard instanceof DnaCodonCard) {
      codonCard.tab = this.currentPhase === "Mutations" ? "list" : this._codonTab
      codonCard.allowDrag = this.currentPhase === "Translation"
      codonCard.pickable = this.mutationTeacherEditing
      codonCard.requestUpdate()
    }

    this._ensureLayoutObserver()
    this._syncCanvasRowHeight()
    this._checkDerivedPhaseCompletion()
    this._repositionMutationMenu()
  }

  private _checkDerivedPhaseCompletion() {
    this._maybeStartPolymeraseExit()
  }

  /**
   * Pin canvas under the navbar: set --dna-navbar-height from the real
   * navbar box (tabs + child nav + optional extra bar).
   * Canvas uses top/bottom absolute pinning, so it cannot outgrow `.sim-shell`.
   */
  private _syncCanvasRowHeight() {
    const navbar = this.renderRoot.querySelector("dna-simulation-navbar") as HTMLElement | null
    const next = `${navbar?.offsetHeight ?? 0}px`
    if (this.style.getPropertyValue("--dna-navbar-height") === next) return
    this.style.setProperty("--dna-navbar-height", next)
    this._workspace.refresh()
  }

  private _ensureLayoutObserver() {
    if (!this._layoutObserver) {
      this._layoutObserver = new ResizeObserver(() => this._syncCanvasRowHeight())
      this._layoutObserver.observe(this)
    }
    const navbar = this.renderRoot.querySelector("dna-simulation-navbar")
    if (navbar && navbar !== this._observedNavbar) {
      if (this._observedNavbar) this._layoutObserver.unobserve(this._observedNavbar)
      this._layoutObserver.observe(navbar)
      this._observedNavbar = navbar
    }
  }

  private _syncHintExpansion() {
    const text = this._getPhaseHintText()
    if (text === this._lastHintText) return
    this._hintOpen = false
    this._lastHintText = text
  }

  private _hintAlert(): DnaCanvasAlert | null {
    return this.renderRoot.querySelector("dna-canvas-alert[data-hint]")
  }

  private _onHintToggle = () => {
    if (!this.showInfoCards) return
    if (this._hintOpen) {
      this._hintAlert()?.dismiss()
      return
    }
    this._hintOpen = true
    this.requestUpdate()
  }

  private _onInfoAlertDismiss = () => {
    if (!this._hintOpen) return
    this._hintOpen = false
    this.requestUpdate()
  }

  private _showErrorAlert(message: string, onDismiss?: () => void) {
    this._errorAlertOnDismiss = onDismiss ?? null
    this._dropErrorMessage = message
    this.requestUpdate()
  }

  private _onErrorAlertDismiss = () => {
    this._dropErrorMessage = ""
    this._errorAlertOnDismiss?.()
    this._errorAlertOnDismiss = null
    this.requestUpdate()
  }

  private _onPhaseCompleteContinue = () => {
    const nextPhase = this._phaseCompletion.toast?.nextPhase
    this._phaseCompletion.dismiss()
    if (nextPhase) this.setPhase(nextPhase)
  }

  private _onPhaseCompleteDismiss = () => {
    this._phaseCompletion.dismiss()
  }

  private _snapHelicaseAtFork() {
    this._snappedHelicase = true
    this._moleculeDrag.playSlotSnapFade()
    this._startTimer()
  }

  // ── Animation (Replication unzip / Transcription scan) ──────────────────

  private get _animationEnabled(): boolean {
    return this.currentPhase === "Replication" && this.dnaSequence.length > 0
  }

  private get _transcriptionEnabled(): boolean {
    return this.currentPhase === "Transcription" && this.dnaSequence.length > 0
  }

  private get _maxAnimationStep(): number {
    return this.dnaSequence.length
  }

  private _clampAnimationStep() {
    const max = this._maxAnimationStep
    this.animationStep = Math.max(0, Math.min(this.animationStep, max))
    this._transcription.clamp(max)
    this._translation.clamp()
  }

  private _startTimer() {
    this._stopTimer()
    if (this.currentPhase !== "Replication" || !this._snappedHelicase) return
    if (this.animationStep >= this._maxAnimationStep) return
    this._timer = setInterval(() => {
      if (this.animationStep >= this._maxAnimationStep) {
        this._stopTimer()
        this._maybeScheduleHelicaseExit()
        this.requestUpdate()
        return
      }
      this.animationStep++
      if (this.animationStep >= this._maxAnimationStep) {
        this._stopTimer()
        this._maybeScheduleHelicaseExit()
      }
      this.requestUpdate()
    }, this.scaleAnimMs(REPLICATION_STEP_MS))
  }

  private _stopTimer() {
    if (this._timer !== null) {
      clearInterval(this._timer)
      this._timer = null
    }
  }

  private _resetAnimation() {
    this._stopTimer()
    this.animationStep = 0
    this._clearSnappedHelicase()
    this._cancelPolymeraseExit()
    this._transcription.reset()
    this._translation.reset()
    this._moleculeDrag.clear()
    this._phaseCompletion.reset()
    this._codonWheelOpen = false
    this._codonDrawerClosing = false
    if (this._codonDrawerCloseTimer) {
      clearTimeout(this._codonDrawerCloseTimer)
      this._codonDrawerCloseTimer = null
    }
  }

  private _clearSnappedHelicase() {
    this._cancelHelicaseExit()
    this._snappedHelicase = false
    this._moleculeDrag.slotSnapFadeOut = false
    this._moleculeDrag.pointerDrag = null
    this._moleculeDrag.discardGhost = null
  }

  private _cancelHelicaseExit() {
    this._helicaseAwaitingSplitSettle = false
    this._helicaseExiting = false
  }

  private _cancelPolymeraseExit() {
    this._polymeraseAwaitingSettle = false
    this._polymeraseExiting = false
  }

  /**
   * After the last base pair splits, wait for its transform transition, then
   * play the helicase exit and show the replication-complete toast.
   */
  private _maybeScheduleHelicaseExit() {
    if (this.currentPhase !== "Replication") return
    if (!this._snappedHelicase || this._helicaseExiting) return
    if (this._helicaseAwaitingSplitSettle) return
    if (this._maxAnimationStep === 0 || this.animationStep < this._maxAnimationStep) return

    this._helicaseAwaitingSplitSettle = true
    this.requestUpdate()
    void this.updateComplete.then(() => this._observeHelicaseSplitSettle())
  }

  private _observeHelicaseSplitSettle() {
    if (!this._helicaseAwaitingSplitSettle || !this._helicaseExitPreconditionsMet()) {
      this._helicaseAwaitingSplitSettle = false
      return
    }

    const target = this._forkSplitTransitionTarget()
    if (!target) {
      this._beginHelicaseExit()
      return
    }

    // If the split is already settled (no transform this step),
    // no transitionend will fire — detect that and proceed immediately.
    requestAnimationFrame(() => {
      if (!this._helicaseAwaitingSplitSettle) return
      if (!this._forkSplitTransitionRunning(target)) {
        this._beginHelicaseExit()
      }
    })
  }

  private _helicaseExitPreconditionsMet(): boolean {
    return (
      this.currentPhase === "Replication" &&
      this._snappedHelicase &&
      this._maxAnimationStep > 0 &&
      this.animationStep >= this._maxAnimationStep
    )
  }

  /** Top subunit of the fork pair that just finished splitting. */
  private _forkSplitTransitionTarget(): HTMLElement | null {
    const index = this.animationStep - 1
    if (index < 0) return null
    const col = this.renderRoot.querySelector(`[data-bp-index="${index}"]`)
    return col?.querySelector(".bp-top") as HTMLElement | null
  }

  private _forkSplitTransitionRunning(el: Element): boolean {
    return el.getAnimations().some(
      (a) => a instanceof CSSTransition && a.transitionProperty === "transform",
    )
  }

  private _onReplicationSplitTransitionEnd = (e: TransitionEvent) => {
    if (!this._helicaseAwaitingSplitSettle) return
    if (e.propertyName !== "transform") return
    if (e.target !== e.currentTarget) return

    const col = (e.currentTarget as HTMLElement).closest("[data-bp-index]")
    const index = col ? Number(col.getAttribute("data-bp-index")) : -1
    if (index !== this.animationStep - 1) return
    if (!this._helicaseExitPreconditionsMet()) return

    this._beginHelicaseExit()
  }

  private _beginHelicaseExit() {
    if (this._helicaseExiting) return
    if (!this._helicaseExitPreconditionsMet()) {
      this._helicaseAwaitingSplitSettle = false
      return
    }

    this._helicaseAwaitingSplitSettle = false
    this._helicaseExiting = true
    this.requestUpdate()
    void this.updateComplete.then(() => this._observeHelicaseExit())
  }

  private _observeHelicaseExit() {
    if (!this._helicaseExiting) return

    const el = this.renderRoot.querySelector(".molecule-snapped.is-molecule-exit")
    if (!el) {
      this._finishHelicaseExit()
      return
    }

    requestAnimationFrame(() => {
      if (!this._helicaseExiting) return
      const running = el.getAnimations().some(
        (a) => a instanceof CSSAnimation && a.animationName.includes("molecule-exit-up-right"),
      )
      if (!running) this._finishHelicaseExit()
    })
  }

  private _onSnappedMoleculeAnimationEnd = (e: AnimationEvent) => {
    if (e.target !== e.currentTarget) return
    if (!e.animationName.includes("molecule-exit-up-right")) return
    if (this._helicaseExiting) {
      this._finishHelicaseExit()
      return
    }
    if (this._polymeraseExiting) {
      this._finishPolymeraseExit()
    }
  }

  private _finishHelicaseExit() {
    if (!this._helicaseExiting) return
    this._helicaseExiting = false
    this._helicaseAwaitingSplitSettle = false
    this._snappedHelicase = false
    this.requestUpdate()
    this._notifyPhaseComplete("Replication")
  }

  private _maybeStartPolymeraseExit() {
    if (this.currentPhase !== "Transcription") return
    if (!this._transcription.snappedPolymerase) return
    if (!this._transcription.isComplete) return
    if (this._transcription.stepAnimActive() || this._transcription.batchVerifyRunning) return
    if (this._polymeraseExiting || this._polymeraseAwaitingSettle) return

    this._polymeraseAwaitingSettle = true
    this.requestUpdate()
    void this.updateComplete.then(() => this._observePolymeraseSettle())
  }

  private _observePolymeraseSettle() {
    if (!this._polymeraseAwaitingSettle) return

    const el = this.renderRoot.querySelector(".molecule-snapped")
    if (!el) {
      this._beginPolymeraseExit()
      return
    }

    requestAnimationFrame(() => {
      if (!this._polymeraseAwaitingSettle) return
      const moving = el.getAnimations().some(
        (a) => a instanceof CSSTransition && (a.transitionProperty === "left" || a.transitionProperty === "top"),
      )
      if (!moving) this._beginPolymeraseExit()
    })
  }

  private _beginPolymeraseExit() {
    if (!this._polymeraseAwaitingSettle || this._polymeraseExiting) return
    if (
      this.currentPhase !== "Transcription" ||
      !this._transcription.snappedPolymerase ||
      !this._transcription.isComplete
    ) {
      this._polymeraseAwaitingSettle = false
      return
    }

    this._polymeraseAwaitingSettle = false
    this._polymeraseExiting = true
    this.requestUpdate()
    void this.updateComplete.then(() => this._observePolymeraseExit())
  }

  private _observePolymeraseExit() {
    if (!this._polymeraseExiting) return

    const el = this.renderRoot.querySelector(".molecule-snapped.is-molecule-exit")
    if (!el) {
      this._finishPolymeraseExit()
      return
    }

    requestAnimationFrame(() => {
      if (!this._polymeraseExiting) return
      const running = el.getAnimations().some(
        (a) => a instanceof CSSAnimation && a.animationName.includes("molecule-exit-up-right"),
      )
      if (!running) this._finishPolymeraseExit()
    })
  }

  private _finishPolymeraseExit() {
    if (!this._polymeraseExiting && !this._polymeraseAwaitingSettle) return
    this._polymeraseAwaitingSettle = false
    this._polymeraseExiting = false
    this._transcription.unsnap()
    this._notifyPhaseComplete("Transcription")
  }

  private _onSnappedMoleculeTransitionEnd = (e: TransitionEvent) => {
    if (!this._polymeraseAwaitingSettle) return
    if (e.target !== e.currentTarget) return
    if (e.propertyName !== "left" && e.propertyName !== "top") return
    this._beginPolymeraseExit()
  }

  // ── NavbarHost (drives components/simulation-navbar) ────────────────────

  get mrnaInput(): NavbarMrnaInput {
    return {
      value: this._transcription.activeInputMode === "batch" ? this._transcription.mrnaDraft : this._transcription.mrnaBuilt,
      busy: this._transcription.stepAnimActive() || this._transcription.batchVerifyRunning,
      isBatchMode: this._transcription.activeInputMode === "batch",
    }
  }

  get showPhaseBar(): boolean {
    return (
      this.currentPhase === "Transcription" &&
      this._transcription.snappedPolymerase &&
      (this._transcription.awaitingRnaBase ||
        this._transcription.stepAnimActive() ||
        this._transcription.batchVerifyRunning ||
        this._transcription.isComplete)
    )
  }

  get baukastenMolecules(): BaukastenMolecule[] {
    return baukastenForPhase(this.currentPhase, this._baukastenOrder)
  }

  get draggingMoleculeId(): string | null {
    return this._moleculeDrag.draggingMolecule?.id ?? null
  }

  private get _showCodonReference(): boolean {
    return this.currentPhase === "Mutations" || this._translation.showCodonCard
  }

  get showMutationVerify(): boolean {
    return this.mutationShowGoal && hasMutationProteinGoal(this.mutationTargetProtein)
  }

  get mutationShowGoal(): boolean {
    return (
      this.currentPhase === "Mutations" &&
      normalizeMutationGoalMode(this.mutationGoalMode) === "target-protein"
    )
  }

  get mutationStepItems() {
    return this._mutationSteps.map((step, stepIndex) => ({
      label: formatMutationStepKindLabel(step),
      stepIndex,
      kind: step.kind,
      from: step.from,
      to: step.to,
    }))
  }

  get mutationTargetChain(): string[] {
    return mutationTargetChain(this.mutationTargetProtein)
  }

  get mutationShowNow(): boolean {
    return this.currentPhase === "Mutations" && this._isTeacherEditing()
  }

  get mutationCurrentChain(): string[] {
    return readingFrameFromTemplate(this.mutationsSequence).polypeptide
  }

  get mutationNowEmptyReason(): "short" | "stop" | "empty" {
    if (this.mutationsSequence.length < 3) return "short"
    const frame = readingFrameFromTemplate(this.mutationsSequence)
    if (frame.stopCodonIndex === 0) return "stop"
    return "empty"
  }

  get mutationTeacherEditing(): boolean {
    return this.mutationShowGoal && this._isTeacherEditing()
  }

  get showToolkitTab(): boolean {
    return this.currentPhase !== "Mutations"
  }

  get showProteinTab(): boolean {
    return this.currentPhase === "Mutations"
  }

  setDnaSequence(value: string) {
    const previousSequence = this.dnaSequence
    const next = sanitizeDnaSequence(value)
    writeDnaSequence(this, next)
    this._lessonDnaSnapshot = next
    this._mutationsWorkingCopy = next
    if (next === previousSequence) {
      this.requestUpdate()
      return
    }
    const prevCodon = this._translation.codonIndex
    this.dnaSequence = next

    const isLengthOnlyEdit =
      this.dnaSequence.length > 0 &&
      (this.dnaSequence.startsWith(previousSequence) || previousSequence.startsWith(this.dnaSequence))

    if (isLengthOnlyEdit) {
      this._clampAnimationStep()
      if (!this._transcription.isComplete) this._phaseCompletion.revoke("Transcription")
      if (!this._translation.complete) this._phaseCompletion.revoke("Translation")
    } else {
      this._resetAnimation()
    }

    this._workspace.resetView(this.defaultZoomForPhase(this.currentPhase))
    this._clearMutationSteps()
    if (
      this.currentPhase === "Translation" &&
      this._translation.snappedRibosome &&
      this._translation.codonIndex !== prevCodon
    ) {
      this.updateComplete.then(() => this._centerOnActiveCodon())
    }
    this.requestUpdate()
  }

  appendDnaBase(base: string) {
    this.appendBase(base)
  }

  setMrnaInput(value: string) {
    this._transcription.handleInput(value)
  }

  clearMrnaInput() {
    this._transcription.clear()
  }

  verifyMrnaInput() {
    this._transcription.verify()
  }

  appendMrnaBase(base: string) {
    this._transcription.appendBase(base)
  }

  startMoleculeDrag(nativeEvent: DragEvent, moleculeId: string) {
    const molecule = moleculeById(moleculeId)
    if (molecule) this._moleculeDrag.onDragStart(nativeEvent, molecule)
  }

  endMoleculeDrag() {
    this._moleculeDrag.onDragEnd()
  }

  // ── ResetHost (drives lib/phases/reset-controller) ───────────────────────

  get codonDrawerOpen(): boolean {
    return this._codonWheelOpen
  }

  requestResetSimulation() {
    this._reset.requestSimulation()
  }

  verifyMutationGoal() {
    if (!this.mutationShowGoal) return
    if (!hasMutationProteinGoal(this.mutationTargetProtein)) return
    const result = evaluateMutationGoal({
      mode: "target-protein",
      startDna: this._lessonDnaSnapshot,
      currentDna: this.mutationsSequence,
      targetProteinRaw: this.mutationTargetProtein,
    })
    this._mutationFeedback = result
    if (result.passed) {
      this._notifyPhaseComplete("Mutations")
      this.requestUpdate()
      return
    }
    this._showErrorAlert(this._mutationCheckMessage(result))
  }

  openCodonDrawer() {
    this._setCodonWheelOpen(true)
  }

  rewindMutationStep(stepIndex: number) {
    if (this.currentPhase !== "Mutations") return
    if (stepIndex < 0 || stepIndex >= this._mutationSteps.length) return
    const kept = this._mutationSteps.slice(0, stepIndex + 1)
    const next = replayMutationSteps(this._lessonDnaSnapshot, kept)
    this._mutationSteps = kept
    this._mutationFeedback = null
    this._applyMutationSequenceEdit(next)
    const last = kept[kept.length - 1]
    if (last) this._mutations.selectAt(last.index)
    this.requestUpdate()
  }

  addMutationTargetAmino(amino: string) {
    if (!this.mutationTeacherEditing) return
    const token = normalizeAminoAcidToken(amino)
    if (!token) return
    const chain = [...mutationTargetChain(this.mutationTargetProtein), token]
    this._setMutationTargetProtein(formatPolypeptide(chain))
  }

  removeMutationTargetAmino(index: number) {
    if (!this.mutationTeacherEditing) return
    const chain = mutationTargetChain(this.mutationTargetProtein).filter((_, i) => i !== index)
    this._setMutationTargetProtein(formatPolypeptide(chain))
  }

  private _clearMutationSteps() {
    if (this._mutationSteps.length === 0) return
    this._mutationSteps = []
  }

  private _pushMutationStep(step: MutationStep) {
    this._mutationSteps = [...this._mutationSteps, step]
  }

  private _setMutationTargetProtein(raw: unknown) {
    const chain = mutationTargetChain(raw)
    this.mutationTargetProtein = formatPolypeptide(chain)
    writeMutationTargetProtein(this, this.mutationTargetProtein)
    this.requestUpdate()
  }

  private _mutationCheckMessage(result: MutationCheckResult): string {
    if (result.reason === "no-target") {
      return msg("No target is set for this task.")
    }
    if (result.reason === "invalid-target") {
      return msg("The target protein is not valid. Use three-letter names such as Met-Leu-Phe.")
    }
    return msg("That is not the target yet.")
  }

  clearAllSimulationState() {
    this._mutations.dismiss()
    this._mutationsWorkingCopy = this.dnaSequence
    this._mutationFeedback = null
    this._clearMutationSteps()
    this._resetAnimation()
  }

  enterFirstVisiblePhaseAfterFullReset() {
    const first = this.visiblePhases[0]
    this._navbar.activeTab = "phasen"
    if (first && first !== this.currentPhase) {
      this.currentPhase = first
    }
    this._mutations.dismiss()
    this._clampAnimationStep()
  }

  resetCanvasView(zoom: number) {
    this._workspace.resetView(zoom)
  }

  /** Public so ResetController can pick the phase default zoom. */
  defaultZoomForPhase(phase: string): number {
    return phase === "Translation" ? 75 : 100
  }

  resetReplicationPhase() {
    this._cancelHelicaseExit()
    this.animationStep = 0
    this._startTimer()
  }

  resetTranscriptionPhase() {
    this._cancelPolymeraseExit()
    if (this._transcription.snappedPolymerase) {
      this._transcription.retryAttempt()
    } else {
      this._transcription.reset()
    }
  }

  resetTranslationPhase() {
    this._translation.reset()
    this._codonWheelOpen = false
    this._codonDrawerClosing = false
    if (this._codonDrawerCloseTimer) {
      clearTimeout(this._codonDrawerCloseTimer)
      this._codonDrawerCloseTimer = null
    }
  }

  resetMutationsPhase() {
    this._mutations.dismiss()
    this._mutationFeedback = null
    this._clearMutationSteps()
    if (this.crossPhaseMutations) {
      this._applyDnaSequenceEdit(this._lessonDnaSnapshot)
      this._mutationsWorkingCopy = this._lessonDnaSnapshot
      return
    }
    this._mutationsWorkingCopy = this.dnaSequence
    this.requestUpdate()
  }

  clearPhaseCompletionNotified(phase: string) {
    this._phaseCompletion.clearNotified(phase)
  }

  // ── TranscriptionHost (drives lib/phases/transcription-controller) ──────

  showErrorAlert(message: string) {
    this._showErrorAlert(message)
  }

  /** TranscriptionHost: wait for render, then ask the navbar to focus its mRNA field. */
  focusMrnaInput() {
    void this.updateComplete.then(() => {
      const navbar = this.renderRoot.querySelector("dna-simulation-navbar")
      if (navbar instanceof DnaSimulationNavbar) navbar.focusMrnaInput()
    })
  }

  playSlotSnapFade() {
    this._moleculeDrag.playSlotSnapFade()
  }

  onTranscriptionCompleteReady() {
    this._maybeStartPolymeraseExit()
  }

  focusActiveCodon() {
    this.updateComplete.then(() => this._centerOnActiveCodon())
  }

  onStopCodonReached() {
    this._translation.releaseTrnasAtStop()
  }

  onRibosomeFillComplete() {
    this._translation.beginRibosomeSplit()
  }

  focusPolypeptide() {
    this.updateComplete.then(() => this._centerOnPolypeptide())
  }

  onTranslationComplete() {
    if (this._translation.endedWithoutStop) {
      const enabled = this.visiblePhases
      const i = enabled.indexOf("Translation")
      const next = i >= 0 ? enabled[i + 1] ?? null : enabled[0] ?? null
      const runoff = msg("The sequence ended without a stop codon.")
      if (!next) {
        this._phaseCompletion.notify("Translation", "", msg(str`${runoff} Lesson complete`))
        return
      }
      this._phaseCompletion.notify(
        "Translation",
        next,
        msg(str`${runoff} Continue to ${localizedPhaseLabel(next)}?`),
      )
      return
    }
    this._notifyPhaseComplete("Translation")
  }

  scaleAnimMs(ms: number): number {
    return scaledDurationMs(ms, this.animationSpeed)
  }

  private _syncAnimSpeedCss() {
    this.style.setProperty("--dna-anim-speed", String(normalizeAnimationSpeed(this.animationSpeed)))
  }

  private _notifyPhaseComplete(phase: string) {
    const enabled = this.visiblePhases
    const i = enabled.indexOf(phase as SimulationPhase)
    const next = i >= 0 ? enabled[i + 1] ?? null : enabled[0] ?? null
    this._phaseCompletion.notify(phase, next ?? "", this._phaseCompleteMessage(phase, next))
  }

  private _phaseCompleteMessage(phase: string, next: string | null): string {
    return localizedPhaseCompleteMessage(
      phase,
      next,
      phase === "Mutations" ? this._mutationSteps.length : undefined,
    )
  }

  /** Cross-phase DNA edits must not keep Transcription/Translation marked as complete. */
  private _invalidateTranscriptionAndTranslationCompletion() {
    this._phaseCompletion.revoke("Transcription")
    this._phaseCompletion.revoke("Translation")
    this._cancelPolymeraseExit()
    this._transcription.reset()
    this._translation.reset()
    // Mutations uses the same codon drawer as the amino-acid list; keep it
    // open so applying a substitution/insertion/deletion does not force a reopen.
    if (this.currentPhase === "Mutations") return
    this._codonWheelOpen = false
    this._codonDrawerClosing = false
    if (this._codonDrawerCloseTimer) {
      clearTimeout(this._codonDrawerCloseTimer)
      this._codonDrawerCloseTimer = null
    }
  }

  private _onSelectStart = (event: Event) => {
    const path = event.composedPath()
    for (const node of path) {
      if (!node || typeof node !== "object") continue
      const tag = String((node as {tagName?: string}).tagName ?? "").toLowerCase()
      if (tag === "input" || tag === "textarea" || tag === "sl-input" || tag === "sl-textarea") return
    }
    event.preventDefault()
  }

  private _parseSelect(event: Event): string {
    const target = (event.currentTarget ?? event.target) as {value?: unknown} | null
    const value = target?.value
    if (Array.isArray(value)) return String(value[0] ?? "")
    return String(value ?? "")
  }

  private _parseSwitch(event: Event): boolean {
    const target = (event.currentTarget ?? event.target) as {checked?: boolean} | null
    return Boolean(target?.checked)
  }

  private _parseRange(event: Event): number {
    const target = (event.currentTarget ?? event.target) as {value?: string | number} | null
    const raw = target?.value
    if (raw === undefined || raw === "") return this.animationSpeed
    if (typeof raw === "number") return raw
    return Number(String(raw).trim().replace(",", "."))
  }

  private getTeacherOptionsContext() {
    return {
      phaseSetMode: this.phaseSetMode,
      enableReplication: this.enableReplication,
      enableTranscription: this.enableTranscription,
      enableTranslation: this.enableTranslation,
      enableMutations: this.enableMutations,
      canonicalPhaseOrder: this.canonicalPhaseOrder,
      mrnaInputMode: this.mrnaInputMode,
      mrnaBatchVerifyMode: this.mrnaBatchVerifyMode,
      mutationGoalMode: this.mutationGoalMode,
      crossPhaseMutations: this.crossPhaseMutations,
      showInfoCards: this.showInfoCards,
      showSequenceTab: this.showSequenceTab,
      markCodons: this.markCodons,
      markStopCodons: this.markStopCodons,
      animationSpeed: this.animationSpeed,
      onPhaseSetMode: (event: Event) => {
        this._setPhaseSetMode(normalizePhaseSetMode(this._parseSelect(event)))
      },
      onPhaseFlag: (key: (typeof PHASE_ENABLE_KEYS)[number], event: Event) => {
        this._setPhaseFlag(key, this._parseSwitch(event))
      },
      onCanonicalPhaseOrder: (event: Event) => {
        this._setCanonicalPhaseOrder(this._parseSwitch(event))
      },
      onMrnaInputMode: (event: Event) => {
        const value = normalizeMrnaInputMode(this._parseSelect(event))
        this.mrnaInputMode = value
        writeMrnaInputMode(this, value)
        this._transcription.syncInputModeFromDom(true)
      },
      onMrnaBatchVerifyMode: (event: Event) => {
        const value = normalizeMrnaBatchVerifyMode(this._parseSelect(event))
        this.mrnaBatchVerifyMode = value
        writeMrnaBatchVerifyMode(this, value)
        this._transcription.syncBatchVerifyModeFromDom(true)
      },
      onMutationGoalMode: (event: Event) => {
        this.mutationGoalMode = normalizeMutationGoalMode(this._parseSelect(event))
        writeMutationGoalMode(this, this.mutationGoalMode)
      },
      onCrossPhaseMutations: (event: Event) => {
        this._setCrossPhaseMutations(this._parseSwitch(event))
      },
      onShowInfoCards: (event: Event) => {
        this._setShowInfoCards(this._parseSwitch(event))
      },
      onShowSequenceTab: (event: Event) => {
        this._setShowSequenceTab(this._parseSwitch(event))
      },
      onMarkCodons: (event: Event) => {
        this._setMarkCodons(this._parseSwitch(event))
      },
      onMarkStopCodons: (event: Event) => {
        this._setMarkStopCodons(this._parseSwitch(event))
      },
      onAnimationSpeed: (event: Event) => {
        const parsed = this._parseRange(event)
        if (!Number.isFinite(parsed)) {
          this.requestUpdate()
          return
        }
        this.animationSpeed = normalizeAnimationSpeed(parsed)
        this.requestUpdate()
      },
    }
  }

  private _setPhaseSetMode(mode: PhaseSetMode) {
    const next = normalizePhaseSetMode(mode)
    const enteringCustom =
      next === "custom" && normalizePhaseSetMode(this.phaseSetMode) !== "custom"
    this.phaseSetMode = next
    writePhaseSetMode(this, next)
    if (enteringCustom) this._setAllPhaseFlags(true)
    else {
      this._ensureCurrentPhaseEnabled()
      this._syncPhaseChrome()
    }
  }

  private _setShowInfoCards(on: boolean) {
    if (this.showInfoCards === on) {
      writeShowInfoCards(this, on)
      if (!on) this._hintOpen = false
      this.requestUpdate()
      return
    }
    this.showInfoCards = on
    if (!on) this._hintOpen = false
    writeShowInfoCards(this, on)
    this.requestUpdate()
  }

  private _setShowSequenceTab(on: boolean) {
    if (this.showSequenceTab === on) {
      writeShowSequenceTab(this, on)
      this.requestUpdate()
      return
    }
    this.showSequenceTab = on
    writeShowSequenceTab(this, on)
    this.requestUpdate()
  }

  private _setCrossPhaseMutations(on: boolean) {
    if (this.crossPhaseMutations === on) {
      writeCrossPhaseMutations(this, on)
      this.requestUpdate()
      return
    }
    if (on) {
      if (this._mutationsWorkingCopy !== this.dnaSequence) {
        this._applyDnaSequenceEdit(this._mutationsWorkingCopy)
      }
    } else {
      this._mutationsWorkingCopy = this.dnaSequence
    }
    this.crossPhaseMutations = on
    writeCrossPhaseMutations(this, on)
    this.requestUpdate()
  }

  private _setMarkCodons(on: boolean) {
    if (this.markCodons === on) {
      writeMarkCodons(this, on)
      this.requestUpdate()
      return
    }
    this.markCodons = on
    writeMarkCodons(this, on)
    this.requestUpdate()
  }

  private _setMarkStopCodons(on: boolean) {
    if (this.markStopCodons === on) {
      writeMarkStopCodons(this, on)
      this.requestUpdate()
      return
    }
    this.markStopCodons = on
    writeMarkStopCodons(this, on)
    this.requestUpdate()
  }

  private _setCanonicalPhaseOrder(on: boolean) {
    if (this.canonicalPhaseOrder === on) {
      writeCanonicalPhaseOrder(this, on)
      this.requestUpdate()
      return
    }
    this.canonicalPhaseOrder = on
    writeCanonicalPhaseOrder(this, on)
    this.requestUpdate()
  }

  private _isTeacherEditing(): boolean {
    const editable = this.contentEditable
    return (
      this.hasAttribute("contenteditable") ||
      editable === "true" ||
      editable === ""
    )
  }

  private _setAllPhaseFlags(on: boolean) {
    const flags = on ? ALL_PHASES_ENABLED : {
      enableReplication: false,
      enableTranscription: false,
      enableTranslation: false,
      enableMutations: false,
    }
    this.enableReplication = flags.enableReplication
    this.enableTranscription = flags.enableTranscription
    this.enableTranslation = flags.enableTranslation
    this.enableMutations = flags.enableMutations
    for (const key of PHASE_ENABLE_KEYS) this._mirrorEnableAttribute(key, flags[key])
    this._ensureCurrentPhaseEnabled()
    this._syncPhaseChrome()
  }

  private _setPhaseFlag(key: (typeof PHASE_ENABLE_KEYS)[number], on: boolean) {
    if (!on) {
      const othersOn = PHASE_ENABLE_KEYS.some((k) => k !== key && this[k])
      if (!othersOn) {
        this._writeEnableFlag(key, true)
        this._mirrorEnableAttribute(key, true)
        this._syncPhaseChrome()
        return
      }
    }
    this._writeEnableFlag(key, on)
    this._mirrorEnableAttribute(key, on)
    this._ensureCurrentPhaseEnabled()
    this._syncPhaseChrome()
  }

  /** Phase buttons live on the navbar; always push them even if Lit skips a Boolean. */
  private _syncPhaseChrome() {
    this.requestUpdate()
    if (this.hasUpdated) this._navbar.syncView(this.renderRoot)
  }

  private _writeEnableFlag(key: (typeof PHASE_ENABLE_KEYS)[number], on: boolean) {
    switch (key) {
      case "enableReplication":
        this.enableReplication = on
        break
      case "enableTranscription":
        this.enableTranscription = on
        break
      case "enableTranslation":
        this.enableTranslation = on
        break
      case "enableMutations":
        this.enableMutations = on
        break
    }
  }

  private _mirrorEnableAttribute(key: (typeof PHASE_ENABLE_KEYS)[number], on: boolean) {
    writePhaseEnableFlag(this, key, on)
  }

  private _hydratePhaseFlagsFromDom() {
    for (const key of PHASE_ENABLE_KEYS) {
      const value = readPhaseEnableFlag(this, key)
      if (value !== undefined) this[key] = value
    }
    if (normalizePhaseSetMode(this.phaseSetMode) !== "custom") return
    if (!PHASE_ENABLE_KEYS.some((key) => this[key])) {
      this._writeEnableFlag("enableReplication", true)
    }
    for (const key of PHASE_ENABLE_KEYS) this._mirrorEnableAttribute(key, this[key])
  }

  private _ensureCurrentPhaseEnabled() {
    const enabled = this.visiblePhases
    if (!enabled.length) return
    if (enabled.includes(this.currentPhase as SimulationPhase)) return
    const fallback = enabled[0]
    this._navbar.activeTab = "phasen"
    this.setPhase(fallback)
    if (this.hasUpdated) this._navbar.syncView(this.renderRoot)
  }

  showWrongAminoAcidAlert() {
    this.showErrorAlert(
      msg("That amino acid does not match the current codon. Check the codon wheel and try again."),
    )
  }

  // ── MoleculeDragHost (drives lib/molecules/molecule-drag-controller) ────

  stopTimer() {
    this._stopTimer()
  }

  setErrorAlertDismiss(onDismiss: () => void) {
    this._errorAlertOnDismiss = onDismiss
  }

  // ── Sequence editing ──────────────────────────────────────────────────────

  setPhase(phase: string) {
    if (phase === this.currentPhase) return
    if (!this.visiblePhases.includes(phase as SimulationPhase)) return
    if (
      !canSelectVisiblePhase(
        phase,
        this.currentPhase,
        this.visiblePhases,
        {has: (p) => this._phaseCompletion.hasCompleted(p)},
        this.canonicalPhaseOrder,
      )
    ) {
      return
    }

    this._stopTimer()
    if (this.currentPhase === "Replication") this._cancelHelicaseExit()
    if (this.currentPhase === "Transcription") this._cancelPolymeraseExit()
    this._moleculeDrag.cancelActiveDrag()
    this._moleculeDrag.dropFeedback = "none"
    this._dropErrorMessage = ""
    this._moleculeDrag.slotSnapFadeOut = false

    this.currentPhase = phase
    this._mutations.dismiss()
    this._clampAnimationStep()
    this._workspace.resetView(this.defaultZoomForPhase(phase))
    this.requestUpdate()
  }

  private _onMutationBaseClick = (
    index: number,
    strand: MutationStrandSide,
    e: MouseEvent,
  ) => {
    e.stopPropagation()
    if (this.currentPhase !== "Mutations") return
    if (index < 0 || index >= this.mutationsSequence.length) return
    this._mutations.openAt(index, strand)
  }

  /** Clear Mutations selection/menu when clicking empty canvas (base clicks stopPropagation). */
  private _onMutationsViewportClick = (_e: MouseEvent) => {
    if (this.currentPhase !== "Mutations") return
    this._mutations.dismiss()
  }

  /** DOM node for the selected base — used as the sl-popup anchor. */
  private _mutationMenuAnchor(): HTMLElement | null {
    const index = this._mutations.selectedIndex
    const strand = this._mutations.selectedStrand
    if (index === null || strand === null) return null
    const col = this.renderRoot.querySelector(`.bp-col[data-bp-index="${index}"]`)
    if (!(col instanceof HTMLElement)) return null
    const base = col.querySelector(strand === "template" ? ".bp-top" : ".bp-bottom")
    return base instanceof HTMLElement ? base : null
  }

  private _repositionMutationMenu() {
    if (!this._mutations.menuOpen) return
    const popup = this.renderRoot.querySelector("sl-popup.mutation-menu-popup")
    if (!(popup instanceof SlPopup)) return
    const anchor = this._mutationMenuAnchor()
    const area = this.renderRoot.querySelector(".canvas-area")
    popup.anchor = anchor ?? ""
    if (area instanceof HTMLElement) {
      popup.flipBoundary = area
      popup.shiftBoundary = area
    }
    // After flyout open/close the panel size changes — refresh Floating UI.
    requestAnimationFrame(() => popup.reposition())
  }

  private _onMutationPopupReposition = (e: Event) => {
    const popup = e.currentTarget
    if (!(popup instanceof HTMLElement)) return
    const placement = popup.getAttribute("data-current-placement") ?? "right-start"
    const prevSide = this._mutations.menuSide
    this._mutations.setMenuSideFromPlacement(placement)
    // Layout flipped (submenu now opens the other way) — remeasure once.
    if (prevSide !== this._mutations.menuSide && popup instanceof SlPopup) {
      requestAnimationFrame(() => popup.reposition())
    }
  }

  private _onMutationAction = (action: {
    type: "substitute" | "insert" | "delete"
    base?: DnaBase
  }) => {
    const index = this._mutations.selectedIndex
    const strand = this._mutations.selectedStrand ?? "template"
    if (index === null) return
    if (action.type === "substitute" && action.base) {
      const templateBase = templateBaseForStrandEdit(action.base, strand)
      if (templateBase) this.substituteBase(index, templateBase)
    } else if (action.type === "insert" && action.base) {
      const templateBase = templateBaseForStrandEdit(action.base, strand)
      if (templateBase) this.insertBase(index, templateBase)
    } else if (action.type === "delete") {
      this.deleteBase(index)
    }
    this._mutations.dismiss()
  }

  private _renderMutationMenu() {
    if (this.currentPhase !== "Mutations" || !this._mutations.menuOpen) return null

    // Icons / options match the clicked strand (bottom click → bottom base).
    const current = (this._mutations.displayBase ?? "A").toUpperCase() as DnaBase
    const currentIcon = MUTATION_DNA_ICON[current] ?? MUTATION_DNA_ICON.A
    const flyout = this._mutations.flyout
    const menuSide = this._mutations.menuSide
    const flyoutLeft = menuSide === "left"
    const anchor = this._mutationMenuAnchor()
    const area = this.renderRoot.querySelector(".canvas-area")
    const chevron = flyoutLeft ? "‹" : "›"

    return html`
      <sl-popup
        class="mutation-menu-popup"
        .anchor=${anchor ?? ""}
        .active=${anchor !== null}
        placement="right-start"
        strategy="fixed"
        distance="4"
        flip
        shift
        flip-fallback-placements="left-start left"
        .flipPadding=${8}
        .shiftPadding=${8}
        .flipBoundary=${area instanceof HTMLElement ? area : undefined}
        .shiftBoundary=${area instanceof HTMLElement ? area : undefined}
        @sl-reposition=${this._onMutationPopupReposition}>
        <div
          class="mutation-menu ${flyoutLeft ? "is-flyout-left" : ""}"
          @pointerdown=${(e: Event) => e.stopPropagation()}
          @click=${(e: Event) => e.stopPropagation()}>
          <div class="mutation-menu-primary" role="menu">
            <button
              type="button"
              class="mutation-menu-item ${flyout === "substitution" ? "is-active" : ""}"
              role="menuitem"
              aria-haspopup="true"
              aria-expanded="${flyout === "substitution"}"
              @click=${() => this._mutations.toggleFlyout("substitution")}>
              ${flyoutLeft
                ? html`<span class="mutation-menu-chevron" aria-hidden="true">${chevron}</span><span>${msg("Substitution")}</span>`
                : html`<span>${msg("Substitution")}</span><span class="mutation-menu-chevron" aria-hidden="true">${chevron}</span>`}
            </button>
            <button
              type="button"
              class="mutation-menu-item ${flyout === "insertion" ? "is-active" : ""}"
              role="menuitem"
              aria-haspopup="true"
              aria-expanded="${flyout === "insertion"}"
              @click=${() => this._mutations.toggleFlyout("insertion")}>
              ${flyoutLeft
                ? html`<span class="mutation-menu-chevron" aria-hidden="true">${chevron}</span><span>${msg("Insertion")}</span>`
                : html`<span>${msg("Insertion")}</span><span class="mutation-menu-chevron" aria-hidden="true">${chevron}</span>`}
            </button>
            <button
              type="button"
              class="mutation-menu-item"
              role="menuitem"
              @click=${() => this._onMutationAction({type: "delete"})}>
              <span>${msg("Deletion")}</span>
            </button>
          </div>

          ${flyout === "substitution"
            ? html`
              <div class="mutation-menu-flyout" role="menu">
                ${substitutionTargets(current).map(
                  (base) => html`
                    <button
                      type="button"
                      class="mutation-menu-option"
                      role="menuitem"
                      @click=${() => this._onMutationAction({type: "substitute", base})}>
                      <img class="mutation-menu-base" src="${currentIcon}" alt="${current}" draggable="false"/>
                      <span class="mutation-menu-arrow" aria-hidden="true">→</span>
                      <img class="mutation-menu-base" src="${MUTATION_DNA_ICON[base]}" alt="${base}" draggable="false"/>
                    </button>
                  `,
                )}
              </div>
            `
            : flyout === "insertion"
              ? html`
                <div class="mutation-menu-flyout is-insertion" role="menu">
                  ${DNA_BASE_ORDER.map(
                    (base) => html`
                      <button
                        type="button"
                        class="mutation-menu-option"
                        role="menuitem"
                        @click=${() => this._onMutationAction({type: "insert", base})}>
                        <span>${msg("Insert")}</span>
                        <img class="mutation-menu-base" src="${MUTATION_DNA_ICON[base]}" alt="${base}" draggable="false"/>
                      </button>
                    `,
                  )}
                </div>
              `
            : html`
              <div
                class="mutation-menu-flyout mutation-menu-flyout--spacer"
                aria-hidden="true"></div>
            `}
        </div>
      </sl-popup>
    `
  }

  appendBase(base: string) {
    this.setDnaSequence(this.dnaSequence + base)
  }

  /**
   * Replace the DNA template base at `index` (Mutations phase).
   * No-ops if the index/base is invalid or unchanged.
   */
  substituteBase(index: number, base: string) {
    const seq = this.mutationsSequence
    const next = substituteDnaBase(seq, index, base)
    if (next === null) return
    const from = sanitizeDnaBase(seq[index] ?? "")
    const to = sanitizeDnaBase(base)
    this._pushMutationStep({
      kind: "substitution",
      index,
      ...(from ? {from} : {}),
      ...(to ? {to} : {}),
    })
    this._applyMutationSequenceEdit(next)
  }

  /**
   * Insert a DNA template base before `index` (0 … length inclusive).
   * No-ops if the index/base is invalid.
   */
  insertBase(index: number, base: string) {
    const next = insertDnaBase(this.mutationsSequence, index, base)
    if (next === null) return
    const to = sanitizeDnaBase(base)
    this._pushMutationStep({
      kind: "insertion",
      index,
      ...(to ? {to} : {}),
    })
    this._applyMutationSequenceEdit(next)
  }

  /**
   * Delete the DNA template base at `index`.
   * No-ops if the index is out of range.
   */
  deleteBase(index: number) {
    const seq = this.mutationsSequence
    const next = deleteDnaBase(seq, index)
    if (next === null) return
    const from = sanitizeDnaBase(seq[index] ?? "")
    this._pushMutationStep({
      kind: "deletion",
      index,
      ...(from ? {from} : {}),
    })
    this._applyMutationSequenceEdit(next)
  }

  /** Mutation edits: shared `dnaSequence` or an isolated session copy. */
  private _applyMutationSequenceEdit(next: string) {
    if (this.crossPhaseMutations) {
      this._applyDnaSequenceEdit(next)
      return
    }
    if (next === this._mutationsWorkingCopy) return
    this._mutationsWorkingCopy = next
    this._mutations.clampSelection(next.length)
    this._mutationFeedback = null
    this.requestUpdate()
  }

  /** Shared path for lesson-DNA edits: clamp anim and drop stale tx/tl completion. */
  private _applyDnaSequenceEdit(next: string) {
    if (next === this.dnaSequence) return
    this.dnaSequence = next
    writeDnaSequence(this, next)
    this._mutationsWorkingCopy = next
    this._mutations.clampSelection(next.length)
    this._clampAnimationStep()
    this._invalidateTranscriptionAndTranslationCompletion()
    this._mutationFeedback = null
    this.requestUpdate()
  }

  // ── Biomolekül-Baukasten ─────────────────────────────────────────────────

  private _snappedEnzymeId(): string | null {
    if (this.currentPhase === "Replication" && this._snappedHelicase) return "helicase"
    if (this.currentPhase === "Transcription" && this._transcription.snappedPolymerase) return "rna-polymerase"
    if (this.currentPhase === "Translation" && this._translation.snappedRibosome) return "ribosome"
    return null
  }

  private _enzymeSlotOccupied(): boolean {
    if (this.currentPhase === "Replication") return this._snappedHelicase
    if (this.currentPhase === "Transcription") return this._transcription.snappedPolymerase
    if (this.currentPhase === "Translation") return this._translation.snappedRibosome
    return false
  }

  private _canRemoveSnappedEnzyme(): boolean {
    if (this.currentPhase === "Replication") {
      return canRemoveHelicaseFromFork(this._snappedHelicase, this.animationStep) && !this._helicaseExiting
    }
    if (this.currentPhase === "Transcription") {
      return (
        canRemovePolymeraseFromFork(
          this._transcription.snappedPolymerase,
          this._transcription.transcriptionStep,
        ) && !this._polymeraseExiting
      )
    }
    if (this.currentPhase === "Translation") {
      return (
        canRemoveRibosomeFromCodon(this._translation.snappedRibosome, this._translation.codonIndex) &&
        this._translation.polypeptide.length === 0 &&
        !this._translation.complete
      )
    }
    return false
  }

  private _onSnappedPointerDown = (e: PointerEvent) => {
    if (!this._canRemoveSnappedEnzyme() || e.button !== 0) return

    const enzymeId = this._snappedEnzymeId()
    const molecule = enzymeId ? moleculeById(enzymeId) : undefined
    if (!molecule) return

    if (this.currentPhase === "Replication") {
      this._snappedHelicase = false
    } else if (this.currentPhase === "Transcription") {
      this._transcription.unsnap()
    } else if (this.currentPhase === "Translation") {
      this._translation.unsnap()
      this._setCodonWheelOpen(false)
    }

    this._moleculeDrag.beginPointerRemove(e, molecule, () => {
      if (molecule.id === "helicase") {
        this._snapHelicaseAtFork()
      } else if (molecule.id === "rna-polymerase") {
        this._transcription.snap()
      } else if (molecule.id === "ribosome") {
        this._translation.snap()
        this._openCodonDrawerForRibosome()
      }
    })
  }

  private _expectedEnzymeId(): string | null {
    if (this.currentPhase === "Replication") {
      return expectedMoleculeId(
        this.currentPhase,
        this.dnaSequence.length,
        this.animationStep,
        this._snappedHelicase,
      )
    }
    if (
      this.currentPhase === "Transcription" &&
      canPlacePolymeraseAtFork(
        this.currentPhase,
        this.dnaSequence.length,
        this._transcription.transcriptionStep,
        this._transcription.snappedPolymerase,
      )
    ) {
      return "rna-polymerase"
    }
    if (
      this.currentPhase === "Translation" &&
      canPlaceRibosomeAtCodon(
        this.currentPhase,
        this.dnaSequence.length,
        this._translation.codonIndex,
        this._translation.snappedRibosome,
      )
    ) {
      return "ribosome"
    }
    return null
  }

  private _onSlotDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedId = this._moleculeDrag.takeDraggedMoleculeId(e)

    if (!droppedId || this._enzymeSlotOccupied()) {
      this.requestUpdate()
      return
    }

    const expected = this._expectedEnzymeId()

    if (droppedId === expected && expected === "helicase") {
      this._snapHelicaseAtFork()
      this.requestUpdate()
      return
    }

    if (droppedId === expected && expected === "rna-polymerase") {
      this._transcription.snap()
      this.requestUpdate()
      return
    }

    if (droppedId === expected && expected === "ribosome") {
      this._translation.snap()
      this.requestUpdate()
      this._openCodonDrawerForRibosome()
      return
    }

    this._moleculeDrag.showDropError(
      dropErrorMessage(this.currentPhase, droppedId, expected),
      droppedId,
    )
    this.requestUpdate()
  }

  private _onCodonCardAction = (e: CustomEvent<CodonCardAction>) => {
    if (e.detail.action === "amino-pick") {
      this.addMutationTargetAmino(e.detail.aminoAcid)
      return
    }
    if (this.currentPhase !== "Translation") return
    switch (e.detail.action) {
      case "amino-drag-start":
        this._translation.setAminoDropHover(false)
        break
      case "amino-drag-move":
        this._translation.setAminoDropHover(
          this._hitsLargeSubunit(e.detail.clientX, e.detail.clientY),
        )
        break
      case "amino-drag-end": {
        const {payload, clientX, clientY} = e.detail
        this._translation.setAminoDropHover(false)
        if (!this._hitsLargeSubunit(clientX, clientY)) break

        const result = this._translation.tryPlaceAminoAcid(payload.aminoAcid)
        if (result === "ok" || result === "complete") {
          this.requestUpdate()
        }
        break
      }
    }
  }

  private _hitsLargeSubunit(clientX: number, clientY: number): boolean {
    const zone =
      (this.renderRoot.querySelector(".ribosome-aa-dropzone") as HTMLElement | null) ??
      (this.renderRoot.querySelector(".ribosome-border") as HTMLElement | null)
    if (!zone) return false
    const r = zone.getBoundingClientRect()
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
  }

  private _toggleCodonWheel = (e?: Event) => {
    e?.preventDefault()
    e?.stopPropagation()
    this._setCodonWheelOpen(!this._codonWheelOpen)
  }

  /** Matches the .codon-drawer width transition in dna-simulation.styles.ts. */
  private static readonly DRAWER_TRANSITION_MS = 320
  private static readonly CODON_DRAWER_WIDTH_PX = 400

  /** Open the codon drawer after snapping the ribosome, forcing a recenter even if it was already open. */
  private _openCodonDrawerForRibosome() {
    const alreadyOpen = this._codonWheelOpen && !this._codonDrawerClosing
    this._setCodonWheelOpen(true)
    if (alreadyOpen) {
      this._centerOnActiveCodon()
    }
  }

  private _setCodonWheelOpen(open: boolean) {
    if (this._codonDrawerCloseTimer) {
      clearTimeout(this._codonDrawerCloseTimer)
      this._codonDrawerCloseTimer = null
    }

    if (open) {
      if (this._codonWheelOpen && !this._codonDrawerClosing) return
      this._codonDrawerClosing = false
      this._codonWheelOpen = true
      this.requestUpdate()
      // Pan immediately toward the post-drawer layout so centering runs with the
      // drawer slide instead of waiting for the width transition to finish.
      this.updateComplete.then(() => {
        if (this._translation.snappedRibosome) {
          this._centerOnActiveCodon(WebwriterDnaSimulation.CODON_DRAWER_WIDTH_PX)
        } else {
          this._workspace.refresh()
        }
      })
      return
    }

    if (!this._codonWheelOpen) return
    // Closing: the panel starts collapsing immediately, but keep
    // <dna-codon-card> mounted until it's actually finished shrinking so
    // it doesn't leave the panel visibly narrowing around empty space.
    this._codonWheelOpen = false
    this._codonDrawerClosing = true
    this.requestUpdate()
    this._codonDrawerCloseTimer = setTimeout(() => {
      this._codonDrawerCloseTimer = null
      this._codonDrawerClosing = false
      this.requestUpdate()
      this._workspace.refresh()
    }, WebwriterDnaSimulation.DRAWER_TRANSITION_MS)
  }

  /** Keep the ribosome's current codon in the middle of the visible canvas. */
  private _centerOnActiveCodon(widthInset = 0) {
    this._workspace.centerOnTranslationCodon(this._translation.codonIndex, widthInset)
  }

  private _centerOnPolypeptide(widthInset = 0) {
    if (this._translation.polypeptide.length === 0) return
    this._workspace.centerOnTranslationPolypeptide(widthInset)
  }

  private _setCodonTab(tab: CodonDrawerTab) {
    this._codonTab = tab
    this.requestUpdate()
  }

  private _renderCanvasOverlays() {
    const hint = this._getPhaseHintText()
    const errorOpen = Boolean(
      this._dropErrorMessage && this._moleculeDrag.dropFeedback !== "error",
    )
    const showCodonToggle = this._showCodonReference
    return html`
      ${errorOpen
        ? html`
          <dna-canvas-alert
            variant="error"
            .message=${this._dropErrorMessage}
            .duration=${CANVAS_ERROR_ALERT_MS}
            @dna-canvas-alert-dismiss=${this._onErrorAlertDismiss}>
          </dna-canvas-alert>
        `
        : null}
      ${this._phaseCompletion.toast
        ? html`
          <dna-phase-complete-toast
            .message=${this._phaseCompletion.toast.message}
            .duration=${PHASE_COMPLETE_TOAST_MS}
            .showContinue=${Boolean(this._phaseCompletion.toast.nextPhase)}
            @dna-phase-complete-continue=${this._onPhaseCompleteContinue}
            @dna-phase-complete-dismiss=${this._onPhaseCompleteDismiss}>
          </dna-phase-complete-toast>
        `
        : null}
      ${hint && this.showInfoCards
        ? html`
          <dna-canvas-info-button
            ?active=${this._hintOpen}
            @dna-canvas-info-toggle=${this._onHintToggle}>
          </dna-canvas-info-button>
          ${this._hintOpen
            ? html`
              <dna-canvas-alert
                data-hint
                variant="info"
                .message=${hint}
                .duration=${CANVAS_INFO_ALERT_MS}
                @dna-canvas-alert-dismiss=${this._onInfoAlertDismiss}>
              </dna-canvas-alert>
            `
            : null}
        `
        : null}
      <button
        type="button"
        class="phase-reset-btn ${showCodonToggle ? "has-codon-toggle" : ""}"
        aria-label="${msg("Start over")}"
        title="${msg("Start over")}"
        @click=${() => this._reset.requestPhase()}>
        <sl-icon src="${arrowCounterclockwiseIcon}"></sl-icon>
      </button>
      ${this._renderMutationMenu()}
    `
  }

  private _getPhaseHintText(): string | null {
    if (this.currentPhase === "Replication") {
      if (!this._animationEnabled || this._snappedHelicase) return null
      return msg("Place the correct molecule at the fork to start.")
    }

    if (this.currentPhase === "Transcription") {
      if (!this._transcriptionEnabled) return null
      if (!this._transcription.snappedPolymerase) {
        return msg("Place RNA polymerase at the fork to start.")
      }
      if (this._transcription.awaitingRnaBase) {
        if (this._transcription.activeInputMode === "stepwise") {
          return msg("Enter mRNA above, one base at a time.")
        }
        return this._transcription.activeBatchVerifyMode === "sequential"
          ? msg("Enter the full mRNA above and tap Verify. Bases are checked one by one.")
          : msg("Enter the full mRNA above and tap Verify.")
      }
    }

    if (this.currentPhase === "Translation") {
      if (this.dnaSequence.length < 3) {
        return msg("Add at least 3 bases to the template.")
      }
      if (!this._translation.snappedRibosome) {
        return msg("Place the ribosome on the first codon.")
      }
      if (this._translation.complete) {
        const chain = this._translation.polypeptide.join("-") || "—"
        if (this._translation.endedWithoutStop) {
          return msg(str`Done without stop codon. Protein: ${chain}`)
        }
        return msg(str`Done. Protein: ${chain}`)
      }
      if (this._translation.awaitingMoreSequence) {
        return msg("Add more bases to continue.")
      }
      const expected = this._translation.expectedAminoAcid
      const codon = this._translation.currentCodon ?? "?"
      if (expected) {
        return msg(str`Drag the amino acid for ${codon} onto the ribosome.`)
      }
      return msg("Open the codon wheel and drag the matching amino acid onto the ribosome.")
    }

    if (this.currentPhase === "Mutations") {
      let assignment: string
      if (this.mutationShowGoal) {
        const protein = formatPolypeptide(this.mutationTargetChain)
        if (this._isTeacherEditing() && !protein) {
          assignment = msg("Choose a target protein in the list.")
        } else if (protein) {
          assignment = msg(str`Change the DNA to produce ${protein}. Then tap Verify.`)
        } else {
          assignment = msg("Change the DNA to match the target. Then tap Verify.")
        }
      } else {
        assignment = msg("Tap a base to substitute, insert, or delete.")
      }
      return assignment
    }

    return null
  }

  // ── Main render ───────────────────────────────────────────────────────────

  private _renderPointerDragGhost() {
    if (!this._moleculeDrag.pointerDrag) return null
    const {molecule, canvasX, canvasY} = this._moleculeDrag.pointerDrag
    const size = MOLECULE_DROP_SIZE
    return html`
      <div
        class="molecule-drag-ghost"
        style="left:${canvasX}px; top:${canvasY}px; width:${size}px; height:${size}px">
        <img src="${molecule.icon}" width="${size}" height="${size}" alt="" draggable="false"/>
      </div>
    `
  }

  private _renderDiscardGhost() {
    if (!this._moleculeDrag.discardGhost) return null
    const {icon, x, y} = this._moleculeDrag.discardGhost
    const size = MOLECULE_DROP_SIZE
    return html`
      <div
        class="molecule-discard-ghost"
        style="left:${x}px; top:${y}px; width:${size}px; height:${size}px"
        @animationend="${this._moleculeDrag.onDiscardGhostAnimationEnd}">
        <img src="${icon}" width="${size}" height="${size}" alt="" draggable="false"/>
      </div>
    `
  }

  private _renderStrandContent() {
    const repDropActive = replicationDropActive(this.currentPhase, this.dnaSequence.length)
    const txDropActive = transcriptionDropActive(this.currentPhase, this.dnaSequence.length)
    const tlDropActive = translationDropActive(this.currentPhase, this.dnaSequence.length)

    const repCanPlace = canPlaceHelicaseAtFork(
      this.currentPhase,
      this.dnaSequence.length,
      this.animationStep,
      this._snappedHelicase,
    )
    const txCanPlace = canPlacePolymeraseAtFork(
      this.currentPhase,
      this.dnaSequence.length,
      this._transcription.transcriptionStep,
      this._transcription.snappedPolymerase,
    )
    const tlCanPlace = canPlaceRibosomeAtCodon(
      this.currentPhase,
      this.dnaSequence.length,
      this._translation.codonIndex,
      this._translation.snappedRibosome,
    )

    const dragFeedbackOpen =
      this._moleculeDrag.dropFeedback === "error" ||
      this._moleculeDrag.pointerDrag !== null ||
      this._moleculeDrag.slotSnapFadeOut

    const showEnzymeDropSlot =
      (repDropActive && (repCanPlace || dragFeedbackOpen)) ||
      (txDropActive && (txCanPlace || dragFeedbackOpen)) ||
      (tlDropActive && (tlCanPlace || dragFeedbackOpen))

    const snappedMolecule =
      this.currentPhase === "Replication" && this._snappedHelicase
        ? {
            id: "helicase",
            icon: moleculeIcon("helicase"),
            removable:
              canRemoveHelicaseFromFork(this._snappedHelicase, this.animationStep) &&
              !this._helicaseExiting,
            exiting: this._helicaseExiting,
          }
        : this.currentPhase === "Transcription" && this._transcription.snappedPolymerase
          ? {
              id: "rna-polymerase",
              icon: moleculeIcon("rna-polymerase"),
              removable: canRemovePolymeraseFromFork(
                this._transcription.snappedPolymerase,
                this._transcription.transcriptionStep,
              ) && !this._polymeraseExiting,
              exiting: this._polymeraseExiting,
            }
          : null

    const mrnaBaseAnimEnabled = this._transcription.baseAnimEnabled

    return renderStrand({
      dnaSequence: this.currentPhase === "Mutations" ? this.mutationsSequence : this.dnaSequence,
      currentPhase: this.currentPhase,
      animationStep: this.animationStep,
      markCodons: this.markCodons && (this.currentPhase === "Mutations" || this.currentPhase === "Translation"),
      markStopCodons: this.markStopCodons && (this.currentPhase === "Mutations" || this.currentPhase === "Translation"),
      polypeptideCompare: null,
      moleculeDrop: showEnzymeDropSlot
        ? {
            hover: this._moleculeDrag.dropSlotHover,
            feedback: this._moleculeDrag.dropFeedback,
            snappingOut: this._moleculeDrag.slotSnapFadeOut,
          }
        : null,
      snappedMolecule,
      transcription: this.currentPhase === "Transcription"
        ? {
            mrnaSequence: this._transcription.mrnaBuilt,
            transcriptionStep: this._transcription.transcriptionStep,
            awaitingRnaBase: this._transcription.awaitingRnaBase,
            stepwiseAnim: mrnaBaseAnimEnabled,
            baseAnim: mrnaBaseAnimEnabled
              ? {
                  enteringIndex: this._transcription.mrnaEnteringIndex,
                  successIndex: this._transcription.mrnaSuccessIndex,
                }
              : null,
            rejectAnim: mrnaBaseAnimEnabled ? this._transcription.mrnaRejectAnim : null,
          }
        : null,
      translation: this.currentPhase === "Translation"
        ? {
            mrnaSequence: this._translation.mrnaSequence,
            codonIndex: this._translation.codonIndex,
            visualCodonIndex: this._translation.visualCodonIndex,
            snappedRibosome: this._translation.snappedRibosome,
            removable:
              canRemoveRibosomeFromCodon(
                this._translation.snappedRibosome,
                this._translation.codonIndex,
              ) &&
              this._translation.polypeptide.length === 0 &&
              !this._translation.complete,
            polypeptide: this._translation.polypeptide,
            polypeptideLinkAngles: this._translation.polypeptideLinkAngles,
            polypeptideAnchorCodonIndex: this._translation.polypeptideAnchorCodonIndex,
            awaitingAminoAcid: this._translation.awaitingAminoAcid,
            aminoDropHover: this._translation.aminoDropHover,
            aminoDropHidden: this._translation.aminoDropHidden,
            aminoDropReveal: this._translation.aminoDropReveal,
            complete: this._translation.complete,
            ribosomeClosing: this._translation.ribosomeClosing,
            ribosomeFillVisible: this._translation.ribosomeFillVisible,
            ribosomeShellVisible: this._translation.ribosomeShellVisible,
            ribosomeHalvesPhase: this._translation.ribosomeHalvesPhase,
            incomingTrna: this._translation.incomingTrna,
            dockedTrnas: this._translation.dockedTrnas,
          }
        : null,
      mutations: this.currentPhase === "Mutations"
        ? {
            selectedIndex: this._mutations.selectedIndex,
            selectedStrand: this._mutations.selectedStrand,
            onBaseClick: this._onMutationBaseClick,
          }
        : null,
      dropHandlers: {
        onSlotDragEnter: this._moleculeDrag.onSlotDragEnter,
        onSlotDragOver: this._moleculeDrag.onSlotDragOver,
        onSlotDragLeave: this._moleculeDrag.onSlotDragLeave,
        onSlotDrop: this._onSlotDrop,
        onSnappedPointerDown: this._onSnappedPointerDown,
        onDropSlotAnimationEnd: this._moleculeDrag.onDropSlotAnimationEnd,
        onMrnaBaseAnimationEnd: this._transcription.onBaseAnimationEnd,
        onReplicationSplitTransitionEnd: this._onReplicationSplitTransitionEnd,
        onSnappedMoleculeAnimationEnd: this._onSnappedMoleculeAnimationEnd,
        onSnappedMoleculeTransitionEnd: this._onSnappedMoleculeTransitionEnd,
      },
    })
  }

  render() {
    const showCodon = this._showCodonReference
    const codonOpen = showCodon && this._codonWheelOpen
    const codonVisible = showCodon && (this._codonWheelOpen || this._codonDrawerClosing)
    const codonListOnly = this.currentPhase === "Mutations"
    const codonTab: CodonDrawerTab = codonListOnly ? "list" : this._codonTab
    const resetConfirmOpen = this._reset.confirmOpen
    const resetConfirmLabel = this._reset.confirmLabel
    const resetConfirmMessage = this._reset.confirmMessage
    const resetConfirmAction = this._reset.confirmActionLabel

    return html`
      <div class="sim-shell">
        <dna-simulation-navbar
          contenteditable="false"
          .showSequenceTab=${this.sequenceTabVisible}
          .phases=${this.visiblePhases}
          .lockedPhases=${this.lockedPhases}
          @dna-navbar-action=${this._navbar.onAction}>
        </dna-simulation-navbar>

        <div class="canvas-row" contenteditable="false">
          <div class="canvas-area">
            ${this._workspace.render(this._renderStrandContent())}
            <div class="canvas-overlays">
              ${this._renderCanvasOverlays()}
              ${this._renderPointerDragGhost()}
              ${this._renderDiscardGhost()}
              ${showCodon
                ? html`
                  <button
                    type="button"
                    class="codon-drawer-toggle ${codonOpen ? "is-open" : ""}"
                    aria-expanded="${codonOpen}"
                    aria-label="${codonOpen ? msg("Close codon reference") : msg("Open codon reference")}"
                    title="${msg("Codon reference")}"
                    @click=${this._toggleCodonWheel}>
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <line x1="2.5" y1="4" x2="13.5" y2="4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                      <line x1="2.5" y1="8" x2="13.5" y2="8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                      <line x1="2.5" y1="12" x2="13.5" y2="12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                    </svg>
                  </button>
                `
                : null}
            </div>
          </div>

          <div class="codon-drawer ${codonOpen ? "is-open" : ""}">
            <div class="codon-drawer-body">
              <div class="codon-drawer-header ${codonListOnly ? "codon-drawer-header--list" : ""} ${codonListOnly && this.mutationTeacherEditing ? "codon-drawer-header--tip" : ""}">
                ${codonListOnly
                  ? html`
                    <span class="drawer-title ${this.mutationTeacherEditing ? "is-teacher-tip" : ""}">
                      ${this.mutationTeacherEditing
                        ? msg("Click an amino acid to add it to the goal.")
                        : msg("Amino acids")}
                    </span>
                  `
                  : html`
                    <nav class="drawer-tabs" aria-label="${msg("Codon reference view")}">
                      <button
                        type="button"
                        class="drawer-tab ${codonTab === "wheel" ? "active" : ""}"
                        aria-pressed="${codonTab === "wheel"}"
                        @click=${() => this._setCodonTab("wheel")}>
                        ${msg("Wheel")}
                      </button>
                      <button
                        type="button"
                        class="drawer-tab ${codonTab === "list" ? "active" : ""}"
                        aria-pressed="${codonTab === "list"}"
                        @click=${() => this._setCodonTab("list")}>
                        ${msg("List")}
                      </button>
                    </nav>
                  `}
                <button
                  type="button"
                  class="codon-drawer-close"
                  aria-label="${msg("Close codon reference")}"
                  title="${msg("Close codon reference")}"
                  @click=${() => this._setCodonWheelOpen(false)}>
                  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
              <div class="codon-drawer-inner ${codonListOnly ? "is-flush-top" : ""}">
                ${codonVisible
                  ? html`
                    <dna-codon-card
                      .tab=${codonTab}
                      .allowDrag=${this.currentPhase === "Translation"}
                      .pickable=${this.mutationTeacherEditing}
                      @dna-codon-card-action=${this._onCodonCardAction}>
                    </dna-codon-card>
                  `
                  : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <sl-dialog
        class="reset-confirm-dialog"
        label=${resetConfirmLabel}
        no-header
        .open=${resetConfirmOpen}
        @sl-after-hide=${() => this._reset.closeConfirm()}>
        ${resetConfirmMessage}
        <sl-button slot="footer" variant="default" size="small" @click=${() => this._reset.closeConfirm()}>
          ${msg("Cancel")}
        </sl-button>
        <sl-button slot="footer" variant="danger" size="small" @click=${() => this._reset.confirm()}>
          ${resetConfirmAction}
        </sl-button>
      </sl-dialog>

      <div part="options" class="teacher-options-shell author-only">
        ${renderTeacherOptions(buildTeacherOptionsInput(this.getTeacherOptionsContext()))}
      </div>
    `
  }
}
