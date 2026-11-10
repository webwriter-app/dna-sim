import {html, LitElement, svg, type TemplateResult} from "lit"
import {property, state} from "lit/decorators.js"
import {localized, msg} from "@lit/localize"
import {ScopedElementsMixin} from "@open-wc/scoped-elements/lit-element.js"
import SlInput from "@shoelace-style/shoelace/dist/components/input/input.component.js"

import {shoelaceLight} from "../../lib/shoelace-theme.js"
import {codonCardStyles} from "./codon-card.styles.js"
import {renderAminoAcidBadge} from "../../lib/molecules/amino-acid.js"
import {
  buildAminoAcidList,
  buildCodonWheelArcs,
  donutSlicePath,
  midDeg,
  polar,
  type AminoAcidEntry,
  type AminoDragPayload,
  type WheelArc,
} from "../../lib/phases/codon-wheel.js"
import {localizedAminoAcidFullName} from "../../lib/localize-text.js"

const CX = 200
const CY = 200
const R_CENTER = 28
const R1_OUT = 62
const R2_OUT = 96
const R3_OUT = 128
const R_AA_OUT = 188

export type CodonDrawerTab = "wheel" | "list"

export type CodonCardAction =
  | {action: "amino-pick"; aminoAcid: string}
  | {action: "amino-drag-start"; payload: AminoDragPayload}
  | {action: "amino-drag-move"; payload: AminoDragPayload; clientX: number; clientY: number}
  | {action: "amino-drag-end"; payload: AminoDragPayload; clientX: number; clientY: number}

/** Codon wheel / amino-acid list — the drawer's outer chrome (header, tabs, close button) lives on the parent widget. */
@localized()
export class DnaCodonCard extends ScopedElementsMixin(LitElement) {
  static styles = [shoelaceLight, codonCardStyles]

  static scopedElements = {
    "sl-input": SlInput,
  }

  @property({type: String}) tab: CodonDrawerTab = "wheel"
  /** Translation places amino acids by dragging; Mutations is look-up only. */
  @property({type: Boolean}) allowDrag = true
  /** Teacher Mutations protein-goal: click an amino acid to append it to the target. */
  @property({type: Boolean}) pickable = false

  @state() private _search = ""
  @state() private _draggingId: string | null = null
  @state() private _dragGhost: {label: string; x: number; y: number} | null = null

  private readonly _arcs: WheelArc[] = buildCodonWheelArcs()
  private readonly _aminoAcids: AminoAcidEntry[] = buildAminoAcidList()

  private _emit(detail: CodonCardAction) {
    this.dispatchEvent(
      new CustomEvent("dna-codon-card-action", {
        bubbles: true,
        composed: true,
        detail,
      }),
    )
  }

  /** Pixels of pointer movement before a press becomes a drag — lets a plain
      scroll/tap (esp. touch/trackpad) pass through untouched instead of the
      old behavior of hijacking every pointerdown on a wheel arc or list card. */
  private static readonly DRAG_THRESHOLD_PX = 6

  private _onAminoPointerDown = (e: PointerEvent, payload: AminoDragPayload, dragId: string) => {
    if (!this.allowDrag) return
    if (e.button !== 0) return

    const pointerId = e.pointerId
    const target = e.currentTarget as Element | null
    const startX = e.clientX
    const startY = e.clientY
    let dragging = false

    const beginDrag = (ev: PointerEvent) => {
      dragging = true
      target?.setPointerCapture?.(pointerId)
      this._draggingId = dragId
      this._dragGhost = {label: payload.aminoAcid, x: ev.clientX, y: ev.clientY}
      this._emit({action: "amino-drag-start", payload})
      this.requestUpdate()
    }

    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      if (!dragging) {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (Math.hypot(dx, dy) < DnaCodonCard.DRAG_THRESHOLD_PX) return
        ev.preventDefault()
        beginDrag(ev)
        return
      }
      ev.preventDefault()
      this._dragGhost = {label: payload.aminoAcid, x: ev.clientX, y: ev.clientY}
      this._emit({
        action: "amino-drag-move",
        payload,
        clientX: ev.clientX,
        clientY: ev.clientY,
      })
      this.requestUpdate()
    }

    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", end)
      window.removeEventListener("pointercancel", end)
      if (!dragging) return

      try {
        target?.releasePointerCapture?.(pointerId)
      } catch {
        /* already released */
      }

      this._emit({
        action: "amino-drag-end",
        payload,
        clientX: ev.clientX,
        clientY: ev.clientY,
      })
      this._draggingId = null
      this._dragGhost = null
      this.requestUpdate()
    }

    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", end)
    window.addEventListener("pointercancel", end)
  }

  private _onAminoPick = (e: Event, aminoAcid: string) => {
    if (!this.pickable) return
    if (aminoAcid === "Stop") return
    e.stopPropagation()
    this._emit({action: "amino-pick", aminoAcid})
  }

  private _labelAt(
    arc: WheelArc,
    r: number,
    className: string,
  ): TemplateResult {
    const mid = midDeg(arc.startDeg, arc.endDeg)
    const p = polar(CX, CY, r, mid)
    return svg`
      <text
        class="wheel-label ${className}"
        x="${p.x}"
        y="${p.y}"
        text-anchor="middle"
        dominant-baseline="middle">
        ${arc.isStop ? msg("Stop") : arc.label}
      </text>
    `
  }

  private _renderRing(
    kind: WheelArc["kind"],
    innerR: number,
    outerR: number,
    labelR: number,
    labelClass: string,
  ) {
    return this._arcs
      .filter((a) => a.kind === kind)
      .map((arc) => {
        const path = donutSlicePath(CX, CY, innerR, outerR, arc.startDeg, arc.endDeg)
        if (kind === "amino" && arc.drag) {
          return svg`
            <g
              class="wheel-amino ${arc.isStart ? "is-start" : ""} ${arc.isStop ? "is-stop" : ""} ${this.allowDrag ? "" : "is-static"} ${this.pickable && !arc.isStop ? "is-pickable" : ""} ${this._draggingId === arc.id ? "is-dragging" : ""}"
              @pointerdown=${(e: PointerEvent) => this._onAminoPointerDown(e, arc.drag!, arc.id)}
              @click=${(e: Event) => this._onAminoPick(e, arc.drag!.aminoAcid)}>
              ${this.pickable && !arc.isStop
                ? svg`<title>${msg("Add to goal")}</title>`
                : null}
              <path
                d="${path}"
                fill="${arc.isStart ? "#dcfce7" : arc.isStop ? "#fee2e2" : arc.fill}"
                stroke="${arc.stroke}"
                stroke-width="0.8"/>
              ${this._labelAt(arc, labelR, labelClass)}
            </g>
          `
        }
        return svg`
          <path
            d="${path}"
            fill="${arc.fill}"
            stroke="${arc.stroke}"
            stroke-width="0.7"
            pointer-events="none"/>
          ${this._labelAt(arc, labelR, labelClass)}
        `
      })
  }

  private _renderWheel() {
    return html`
      <svg
        class="codon-wheel"
        viewBox="0 0 400 400"
        role="img"
        aria-label="${msg("Amino acid codon wheel")}">
        ${this._renderRing("amino", R3_OUT, R_AA_OUT, (R3_OUT + R_AA_OUT) / 2, "amino")}
        ${this._renderRing("base3", R2_OUT, R3_OUT, (R2_OUT + R3_OUT) / 2, "base")}
        ${this._renderRing("base2", R1_OUT, R2_OUT, (R1_OUT + R2_OUT) / 2, "base")}
        ${this._renderRing("base1", R_CENTER, R1_OUT, (R_CENTER + R1_OUT) / 2, "base")}
        <circle cx="${CX}" cy="${CY}" r="${R_CENTER - 1}" fill="#fff" stroke="#0f766e" stroke-width="1.5"/>
        <text class="wheel-center-label" x="${CX}" y="${CY}" text-anchor="middle" dominant-baseline="middle">5′</text>
      </svg>
    `
  }

  private _matchesSearch(entry: AminoAcidEntry, query: string): boolean {
    if (!query) return true
    const fullName = localizedAminoAcidFullName(entry.threeLetter)
    return (
      fullName.toLowerCase().includes(query) ||
      entry.fullName.toLowerCase().includes(query) ||
      entry.threeLetter.toLowerCase().includes(query) ||
      entry.oneLetter.toLowerCase() === query ||
      entry.codons.some((codon) => codon.toLowerCase().includes(query))
    )
  }

  private _renderList() {
    const query = this._search.trim().toLowerCase()
    const entries = this._aminoAcids.filter((entry) => this._matchesSearch(entry, query))

    return html`
      <div class="aa-list">
        <sl-input
          class="aa-search"
          size="small"
          clearable
          placeholder="${msg("Search amino acid…")}"
          .value=${this._search}
          @sl-input=${(e: Event) => {
            this._search = (e.target as SlInput).value as string
            this.requestUpdate()
          }}>
        </sl-input>
        <div class="aa-grid">
          ${entries.length
            ? entries.map((entry) => {
              const dragId = `list-${entry.threeLetter}`
              const payload: AminoDragPayload = {
                aminoAcid: entry.threeLetter,
                oneLetter: entry.oneLetter,
                codons: entry.codons,
              }
              return html`
                <div
                  class="aa-cell ${entry.isStart ? "is-start" : ""} ${this.allowDrag ? "" : "is-static"} ${this.pickable ? "is-pickable" : ""} ${this._draggingId === dragId ? "is-dragging" : ""}"
                  title=${this.pickable ? msg("Add to goal") : ""}
                  @pointerdown=${(e: PointerEvent) => this._onAminoPointerDown(e, payload, dragId)}
                  @click=${(e: Event) => this._onAminoPick(e, entry.threeLetter)}>
                  <span class="aa-one-letter">${entry.oneLetter}</span>
                  <span class="aa-name">${localizedAminoAcidFullName(entry.threeLetter)}</span>
                  <span class="aa-three-letter">${entry.threeLetter}</span>
                  <span class="aa-codons">${entry.codons.join(", ")}</span>
                </div>
              `
            })
            : html`<p class="aa-empty">${msg("No matching amino acid.")}</p>`}
        </div>
      </div>
    `
  }

  render() {
    return html`
      <div class="codon-card-panel">
        ${this.tab === "wheel" ? this._renderWheel() : this._renderList()}
      </div>
      ${this._dragGhost
        ? html`
          <div
            class="amino-drag-ghost"
            style="left:${this._dragGhost.x}px; top:${this._dragGhost.y}px">
            ${renderAminoAcidBadge(this._dragGhost.label, 44)}
          </div>
        `
        : null}
    `
  }
}
