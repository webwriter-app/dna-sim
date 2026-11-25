import {css} from "lit"

export const phaseCompleteToastStyles = css`
  :host {
    position: absolute;
    top: 0.75rem;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 5;
    pointer-events: none;
  }

  .phase-toast {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: max-content;
    max-width: min(26rem, calc(100% - 1.5rem));
    padding: 0.6rem 0.9rem 0.7rem;
    border-radius: 0.5rem;
    border: 1px solid #bfdbfe;
    border-top-width: 5px;
    background: #eff6ff;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
    overflow: hidden;
    pointer-events: auto;
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.28s ease, transform 0.28s ease;
  }

  .phase-toast.is-leaving {
    opacity: 0;
    transform: translateY(-6px);
    pointer-events: none;
  }

  .phase-toast-message {
    color: #1e3a8a;
    font-size: 0.9rem;
    line-height: 1.3;
  }

  .phase-toast sl-button {
    flex-shrink: 0;
  }

  .phase-toast-bar {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 3px;
    background: var(--sl-color-primary-500, #3b82f6);
    transform: scaleX(1);
    transform-origin: left center;
    animation-name: phase-toast-countdown;
    animation-timing-function: linear;
    animation-fill-mode: forwards;
  }

  .phase-toast.is-leaving .phase-toast-bar {
    animation-play-state: paused;
  }

  @keyframes phase-toast-countdown {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }
`
