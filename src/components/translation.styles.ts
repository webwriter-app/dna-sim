import {css} from "lit"

/** Ribosome, tRNA and polypeptide. */
export const translationStyles = css`
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
`
