# Dna Sim (`@webwriter/dna-sim@1.0.1`)
[License: MIT](LICENSE) | Version: 1.0.1

Simulate DNA replication, transcription, and translation in phases, including animations.

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
| `WebwriterDnaSimulation.optionGroups` | `object` | - | `{ lesson: {label: (widget: {msg: MsgFn}) => widget.msg("Lesson")}, phases: {label: (widget: {msg: MsgFn}) => widget.msg("Phases")}, transcription: {label: (widget: {msg: MsgFn}) => widget.msg("Transcription")}, mutations: {label: (widget: {msg: MsgFn}) => widget.msg("Mutations")}, display: {label: (widget: {msg: MsgFn}) => widget.msg("Display")}, }` | ✗ |
| `actions` | - | - | - | ✗ |
| `options` | - | - | - | ✗ |
| `msg` | `MsgFn` | - | - | ✗ |
| `workspace` | - | - | `new WorkspaceController(this, { getZoomLevel: () => this.zoomLevel, setZoomLevel: (z) => { this.zoomLevel = z }, getPanEnabled: () => this.allowStudentPan \|\| this.editable, onViewportClick: (e) => this.mutationMenu.onViewportClick(e), onUserPanZoom: () => this.mutations.dismiss(), })` | ✗ |
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

## Editing config
| Name | Value |
| :--: | :---------: |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, custom CSS properties, or CSS parts.*


---
*Generated with @webwriter/build@1.9.1*