import {html, LitElement} from "lit"
import {property} from "lit/decorators.js"
import {live} from "lit/directives/live.js"
import {localized, msg, str} from "@lit/localize"
import {ScopedElementsMixin} from "@open-wc/scoped-elements/lit-element.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"
import SlDivider from "@shoelace-style/shoelace/dist/components/divider/divider.component.js"
import SlDropdown from "@shoelace-style/shoelace/dist/components/dropdown/dropdown.component.js"
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"
import SlMenu from "@shoelace-style/shoelace/dist/components/menu/menu.component.js"
import SlMenuItem from "@shoelace-style/shoelace/dist/components/menu-item/menu-item.component.js"

import {shoelaceLight} from "../../lib/shoelace-theme.js"
import {simulationNavbarStyles} from "./simulation-navbar.styles.js"
import {renderAminoAcidBadge} from "../../lib/molecules/amino-acid.js"
import {localizedPhaseLabel} from "../../lib/localize-text.js"
import {DNA_BASE_ICONS, type DnaBase, type MutationStepKind} from "../../lib/phases/mutations.js"

export type NavTab = "phasen" | "sequenz" | "baukasten" | "protein"

export type NavbarBaukastenMolecule = {
  id: string
  name: string
  icon: string
  isDragging: boolean
}

export type NavbarMutationStep = {
  label: string
  stepIndex: number
  kind: MutationStepKind
  from?: DnaBase
  to?: DnaBase
}

export type MutationNowEmptyReason = "short" | "stop" | "empty"

export type NavbarModel = {
  activeTab: NavTab
  currentPhase: string
  phases: readonly string[]
  lockedPhases: readonly string[]
  showSequenceTab: boolean
  dnaSequence: string
  sequenceWarnings: readonly string[]
  showPhaseBar: boolean
  mrnaInputValue: string
  mrnaInputBusy: boolean
  canAppendMrnaBase: boolean
  showMrnaVerify: boolean
  canVerifyMrna: boolean
  mrnaRemaining: number
  showMutationVerify: boolean
  mutationSteps: readonly NavbarMutationStep[]
  mutationShowGoal: boolean
  mutationShowNow: boolean
  mutationCurrentChain: readonly string[]
  mutationNowEmptyReason: MutationNowEmptyReason
  mutationTargetChain: readonly string[]
  mutationTeacherEditing: boolean
  showToolkitTab: boolean
  showProteinTab: boolean
  baukastenMolecules: NavbarBaukastenMolecule[]
  baukastenEmptyMessage: string | null
}

export type NavbarAction =
  | {action: "tab-change"; tab: NavTab}
  | {action: "phase-change"; phase: string}
  | {action: "sequence-input"; value: string}
  | {action: "append-dna-base"; base: string}
  | {action: "mrna-input"; value: string}
  | {action: "mrna-clear"}
  | {action: "mrna-verify"}
  | {action: "mrna-enter"}
  | {action: "mrna-append-base"; base: string}
  | {action: "molecule-drag-start"; moleculeId: string; nativeEvent: DragEvent}
  | {action: "molecule-drag-end"}
  | {action: "reset-simulation"}
  | {action: "mutation-verify"}
  | {action: "mutation-step-select"; stepIndex: number}
  | {action: "mutation-target-add"; amino: string}
  | {action: "mutation-target-remove"; index: number}
  | {action: "open-codon-drawer"}

@localized()
export class DnaSimulationNavbar extends ScopedElementsMixin(LitElement) {
  static styles = [shoelaceLight, simulationNavbarStyles]

  static scopedElements = {
    "sl-button": SlButton,
    "sl-divider": SlDivider,
    "sl-dropdown": SlDropdown,
    "sl-input": SlInput,
    "sl-menu": SlMenu,
    "sl-menu-item": SlMenuItem,
  }

  @property({type: String}) activeTab: NavTab = "phasen"
  @property({type: String}) currentPhase = "Replication"
  @property({attribute: false}) phases: readonly string[] = []
  @property({attribute: false}) lockedPhases: readonly string[] = []
  @property({type: Boolean}) showSequenceTab = true
  @property({type: String}) dnaSequence = ""
  @property({attribute: false}) sequenceWarnings: readonly string[] = []
  @property({type: Boolean}) showPhaseBar = false
  @property({type: String}) mrnaInputValue = ""
  @property({type: Boolean}) mrnaInputBusy = false
  @property({type: Boolean}) canAppendMrnaBase = false
  @property({type: Boolean}) showMrnaVerify = false
  @property({type: Boolean}) canVerifyMrna = false
  @property({type: Number}) mrnaRemaining = 0
  @property({type: Boolean}) showMutationVerify = false
  @property({attribute: false}) mutationSteps: readonly NavbarMutationStep[] = []
  @property({type: Boolean}) mutationShowGoal = false
  @property({type: Boolean}) mutationShowNow = false
  @property({attribute: false}) mutationCurrentChain: readonly string[] = []
  @property({type: String}) mutationNowEmptyReason: MutationNowEmptyReason = "empty"
  @property({attribute: false}) mutationTargetChain: readonly string[] = []
  @property({type: Boolean}) mutationTeacherEditing = false
  @property({type: Boolean}) showToolkitTab = true
  @property({type: Boolean}) showProteinTab = false
  @property({attribute: false}) baukastenMolecules: NavbarBaukastenMolecule[] = []
  @property({type: String}) baukastenEmptyMessage: string | null = null

  applyModel(model: NavbarModel) {
    this.activeTab = model.activeTab
    this.currentPhase = model.currentPhase
    this.phases = model.phases
    this.lockedPhases = model.lockedPhases
    this.showSequenceTab = model.showSequenceTab
    this.dnaSequence = model.dnaSequence
    this.sequenceWarnings = model.sequenceWarnings
    this.showPhaseBar = model.showPhaseBar
    this.mrnaInputValue = model.mrnaInputValue
    this.mrnaInputBusy = model.mrnaInputBusy
    this.canAppendMrnaBase = model.canAppendMrnaBase
    this.showMrnaVerify = model.showMrnaVerify
    this.canVerifyMrna = model.canVerifyMrna
    this.mrnaRemaining = model.mrnaRemaining
    this.showMutationVerify = model.showMutationVerify
    this.mutationSteps = model.mutationSteps
    this.mutationShowGoal = model.mutationShowGoal
    this.mutationShowNow = model.mutationShowNow
    this.mutationCurrentChain = model.mutationCurrentChain
    this.mutationNowEmptyReason = model.mutationNowEmptyReason
    this.mutationTargetChain = model.mutationTargetChain
    this.mutationTeacherEditing = model.mutationTeacherEditing
    this.showToolkitTab = model.showToolkitTab
    this.showProteinTab = model.showProteinTab
    this.baukastenMolecules = model.baukastenMolecules
    this.baukastenEmptyMessage = model.baukastenEmptyMessage
    this.requestUpdate()
  }

  /** Focus the Transcription phase-bar mRNA field (owned by this shadow root). */
  focusMrnaInput() {
    const input = this.renderRoot.querySelector(
      "sl-input.phase-bar-input",
    ) as SlInput | null
    if (!input || input.disabled) return
    input.focus({preventScroll: true})
  }

  private _emit(action: NavbarAction) {
    this.dispatchEvent(
      new CustomEvent("dna-navbar-action", {
        bubbles: true,
        composed: true,
        detail: action,
      }),
    )
  }

  private _renderPrimaryNav() {
    const tabs: {id: NavTab; label: string}[] = [
      {id: "phasen", label: msg("Phases")},
      ...(this.showSequenceTab
        ? [{id: "sequenz" as const, label: msg("Sequence")}]
        : []),
      ...(this.showToolkitTab
        ? [{id: "baukasten" as const, label: msg("Toolkit")}]
        : []),
      ...(this.showProteinTab
        ? [{id: "protein" as const, label: msg("Protein")}]
        : []),
    ]

    return html`
      <nav class="primary-nav" aria-label="${msg("Main navigation")}">
        ${tabs.map(({id, label}) => html`
          <button
            type="button"
            class="nav-tab ${this.activeTab === id ? "active" : ""}"
            aria-pressed="${this.activeTab === id}"
            @click=${() => this._emit({action: "tab-change", tab: id})}>
            ${label}
          </button>
        `)}
      </nav>
    `
  }

  private _renderPhaseBar() {
    return html`
      <div class="phase-bar">
        <span class="child-nav-label">${msg("mRNA (5′ → 3′)")}</span>
        <!-- Only disabled during batch sequential verify playback. Stepwise mode is "busy" for the
             brief per-base accept/reject animation too, but disabling there would blur the field on
             every keystroke and break continuous typing. -->
        <sl-input
          class="sequence-input phase-bar-input"
          size="small"
          clearable
          ?disabled=${this.mrnaInputBusy && this.showMrnaVerify}
          .value=${live(this.mrnaInputValue)}
          placeholder="${msg("A, U, C, G")}"
          @sl-input=${(e: Event) =>
            this._emit({action: "mrna-input", value: (e.target as SlInput).value as string})}
          @sl-clear=${() => this._emit({action: "mrna-clear"})}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter") this._emit({action: "mrna-enter"})
          }}>
        </sl-input>
        <div class="base-buttons">
          <sl-button size="small" class="btn-a" ?disabled=${!this.canAppendMrnaBase} @click=${() => this._emit({action: "mrna-append-base", base: "A"})}>A</sl-button>
          <sl-button size="small" class="btn-u" ?disabled=${!this.canAppendMrnaBase} @click=${() => this._emit({action: "mrna-append-base", base: "U"})}>U</sl-button>
          <sl-button size="small" class="btn-c" ?disabled=${!this.canAppendMrnaBase} @click=${() => this._emit({action: "mrna-append-base", base: "C"})}>C</sl-button>
          <sl-button size="small" class="btn-g" ?disabled=${!this.canAppendMrnaBase} @click=${() => this._emit({action: "mrna-append-base", base: "G"})}>G</sl-button>
        </div>
        ${this.showMrnaVerify
          ? html`
            <sl-button
              size="small"
              variant="primary"
              ?disabled=${!this.canVerifyMrna}
              @click=${() => this._emit({action: "mrna-verify"})}>
              ${msg("Verify")}
            </sl-button>
          `
          : null}
        <span class="child-nav-meta">${
          this.mrnaRemaining === 1
            ? msg(str`${this.mrnaRemaining} base remaining`)
            : msg(str`${this.mrnaRemaining} bases remaining`)
        }</span>
      </div>
    `
  }

  private _onMutationStepSelect = (e: CustomEvent<{item: SlMenuItem}>) => {
    const value = e.detail.item.value
    if (value === "") return
    this._emit({action: "mutation-step-select", stepIndex: Number(value)})
  }

  private _nowEmptyMessage() {
    if (this.mutationNowEmptyReason === "short") {
      return msg("Need at least one full codon")
    }
    if (this.mutationNowEmptyReason === "stop") {
      return msg("First codon is a stop")
    }
    return msg("No polypeptide yet")
  }

  private _renderAminoChain(
    chain: readonly string[],
    options: {removable: boolean; empty: string},
  ) {
    if (!chain.length) {
      return html`<span class="mutation-step-empty">${options.empty}</span>`
    }
    return html`
      <div class="mutation-aa-chain">
        ${chain.map(
          (amino, i) => html`
            ${i > 0 ? html`<span class="mutation-aa-bond" aria-hidden="true"></span>` : null}
            <span class="mutation-aa-chip">
              ${renderAminoAcidBadge(amino, 34)}
              ${options.removable
                ? html`
                  <button
                    type="button"
                    class="mutation-aa-remove"
                    aria-label="${msg(str`Remove ${amino}`)}"
                    @click=${() => this._emit({action: "mutation-target-remove", index: i})}>
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                      <line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                      <line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                  </button>
                `
                : null}
            </span>
          `,
        )}
      </div>
    `
  }

  private _renderMutationStepVisual(step: NavbarMutationStep) {
    if (step.kind === "substitution" && step.from && step.to) {
      return html`
        <span class="mutation-step-visual">
          <img class="mutation-step-base" src=${DNA_BASE_ICONS[step.from]} alt=${step.from} draggable="false" />
          <span class="mutation-step-arrow" aria-hidden="true">→</span>
          <img class="mutation-step-base" src=${DNA_BASE_ICONS[step.to]} alt=${step.to} draggable="false" />
        </span>
      `
    }
    if (step.kind === "insertion" && step.to) {
      return html`
        <span class="mutation-step-visual">
          <img class="mutation-step-base" src=${DNA_BASE_ICONS[step.to]} alt=${step.to} draggable="false" />
        </span>
      `
    }
    if (step.kind === "deletion" && step.from) {
      return html`
        <span class="mutation-step-visual">
          <img class="mutation-step-base" src=${DNA_BASE_ICONS[step.from]} alt=${step.from} draggable="false" />
        </span>
      `
    }
    return null
  }

  private _renderProteinNav() {
    const stepCount = this.mutationSteps.length
    return html`
      <div class="child-nav">
        <div class="mutation-protein-cluster">
          ${this.mutationShowNow
            ? html`
              <span class="child-nav-label">${msg("Now")}</span>
              ${this._renderAminoChain(this.mutationCurrentChain, {
                removable: false,
                empty: this._nowEmptyMessage(),
              })}
            `
            : null}
          ${this.mutationShowGoal
            ? html`
              <span class="child-nav-label">${msg("Goal")}</span>
              ${this.mutationTargetChain.length
                ? this._renderAminoChain(this.mutationTargetChain, {
                    removable: this.mutationTeacherEditing,
                    empty: "",
                  })
                : this.mutationTeacherEditing
                  ? html`
                    <sl-button
                      size="small"
                      class="mutation-open-list-btn"
                      @click=${() => this._emit({action: "open-codon-drawer"})}>
                      ${msg("Set goal")}
                    </sl-button>
                  `
                  : html`<span class="mutation-step-empty">${msg("No target selected")}</span>`}
            `
            : null}
        </div>
        <div class="phase-actions">
          <sl-dropdown class="mutation-steps-dropdown" hoist placement="bottom-end" distance="6">
            <sl-button slot="trigger" size="small" caret>
              ${stepCount ? msg(str`Steps (${stepCount})`) : msg("Steps")}
            </sl-button>
            <sl-menu class="mutation-steps-menu" @sl-select=${this._onMutationStepSelect}>
              ${stepCount
                ? this.mutationSteps.map(
                    (step, i) => html`
                      ${i > 0 ? html`<sl-divider></sl-divider>` : null}
                      <sl-menu-item value=${String(step.stepIndex)}>
                        <span class="mutation-step-row">
                          <span class="mutation-step-kind">${step.label}</span>
                          ${this._renderMutationStepVisual(step)}
                        </span>
                      </sl-menu-item>
                    `,
                  )
                : html`<sl-menu-item disabled value="">${msg("No mutations yet")}</sl-menu-item>`}
            </sl-menu>
          </sl-dropdown>
          ${this.showMutationVerify
            ? html`
              <sl-button
                class="mutation-verify-btn"
                size="small"
                variant="primary"
                @click=${() => this._emit({action: "mutation-verify"})}>
                ${msg("Verify")}
              </sl-button>
            `
            : null}
        </div>
      </div>
    `
  }

  private _renderBaukastenToolbar() {
    if (this.baukastenEmptyMessage) {
      return html`<span class="baukasten-empty">${this.baukastenEmptyMessage}</span>`
    }

    return this.baukastenMolecules.map((mol) => html`
      <div
        class="baukasten-chip ${mol.isDragging ? "is-dragging" : ""}"
        title="${mol.name}"
        draggable="true"
        @dragstart=${(e: DragEvent) =>
          this._emit({action: "molecule-drag-start", moleculeId: mol.id, nativeEvent: e})}
        @dragend=${() => this._emit({action: "molecule-drag-end"})}>
        <img
          class="baukasten-molecule"
          src="${mol.icon}"
          width="36"
          height="36"
          alt=""
          draggable="false" />
        <span class="baukasten-name">${mol.name}</span>
      </div>
    `)
  }

  private _renderChildNav() {
    switch (this.activeTab) {
      case "phasen":
        return html`
          <div class="child-nav">
            <div class="phase-buttons">
              ${this.phases.map((phase) => {
                const locked = this.lockedPhases.includes(phase)
                return html`
                <sl-button
                  size="small"
                  variant="${this.currentPhase === phase ? "primary" : "default"}"
                  ?disabled=${locked}
                  title=${locked ? msg("Complete the previous phase first") : localizedPhaseLabel(phase)}
                  @click=${() => this._emit({action: "phase-change", phase})}>
                  ${localizedPhaseLabel(phase)}
                </sl-button>
              `
              })}
            </div>
            <div class="phase-actions">
              <sl-button
                class="reset-simulation-btn"
                size="small"
                variant="default"
                @click=${() => this._emit({action: "reset-simulation"})}>
                ${msg("Reset all")}
              </sl-button>
            </div>
          </div>
        `

      case "sequenz":
        return html`
          <div class="child-nav">
            <span class="child-nav-label">${msg("Template strand (3′ → 5′)")}</span>
            <sl-input
              class="sequence-input"
              size="small"
              .value=${live(this.dnaSequence)}
              placeholder="${msg("A, C, T or G")}"
              @sl-input=${(e: Event) =>
                this._emit({action: "sequence-input", value: (e.target as SlInput).value as string})}
              clearable>
            </sl-input>
            <div class="base-buttons">
              <sl-button size="small" class="btn-a" @click=${() => this._emit({action: "append-dna-base", base: "A"})}>A</sl-button>
              <sl-button size="small" class="btn-t" @click=${() => this._emit({action: "append-dna-base", base: "T"})}>T</sl-button>
              <sl-button size="small" class="btn-c" @click=${() => this._emit({action: "append-dna-base", base: "C"})}>C</sl-button>
              <sl-button size="small" class="btn-g" @click=${() => this._emit({action: "append-dna-base", base: "G"})}>G</sl-button>
            </div>
            <div class="child-nav-meta ${this.sequenceWarnings.length ? "is-warning is-stacked" : ""}">
              ${this.sequenceWarnings.length
                ? this.sequenceWarnings.map(
                    (warning) => html`<span class="child-nav-meta-line">${warning}</span>`,
                  )
                : html`<span class="child-nav-meta-line">${msg(str`Phase: ${localizedPhaseLabel(this.currentPhase)}`)}</span>`}
            </div>
          </div>
        `

      case "baukasten":
        return html`
          <div class="child-nav child-nav--baukasten">
            <span class="child-nav-label">${msg("Biomolecule toolkit")}</span>
            <div class="baukasten-toolbar">
              ${this._renderBaukastenToolbar()}
            </div>
            <span class="child-nav-meta">${msg(str`Phase: ${localizedPhaseLabel(this.currentPhase)}`)}</span>
          </div>
        `

      case "protein":
        return this._renderProteinNav()
    }
  }

  render() {
    return html`
      ${this._renderPrimaryNav()}
      <div class="child-nav-shell">
        ${this._renderChildNav()}
      </div>
      ${this.showPhaseBar
        ? html`
          <div class="phase-bar-shell">
            ${this._renderPhaseBar()}
          </div>
        `
        : null}
    `
  }
}
