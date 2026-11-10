import {html, LitElement} from "lit"
import {property} from "lit/decorators.js"
import type {MsgFn} from "@lit/localize"

import {sourceMsg} from "../../localization/localizer.js"
import {canvasInfoButtonStyles} from "./canvas-info-button.styles.js"

/** Top-right info toggle only. The info card is a sibling dna-canvas-alert in the overlay. */
export class DnaCanvasInfoButton extends LitElement {
  @property({attribute: false}) msg: MsgFn = sourceMsg

  static styles = canvasInfoButtonStyles

  @property({type: Boolean, reflect: true}) active = false

  private _onClick = (e: Event) => {
    e.stopPropagation()
    this.dispatchEvent(
      new CustomEvent("dna-canvas-info-toggle", {bubbles: true, composed: true}),
    )
  }

  render() {
    return html`
      <button
        type="button"
        class="${this.active ? "is-active" : ""}"
        aria-label="${this.msg("Show hint")}"
        aria-expanded="${this.active}"
        title="${this.msg("Show hint")}"
        @click=${this._onClick}>
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <rect x="7.25" y="6.75" width="1.5" height="5" rx="0.75" fill="currentColor"/>
          <circle cx="8" cy="4.75" r="0.9" fill="currentColor"/>
        </svg>
      </button>
    `
  }
}
