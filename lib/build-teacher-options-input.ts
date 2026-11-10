import {msg} from "@lit/localize"

import type {RenderTeacherOptionsInput} from "./teacher-options-renderer.js"
import type {MrnaBatchVerifyMode, MrnaInputMode} from "./phases/transcription.js"
import type {MutationGoalMode} from "./phases/mutation-goals.js"
import {
  localizedPhaseEnableDescription,
  localizedPhaseEnableLabel,
} from "./localize-text.js"
import {
  ANIMATION_SPEED_STEP,
  lockedPhaseEnableKey,
  MAX_ANIMATION_SPEED,
  MIN_ANIMATION_SPEED,
  normalizePhaseSetMode,
  PHASE_ENABLE_KEYS,
  type PhaseEnableFlags,
  type PhaseSetMode,
} from "./widget-options.js"

export type TeacherOptionsContext = {
  phaseSetMode: PhaseSetMode
  enableReplication: boolean
  enableTranscription: boolean
  enableTranslation: boolean
  enableMutations: boolean
  canonicalPhaseOrder: boolean
  mrnaInputMode: MrnaInputMode
  mrnaBatchVerifyMode: MrnaBatchVerifyMode
  mutationGoalMode: MutationGoalMode
  crossPhaseMutations: boolean
  showInfoCards: boolean
  showSequenceTab: boolean
  markCodons: boolean
  markStopCodons: boolean
  animationSpeed: number
  onPhaseSetMode: (event: Event) => void
  onPhaseFlag: (key: (typeof PHASE_ENABLE_KEYS)[number], event: Event) => void
  onCanonicalPhaseOrder: (event: Event) => void
  onMrnaInputMode: (event: Event) => void
  onMrnaBatchVerifyMode: (event: Event) => void
  onMutationGoalMode: (event: Event) => void
  onCrossPhaseMutations: (event: Event) => void
  onShowInfoCards: (event: Event) => void
  onShowSequenceTab: (event: Event) => void
  onMarkCodons: (event: Event) => void
  onMarkStopCodons: (event: Event) => void
  onAnimationSpeed: (event: Event) => void
}

export function buildTeacherOptionsInput(ctx: TeacherOptionsContext): RenderTeacherOptionsInput {
  const flags: PhaseEnableFlags = {
    enableReplication: ctx.enableReplication,
    enableTranscription: ctx.enableTranscription,
    enableTranslation: ctx.enableTranslation,
    enableMutations: ctx.enableMutations,
  }
  const customPhases = normalizePhaseSetMode(ctx.phaseSetMode) === "custom"
  const locked = customPhases ? lockedPhaseEnableKey(flags) : null

  const phaseRows = [
    {
      kind: "select" as const,
      label: msg("Visible phases"),
      title: msg("Which processes students see. Choose phases reveals the individual toggles."),
      value: normalizePhaseSetMode(ctx.phaseSetMode),
      options: [
        {value: "all", label: msg("All phases")},
        {value: "custom", label: msg("Choose phases")},
      ],
      onChange: ctx.onPhaseSetMode,
    },
    ...(customPhases
      ? PHASE_ENABLE_KEYS.map((key) => ({
          kind: "boolean" as const,
          label: localizedPhaseEnableLabel(key),
          title: localizedPhaseEnableDescription(key),
          value: flags[key],
          disabled: locked === key,
          onChange: (event: Event) => ctx.onPhaseFlag(key, event),
        }))
      : []),
    {
      kind: "boolean" as const,
      label: msg("Finish phases in order"),
      title: msg("Forward only after the previous visible phase is complete. Going back is always allowed."),
      value: ctx.canonicalPhaseOrder,
      onChange: ctx.onCanonicalPhaseOrder,
    },
  ]

  const transcriptionRows = [
    {
      kind: "select" as const,
      label: msg("mRNA input"),
      title: msg("Base by base checks each base immediately. Whole sequence waits until Verify."),
      value: ctx.mrnaInputMode,
      options: [
        {value: "stepwise", label: msg("Base by base")},
        {value: "batch", label: msg("Whole sequence")},
      ],
      onChange: ctx.onMrnaInputMode,
    },
    ...(ctx.mrnaInputMode === "batch"
      ? [
          {
            kind: "select" as const,
            label: msg("Sequence check"),
            title: msg("Instant: the correct prefix stays, the first wrong base flashes. With animation: base by base."),
            value: ctx.mrnaBatchVerifyMode,
            options: [
              {value: "instant", label: msg("Instant")},
              {value: "sequential", label: msg("With animation")},
            ],
            onChange: ctx.onMrnaBatchVerifyMode,
          },
        ]
      : []),
  ]

  return {
    sections: [
      {title: msg("Phases"), open: true, rows: phaseRows},
      {title: msg("Transcription"), open: true, rows: transcriptionRows},
      {
        title: msg("Mutations"),
        open: true,
        rows: [
          {
            kind: "select",
            label: msg("Task"),
            title: msg("Free mutation with no goal. Protein goal: pick amino acids in the list, then Verify."),
            value: ctx.mutationGoalMode,
            options: [
              {value: "sandbox", label: msg("Free mutation")},
              {value: "target-protein", label: msg("Protein goal")},
            ],
            onChange: ctx.onMutationGoalMode,
          },
          {
            kind: "boolean",
            label: msg("Mutations apply to all phases"),
            title: msg("On: DNA edits also apply to replication, transcription, and translation. Off: Mutations tab only."),
            value: ctx.crossPhaseMutations,
            onChange: ctx.onCrossPhaseMutations,
          },
        ],
      },
      {
        title: msg("Display"),
        open: true,
        rows: [
          {
            kind: "boolean",
            label: msg("Hints"),
            title: msg("Short info cards on the canvas."),
            value: ctx.showInfoCards,
            onChange: ctx.onShowInfoCards,
          },
          {
            kind: "boolean",
            label: msg("Sequence tab for students"),
            title: msg("Students see the Sequence tab. Teachers always see it."),
            value: ctx.showSequenceTab,
            onChange: ctx.onShowSequenceTab,
          },
          {
            kind: "boolean",
            label: msg("Codon dividers"),
            title: msg("Lines between triplets in Mutations and Translation. Leftover bases are not grouped."),
            value: ctx.markCodons,
            onChange: ctx.onMarkCodons,
          },
          {
            kind: "boolean",
            label: msg("Highlight stop codons"),
            title: msg("Display only. Translation still stops when this is off."),
            value: ctx.markStopCodons,
            onChange: ctx.onMarkStopCodons,
          },
          {
            kind: "range",
            label: msg("Animation speed"),
            title: msg("Speed of replication, transcription, and translation (0.5–2×)."),
            value: ctx.animationSpeed,
            min: MIN_ANIMATION_SPEED,
            max: MAX_ANIMATION_SPEED,
            step: ANIMATION_SPEED_STEP,
            onInput: ctx.onAnimationSpeed,
          },
        ],
      },
    ],
  }
}
