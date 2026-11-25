import {html, type PropertyValues} from "lit"
import {LitElementWw} from "@webwriter/lit"
import {customElement, state} from "lit/decorators.js"
import {type MsgFn} from "@lit/localize"
import {styleMap} from "lit/directives/style-map.js"

import {localizer} from "@webwriter/lit/localize"
import {sourceLocale, targetLocales} from "../../localization/generated/locale-codes"

import {widgetStyles} from "../components/dna-simulation.styles"
import {codonDrawerStyles} from "../components/codon-drawer.styles"
import {canvasOverlayStyles} from "../components/canvas-overlays.styles"
import {mutationMenuStyles} from "../components/mutation-menu.styles"
import {workspaceStyles} from "../components/workspace.styles"
import {strandStyles} from "../components/strand.styles"
import {translationStyles} from "../components/translation.styles"
import {mrnaStrandStyles} from "../components/mrna-strand.styles"
import {shoelaceLight} from "../components/shoelace-theme"
import {DnaCanvasAlert} from "../components/canvas-alert"
import {DnaCanvasInfoButton} from "../components/canvas-info-button"
import {DnaPhaseCompleteToast} from "../components/phase-complete-toast"
import {DnaSimulationNavbar} from "../components/simulation-navbar"
import {DnaCodonCard} from "../components/codon-card"
import SlIcon from "@shoelace-style/shoelace/dist/components/icon/icon.component.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlDialog from "@shoelace-style/shoelace/dist/components/dialog/dialog.component.js"
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js"
import {WorkspaceController} from "../components/workspace-controller"
import {EnzymeController} from "../components/enzyme-controller"
import {CodonDrawerController} from "../components/codon-drawer-controller"
import {MutationEditsController} from "../components/mutation-edits-controller"
import {MutationMenuController} from "../components/mutation-menu-controller"
import {renderCanvasOverlays, renderPointerDragGhost, renderDiscardGhost} from "../components/canvas-overlays"
import {renderStrandContent} from "../components/strand-view"
import {FlowController} from "../components/flow-controller"
import {LessonController} from "../components/lesson-controller"
import {AlertsController} from "../components/alerts-controller"
import {LayoutController} from "../components/layout-controller"
import {SimulationView} from "../components/simulation-view"
import {localizedPhaseLabel} from "../components/localize-text"
import {phaseHintText} from "../components/phase-hint"
import {NavbarController} from "../components/navbar-controller"
import {
  TranscriptionController,
  type TranscriptionHost,
} from "../components/transcription-controller"
import {
  TranslationController,
  type TranslationHost,
} from "../components/translation-controller"
import {
  MoleculeDragController,
  type MoleculeDragHost,
} from "../components/molecule-drag-controller"
import {PhaseCompletionController} from "../components/phase-completion-controller"
import {MutationsController} from "../components/mutations-controller"
import {ResetController} from "../components/reset-controller"
import {
  moleculeById,
} from "../components/baukasten"
import {
  DEFAULT_MRNA_BATCH_VERIFY_MODE,
  DEFAULT_MRNA_INPUT_MODE,
  readMrnaBatchVerifyModeAttr,
  readMrnaInputModeAttr,
} from "../model/transcription"
import {lessonOptions} from "../components/drawer-options"
import {FASTA_MAX_BASES} from "../model/fasta"
import {PublishedSignals} from "../components/published-signals"
import {exportFastaFile, importFastaFile} from "../components/fasta-files"
import {LESSON_DATA_TYPE} from "../model/lesson-data"
import {
  PHASE_ENABLE_KEYS,
  DEFAULT_PHASE_SET_MODE,
  ALL_PHASES_ENABLED,
  readPhaseSetModeAttr,
  readPhaseEnableFlag,
  booleanFromAttribute,
  writePersistedBoolean,
  writePhaseEnableFlag,
  DEFAULT_DNA_SEQUENCE,
  normalizeAnimationSpeed,
  sanitizeDnaSequence,
  readShowInfoCards,
  readShowSequenceTab,
  readCrossPhaseMutations,
  readMarkCodons,
  readMarkStopCodons,
  readCanonicalPhaseOrder,
  readMutationGoalModeAttr,
  writeShowInfoCards,
  writeShowSequenceTab,
  writeCrossPhaseMutations,
  writeMarkCodons,
  writeMarkStopCodons,
  writeCanonicalPhaseOrder,
  type PhaseEnableFlags,
} from "../model/widget-options"

/**
 * Interactive simulation of DNA replication, transcription, translation and point mutations.
 *
 * Settings are persisted as attributes on the element; the lesson (DNA sequence and mutation
 * target protein) is stored as a JSON data block through `jsonData`. Learner progress is
 * transient and never written to the document. The widget is split into controllers under
 * `src/components/` (workspace, navbar, transcription, translation, enzymes, codon drawer,
 * mutation menu and edits, reset); each reaches the widget through a host interface.
 *
 * @part canvas - The pan and zoom area that shows the strands.
 * @part navbar - The tab and phase bar above the canvas.
 *
 * Theme: text follows `--ww-text-color` and `--ww-font-family`; the active tab, focus rings and
 * primary buttons follow `--ww-theme-accent-1`. Base colours stay fixed because they carry meaning.
 *
 * Keyboard: Tab reaches the toolkit, the canvas, bases (Mutations) and the codon reference.
 * On the canvas, arrow keys pan (Shift for larger steps), plus and minus zoom, 0 or Home recentre.
 * Enter or Space on a toolkit chip places the molecule; on an amino acid it places it on the
 * ribosome (Translation) or adds it to the goal (Mutations). Delete removes a placed enzyme.
 *
 * Print: the controls are hidden; a caption names the phase and the template strand.
 *
 * Files: a FASTA file (`.fasta`, `.fa`) imports as the template strand (first record; RNA is read as
 * DNA; 3 to 2000 bases of A, C, G, T). Export writes the authored strand as `.fasta` (3′ → 5′, named in
 * the header). Target protein and settings are not part of FASTA and stay unchanged on import.
 *
 * Signals: `phase` (string, the open phase), `sequence` (string, the template strand as shown, with a
 * learner's mutations) and `complete` (boolean, every visible phase finished).
 *
 * Effect: `sequence-from` takes a string signal and shows its A, C, G, T letters instead of the authored
 * sequence while it is not empty. Nothing is written to the document.
 *
 * @summary Simulate DNA replication, transcription, and translation in phases, including animations.
 */
@customElement("webwriter-dna-simulation")
export class WebwriterDnaSimulation extends LitElementWw implements TranscriptionHost, TranslationHost, MoleculeDragHost {

  static override readonly dataType = LESSON_DATA_TYPE
  static styles = [
    shoelaceLight,
    widgetStyles,
    codonDrawerStyles,
    canvasOverlayStyles,
    mutationMenuStyles,
    workspaceStyles,
    strandStyles,
    translationStyles,
    mrnaStrandStyles,
  ]

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
  }

  static optionGroups = {
    lesson: {label: (widget: {msg: MsgFn}) => widget.msg("Lesson")},
    phases: {label: (widget: {msg: MsgFn}) => widget.msg("Phases")},
    transcription: {label: (widget: {msg: MsgFn}) => widget.msg("Transcription")},
    mutations: {label: (widget: {msg: MsgFn}) => widget.msg("Mutations")},
    display: {label: (widget: {msg: MsgFn}) => widget.msg("Display")},
    advanced: {label: (widget: {msg: MsgFn}) => widget.msg("Advanced"), advanced: true},
  }

  static convertFrom = {".fasta": "importFasta", ".fa": "importFasta"}
  static convertTo = {".fasta": "exportFasta"}

  static effects = {
    "sequence-from": {
      label: (widget: {msg: MsgFn}) => widget.msg("DNA sequence from"),
      connect(this: WebwriterDnaSimulation, source: {get(): unknown}, lifetime: AbortSignal) {
        this.published.source.set(source)
        lifetime.addEventListener("abort", () => this.published.source.set(null), {once: true})
      },
    },
  }

  get actions() {
    return {
      restoreLessonDefaults: {
        label: {_: this.msg("Restore default sequence and target")},
        group: "lesson",
        disabled: !this.lesson.canEdit,
        confirm: {_: this.msg("Restore the default DNA sequence and clear the protein target?")},
      },
    }
  }

  get options() {
    return lessonOptions(this.msg, this.phaseFlags, this.phaseSetMode, this.mrnaInputMode,
      this.mutationGoalMode === "target-protein", this.lesson.canEdit)
  }

  protected localize = localizer(this, {
    sourceLocale,
    targetLocales,
    load: (locale) => import(`../../localization/generated/${locale}.ts`),
    prefer: {pt: "pt-PT"},
    drawer: true,
  })
  msg: MsgFn = this.localize.msg

  workspace = new WorkspaceController(this, {
    getZoomLevel: () => this.zoomLevel,
    setZoomLevel: (z) => { this.zoomLevel = z },
    getLabel: () => this.msg("DNA simulation canvas"),
    getPanEnabled: () => this.allowStudentPan || this.editable,
    onViewportClick: (e) => this.mutationMenu.onViewportClick(e),
    onUserPanZoom: () => this.mutations.dismiss(),
  })

  navbar = new NavbarController(this)

  transcription = new TranscriptionController(this)

  translation = new TranslationController(this)

  mutations = new MutationsController(this)

  moleculeDrag = new MoleculeDragController(this)

  phaseCompletion = new PhaseCompletionController(this)

  resetFlow = new ResetController(this)

  enzymes = new EnzymeController(this)

  codonDrawer = new CodonDrawerController(this)

  mutationMenu = new MutationMenuController(this)

  mutationEdits = new MutationEditsController(this)

  view = new SimulationView(this)

  lesson = new LessonController(this)

  flow = new FlowController(this)

  alerts = new AlertsController(this)

  layout = new LayoutController(this)

  published = new PublishedSignals()
  /** Public read-only signals, stable for the life of the element. */
  get signals() { return this.published.signals }

  @state() accessor currentPhase = "Replication"
  @state() accessor dnaSequence = DEFAULT_DNA_SEQUENCE
  @state() accessor zoomLevel = 100

  get lessonDnaSequence(): string { return this.lesson.value.dnaSequence }
  set lessonDnaSequence(value: string | null) {
    this.lesson.write({dnaSequence: value === null ? DEFAULT_DNA_SEQUENCE : sanitizeDnaSequence(value)})
  }

  get lessonTargetProtein() { return this.lesson.value.mutationTargetProtein }
  set lessonTargetProtein(value: string | null) { this.mutationEdits.setTargetProtein(value) }

  get animationSpeed() { return normalizeAnimationSpeed(this.getAttribute("animationspeed")) }
  get phaseSetMode() { return readPhaseSetModeAttr(this) ?? DEFAULT_PHASE_SET_MODE }
  get mrnaInputMode() { return readMrnaInputModeAttr(this) ?? DEFAULT_MRNA_INPUT_MODE }
  get mrnaBatchVerifyMode() { return readMrnaBatchVerifyModeAttr(this) ?? DEFAULT_MRNA_BATCH_VERIFY_MODE }
  get mutationGoalMode() { return readMutationGoalModeAttr(this) ?? "sandbox" }
  get mutationTargetProtein() { return this.lesson.value.mutationTargetProtein }

  get showInfoCards() { return readShowInfoCards(this) }
  set showInfoCards(value: boolean) { this._setBooleanOption(writeShowInfoCards, value) }
  get showSequenceTab() { return readShowSequenceTab(this) }
  set showSequenceTab(value: boolean) { this._setBooleanOption(writeShowSequenceTab, value) }
  get crossPhaseMutations() { return readCrossPhaseMutations(this) }
  set crossPhaseMutations(value: boolean) { this._setBooleanOption(writeCrossPhaseMutations, value) }
  get markCodons() { return readMarkCodons(this) }
  set markCodons(value: boolean) { this._setBooleanOption(writeMarkCodons, value) }
  get markStopCodons() { return readMarkStopCodons(this) }
  set markStopCodons(value: boolean) { this._setBooleanOption(writeMarkStopCodons, value) }
  get canonicalPhaseOrder() { return readCanonicalPhaseOrder(this) }
  set canonicalPhaseOrder(value: boolean) { this._setBooleanOption(writeCanonicalPhaseOrder, value) }
  get allowStudentPan() { return booleanFromAttribute(this.getAttribute("allow-student-pan")) }
  set allowStudentPan(value: boolean) {
    this._setBooleanOption((widget, on) => writePersistedBoolean(widget, "allow-student-pan", on), value)
  }

  get enableReplication() { return this._readPhaseFlag("enableReplication") }
  set enableReplication(value: boolean) { this._setPhaseFlag("enableReplication", value) }
  get enableTranscription() { return this._readPhaseFlag("enableTranscription") }
  set enableTranscription(value: boolean) { this._setPhaseFlag("enableTranscription", value) }
  get enableTranslation() { return this._readPhaseFlag("enableTranslation") }
  set enableTranslation(value: boolean) { this._setPhaseFlag("enableTranslation", value) }
  get enableMutations() { return this._readPhaseFlag("enableMutations") }
  set enableMutations(value: boolean) { this._setPhaseFlag("enableMutations", value) }

  /** Sequence the Mutations tab displays and edits. */
  get mutationsSequence(): string {
    return this.crossPhaseMutations ? this.dnaSequence : this.mutationEdits.workingCopy
  }

  get phaseFlags(): PhaseEnableFlags {
    return {
      enableReplication: this.enableReplication,
      enableTranscription: this.enableTranscription,
      enableTranslation: this.enableTranslation,
      enableMutations: this.enableMutations,
    }
  }

  private _animationSpeed = this.animationSpeed
  private _crossPhaseMutations = this.crossPhaseMutations
  private _settingsObserver = new MutationObserver(() => this._syncSettings())
  private _frames = new Set<number>()
  private _connection = 0

  connectedCallback() {
    super.connectedCallback()
    this.currentPhase = this.view.visiblePhases[0]
    this.navbar.activeTab = "phasen"
    this.lesson.sync(true)
    this.afterRender(() => this.workspace.resetView(this.flow.defaultZoomForPhase(this.currentPhase)))
    this._settingsObserver.observe(this, {attributes: true})
    this._syncSettings()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._connection++
    this._settingsObserver.disconnect()
    this.flow.resetAnimation()
    this.mutations.dismiss()
    this._cancelFrames()
  }

  nextFrame(callback: () => void) {
    if (!this.isConnected) return
    const frame = requestAnimationFrame(() => {
      this._frames.delete(frame)
      if (this.isConnected) callback()
    })
    this._frames.add(frame)
  }

  private _cancelFrames() {
    for (const frame of this._frames) cancelAnimationFrame(frame)
    this._frames.clear()
  }

  afterRender(callback: () => void) {
    const connection = this._connection
    void this.updateComplete.then(() => {
      if (this.isConnected && connection === this._connection) callback()
    })
  }

  protected override dataPending() {
    this.lesson.sync(true)
    this.refreshDrawer()
  }

  protected override dataError() {
    this.refreshDrawer()
  }

  private _syncSettings() {
    this.lesson.sync()
    const speed = this.animationSpeed
    if (speed !== this._animationSpeed) {
      this._animationSpeed = speed
      this.layout.setSpeed(speed)
      if (this.flow.timerRunning) this.flow.startTimer()
    }
    const crossPhase = this.crossPhaseMutations
    if (crossPhase !== this._crossPhaseMutations) {
      if (crossPhase) this.mutationEdits.applyLessonSequenceEdit(this.mutationEdits.workingCopy)
      else this.mutationEdits.workingCopy = this.dnaSequence
      this._crossPhaseMutations = crossPhase
    }
    if (!this.showInfoCards) this.alerts.hintOpen = false
    this.flow.ensureCurrentPhaseEnabled()
    this.requestUpdate()
    this.refreshDrawer()
  }

  /** Tell the editor to read `options` and `actions` again. */
  refreshDrawer() {
    if (this.isConnected) this.dispatchEvent(new Event("optionschange", {bubbles: true}))
  }

  private _setBooleanOption(write: (widget: Element, value: boolean) => void, value: boolean) {
    if (this.editable && typeof value === "boolean") write(this, value)
  }

  private _readPhaseFlag(key: (typeof PHASE_ENABLE_KEYS)[number]) {
    return readPhaseEnableFlag(this, key) ?? ALL_PHASES_ENABLED[key]
  }

  private _setPhaseFlag(key: (typeof PHASE_ENABLE_KEYS)[number], value: boolean) {
    if (!this.editable || typeof value !== "boolean") return
    if (!value && !PHASE_ENABLE_KEYS.some(other => other !== key && this._readPhaseFlag(other))) return
    writePhaseEnableFlag(this, key, value)
  }

  protected willUpdate() {
    this.transcription.syncModes()
    const linked = this.published.source.get()?.get()
    const next = typeof linked === "string" ? sanitizeDnaSequence(linked).slice(0, FASTA_MAX_BASES) : null
    if ((next || null) !== this.lesson.linkedSequence) {
      this.lesson.linkedSequence = next || null
      this.lesson.sync()
    }
  }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed)
    if (changed.has("editable")) this.refreshDrawer()
    this.published.update(this)
    this.alerts.syncHintExpansion()
    this.navbar.syncView(this.renderRoot)
    const codonCard = this.renderRoot.querySelector("dna-codon-card")
    if (codonCard instanceof DnaCodonCard) {
      codonCard.tab = this.currentPhase === "Mutations" ? "list" : this.codonDrawer.tab
      codonCard.allowDrag = this.currentPhase === "Translation"
      codonCard.pickable = this.view.mutationTeacherEditing
      codonCard.requestUpdate()
    }

    this.layout.update()
    this.enzymes.maybeStartPolymeraseExit()
    this.mutationMenu.reposition()
  }

  restoreLessonDefaults() {
    this.lesson.restoreDefaults()
  }

  importFasta(file: File) {
    return importFastaFile(this, file)
  }

  exportFasta() {
    return exportFastaFile(this)
  }

  setPhase(phase: string) {
    this.flow.setPhase(phase)
  }

  setDnaSequence(value: string) {
    this.flow.setDnaSequence(value)
  }

  startMoleculeDrag(nativeEvent: DragEvent, moleculeId: string) {
    const molecule = moleculeById(this.msg, moleculeId)
    if (molecule) this.moleculeDrag.onDragStart(nativeEvent, molecule)
  }

  /** Replace the DNA template base at `index` (Mutations phase). */
  substituteBase(index: number, base: string) {
    this.mutationEdits.substituteBase(index, base)
  }

  /** Insert a DNA template base before `index`. */
  insertBase(index: number, base: string) {
    this.mutationEdits.insertBase(index, base)
  }

  /** Delete the DNA template base at `index`. */
  deleteBase(index: number) {
    this.mutationEdits.deleteBase(index)
  }

  // ── Host interfaces of the controllers ────────────────────────────────────

  showErrorAlert(message: string, onDismiss?: () => void) {
    this.alerts.showError(message, onDismiss)
  }

  setErrorAlertDismiss(onDismiss: () => void) {
    this.alerts.setErrorDismiss(onDismiss)
  }

  showWrongAminoAcidAlert() {
    this.showErrorAlert(
      this.msg("That amino acid does not match the current codon. Check the codon wheel and try again."),
    )
  }

  /** Wait for render, then ask the navbar to focus its mRNA field. */
  focusMrnaInput() {
    this.afterRender(() => {
      const navbar = this.renderRoot.querySelector("dna-simulation-navbar")
      if (navbar instanceof DnaSimulationNavbar) navbar.focusMrnaInput()
    })
  }

  playSlotSnapFade() {
    this.moleculeDrag.playSlotSnapFade()
  }

  onTranscriptionCompleteReady() {
    this.enzymes.maybeStartPolymeraseExit()
  }

  focusActiveCodon() {
    this.afterRender(() => this.codonDrawer.centerOnActiveCodon())
  }

  onStopCodonReached() {
    this.translation.releaseTrnasAtStop()
  }

  onRibosomeFillComplete() {
    this.translation.beginRibosomeSplit()
  }

  focusPolypeptide() {
    this.afterRender(() => this.codonDrawer.centerOnPolypeptide())
  }

  onTranslationComplete() {
    this.flow.onTranslationComplete()
  }

  scaleAnimMs(ms: number): number {
    return this.flow.scaleAnimMs(ms)
  }

  stopTimer() {
    this.flow.stopTimer()
  }

  phaseHintText(): string | null {
    return phaseHintText(this.msg, {
      currentPhase: this.currentPhase,
      dnaSequenceLength: this.dnaSequence.length,
      replicationEnabled: this.view.animationEnabled,
      snappedHelicase: this.enzymes.snappedHelicase,
      transcriptionEnabled: this.view.transcriptionEnabled,
      transcription: this.transcription,
      translation: this.translation,
      mutationShowGoal: this.view.mutationShowGoal,
      mutationTargetChain: this.view.mutationTargetChain,
      teacherEditing: this.view.teacherEditing,
    })
  }

  // ── Main render ───────────────────────────────────────────────────────────

  render() {
    return html`
      <div class="print-caption">
        ${localizedPhaseLabel(this.msg, this.currentPhase)} · ${this.msg("Template strand (3′ → 5′)")} <code>${this.dnaSequence}</code>
      </div>
      <div class="sim-shell" style=${styleMap(this.layout.style)}>
        <dna-simulation-navbar
          part="navbar"
          contenteditable="false"
          .showSequenceTab=${this.view.sequenceTabVisible}
          .phases=${this.view.visiblePhases}
          .lockedPhases=${this.view.lockedPhases}
          @dna-navbar-action=${this.navbar.onAction}>
        </dna-simulation-navbar>

        <div class="canvas-row" contenteditable="false">
          <div class="canvas-area" part="canvas">
            ${this.workspace.render(renderStrandContent(this))}
            <div class="canvas-overlays">
              ${renderCanvasOverlays(this)}
              ${renderPointerDragGhost(this)}
              ${renderDiscardGhost(this)}
              ${this.view.showCodonReference ? this.codonDrawer.renderToggle() : null}
            </div>
          </div>
          ${this.codonDrawer.renderDrawer()}
        </div>
      </div>

      <sl-dialog
        class="reset-confirm-dialog"
        label=${this.resetFlow.confirmLabel}
        no-header
        .open=${this.resetFlow.confirmOpen}
        @sl-after-hide=${() => this.resetFlow.closeConfirm()}>
        ${this.resetFlow.confirmMessage}
        <sl-button slot="footer" variant="default" size="small" @click=${() => this.resetFlow.closeConfirm()}>
          ${this.msg("Cancel")}
        </sl-button>
        <sl-button slot="footer" variant="danger" size="small" @click=${() => this.resetFlow.confirm()}>
          ${this.resetFlow.confirmActionLabel}
        </sl-button>
      </sl-dialog>
    `
  }

}
