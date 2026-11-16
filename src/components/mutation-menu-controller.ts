import {html, type ReactiveController} from "lit"
import SlPopup from "@shoelace-style/shoelace/dist/components/popup/popup.component.js"

import {DNA_BASE_ICONS, DNA_BASE_ORDER, substitutionTargets, templateBaseForStrandEdit, type DnaBase} from "./mutations"
import type {MutationStrandSide} from "../model/strand-view-model"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

/** The substitute/insert/delete menu that opens on a clicked base in the Mutations phase. */
export class MutationMenuController implements ReactiveController {
  constructor(private readonly host: WebwriterDnaSimulation) {
    host.addController(this)
  }

  hostDisconnected() {}

  onBaseClick = (
    index: number,
    strand: MutationStrandSide,
    e: MouseEvent,
  ) => {
    e.stopPropagation()
    if (this.host.currentPhase !== "Mutations") return
    if (index < 0 || index >= this.host.mutationsSequence.length) return
    this.host.mutations.openAt(index, strand)
  }

  /** Clear Mutations selection/menu when clicking empty canvas (base clicks stopPropagation). */
  onViewportClick = (_e: MouseEvent) => {
    if (this.host.currentPhase !== "Mutations") return
    this.host.mutations.dismiss()
  }

  /** DOM node for the selected base — used as the sl-popup anchor. */
  anchor(): HTMLElement | null {
    const index = this.host.mutations.selectedIndex
    const strand = this.host.mutations.selectedStrand
    if (index === null || strand === null) return null
    const col = this.host.renderRoot.querySelector(`.bp-col[data-bp-index="${index}"]`)
    if (!(col instanceof HTMLElement)) return null
    const base = col.querySelector(strand === "template" ? ".bp-top" : ".bp-bottom")
    return base instanceof HTMLElement ? base : null
  }

  reposition() {
    if (!this.host.mutations.menuOpen) return
    const popup = this.host.renderRoot.querySelector("sl-popup.mutation-menu-popup")
    if (!(popup instanceof SlPopup)) return
    const anchor = this.anchor()
    const area = this.host.renderRoot.querySelector(".canvas-area")
    popup.anchor = anchor ?? ""
    if (area instanceof HTMLElement) {
      popup.flipBoundary = area
      popup.shiftBoundary = area
    }
    // After flyout open/close the panel size changes — refresh Floating UI.
    this.host.nextFrame(() => popup.reposition())
  }

  onPopupReposition = (e: Event) => {
    const popup = e.currentTarget
    if (!(popup instanceof HTMLElement)) return
    const placement = popup.getAttribute("data-current-placement") ?? "right-start"
    const prevSide = this.host.mutations.menuSide
    this.host.mutations.setMenuSideFromPlacement(placement)
    // Layout flipped (submenu now opens the other way) — remeasure once.
    if (prevSide !== this.host.mutations.menuSide && popup instanceof SlPopup) {
      this.host.nextFrame(() => popup.reposition())
    }
  }

  onAction = (action: {
    type: "substitute" | "insert" | "delete"
    base?: DnaBase
  }) => {
    const index = this.host.mutations.selectedIndex
    const strand = this.host.mutations.selectedStrand ?? "template"
    if (index === null) return
    if (action.type === "substitute" && action.base) {
      const templateBase = templateBaseForStrandEdit(action.base, strand)
      if (templateBase) this.host.mutationEdits.substituteBase(index, templateBase)
    } else if (action.type === "insert" && action.base) {
      const templateBase = templateBaseForStrandEdit(action.base, strand)
      if (templateBase) this.host.mutationEdits.insertBase(index, templateBase)
    } else if (action.type === "delete") {
      this.host.mutationEdits.deleteBase(index)
    }
    this.host.mutations.dismiss()
  }

  render() {
    if (this.host.currentPhase !== "Mutations" || !this.host.mutations.menuOpen) return null

    // Icons / options match the clicked strand (bottom click → bottom base).
    const current = (this.host.mutations.displayBase ?? "A").toUpperCase() as DnaBase
    const currentIcon = DNA_BASE_ICONS[current] ?? DNA_BASE_ICONS.A
    const flyout = this.host.mutations.flyout
    const menuSide = this.host.mutations.menuSide
    const flyoutLeft = menuSide === "left"
    const anchor = this.anchor()
    const area = this.host.renderRoot.querySelector(".canvas-area")
    const chevron = flyoutLeft ? "‹" : "›"

    return html`
      <sl-popup
        class="mutation-menu-popup"
        .anchor=${anchor ?? ""}
        .active=${anchor !== null}
        placement="right-start"
        strategy="fixed"
        distance="4"
        flip
        shift
        flip-fallback-placements="left-start left"
        .flipPadding=${8}
        .shiftPadding=${8}
        .flipBoundary=${area instanceof HTMLElement ? area : undefined}
        .shiftBoundary=${area instanceof HTMLElement ? area : undefined}
        @sl-reposition=${this.onPopupReposition}>
        <div
          class="mutation-menu ${flyoutLeft ? "is-flyout-left" : ""}"
          @pointerdown=${(e: Event) => e.stopPropagation()}
          @click=${(e: Event) => e.stopPropagation()}>
          <div class="mutation-menu-primary" role="menu">
            <button
              type="button"
              class="mutation-menu-item ${flyout === "substitution" ? "is-active" : ""}"
              role="menuitem"
              aria-haspopup="true"
              aria-expanded="${flyout === "substitution"}"
              @click=${() => this.host.mutations.toggleFlyout("substitution")}>
              ${flyoutLeft
                ? html`<span class="mutation-menu-chevron" aria-hidden="true">${chevron}</span><span>${this.host.msg("Substitution")}</span>`
                : html`<span>${this.host.msg("Substitution")}</span><span class="mutation-menu-chevron" aria-hidden="true">${chevron}</span>`}
            </button>
            <button
              type="button"
              class="mutation-menu-item ${flyout === "insertion" ? "is-active" : ""}"
              role="menuitem"
              aria-haspopup="true"
              aria-expanded="${flyout === "insertion"}"
              @click=${() => this.host.mutations.toggleFlyout("insertion")}>
              ${flyoutLeft
                ? html`<span class="mutation-menu-chevron" aria-hidden="true">${chevron}</span><span>${this.host.msg("Insertion")}</span>`
                : html`<span>${this.host.msg("Insertion")}</span><span class="mutation-menu-chevron" aria-hidden="true">${chevron}</span>`}
            </button>
            <button
              type="button"
              class="mutation-menu-item"
              role="menuitem"
              @click=${() => this.onAction({type: "delete"})}>
              <span>${this.host.msg("Deletion")}</span>
            </button>
          </div>

          ${flyout === "substitution"
            ? html`
              <div class="mutation-menu-flyout" role="menu">
                ${substitutionTargets(current).map(
                  (base) => html`
                    <button
                      type="button"
                      class="mutation-menu-option"
                      role="menuitem"
                      @click=${() => this.onAction({type: "substitute", base})}>
                      <img class="mutation-menu-base" src="${currentIcon}" alt="${current}" draggable="false"/>
                      <span class="mutation-menu-arrow" aria-hidden="true">→</span>
                      <img class="mutation-menu-base" src="${DNA_BASE_ICONS[base]}" alt="${base}" draggable="false"/>
                    </button>
                  `,
                )}
              </div>
            `
            : flyout === "insertion"
              ? html`
                <div class="mutation-menu-flyout is-insertion" role="menu">
                  ${DNA_BASE_ORDER.map(
                    (base) => html`
                      <button
                        type="button"
                        class="mutation-menu-option"
                        role="menuitem"
                        @click=${() => this.onAction({type: "insert", base})}>
                        <span>${this.host.msg("Insert")}</span>
                        <img class="mutation-menu-base" src="${DNA_BASE_ICONS[base]}" alt="${base}" draggable="false"/>
                      </button>
                    `,
                  )}
                </div>
              `
            : html`
              <div
                class="mutation-menu-flyout mutation-menu-flyout--spacer"
                aria-hidden="true"></div>
            `}
        </div>
      </sl-popup>
    `
  }
}
