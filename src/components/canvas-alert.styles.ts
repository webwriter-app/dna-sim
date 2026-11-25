import {css} from "lit"

export const canvasAlertStyles = css`
  :host {
    position: absolute;
    top: 0.75rem;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 4;
    pointer-events: none;
  }

  sl-alert.canvas-alert {
    display: block;
    width: max-content;
    max-width: min(20rem, calc(100% - 1.5rem));
    margin: 0;
    pointer-events: auto;
    flex-shrink: 0;
  }

  sl-alert.canvas-alert--info::part(base) {
    border-top-width: 5px;
    background-color: #eff6ff;
    border-color: #bfdbfe;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
  }

  sl-alert.canvas-alert--error::part(base) {
    border-top-width: 5px;
    background-color: #fef2f2;
    border-color: #fecaca;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
  }

  sl-alert.canvas-alert--info::part(message) {
    color: #1e3a8a;
  }

  sl-alert.canvas-alert--error::part(message) {
    color: #991b1b;
  }

  sl-alert.canvas-alert--info::part(icon) {
    color: var(--sl-color-primary-600);
  }

  sl-alert.canvas-alert--error::part(icon) {
    color: var(--sl-color-danger-600);
  }

  .canvas-alert-icon {
    display: flex;
    align-items: center;
    line-height: 0;
  }

  .canvas-alert-icon svg {
    width: 1.15rem;
    height: 1.15rem;
  }
`
