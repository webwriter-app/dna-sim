import {css} from "lit"

/** Base layout, canvas row and reset dialog of the DNA simulation widget. */
export const widgetStyles = css`
  :host {
    --color-adenine:  #239d46;
    --color-thymine:  #c10077;
    --color-cytosine: #b4d7f5;
    --color-guanine:  #f1e21a;
    --color-uracil:   #e07428;
    --dna-navbar-height: 0px;
    --dna-anim-speed: 1;
    --dna-accent: var(--ww-theme-accent-1, var(--sl-color-primary-600, #2563eb));
    --dna-text: var(--ww-text-color, #334155);

    font-family: var(--ww-font-family, var(--sl-font-sans, sans-serif));
    color: var(--ww-text-color, inherit);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 300px;
    max-width: 2100px;
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

  /* Fit the simulation to the available page width and viewport height. */
  .sim-shell {
    position: relative;
    flex: 0 0 auto;
    width: 100%;
    height: clamp(400px, 65vh, 520px);
    min-height: 400px;
    min-width: 0;
    overflow: hidden;
    container-type: inline-size;
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
    color: var(--dna-text);
  }
`
