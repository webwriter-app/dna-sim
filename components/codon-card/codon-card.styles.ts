import {css} from "lit"

/** Panel-only styles — positioning is owned by the widget layer. */
export const codonCardStyles = css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    pointer-events: auto;
    font-family: system-ui, sans-serif;
  }

  .codon-card-panel {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
  }

  .codon-wheel {
    display: block;
    width: 100%;
    max-height: 100%;
    height: auto;
    flex: 0 1 auto;
    user-select: none;
    -webkit-user-drag: none;
    touch-action: none;
  }

  .wheel-amino {
    cursor: grab;
  }

  .wheel-amino.is-static {
    cursor: default;
  }

  .wheel-amino.is-pickable {
    cursor: pointer;
  }

  .wheel-amino:active {
    cursor: grabbing;
  }

  .wheel-amino.is-dragging {
    opacity: 0.45;
  }

  .wheel-amino:hover .wheel-label.amino {
    font-size: 11px;
    font-weight: 800;
  }

  .wheel-amino:hover path {
    stroke-width: 1.6;
  }

  .wheel-label {
    fill: #0f172a;
    font-size: 9px;
    font-weight: 700;
    pointer-events: none;
    transition: font-size 0.12s ease;
  }

  .wheel-label.base {
    font-size: 10px;
  }

  .wheel-label.amino {
    font-size: 8px;
    font-weight: 650;
  }

  .wheel-center-label {
    fill: #0f766e;
    font-size: 11px;
    font-weight: 700;
  }

  .aa-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    flex: 1 1 0;
    min-height: 0;
    height: 100%;
    /* Keep visible so the sl-input focus ring isn't clipped on the sides;
       only .aa-grid scrolls. */
    overflow: visible;
  }

  .aa-search {
    flex: 0 0 auto;
    width: 100%;
  }

  .aa-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    align-content: start;
    flex: 1 1 0;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .aa-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    padding: 0.5rem 0.4rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    text-align: center;
    cursor: grab;
    user-select: none;
    -webkit-user-drag: none;
    transition: border-color 0.15s, background 0.15s, opacity 0.15s;
  }

  .aa-cell.is-static {
    cursor: default;
  }

  .aa-cell.is-pickable {
    cursor: pointer;
  }

  .aa-cell:hover {
    border-color: #cbd5e1;
    background: #f1f5f9;
  }

  .aa-cell:active {
    cursor: grabbing;
  }

  .aa-cell.is-dragging {
    opacity: 0.45;
  }

  .aa-cell.is-start {
    border-color: #86efac;
    background: #f0fdf4;
  }

  .aa-one-letter {
    font-size: 1.15rem;
    font-weight: 800;
    color: #0f766e;
    line-height: 1.1;
  }

  .aa-name {
    font-size: 0.75rem;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.15;
  }

  .aa-three-letter {
    font-size: 0.68rem;
    color: #64748b;
  }

  .aa-codons {
    font-size: 0.66rem;
    font-family: "SFMono-Regular", Consolas, monospace;
    color: #94a3b8;
    word-break: break-word;
  }

  .aa-empty {
    grid-column: 1 / -1;
    margin: 1rem 0;
    font-size: 0.85rem;
    color: #94a3b8;
    font-style: italic;
    text-align: center;
  }

  .amino-drag-ghost {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    pointer-events: none;
    line-height: 0;
    filter: drop-shadow(0 4px 14px rgba(15, 23, 42, 0.25));
  }

  .amino-acid-badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    line-height: 0;
  }

  .amino-acid-badge img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .amino-acid-label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3d2914;
    font-size: 0.28em;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    pointer-events: none;
    user-select: none;
  }
`
