# Dna Sim (`@webwriter/dna-sim@2.1.1`)
[License: MIT](LICENSE) | Version: 2.1.1

Explore DNA structure and genetics through interactive simulations.

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| Dna Simulation | `@webwriter/dna-sim/snippets/dna-simulation.html` |



## `WebwriterDnaSimulation` (`<webwriter-dna-simulation>`)
Interactive simulation of DNA replication, transcription, translation and point mutations.

Settings are persisted as attributes on the element; the lesson (DNA sequence and mutation
target protein) is stored as a JSON data block through `jsonData`. Learner progress is
transient and never written to the document. The widget is split into controllers under
`src/components/` (workspace, navbar, transcription, translation, enzymes, codon drawer,
mutation menu and edits, reset); each reaches the widget through a host interface.

### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<link href="https://cdn.jsdelivr.net/npm/@webwriter/dna-sim/widgets/webwriter-dna-simulation.css" rel="stylesheet">
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/dna-sim/widgets/webwriter-dna-simulation.js"></script>
<webwriter-dna-simulation></webwriter-dna-simulation>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/dna-sim
```

```html
<link href="@webwriter/dna-sim/widgets/webwriter-dna-simulation.css" rel="stylesheet">
<script type="module" src="@webwriter/dna-sim/widgets/webwriter-dna-simulation.js"></script>
<webwriter-dna-simulation></webwriter-dna-simulation>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `WebwriterDnaSimulation.dataType` | - | - | `LESSON_DATA_TYPE` | ✗ |
| `WebwriterDnaSimulation.scopedElements` | `object` | - | `{ "dna-canvas-alert": DnaCanvasAlert, "dna-canvas-info-button": DnaCanvasInfoButton, "dna-phase-complete-toast": DnaPhaseCompleteToast, "dna-simulation-navbar": DnaSimulationNavbar, "dna-codon-card": DnaCodonCard, "sl-icon": SlIcon, "sl-button": SlButton, "sl-dialog": SlDialog, "sl-popup": SlPopup, }` | ✗ |
| `WebwriterDnaSimulation.optionGroups` | `object` | - | `{ lesson: {label: (widget: {msg: MsgFn}) => widget.msg("Lesson")}, phases: {label: (widget: {msg: MsgFn}) => widget.msg("Phases")}, transcription: {label: (widget: {msg: MsgFn}) => widget.msg("Transcription")}, mutations: {label: (widget: {msg: MsgFn}) => widget.msg("Mutations")}, display: {label: (widget: {msg: MsgFn}) => widget.msg("Display")}, advanced: {label: (widget: {msg: MsgFn}) => widget.msg("Advanced"), advanced: true}, }` | ✗ |
| `WebwriterDnaSimulation.convertFrom` | `object` | - | `{".fasta": "importFasta", ".fa": "importFasta"}` | ✗ |
| `WebwriterDnaSimulation.convertTo` | `object` | - | `{".fasta": "exportFasta"}` | ✗ |
| `WebwriterDnaSimulation.effects` | `object` | - | `{ "sequence-from": { label: (widget: {msg: MsgFn}) => widget.msg("DNA sequence from"), connect(this: WebwriterDnaSimulation, source: {get(): unknown}, lifetime: AbortSignal) { this.published.source.set(source) lifetime.addEventListener("abort", () => this.published.source.set(null), {once: true}) }, }, }` | ✗ |
| `actions` | - | - | - | ✗ |
| `options` | - | - | - | ✗ |
| `msg` | `MsgFn` | - | - | ✗ |
| `workspace` | - | - | `new WorkspaceController(this, { getZoomLevel: () => this.zoomLevel, setZoomLevel: (z) => { this.zoomLevel = z }, getLabel: () => this.msg("DNA simulation canvas"), getPanEnabled: () => this.allowStudentPan \|\| this.editable, onViewportClick: (e) => this.mutationMenu.onViewportClick(e), onUserPanZoom: () => this.mutations.dismiss(), })` | ✗ |
| `navbar` | - | - | `new NavbarController(this)` | ✗ |
| `transcription` | - | - | `new TranscriptionController(this)` | ✗ |
| `translation` | - | - | `new TranslationController(this)` | ✗ |
| `mutations` | - | - | `new MutationsController(this)` | ✗ |
| `moleculeDrag` | - | - | `new MoleculeDragController(this)` | ✗ |
| `phaseCompletion` | - | - | `new PhaseCompletionController(this)` | ✗ |
| `resetFlow` | - | - | `new ResetController(this)` | ✗ |
| `enzymes` | - | - | `new EnzymeController(this)` | ✗ |
| `codonDrawer` | - | - | `new CodonDrawerController(this)` | ✗ |
| `mutationMenu` | - | - | `new MutationMenuController(this)` | ✗ |
| `mutationEdits` | - | - | `new MutationEditsController(this)` | ✗ |
| `view` | - | - | `new SimulationView(this)` | ✗ |
| `lesson` | - | - | `new LessonController(this)` | ✗ |
| `flow` | - | - | `new FlowController(this)` | ✗ |
| `alerts` | - | - | `new AlertsController(this)` | ✗ |
| `layout` | - | - | `new LayoutController(this)` | ✗ |
| `published` | - | - | `new PublishedSignals()` | ✗ |
| `signals` | - | Public read-only signals, stable for the life of the element. | - | ✗ |
| `currentPhase` | `string` | - | `"Replication"` | ✗ |
| `dnaSequence` | - | - | `DEFAULT_DNA_SEQUENCE` | ✗ |
| `zoomLevel` | `number` | - | `100` | ✗ |
| `lessonDnaSequence` | `string` | - | - | ✗ |
| `lessonTargetProtein` | - | - | - | ✗ |
| `animationSpeed` | - | - | - | ✗ |
| `phaseSetMode` | - | - | - | ✗ |
| `mrnaInputMode` | - | - | - | ✗ |
| `mrnaBatchVerifyMode` | - | - | - | ✗ |
| `mutationGoalMode` | - | - | - | ✗ |
| `mutationTargetProtein` | - | - | - | ✗ |
| `showInfoCards` | - | - | - | ✗ |
| `showSequenceTab` | - | - | - | ✗ |
| `crossPhaseMutations` | - | - | - | ✗ |
| `markCodons` | - | - | - | ✗ |
| `markStopCodons` | - | - | - | ✗ |
| `canonicalPhaseOrder` | - | - | - | ✗ |
| `allowStudentPan` | - | - | - | ✗ |
| `enableReplication` | - | - | - | ✗ |
| `enableTranscription` | - | - | - | ✗ |
| `enableTranslation` | - | - | - | ✗ |
| `enableMutations` | - | - | - | ✗ |
| `mutationsSequence` | `string` | Sequence the Mutations tab displays and edits. | - | ✗ |
| `phaseFlags` | `PhaseEnableFlags` | - | - | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `nextFrame` | - | `callback: () => void`
| `afterRender` | - | `callback: () => void`
| `refreshDrawer` | Tell the editor to read `options` and `actions` again. | -
| `restoreLessonDefaults` | - | -
| `importFasta` | - | `file: File`
| `exportFasta` | - | -
| `setPhase` | - | `phase: string`
| `setDnaSequence` | - | `value: string`
| `startMoleculeDrag` | - | `nativeEvent: DragEvent`, `moleculeId: string`
| `substituteBase` | Replace the DNA template base at `index` (Mutations phase). | `index: number`, `base: string`
| `insertBase` | Insert a DNA template base before `index`. | `index: number`, `base: string`
| `deleteBase` | Delete the DNA template base at `index`. | `index: number`
| `showErrorAlert` | - | `message: string`, `onDismiss: () => void`
| `setErrorAlertDismiss` | - | `onDismiss: () => void`
| `showWrongAminoAcidAlert` | - | -
| `focusMrnaInput` | Wait for render, then ask the navbar to focus its mRNA field. | -
| `playSlotSnapFade` | - | -
| `onTranscriptionCompleteReady` | - | -
| `focusActiveCodon` | - | -
| `onStopCodonReached` | - | -
| `onRibosomeFillComplete` | - | -
| `focusPolypeptide` | - | -
| `onTranslationComplete` | - | -
| `scaleAnimMs` | - | `ms: number`
| `stopTimer` | - | -
| `phaseHintText` | - | -

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Events
| Name | Description |
| :--: | :---------: |
| optionschange | - |

*[Events](https://developer.mozilla.org/en-US/docs/Web/Events) are dispatched by the widget after certain triggers.*

## CSS parts
| Name | Description |
| :--: | :---------: |
| canvas | The pan and zoom area that shows the strands. |
| navbar | The tab and phase bar above the canvas. Theme: text follows `--ww-text-color` and `--ww-font-family`; the active tab, focus rings and primary buttons follow `--ww-theme-accent-1`. Base colours stay fixed because they carry meaning. Keyboard: Tab reaches the toolkit, the canvas, bases (Mutations) and the codon reference. On the canvas, arrow keys pan (Shift for larger steps), plus and minus zoom, 0 or Home recentre. Enter or Space on a toolkit chip places the molecule; on an amino acid it places it on the ribosome (Translation) or adds it to the goal (Mutations). Delete removes a placed enzyme. Print: the controls are hidden; a caption names the phase and the template strand. Files: a FASTA file (`.fasta`, `.fa`) imports as the template strand (first record; RNA is read as DNA; 3 to 2000 bases of A, C, G, T). Export writes the authored strand as `.fasta` (3′ → 5′, named in the header). Target protein and settings are not part of FASTA and stay unchanged on import. Signals: `phase` (string, the open phase), `sequence` (string, the template strand as shown, with a learner's mutations) and `complete` (boolean, every visible phase finished). Effect: `sequence-from` takes a string signal and shows its A, C, G, T letters instead of the authored sequence while it is not empty. Nothing is written to the document. |

*[CSS parts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_shadow_parts) allow freely styling internals of the widget with CSS.*

## Editing config
| Name | Value |
| :--: | :---------: |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, or custom CSS properties.*


---
*Generated with @webwriter/build@1.15.0*
