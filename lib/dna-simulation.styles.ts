import {css} from "lit"

/** Styles for the DNA simulation widget. */
export const widgetStyles = css`
  :host {
    --color-adenine:  #239d46;
    --color-thymine:  #c10077;
    --color-cytosine: #b4d7f5;
    --color-guanine:  #f1e21a;
    --color-uracil:   #e07428;
    --dna-navbar-height: 0px;
    --dna-anim-speed: 1;

    font-family: var(--sl-font-sans, sans-serif);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: auto;
    min-height: 400px;
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    background-color: #ffffff;
    overflow: visible;
    position: relative;
    -webkit-user-select: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  ::selection {
    background: transparent;
    color: inherit;
  }

  ::-moz-selection {
    background: transparent;
    color: inherit;
  }

  sl-input,
  sl-textarea,
  input,
  textarea {
    -webkit-user-select: text;
    user-select: text;
  }

  img, svg {
    -webkit-user-drag: none;
    -webkit-user-select: none;
    user-select: none;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  /* Simulation viewport stays 520px. Teacher options sit in-flow below
     this shell when WebWriter does not extract part=options (narrow). */
  .sim-shell {
    position: relative;
    flex: 0 0 auto;
    width: 100%;
    height: 520px;
    min-height: 400px;
    min-width: 0;
    overflow: hidden;
  }

  dna-simulation-navbar {
    display: block;
    position: relative;
    z-index: 2;
  }

  /* ── Canvas row (everything below the navbar) ────────────
     Absolutely pinned: top = navbar height, bottom = 0.
     That is exactly (sim-shell − navbar) with no arithmetic overflow. */
  .canvas-row {
    position: absolute;
    top: var(--dna-navbar-height);
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: stretch;
    min-height: 0;
    overflow: hidden;
    z-index: 1;
  }

  .canvas-area {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    background: #ffffff;
  }

  .canvas-overlays {
    position: absolute;
    inset: 0;
    /* Overlay stack above the canvas so bottom-right controls receive clicks.
       pointer-events: none lets clicks pass through empty areas to the canvas. */
    z-index: 250;
    pointer-events: none;
  }

  /* ── Codon-wheel drawer (Translation phase only) */
  .codon-drawer {
    position: relative;
    flex: 0 0 auto;
    width: 0;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background: #f8fafc;
    border-left: 1px solid transparent;
    transition: width 0.3s ease, border-left-color 0.3s ease;
  }

  .codon-drawer.is-open {
    width: 400px;
    border-left-color: #e2e8f0;
  }

  /* Header on top, content fills the rest — same height as the canvas. */
  .codon-drawer-body {
    box-sizing: border-box;
    width: 400px;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  .codon-drawer.is-open .codon-drawer-body {
    opacity: 1;
    pointer-events: auto;
  }

  .codon-drawer-header {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.65rem 0;
  }

  .drawer-tabs {
    flex: 1 1 auto;
    display: flex;
    min-width: 0;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
  }

  .drawer-title {
    flex: 1 1 auto;
    min-width: 0;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: #334155;
    line-height: 1.3;
  }

  .drawer-title.is-teacher-tip {
    font-size: 0.95rem;
    font-weight: 400;
    color: #94a3b8;
    line-height: 1.3;
  }

  .codon-drawer-header--list {
    align-items: center;
    padding: 0.75rem 0.75rem 0.45rem;
  }

  .codon-drawer-header--tip {
    padding: 0.75rem 0.75rem 0.35rem;
  }

  .codon-drawer-inner.is-flush-top {
    padding-top: 0;
  }

  .drawer-tab {
    flex: 1;
    margin: 0;
    padding: 0.4rem 0.5rem;
    border: none;
    border-right: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #334155;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .drawer-tab:last-child {
    border-right: none;
  }

  .drawer-tab:hover:not(.active) {
    background: #f1f5f9;
  }

  .drawer-tab.active {
    background: var(--sl-color-primary-600, #2563eb);
    color: #ffffff;
  }

  .drawer-tab:focus-visible {
    outline: 2px solid var(--sl-color-primary-400, #60a5fa);
    outline-offset: -2px;
  }

  /* Matches .canvas-overlays' info button — same corner, same icon language. */
  .codon-drawer-close {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.15s ease, transform 0.15s ease;
  }

  .codon-drawer-close:hover {
    color: #64748b;
  }

  .codon-drawer-close svg {
    width: 1.4rem;
    height: 1.4rem;
    display: block;
  }

  .codon-drawer-close:hover svg {
    transform: scale(1.1);
  }

  .codon-drawer-inner {
    box-sizing: border-box;
    flex: 1 1 0;
    min-height: 0;
    width: 100%;
    padding: 0.75rem;
    overflow: hidden;
  }

  .codon-drawer-inner dna-codon-card {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  /* Floating menu button — bottom-right of the canvas; opens the codon drawer. */
  .codon-drawer-toggle {
    position: absolute;
    right: 0.75rem;
    bottom: 0.75rem;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    color: #475569;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  /* Phase-local retry — same corner as the codon menu; stacks above it in Translation. */
  .phase-reset-btn {
    position: absolute;
    right: 0.75rem;
    bottom: 0.75rem;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    background: #ffffff;
    color: #475569;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }

  .phase-reset-btn.has-codon-toggle {
    bottom: calc(0.75rem + 2.5rem + 0.5rem);
  }

  .phase-reset-btn:hover {
    color: #0f172a;
    border-color: #94a3b8;
    background: #f8fafc;
  }

  .phase-reset-btn svg {
    width: 1.15rem;
    height: 1.15rem;
    display: block;
  }

  .phase-reset-btn sl-icon {
    font-size: 1.15rem;
  }

  /* Mutations menu — anchored to the clicked base via sl-popup. */
  .mutation-menu-popup {
    pointer-events: none;
  }

  .mutation-menu-popup::part(popup) {
    z-index: 6;
    pointer-events: auto;
  }

  .mutation-menu {
    --mutation-row-height: 2.35rem;
    --mutation-row-gap: 0.1rem;
    display: flex;
    align-items: flex-start;
    gap: 0;
    pointer-events: auto;
    font-family: inherit;
    /* One shadow for the whole menu — per-panel shadows tinted each other. */
    filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.16));
  }

  /* When the popup flips to the left of the base, open submenus outward (left). */
  .mutation-menu.is-flyout-left {
    flex-direction: row-reverse;
  }

  /* Align row labels to the right (toward the base / submenu hint side). */
  .mutation-menu.is-flyout-left .mutation-menu-item {
    text-align: right;
  }

  .mutation-menu.is-flyout-left .mutation-menu-item > :last-child {
    margin-left: auto;
  }

  .mutation-menu-primary,
  .mutation-menu-flyout {
    display: flex;
    flex-direction: column;
    gap: var(--mutation-row-gap);
    padding: 0.3rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #f1f5f9;
  }

  .mutation-menu-primary {
    min-width: 10.5rem;
  }

  /* Overlap the shared edge so parent + child read as one continuous panel. */
  .mutation-menu-flyout {
    width: max-content;
    flex-shrink: 0;
    box-sizing: border-box;
    margin-left: -1px;
  }

  .mutation-menu.is-flyout-left .mutation-menu-flyout {
    margin-left: 0;
    margin-right: -1px;
  }

  /* Reserves flyout width so sl-popup flip uses combined size from the start. */
  .mutation-menu-flyout--spacer {
    /* ~ Insert label + gap + base icon, or icon → icon row — tuned in CSS only. */
    width: 6.75rem;
    min-height: var(--mutation-row-height);
    visibility: hidden;
    pointer-events: none;
    border-color: transparent;
    background: transparent;
    box-shadow: none;
    margin-left: 0;
    margin-right: 0;
  }

  /* Align Insertion flyout under the Insertion row (1st row + gap). */
  .mutation-menu-flyout.is-insertion {
    margin-top: calc(var(--mutation-row-height) + var(--mutation-row-gap));
  }

  .mutation-menu-item,
  .mutation-menu-option {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    height: var(--mutation-row-height);
    min-height: var(--mutation-row-height);
    margin: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #334155;
    font: inherit;
    font-weight: 500;
    line-height: 1;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
  }

  .mutation-menu-item {
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    padding: 0 0.65rem;
    font-size: 0.88rem;
  }

  .mutation-menu-item > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .mutation-menu-option {
    width: max-content;
    gap: 0.4rem;
    padding: 0 0.4rem;
    font-size: 0.85rem;
  }

  .mutation-menu-flyout.is-insertion .mutation-menu-option {
    gap: 0.7rem;
  }

  .mutation-menu-item:hover,
  .mutation-menu-item.is-active,
  .mutation-menu-option:hover {
    background: var(--sl-color-primary-600, #2563eb);
    color: #ffffff;
  }

  /* CSS chevron — avoids glyph baseline misalignment of › / ‹. */
  .mutation-menu-chevron {
    flex-shrink: 0;
    width: 0.55rem;
    height: 0.55rem;
    font-size: 0;
    border-right: 2.5px solid currentColor;
    border-bottom: 2.5px solid currentColor;
    transform: rotate(-45deg);
    opacity: 0.9;
  }

  .mutation-menu.is-flyout-left .mutation-menu-chevron {
    transform: rotate(135deg);
  }

  .mutation-menu-arrow {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.85;
    font-size: 0.95rem;
    line-height: 1;
  }

  .mutation-menu-base {
    display: block;
    width: 1.55rem;
    height: 1.55rem;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }

  .reset-confirm-dialog {
    --width: 20rem;
    --body-spacing: 1rem 1.1rem 0.35rem;
    --footer-spacing: 0.75rem 1.1rem 1rem;
  }

  /* Keep the confirm modal inside the widget bounds (Shoelace defaults to position:fixed). */
  .reset-confirm-dialog::part(base) {
    position: absolute;
    inset: 0;
    z-index: 1000;
  }

  .reset-confirm-dialog::part(overlay) {
    position: absolute;
    inset: 0;
  }

  .reset-confirm-dialog::part(panel) {
    border-radius: 8px;
  }

  .reset-confirm-dialog::part(body) {
    font-size: 0.95rem;
    line-height: 1.4;
    color: #334155;
  }

  .codon-drawer-toggle:hover {
    color: #0f172a;
    border-color: #94a3b8;
    background: #f8fafc;
  }

  .codon-drawer-toggle.is-open {
    color: var(--sl-color-primary-700, #1d4ed8);
    border-color: var(--sl-color-primary-300, #93c5fd);
    background: var(--sl-color-primary-50, #eff6ff);
  }

  .codon-drawer-toggle svg {
    width: 1.15rem;
    height: 1.15rem;
    display: block;
  }

  /* ── Pan/zoom workspace (inside .canvas-area) ───────────── */
  .workspace-root {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    background: #ffffff;
  }

  .workspace-viewport {
    position: absolute;
    inset: 0;
    overflow: hidden;
    touch-action: none;
    user-select: none;
    outline: none;
    cursor: default;
    background: #ffffff;
  }

  .workspace-viewport.is-panning {
    cursor: grabbing;
  }

  .workspace-stage {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    will-change: transform;
  }

  /* Applied briefly when the pan shifts programmatically (e.g. codon-wheel panel opening/closing). */
  .workspace-stage.is-adjusting {
    transition: transform 0.3s ease;
  }

  .workspace-content {
    position: relative;
    box-sizing: border-box;
    /* Keep generous horizontal room for long strands, but do not inflate
       vertical world height far beyond the visible canvas. */
    padding: 120px 320px;
    width: max-content;
  }

  .zoom-indicator {
    position: absolute;
    bottom: 0.75rem;
    left: 0.75rem;
    z-index: 20;
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 4px 10px;
    user-select: none;
    pointer-events: none;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  }

  /* ── DNA strand ─────────────────────────────────────────── */
  .strand-outer {
    width: max-content;
    display: flex;
    align-items: center;
  }

  .strand-outer.has-polypeptide-compare {
    flex-direction: column;
    align-items: stretch;
  }

  .polypeptide-compare {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.35rem 70px 0.85rem;
  }

  .polypeptide-compare-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 32px;
  }

  .polypeptide-compare-label {
    flex: 0 0 4.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.01em;
  }

  .polypeptide-compare-chain {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.2rem;
  }

  .polypeptide-compare-empty {
    color: #94a3b8;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .strand-inner {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 60px;
  }

  .strand-empty {
    color: #94a3b8;
    font-size: 1.2rem;
    font-weight: bold;
  }

  .strand-polarity {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 11px 0;
    font-size: 12px;
    font-weight: bold;
    color: #64748b;
    user-select: none;
  }

  .strand-polarity > span {
    transition: transform calc(0.45s / var(--dna-anim-speed)) ease-out;
  }

  .strand-pairs-wrap {
    position: relative;
    flex-shrink: 0;
    overflow: visible;
  }

  /* ── Baukasten drop slot (left of replication fork) ─────── */
  .molecule-drop-slot {
    position: absolute;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--sl-color-primary-300, #93c5fd);
    border-radius: 8px;
    background: rgba(37, 99, 235, 0.06);
    pointer-events: auto;
    transition: opacity calc(0.25s / var(--dna-anim-speed)) ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .molecule-drop-slot.is-hover {
    border-color: var(--sl-color-primary-500, #3b82f6);
    background: rgba(37, 99, 235, 0.14);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
  }

  .molecule-drop-slot.is-snapping-out {
    animation: drop-slot-fade-out calc(0.35s / var(--dna-anim-speed)) ease forwards;
    pointer-events: none;
  }

  .molecule-drop-slot.is-error {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.14);
    animation: drop-slot-error calc(0.55s / var(--dna-anim-speed)) ease;
  }

  .molecule-drop-slot--codon {
    border-radius: 12px;
  }

  .molecule-snapped {
    position: absolute;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    transition: left calc(0.45s / var(--dna-anim-speed)) ease-out, top calc(0.45s / var(--dna-anim-speed)) ease-out;
    animation: molecule-snap-in calc(0.35s / var(--dna-anim-speed)) ease-out;
  }

  .molecule-snapped.is-fading-out {
    animation: molecule-snap-out calc(0.35s / var(--dna-anim-speed)) ease forwards;
  }

  /* Helicase arcs up-right and fades out after the last base pair splits. */
  .molecule-snapped.is-molecule-exit {
    transform-origin: 50% 100%;
    transition: none;
    pointer-events: none;
    animation: molecule-exit-up-right calc(0.6s / var(--dna-anim-speed)) cubic-bezier(0.4, 0, 0.7, 1) forwards;
  }

  .molecule-drag-ghost,
  .molecule-discard-ghost {
    position: absolute;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .molecule-drag-ghost img,
  .molecule-discard-ghost img {
    display: block;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
  }

  .molecule-drag-ghost {
    cursor: grabbing;
  }

  .molecule-discard-ghost {
    animation: molecule-discard-out calc(0.2s / var(--dna-anim-speed)) ease forwards;
  }

  @keyframes molecule-discard-out {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.75);
    }
  }

  .molecule-snapped img {
    display: block;
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.28));
  }

  .molecule-snapped.is-locked img {
    pointer-events: none;
    cursor: default;
  }

  .molecule-snapped img:active {
    cursor: grabbing;
  }

  .molecule-snapped.is-fading-out img {
    pointer-events: none;
    cursor: default;
  }

  .ribosome-inside {
    position: absolute;
    z-index: 0;
    display: block;
    pointer-events: none;
    transition: left calc(0.45s / var(--dna-anim-speed)) ease-out, top calc(0.45s / var(--dna-anim-speed)) ease-out;
    animation: molecule-snap-in calc(0.35s / var(--dna-anim-speed)) ease-out;
  }

  .ribosome-snapped {
    position: absolute;
    z-index: 4;
    pointer-events: none;
    transition: left calc(0.45s / var(--dna-anim-speed)) ease-out, top calc(0.45s / var(--dna-anim-speed)) ease-out;
    animation: molecule-snap-in calc(0.35s / var(--dna-anim-speed)) ease-out;
  }

  /* Closing fill must cover the polypeptide (z-index 6). */
  .ribosome-snapped.is-closing {
    z-index: 7;
  }

  .ribosome-snapped .ribosome-border {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: block;
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.28));
    z-index: 1;
  }

  /* Same footprint as the border; fades in after stop-codon tRNA release. */
  .ribosome-snapped .ribosome-fill {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: block;
    pointer-events: none;
    opacity: 0;
    z-index: 2;
  }

  .ribosome-snapped .ribosome-fill.is-visible {
    animation: ribosome-fill-in calc(1.1s / var(--dna-anim-speed)) ease-in forwards;
  }

  @keyframes ribosome-fill-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Top/bottom subunits — same footprint as the fill; split vertically like replication bases. */
  .ribosome-snapped .ribosome-half {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: block;
    pointer-events: none;
    opacity: 1;
    z-index: 3;
    will-change: transform, opacity;
    transition:
      transform calc(1.45s / var(--dna-anim-speed)) cubic-bezier(0.33, 0, 0.55, 1),
      opacity calc(1.45s / var(--dna-anim-speed)) cubic-bezier(0.33, 0, 0.55, 1);
  }

  .ribosome-snapped .ribosome-half-top.is-splitting {
    transform: translate(-50%, calc(-50% - var(--ribosome-split-dist, 120px)));
    opacity: 0;
  }

  .ribosome-snapped .ribosome-half-bottom.is-splitting {
    transform: translate(-50%, calc(-50% + var(--ribosome-split-dist, 120px)));
    opacity: 0;
  }

  /* Dashed drop hint, centered over the right slot where the active codon always sits. */
  .ribosome-aa-dropzone {
    position: absolute;
    left: 83.33%;
    top: 45%;
    transform: translate(-50%, -50%) scale(1);
    box-sizing: border-box;
    width: 11%;
    height: 15%;
    min-width: 26px;
    min-height: 26px;
    border: 2px dashed #a78bfa;
    border-radius: 6px;
    pointer-events: none;
    z-index: 6;
    opacity: 1;
    transition: transform calc(0.28s / var(--dna-anim-speed)) ease, opacity calc(0.28s / var(--dna-anim-speed)) ease, border-color 0.2s ease, background 0.2s ease;
  }

  .ribosome-aa-dropzone.is-aa-drop-hover {
    border-color: #7c3aed;
    border-style: solid;
    background: rgba(124, 58, 237, 0.12);
  }

  .ribosome-aa-dropzone.is-aa-drop-hidden {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.82);
  }

  .ribosome-aa-dropzone.is-aa-drop-reveal {
    animation: aa-drop-bounce-in calc(0.45s / var(--dna-anim-speed)) ease;
  }

  @keyframes aa-drop-bounce-in {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.82);
    }
    65% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.08);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  /* Growing polypeptide hangs off the newest docked tRNA (not the dropzone). */
  .polypeptide-on-trna {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 6;
  }

  .polypeptide-residue {
    position: absolute;
    transform: translate(-50%, -50%);
    transition: left calc(0.45s / var(--dna-anim-speed)) ease, top calc(0.45s / var(--dna-anim-speed)) ease;
  }

  /* Detached from tRNAs at stop — stay put, no move/fade with exiting tRNAs. */
  .polypeptide-on-trna.is-frozen .polypeptide-residue {
    transition: none;
  }

  .polypeptide-bond {
    position: absolute;
    height: 6px;
    transform-origin: 0 50%;
    background: #8a6a3d;
    border-radius: 3px;
    opacity: 0;
    animation: polypeptide-bond-in calc(0.3s / var(--dna-anim-speed)) ease calc(0.45s / var(--dna-anim-speed)) forwards;
  }

  .polypeptide-bond.is-anchored {
    opacity: 1;
    animation: none;
  }

  @keyframes polypeptide-bond-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .ribosome-snapped.is-locked .ribosome-border {
    pointer-events: none;
    cursor: default;
  }

  .bp-col.is-active-codon .mrna-base-icon {
    filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.55));
  }

  .bp-col.is-stop-codon .mrna-base-icon {
    filter:
      drop-shadow(0 0 0 #ef4444)
      drop-shadow(0 0 0 #ef4444)
      drop-shadow(0 0 2px rgba(239, 68, 68, 1))
      drop-shadow(0 0 6px rgba(239, 68, 68, 0.95))
      drop-shadow(0 0 12px rgba(239, 68, 68, 0.75));
  }

  /* Shared amino-acid circle badge (tRNA cargo, polypeptide, drag ghost). */
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
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
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

  .trna-incoming {
    position: absolute;
    z-index: 5;
    pointer-events: none;
  }

  .trna-incoming.is-trna-enter {
    animation: trna-slide-in calc(0.75s / var(--dna-anim-speed)) cubic-bezier(0.22, 1, 0.36, 1);
  }

  .trna-incoming.is-trna-success {
    animation: trna-glow-success calc(0.6s / var(--dna-anim-speed)) ease;
  }

  .trna-incoming.is-trna-error {
    animation: trna-shake-error calc(0.65s / var(--dna-anim-speed)) ease;
  }

  /* trna exit animation */
  .trna-incoming.is-trna-exit {
    transform-origin: 50% 0%;
    animation: trna-fall-away calc(0.6s / var(--dna-anim-speed)) cubic-bezier(0.4, 0, 0.7, 1) forwards;
  }

  .trna-body {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    /* Artwork legs point down by default; flip so they face the codon above. */
    transform: scaleY(-1);
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
  }

  .trna-incoming.is-trna-success .trna-body {
    filter:
      drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3))
      drop-shadow(0 0 2px rgba(34, 197, 94, 0.85))
      drop-shadow(0 0 8px rgba(34, 197, 94, 0.5));
  }

  .trna-incoming.is-trna-error .trna-body {
    filter:
      drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3))
      drop-shadow(0 0 2px rgba(239, 68, 68, 0.85))
      drop-shadow(0 0 8px rgba(239, 68, 68, 0.5));
  }

  .trna-anticodon-base {
    position: absolute;
    transform: translate(-50%, -50%);
    display: block;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }

  .trna-amino-tag {
    position: absolute;
    transform: translate(-50%, -50%);
    line-height: 0;
  }

  .trna-bond {
    position: absolute;
    width: 2px;
    transform: translateX(-50%);
    background: repeating-linear-gradient(
      to bottom,
      #94a3b8 0,
      #94a3b8 5px,
      transparent 5px,
      transparent 9px
    );
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    pointer-events: none;
    z-index: 0;
    opacity: 0;
    animation: trna-bond-in calc(0.3s / var(--dna-anim-speed)) ease forwards;
  }

  @keyframes trna-bond-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes trna-slide-in {
    from {
      opacity: 0;
      transform: translateY(150px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes trna-glow-success {
    0%, 100% { transform: scale(1); }
    45% { transform: scale(1.08); }
  }

  @keyframes trna-shake-error {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }

  @keyframes trna-fall-away {
    0% {
      opacity: 1;
      transform: translate(0, 0) rotate(0deg) scale(1);
    }
    50% {
      opacity: 0.45;
      transform: translate(-12px, 48px) rotate(20deg) scale(0.9);
    }
    100% {
      opacity: 0;
      transform: translate(-55px, 100px) rotate(36deg) scale(0.78);
    }
  }

  @keyframes molecule-exit-up-right {
    0% {
      opacity: 1;
      transform: translate(0, 0) rotate(0deg) scale(1);
    }
    50% {
      opacity: 0.45;
      transform: translate(12px, -48px) rotate(-20deg) scale(0.9);
    }
    100% {
      opacity: 0;
      transform: translate(55px, -100px) rotate(-36deg) scale(0.78);
    }
  }

  @keyframes drop-slot-fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes drop-slot-error {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }

  @keyframes molecule-snap-in {
    from {
      opacity: 0;
      transform: scale(0.75);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes molecule-snap-out {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.82);
    }
  }

  .strand-connector {
    position: absolute;
    height: 4px;
    margin-top: -2px;
    background: #dc2626;
    border-radius: 2px;
    transform-origin: 0 50%;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
    pointer-events: none;
    z-index: 0;
    transition: top calc(0.45s / var(--dna-anim-speed)) ease-out, left calc(0.45s / var(--dna-anim-speed)) ease-out, width calc(0.45s / var(--dna-anim-speed)) ease-out, transform calc(0.45s / var(--dna-anim-speed)) ease-out;
  }

  .strand-pairs {
    display: flex;
    gap: 8px;
    position: relative;
    z-index: 1;
  }

  .bp-col {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .bp-col.has-codon-divider::after {
    content: "";
    position: absolute;
    top: 8%;
    bottom: 8%;
    right: -4px;
    width: 1px;
    background: rgba(15, 23, 42, 0.2);
    pointer-events: none;
    z-index: 2;
  }

  .bp-top,
  .bp-bottom {
    line-height: 0;
    will-change: transform;
    transition: transform calc(0.45s / var(--dna-anim-speed)) ease-out;
  }

  .bp-top img,
  .bp-bottom img {
    display: block;
    width: 44px;
    height: 44px;
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
  }

  /* Mutations: bases are selectable (menu wired in a later step). */
  .strand-pairs.is-mutations .bp-top,
  .strand-pairs.is-mutations .bp-bottom {
    cursor: pointer;
    border-radius: 6px;
  }

  .strand-pairs.is-mutations .bp-top:hover:not(.is-mutation-selected) img,
  .strand-pairs.is-mutations .bp-bottom:hover:not(.is-mutation-selected) img {
    filter:
      drop-shadow(0 0 4px rgba(59, 130, 246, 0.45))
      drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
  }

  .strand-pairs.is-mutations .bp-top.is-mutation-selected img,
  .strand-pairs.is-mutations .bp-bottom.is-mutation-selected img {
    filter:
      drop-shadow(0 0 5px rgba(59, 130, 246, 0.7))
      drop-shadow(0 0 10px rgba(59, 130, 246, 0.45))
      drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
  }

  .bp-col.is-stop-codon .bp-top img,
  .bp-col.is-stop-codon .bp-bottom img,
  .strand-pairs.is-mutations .bp-col.is-stop-codon .bp-top:hover:not(.is-mutation-selected) img,
  .strand-pairs.is-mutations .bp-col.is-stop-codon .bp-bottom:hover:not(.is-mutation-selected) img {
    filter:
      drop-shadow(0 0 0 #ef4444)
      drop-shadow(0 0 0 #ef4444)
      drop-shadow(0 0 2px rgba(239, 68, 68, 1))
      drop-shadow(0 0 6px rgba(239, 68, 68, 0.95))
      drop-shadow(0 0 12px rgba(239, 68, 68, 0.75));
  }

  .bp-bond {
    width: 2px;
    height: 24px;
    background: repeating-linear-gradient(
      to bottom,
      #94a3b8 0,
      #94a3b8 5px,
      transparent 5px,
      transparent 9px
    );
    filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
    transition: opacity calc(0.4s / var(--dna-anim-speed)) ease;
  }

  .bp-spacer {
    height: 44px;
  }

  .bp-col.is-transcribed .bp-top img {
    opacity: 0.72;
  }

  .bp-rna img {
    filter: drop-shadow(0 2px 3px rgba(124, 58, 237, 0.25));
  }

  .mrna-base {
    position: relative;
    display: inline-block;
    line-height: 0;
  }

  .mrna-base-icon {
    position: relative;
    z-index: 1;
    display: block;
  }

  .mrna-base-shape-glow {
    position: absolute;
    inset: 0;
    width: 44px;
    height: 44px;
    pointer-events: none;
    opacity: 0;
    z-index: 0;
  }

  .mrna-base.is-entering {
    animation: mrna-base-enter calc(0.5s / var(--dna-anim-speed)) ease-out forwards;
  }

  .mrna-base.is-success {
    animation: mrna-base-success calc(0.45s / var(--dna-anim-speed)) ease;
  }

  .mrna-base.is-success .mrna-base-shape-glow {
    opacity: 1;
    animation: mrna-success-shape calc(0.45s / var(--dna-anim-speed)) ease;
    filter:
      drop-shadow(0 0 0 #22c55e)
      drop-shadow(0 0 0 #22c55e)
      drop-shadow(0 0 0 #22c55e)
      drop-shadow(0 0 2px rgba(34, 197, 94, 0.85))
      drop-shadow(0 0 8px rgba(34, 197, 94, 0.45));
  }

  .mrna-base.is-success .mrna-base-icon {
    filter: drop-shadow(0 0 5px rgba(34, 197, 94, 0.45));
  }

  @keyframes mrna-base-enter {
    from {
      opacity: 0;
      transform: translateY(36px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes mrna-base-success {
    0%, 100% { transform: scale(1); }
    45% { transform: scale(1.07); }
  }

  @keyframes mrna-success-shape {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1.03);
    }
  }

  .mrna-base.is-reject-error {
    animation: mrna-base-reject-shake calc(0.55s / var(--dna-anim-speed)) ease;
  }

  .mrna-base.is-reject-error .mrna-base-shape-glow {
    opacity: 1;
    filter:
      drop-shadow(0 0 0 #ef4444)
      drop-shadow(0 0 0 #ef4444)
      drop-shadow(0 0 0 #ef4444)
      drop-shadow(0 0 2px rgba(239, 68, 68, 0.85))
      drop-shadow(0 0 8px rgba(239, 68, 68, 0.45));
  }

  .mrna-base.is-reject-error .mrna-base-icon {
    filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.5));
  }

  .mrna-base.is-reject-exit {
    animation: mrna-base-reject-exit calc(0.32s / var(--dna-anim-speed)) ease-in forwards;
  }

  @keyframes mrna-base-reject-shake {
    0%, 100% { transform: translateX(0) translateY(0); }
    20% { transform: translateX(-4px) translateY(0); }
    40% { transform: translateX(4px) translateY(0); }
    60% { transform: translateX(-3px) translateY(0); }
    80% { transform: translateX(3px) translateY(0); }
  }

  @keyframes mrna-base-reject-exit {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(36px);
    }
  }
`
