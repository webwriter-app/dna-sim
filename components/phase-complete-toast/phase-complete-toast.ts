import {html, LitElement} from "lit"
import {property, state} from "lit/decorators.js"
import {localized, msg} from "@lit/localize"
import {ScopedElementsMixin} from "@open-wc/scoped-elements/lit-element.js"
import SlButton from "@shoelace-style/shoelace/dist/components/button/button.component.js"

import {shoelaceLight} from "../../lib/shoelace-theme.js"
import {phaseCompleteToastStyles} from "./phase-complete-toast.styles.js"

export const PHASE_COMPLETE_TOAST_MS = 5000
/** Keep in sync with `.phase-toast` opacity transition duration. */
export const PHASE_COMPLETE_TOAST_FADE_MS = 280

/**
 * Top-center canvas toast shown once a phase's completion condition is met.
 * Offers a "Next phase" button and auto-dismisses after `duration`, with a
 * right-to-left countdown bar. Also dismissible by clicking outside it.
 * Fades out via CSS opacity transition before the dismiss/continue event fires.
 */
@localized()
export class DnaPhaseCompleteToast extends ScopedElementsMixin(LitElement) {
  static styles = [shoelaceLight, phaseCompleteToastStyles]

  static scopedElements = {
    "sl-button": SlButton,
  }

  @property({type: String}) message = ""
  @property({type: Number}) duration = PHASE_COMPLETE_TOAST_MS
  @property({type: Boolean}) showContinue = true

  @state() private _leaving = false

  private _dismissTimer: ReturnType<typeof setTimeout> | null = null
  private _leaveTimer: ReturnType<typeof setTimeout> | null = null
  private _outsideClickListening = false

  connectedCallback() {
    super.connectedCallback()
    this._dismissTimer = setTimeout(
      () => this._beginLeave("dna-phase-complete-dismiss"),
      this.duration,
    )
    requestAnimationFrame(() => {
      if (this.isConnected) this._ensureOutsideClick()
    })
  }

  disconnectedCallback() {
    this._clearDismissTimer()
    this._clearLeaveTimer()
    this._releaseOutsideClick()
    super.disconnectedCallback()
  }

  private _clearDismissTimer() {
    if (this._dismissTimer) {
      clearTimeout(this._dismissTimer)
      this._dismissTimer = null
    }
  }

  private _clearLeaveTimer() {
    if (this._leaveTimer) {
      clearTimeout(this._leaveTimer)
      this._leaveTimer = null
    }
  }

  private _beginLeave(eventName: "dna-phase-complete-dismiss" | "dna-phase-complete-continue") {
    if (this._leaving) return
    this._leaving = true
    this._clearDismissTimer()
    this._releaseOutsideClick()

    // Apply the class immediately so the opacity transition starts on the
    // live node (don't wait for Lit's next render).
    this.renderRoot.querySelector(".phase-toast")?.classList.add("is-leaving")

    this._leaveTimer = setTimeout(() => {
      this._leaveTimer = null
      this.dispatchEvent(
        new CustomEvent(eventName, {bubbles: true, composed: true}),
      )
    }, PHASE_COMPLETE_TOAST_FADE_MS)
  }

  private _onContinueClick = () => {
    this._beginLeave("dna-phase-complete-continue")
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
    const inside = e.composedPath().some((el) => el === this)
    if (!inside) this._beginLeave("dna-phase-complete-dismiss")
  }

  render() {
    if (!this.message) return null

    return html`
      <div class="phase-toast ${this._leaving ? "is-leaving" : ""}" role="status">
        <span class="phase-toast-message">${this.message}</span>
        ${this.showContinue
          ? html`
            <sl-button
              variant="primary"
              size="small"
              ?disabled=${this._leaving}
              @click=${this._onContinueClick}>
              ${msg("Next phase")}
            </sl-button>
          `
          : null}
        <div class="phase-toast-bar" style="animation-duration:${this.duration}ms"></div>
      </div>
    `
  }
}
