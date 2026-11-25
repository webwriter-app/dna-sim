import type {ReactiveController} from "lit"

import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/** Pins the canvas under the navbar and carries the animation speed as a CSS variable. */
export class LayoutController implements ReactiveController {
  readonly style = {"--dna-navbar-height": "0px", "--dna-anim-speed": "1"}
  private observer: ResizeObserver | null = null
  private observedNavbar: Element | null = null

  constructor(private readonly host: WebwriterDnaSimulation) {
    host.addController(this)
  }

  hostDisconnected() {
    this.observer?.disconnect()
    this.observer = null
    this.observedNavbar = null
  }

  setSpeed(speed: number) {
    this.style["--dna-anim-speed"] = String(speed)
  }

  /** Call after every render. */
  update() {
    this.ensureObserver()
    this.syncCanvasRowHeight()
  }

  /**
   * Pin canvas under the navbar: set --dna-navbar-height from the real
   * navbar box (tabs + child nav + optional extra bar).
   * Canvas uses top/bottom absolute pinning, so it cannot outgrow `.sim-shell`.
   */
  private syncCanvasRowHeight() {
    const navbar = this.host.renderRoot.querySelector("dna-simulation-navbar") as HTMLElement | null
    const next = `${navbar?.offsetHeight ?? 0}px`
    if (this.style["--dna-navbar-height"] === next) return
    this.style["--dna-navbar-height"] = next
    this.host.requestUpdate()
    this.host.workspace.refresh()
  }

  private ensureObserver() {
    if (!this.observer) {
      this.observer = new ResizeObserver(() => this.syncCanvasRowHeight())
      this.observer.observe(this.host)
    }
    const navbar = this.host.renderRoot.querySelector("dna-simulation-navbar")
    if (navbar && navbar !== this.observedNavbar) {
      if (this.observedNavbar) this.observer.unobserve(this.observedNavbar)
      this.observer.observe(navbar)
      this.observedNavbar = navbar
    }
  }
}
