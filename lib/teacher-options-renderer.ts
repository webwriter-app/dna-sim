import {html, type TemplateResult} from "lit"
import {live} from "lit/directives/live.js"

export {teacherOptionsStyles} from "./teacher-options.styles.js"

type SelectChoice = {value: string; label: string}

type SelectRow = {
  kind: "select"
  label: string
  title?: string
  value: string
  options: readonly SelectChoice[]
  onChange: (event: Event) => void
}

type BooleanRow = {
  kind: "boolean"
  label: string
  title?: string
  value: boolean
  disabled?: boolean
  onChange: (event: Event) => void
}

type RangeRow = {
  kind: "range"
  label: string
  title?: string
  value: number
  min: number
  max: number
  step: number
  onInput: (event: Event) => void
}

export type TeacherOptionRow = SelectRow | BooleanRow | RangeRow

export type TeacherOptionsSection = {
  title: string
  open?: boolean
  rows: TeacherOptionRow[]
}

export type RenderTeacherOptionsInput = {
  sections: TeacherOptionsSection[]
}

function selectInputValue(event: Event) {
  const el = event.currentTarget
  if (el instanceof HTMLInputElement) el.select()
}

function renderRow(row: TeacherOptionRow): TemplateResult {
  if (row.kind === "select") {
    return html`
      <div class="teacher-options__row" title=${row.title ?? ""}>
        <div class="teacher-options__label">${row.label}</div>
        <sl-select hoist .value=${live(row.value)} @sl-change=${row.onChange}>
          ${row.options.map(
            (option) => html`<sl-option value=${option.value}>${option.label}</sl-option>`,
          )}
        </sl-select>
      </div>
    `
  }

  if (row.kind === "range") {
    const displayValue = row.value.toFixed(1)
    return html`
      <div class="teacher-options__row" title=${row.title ?? ""}>
        <div class="teacher-options__label">${row.label}</div>
        <div class="teacher-options__range-line">
          <sl-range
            min=${row.min}
            max=${row.max}
            step=${row.step}
            .value=${live(row.value)}
            tooltip="none"
            @sl-input=${row.onInput}>
          </sl-range>
          <input
            class="teacher-options__range-input"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            spellcheck="false"
            .value=${live(displayValue)}
            @focus=${selectInputValue}
            @pointerup=${selectInputValue}
            @change=${row.onInput}
          />
        </div>
      </div>
    `
  }

  return html`
    <div class="teacher-options__row" title=${row.title ?? ""}>
      <sl-switch
        .checked=${live(row.value)}
        ?disabled=${Boolean(row.disabled)}
        @sl-change=${row.onChange}>
        ${row.label}
      </sl-switch>
    </div>
  `
}

export function renderTeacherOptions(input: RenderTeacherOptionsInput): TemplateResult {
  return html`
    <div class="teacher-options">
      ${input.sections.map(
        (section) => html`
          <sl-details ?open=${section.open ?? true}>
            <div slot="summary" class="teacher-options__summary">
              <span class="teacher-options__summary-title">${section.title}</span>
            </div>
            <div class="teacher-options__rows">${section.rows.map((row) => renderRow(row))}</div>
          </sl-details>
        `,
      )}
    </div>
  `
}
