# DNA Simulation (`@webwriter/dna-sim@1.0.1`)
[License: MIT](LICENSE) | Version: 1.0.1

Interactive DNA replication, transcription, and translation simulation for biology education.

In WebWriter, insert the DNA Simulation snippet and open the widget drawer to set the lesson DNA sequence, protein target, and visible phases.

## Snippets
[Snippets](https://webwriter.app/docs/snippets/snippets/) are examples and templates using the package's widgets.

| Name | Import Path |
| :--: | :---------: |
| DNA Simulation | `@webwriter/dna-sim/snippets/dna-simulation.html` |



## `WebwriterDnaSimulation` (`<webwriter-dna-simulation>`)


### Usage

Use with a CDN (e.g. [jsdelivr](https://jsdelivr.com)):
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@webwriter/dna-sim/widgets/webwriter-dna-simulation.js"></script>
<webwriter-dna-simulation></webwriter-dna-simulation>
```

Or use with a bundler (e.g. [Vite](https://vite.dev)):

```
npm install @webwriter/dna-sim
```

```html
<script type="module" src="@webwriter/dna-sim/widgets/webwriter-dna-simulation.js"></script>
<webwriter-dna-simulation></webwriter-dna-simulation>
```

## Fields
| Name (Attribute Name) | Type | Description | Default | Reflects |
| :-------------------: | :--: | :---------: | :-----: | :------: |
| `WebwriterDnaSimulation.dataType` | - | - | `LESSON_DATA_TYPE` | ✗ |
| `msg` | `MsgFn` | - | - | ✗ |
| `WebwriterDnaSimulation.scopedElements` | `object` | - | `{ "dna-canvas-alert": DnaCanvasAlert, "dna-canvas-info-button": DnaCanvasInfoButton, "dna-phase-complete-toast": DnaPhaseCompleteToast, "dna-simulation-navbar": DnaSimulationNavbar, "dna-codon-card": DnaCodonCard, "sl-icon": SlIcon, "sl-button": SlButton, "sl-dialog": SlDialog, "sl-popup": SlPopup, }` | ✗ |
| `options` | - | - | - | ✗ |
| `optionGroups` | - | - | - | ✗ |
| `actions` | - | - | - | ✗ |
| `currentPhase` | `string` | - | `"Replication"` | ✗ |
| `dnaSequence` | - | - | `DEFAULT_DNA_SEQUENCE` | ✗ |
| `zoomLevel` | `number` | - | `100` | ✗ |
| `lessonDnaSequence` | - | - | - | ✗ |
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
| `sequenceTabVisible` | - | - | - | ✗ |
| `sequenceTabDna` | - | - | - | ✗ |
| `sequenceTabWarnings` | `readonly string[]` | Sequence-tab hints for authors only — never shown in student view. | - | ✗ |
| `mutationsSequence` | `string` | Sequence the Mutations tab displays and edits. | - | ✗ |
| `visiblePhases` | `readonly SimulationPhase[]` | - | - | ✗ |
| `lockedPhases` | `readonly SimulationPhase[]` | - | - | ✗ |
| `mrnaInput` | `NavbarMrnaInput` | - | - | ✗ |
| `showPhaseBar` | `boolean` | - | - | ✗ |
| `baukastenMolecules` | `BaukastenMolecule[]` | - | - | ✗ |
| `draggingMoleculeId` | `string \| null` | - | - | ✗ |
| `showMutationVerify` | `boolean` | - | - | ✗ |
| `mutationShowGoal` | `boolean` | - | - | ✗ |
| `mutationStepItems` | - | - | - | ✗ |
| `mutationTargetChain` | `string[]` | - | - | ✗ |
| `mutationShowNow` | `boolean` | - | - | ✗ |
| `mutationCurrentChain` | `string[]` | - | - | ✗ |
| `mutationNowEmptyReason` | `"short" \| "stop" \| "empty"` | - | - | ✗ |
| `mutationTeacherEditing` | `boolean` | - | - | ✗ |
| `showToolkitTab` | `boolean` | - | - | ✗ |
| `showProteinTab` | `boolean` | - | - | ✗ |

*Fields including [properties](https://developer.mozilla.org/en-US/docs/Glossary/Property/JavaScript) and [attributes](https://developer.mozilla.org/en-US/docs/Glossary/Attribute) define the current state of the widget and offer customization options.*

## Methods
| Name | Description | Parameters |
| :--: | :---------: | :-------: |
| `restoreLessonDefaults` | - | -
| `nextFrame` | - | `callback: () => void`
| `afterRender` | - | `callback: () => void`
| `setDnaSequence` | - | `value: string`
| `appendDnaBase` | - | `base: string`
| `setMrnaInput` | - | `value: string`
| `clearMrnaInput` | - | -
| `verifyMrnaInput` | - | -
| `appendMrnaBase` | - | `base: string`
| `startMoleculeDrag` | - | `nativeEvent: DragEvent`, `moleculeId: string`
| `endMoleculeDrag` | - | -
| `requestResetSimulation` | - | -
| `verifyMutationGoal` | - | -
| `openCodonDrawer` | - | -
| `rewindMutationStep` | - | `stepIndex: number`
| `addMutationTargetAmino` | - | `amino: string`
| `removeMutationTargetAmino` | - | `index: number`
| `clearAllSimulationState` | - | -
| `enterFirstVisiblePhaseAfterFullReset` | - | -
| `resetCanvasView` | - | `zoom: number`
| `defaultZoomForPhase` | Public so ResetController can pick the phase default zoom. | `phase: string`
| `resetReplicationPhase` | - | -
| `resetTranscriptionPhase` | - | -
| `resetTranslationPhase` | - | -
| `resetMutationsPhase` | - | -
| `clearPhaseCompletionNotified` | - | `phase: string`
| `showErrorAlert` | - | `message: string`
| `focusMrnaInput` | TranscriptionHost: wait for render, then ask the navbar to focus its mRNA field. | -
| `playSlotSnapFade` | - | -
| `onTranscriptionCompleteReady` | - | -
| `focusActiveCodon` | - | -
| `onStopCodonReached` | - | -
| `onRibosomeFillComplete` | - | -
| `focusPolypeptide` | - | -
| `onTranslationComplete` | - | -
| `scaleAnimMs` | - | `ms: number`
| `showWrongAminoAcidAlert` | - | -
| `stopTimer` | - | -
| `setErrorAlertDismiss` | - | `onDismiss: () => void`
| `setPhase` | - | `phase: string`
| `appendBase` | - | `base: string`
| `substituteBase` | Replace the DNA template base at `index` (Mutations phase).<br>No-ops if the index/base is invalid or unchanged. | `index: number`, `base: string`
| `insertBase` | Insert a DNA template base before `index` (0 … length inclusive).<br>No-ops if the index/base is invalid. | `index: number`, `base: string`
| `deleteBase` | Delete the DNA template base at `index`.<br>No-ops if the index is out of range. | `index: number`

*[Methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Method_definitions) allow programmatic access to the widget.*

## Events
| Name | Description |
| :--: | :---------: |
| optionschange | - |

*[Events](https://developer.mozilla.org/en-US/docs/Web/Events) are dispatched by the widget after certain triggers.*

## Editing config
| Name | Value |
| :--: | :---------: |
| `uninsertable` | `true` |


*The [editing config](https://webwriter.app/docs/packages/configuring/#editingconfig) defines how explorable authoring tools such as [WebWriter](https://webwriter.app) treat the widget.*

*No public slots, custom CSS properties, or CSS parts.*


---
*Generated with @webwriter/build@1.9.1*