import {css} from "lit"

/** DNA strand and the replication enzyme slot. */
export const strandStyles = css`
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
`
