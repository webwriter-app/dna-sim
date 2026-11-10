import type {MsgFn} from "@lit/localize"
import type {OptionDeclaration, SelectOptionDeclaration} from "@webwriter/lit"

import {localizedPhaseEnableDescription, localizedPhaseEnableLabel} from "./localize-text.js"
import {
  ANIMATION_SPEED_STEP,
  MAX_ANIMATION_SPEED,
  MIN_ANIMATION_SPEED,
  PHASE_ENABLE_KEYS,
  lockedPhaseEnableKey,
  type PhaseEnableFlags,
  type PhaseSetMode,
} from "./widget-options.js"
import type {MrnaInputMode} from "./phases/transcription.js"

type DrawerOption = OptionDeclaration & {group: string; hidden?: boolean; disabled?: boolean}

export function lessonOptions(
  msg: MsgFn,
  flags: PhaseEnableFlags,
  phaseMode: PhaseSetMode,
  mrnaMode: MrnaInputMode,
  showProteinGoal: boolean,
  canEditLesson: boolean,
): Record<string, DrawerOption> {
  const label = (text: string) => ({_: text})
  const field = (text: string, group: string) => ({label: label(text), group})
  const boolean = (text: string, group: string, description?: string): DrawerOption => ({
    ...field(text, group), type: Boolean, attribute: false,
    description: description ? label(description) : undefined,
  })
  const select = (
    text: string,
    group: string,
    attribute: string,
    choices: [string, string][],
    description?: string,
  ): SelectOptionDeclaration & {group: string} => ({
    ...field(text, group), type: "select", attribute,
    description: description ? label(description) : undefined,
    options: choices.map(([value, text]) => ({value, label: label(text)})),
  })
  const locked = lockedPhaseEnableKey(flags)
  return {
    lessonDnaSequence: {
      ...field(msg("DNA sequence"), "lesson"), type: String, attribute: false,
      disabled: !canEditLesson, spellcheck: "false", autocapitalize: "characters",
    },
    phaseSetMode: select(msg("Visible phases"), "phases", "phasesetmode",
      [["all", msg("All phases")], ["custom", msg("Choose phases")]],
      msg("Which processes students see. Choose phases reveals the individual toggles.")),
    ...Object.fromEntries(PHASE_ENABLE_KEYS.map(key => [key, {
      ...boolean(localizedPhaseEnableLabel(msg, key), "phases", localizedPhaseEnableDescription(msg, key)),
      hidden: phaseMode !== "custom", disabled: locked === key,
    }])),
    canonicalPhaseOrder: boolean(msg("Finish phases in order"), "phases",
      msg("Forward only after the previous visible phase is complete. Going back is always allowed.")),
    mrnaInputMode: select(msg("mRNA input"), "transcription", "mrna-input-mode",
      [["stepwise", msg("Base by base")], ["batch", msg("Whole sequence")]],
      msg("Base by base checks each base immediately. Whole sequence waits until Verify.")),
    mrnaBatchVerifyMode: {
      ...select(msg("Sequence check"), "transcription", "mrna-batch-verify-mode",
        [["instant", msg("Instant")], ["sequential", msg("With animation")]],
        msg("Instant: the correct prefix stays, the first wrong base flashes. With animation: base by base.")),
      hidden: mrnaMode !== "batch",
    },
    mutationGoalMode: select(msg("Task"), "mutations", "mutationgoalmode",
      [["sandbox", msg("Free mutation")], ["target-protein", msg("Protein goal")]]),
    lessonTargetProtein: {
      ...field(msg("Target protein"), "mutations"), type: String, attribute: false,
      hidden: !showProteinGoal, disabled: !canEditLesson, spellcheck: "false",
      placeholder: label("Met-Leu-Phe"),
    },
    crossPhaseMutations: boolean(msg("Mutations apply to all phases"), "mutations",
      msg("On: DNA edits also apply to replication, transcription, and translation. Off: Mutations tab only.")),
    showInfoCards: boolean(msg("Hints"), "display", msg("Short info cards on the canvas.")),
    showSequenceTab: boolean(msg("Sequence tab for students"), "display",
      msg("Students see the Sequence tab. Teachers always see it.")),
    markCodons: boolean(msg("Codon dividers"), "display",
      msg("Lines between triplets in Mutations and Translation. Leftover bases are not grouped.")),
    markStopCodons: boolean(msg("Highlight stop codons"), "display",
      msg("Display only. Translation still stops when this is off.")),
    allowStudentPan: boolean(msg("Allow students to pan and zoom"), "display"),
    animationSpeed: {
      ...field(msg("Animation speed"), "display"), type: Number, attribute: "animationspeed",
      min: MIN_ANIMATION_SPEED, max: MAX_ANIMATION_SPEED, step: ANIMATION_SPEED_STEP,
      description: label(msg("Speed of replication, transcription, and translation (0.5–2×).")),
    },
  }
}
