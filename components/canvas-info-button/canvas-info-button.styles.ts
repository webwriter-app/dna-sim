import {css} from "lit"

export const canvasInfoButtonStyles = css`
  :host {
    position: absolute;
    top: 0.65rem;
    left: 0.65rem;
    z-index: 3;
    pointer-events: auto;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    background: transparent;
    color: #2563eb;
    cursor: pointer;
    pointer-events: auto;
    opacity: 1;
    transition: opacity 0.2s ease, color 0.15s ease, transform 0.15s ease;
  }

  button.is-active {
    opacity: 0.38;
  }

  button:hover {
    color: #1d4ed8;
  }

  button svg {
    width: 1.55rem;
    height: 1.55rem;
    display: block;
  }

  button:not(.is-active):hover svg {
    transform: scale(1.1);
  }
`
