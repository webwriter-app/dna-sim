import {html, LitElement} from "lit"
import {property} from "lit/decorators.js"
import {ScopedElementsMixin} from "@open-wc/scoped-elements/lit-element.js"
import SlAlert from "@shoelace-style/shoelace/dist/components/alert/alert.component.js"

import {shoelaceLight} from "../../lib/shoelace-theme.js"
import {canvasAlertStyles} from "./canvas-alert.styles.js"

export const CANVAS_ERROR_ALERT_MS = 2000
export const CANVAS_INFO_ALERT_MS = 4500

export class DnaCanvasAlert extends ScopedElementsMixin(LitElement) {
  static styles = [shoelaceLight, canvasAlertStyles]

  static scopedElements = {
    "sl-alert": SlAlert,
  }

  @property({type: String}) variant!: "info" | "error"
  @property({type: String}) message = ""
  @property({type: Number}) duration = CANVAS_ERROR_ALERT_MS

  private _outsideClickListening = false
  private _suppressDismiss = false

  disconnectedCallback() {
    this._suppressDismiss = true
    this._releaseOutsideClick()
    void this._slAlert()?.hide()
    super.disconnectedCallback()
  }

  protected firstUpdated() {
    void this._present()
  }

  /** Hide with fade-out; fires `dna-canvas-alert-dismiss` when done. */
  dismiss() {
    this._releaseOutsideClick()
    void this._slAlert()?.hide()
  }

  private _slAlert(): SlAlert | null {
    return this.renderRoot.querySelector("sl-alert")
  }

  private async _present() {
    const alert = this._slAlert()
    if (!alert) return
    await alert.updateComplete
    if (alert.open) await alert.hide()
    await alert.show()
    requestAnimationFrame(() => {
      if (this.isConnected) this._ensureOutsideClick()
    })
  }

  private _ensureOutsideClick() {
    if (this._outsideClickListening) return
    window.addEventListener("pointerdown", this._onOutsideClick)
    this._outsideClickListening = true
  }

  private _releaseOutsideClick() {
    if (!this._outsideClickListening) return
    window.removeEventListener("pointerdown", this._onOutsideClick)
    this._outsideClickListening = false
  }

  private _onOutsideClick = (e: PointerEvent) => {
    const inside = e.composedPath().some(
      (el) =>
        el === this ||
        (el instanceof Element &&
          (el.closest("dna-canvas-info-button") !== null ||
            this.contains(el as Node))),
    )
    if (!inside) this.dismiss()
  }

  private _onHidden = () => {
    this._releaseOutsideClick()
    if (this._suppressDismiss) return
    this.dispatchEvent(
      new CustomEvent("dna-canvas-alert-dismiss", {bubbles: true, composed: true}),
    )
  }

  render() {
    if (!this.message || !this.variant) return null

    const shoelaceVariant = this.variant === "error" ? "danger" : "primary"
    const icon =
      this.variant === "error"
        ? html`
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              d="M5.5 5.5l5 5M10.5 5.5l-5 5"/>
          </svg>
        `
        : html`
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <rect x="7.25" y="6.75" width="1.5" height="5" rx="0.75" fill="currentColor"/>
            <circle cx="8" cy="4.75" r="0.9" fill="currentColor"/>
          </svg>
        `

    return html`
      <sl-alert
        class="canvas-alert canvas-alert--${this.variant}"
        variant=${shoelaceVariant}
        .duration=${this.duration}
        @sl-after-hide=${this._onHidden}>
        <span slot="icon" class="canvas-alert-icon">${icon}</span>
        ${this.message}
      </sl-alert>
    `
  }
}
