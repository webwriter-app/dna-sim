import {css} from "lit"

/** Buttons floating over the canvas. */
export const canvasOverlayStyles = css`
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
`
