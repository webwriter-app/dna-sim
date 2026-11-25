import {css} from "lit"

/** Base selection in Mutations, bond rows and the mRNA strand. */
export const mrnaStrandStyles = css`
  /* Mutations: bases are selectable (menu wired in a later step). */
  .strand-pairs.is-mutations .bp-top,
  .strand-pairs.is-mutations .bp-bottom {
    cursor: pointer;
    border-radius: 6px;
  }

  .strand-pairs.is-mutations .bp-top:focus-visible,
  .strand-pairs.is-mutations .bp-bottom:focus-visible {
    outline: 2px solid var(--dna-accent, #2563eb);
    outline-offset: 2px;
    border-radius: 8px;
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
