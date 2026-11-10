import {css, type CSSResult} from "lit"

export const teacherOptionsStyles: CSSResult = css`
  :host(:not([contenteditable="true"]):not([contenteditable=""])) .author-only {
    display: none;
  }
  :host(.ww-beforeprint) .author-only,
  :host(.ww-beforeprint) .teacher-options-shell,
  :host(.ww-printable) .author-only,
  :host(.ww-printable) .teacher-options-shell {
    display: none !important;
  }
  @media print {
    .author-only,
    .teacher-options-shell {
      display: none !important;
    }
  }

  .teacher-options-shell {
    display: block;
    flex: 0 0 auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 8px 10px 10px;
  }
  .teacher-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    font-size: 0.88rem;
  }
  .teacher-options sl-details {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
  .teacher-options sl-details::part(base) {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    border: 1px solid #d6dce4;
    border-radius: 8px;
    background: #fff;
  }
  .teacher-options sl-details::part(header) {
    padding: 8px 10px;
    font-weight: 600;
    font-size: 0.9rem;
    white-space: normal;
    align-items: center;
    line-height: 1;
  }
  .teacher-options sl-details::part(summary) {
    align-items: center;
    line-height: 1;
    min-height: 0;
  }
  .teacher-options sl-details::part(summary-icon) {
    align-self: center;
    line-height: 0;
  }
  .teacher-options sl-details::part(content) {
    padding: 0 10px 10px;
    min-width: 0;
  }
  .teacher-options__summary {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
  }
  .teacher-options__summary-title {
    flex: 1;
    min-width: 0;
  }
  .teacher-options__rows {
    display: grid;
    gap: 10px;
    width: 100%;
    min-width: 0;
  }
  .teacher-options__row {
    display: grid;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
  .teacher-options__label {
    color: #334155;
    line-height: 1.35;
    font-size: 0.9rem;
    word-break: break-word;
  }
  .teacher-options__range-line {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }
  .teacher-options__range-line sl-range {
    flex: 1;
    min-width: 0;
  }
  .teacher-options__range-input {
    flex: 0 0 3.4rem;
    box-sizing: border-box;
    width: 3.4rem;
    max-width: 3.4rem;
    min-width: 3.4rem;
    height: 1.7rem;
    margin: 0;
    padding: 0 6px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #fff;
    color: #334155;
    font: inherit;
    font-variant-numeric: tabular-nums;
    text-align: right;
    -webkit-user-select: text;
    user-select: text;
  }
  .teacher-options__range-input:focus {
    outline: 2px solid #93c5fd;
    outline-offset: 1px;
    border-color: #60a5fa;
  }
  .teacher-options__range-input::selection,
  .teacher-options__range-input::-moz-selection {
    background: #bfdbfe;
    color: inherit;
  }
  .teacher-options sl-switch::part(base) {
    width: 100%;
    align-items: flex-start;
  }
  .teacher-options sl-switch::part(label) {
    white-space: normal;
    min-width: 0;
  }
  .teacher-options sl-select,
  .teacher-options sl-range {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
`
