import {css} from "lit"

/** Codon reference drawer. */
export const codonDrawerStyles = css`
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
    width: min(400px, 100cqw);
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

  /* Stack the reference below the canvas so both remain usable during a drag. */
  @container (max-width: 700px) {
    .canvas-row {
      flex-direction: column;
    }

    .codon-drawer {
      width: 100%;
      height: 0;
      border-left: 0;
      border-top: 1px solid transparent;
      transition: height 0.3s ease, border-top-color 0.3s ease;
    }

    .codon-drawer.is-open {
      width: 100%;
      height: clamp(180px, 34vh, 230px);
      border-top-color: #e2e8f0;
    }

    .codon-drawer-body {
      width: 100%;
    }
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
    background: var(--dna-accent, var(--sl-color-primary-600, #2563eb));
    color: #ffffff;
  }

  .drawer-tab:focus-visible {
    outline: 2px solid var(--dna-accent, var(--sl-color-primary-400, #60a5fa));
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
`
