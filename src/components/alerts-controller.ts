import type {ReactiveController} from "lit"

import type {DnaCanvasAlert} from "./canvas-alert"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/** The error alert and the info-button hint shown over the canvas. */
export class AlertsController implements ReactiveController {
  hintOpen = false
  errorMessage = ""
  private lastHintText: string | null = null
  private errorOnDismiss: (() => void) | null = null

  constructor(private readonly host: WebwriterDnaSimulation) {
    host.addController(this)
  }

  hostDisconnected() {
    this.hintOpen = false
    this.errorMessage = ""
    this.errorOnDismiss = null
  }

  /** A new hint text collapses the open hint. */
  syncHintExpansion() {
    const text = this.host.phaseHintText()
    if (text === this.lastHintText) return
    this.hintOpen = false
    this.lastHintText = text
  }

  private hintAlert(): DnaCanvasAlert | null {
    return this.host.renderRoot.querySelector("dna-canvas-alert[data-hint]")
  }

  onHintToggle = () => {
    if (!this.host.showInfoCards) return
    if (this.hintOpen) {
      this.hintAlert()?.dismiss()
      return
    }
    this.hintOpen = true
    this.host.requestUpdate()
  }

  onInfoAlertDismiss = () => {
    if (!this.hintOpen) return
    this.hintOpen = false
    this.host.requestUpdate()
  }

  showError(message: string, onDismiss?: () => void) {
    this.errorOnDismiss = onDismiss ?? null
    this.errorMessage = message
    this.host.requestUpdate()
  }

  /** Run `onDismiss` when the current error alert closes. */
  setErrorDismiss(onDismiss: () => void) {
    this.errorOnDismiss = onDismiss
  }

  onErrorAlertDismiss = () => {
    this.errorMessage = ""
    this.errorOnDismiss?.()
    this.errorOnDismiss = null
    this.host.requestUpdate()
  }
}
