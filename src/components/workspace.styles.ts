import {css} from "lit"

/** Pan/zoom workspace. */
export const workspaceStyles = css`
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

  @media print {
    :host {
      height: auto;
      min-height: 0;
      overflow: visible;
      break-inside: avoid;
    }

    .sim-shell {
      height: 520px;
      min-height: 0;
      overflow: hidden;
    }

    .canvas-row {
      top: 0;
    }

    dna-simulation-navbar,
    .canvas-overlays,
    .codon-drawer,
    .reset-confirm-dialog,
    .zoom-indicator {
      display: none !important;
    }
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
`
