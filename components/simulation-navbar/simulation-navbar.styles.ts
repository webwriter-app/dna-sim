import {css} from "lit"

export const simulationNavbarStyles = css`
  :host {
    display: block;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    -webkit-user-select: none;
    user-select: none;
  }

  ::selection {
    background: transparent;
    color: inherit;
  }

  sl-input,
  input,
  textarea {
    -webkit-user-select: text;
    user-select: text;
  }

  .primary-nav {
    display: flex;
    width: calc(100% - 1.5rem);
    margin: 0.3rem 0.75rem 0;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
  }

  .nav-tab {
    flex: 1;
    margin: 0;
    padding: 0.5rem 0.75rem;
    border: none;
    border-right: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #334155;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .nav-tab:last-child {
    border-right: none;
  }

  .nav-tab:hover:not(.active) {
    background: #f1f5f9;
  }

  .nav-tab.active {
    background: var(--sl-color-primary-600, #2563eb);
    color: #ffffff;
  }

  .nav-tab:focus-visible {
    outline: 2px solid var(--sl-color-primary-400, #60a5fa);
    outline-offset: -2px;
  }

  .child-nav-shell {
    height: 3.25rem;
    overflow: hidden;
    border-top: 1px solid #f1f5f9;
  }

  .phase-bar-shell {
    height: 3.25rem;
    overflow: hidden;
    border-top: 1px solid #f1f5f9;
    background: #fafbfc;
  }

  .phase-bar {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    height: 100%;
    padding: 0 0.75rem;
    flex-wrap: nowrap;
    overflow: hidden;
  }

  .phase-bar-input {
    flex: 1;
    min-width: 8rem;
    max-width: 18rem;
  }

  .phase-bar-success {
    color: #15803d;
    font-weight: 600;
  }

  .mutation-steps-dropdown {
    --sl-panel-background-color: #ffffff;
    --sl-panel-border-color: #e2e8f0;
    --sl-color-neutral-0: #ffffff;
  }

  .mutation-steps-dropdown::part(panel) {
    z-index: 40;
    width: max-content;
    min-width: 0;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
    padding: 0.2rem;
  }

  .mutation-steps-menu {
    background: #ffffff;
    width: max-content;
    min-width: 0;
    max-width: none;
    max-height: 16rem;
    overflow-y: auto;
    padding: 0;
  }

  .mutation-steps-menu sl-divider {
    --color: #e2e8f0;
    --spacing: 0.15rem;
  }

  .mutation-steps-menu sl-menu-item::part(base) {
    display: flex;
    align-items: center;
    background: #ffffff;
    min-height: 2.35rem;
    padding-block: 0.25rem;
    padding-inline: 0.5rem;
  }

  .mutation-steps-menu sl-menu-item::part(checked-icon),
  .mutation-steps-menu sl-menu-item::part(submenu-icon) {
    display: none;
    width: 0;
    margin: 0;
  }

  .mutation-steps-menu sl-menu-item::part(prefix) {
    display: none;
    width: 0;
    margin: 0;
  }

  .mutation-steps-menu sl-menu-item::part(label) {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
  }

  .mutation-steps-menu sl-menu-item::part(base):hover,
  .mutation-steps-menu sl-menu-item:hover::part(base) {
    background: #f8fafc;
  }

  .mutation-step-row {
    display: grid;
    grid-template-columns: 5.25rem 1.7rem 0.9rem 1.7rem;
    align-items: center;
    column-gap: 0.3rem;
  }

  .mutation-step-kind {
    display: block;
    font-size: 0.92rem;
    font-weight: 500;
    color: #334155;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    line-height: 1;
    justify-self: start;
  }

  .mutation-step-visual {
    display: contents;
  }

  .mutation-step-arrow {
    color: #64748b;
    font-size: 0.95rem;
    line-height: 1;
    justify-self: center;
  }

  .mutation-step-base {
    display: block;
    width: 1.7rem;
    height: 1.7rem;
    flex-shrink: 0;
    justify-self: center;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }

  .mutation-step-empty {
    font-size: 0.82rem;
    color: #94a3b8;
    font-style: italic;
    white-space: nowrap;
    padding: 0.2rem 0.35rem;
  }

  .mutation-verify-btn,
  .mutation-open-list-btn {
    flex-shrink: 0;
  }

  .mutation-protein-cluster {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
    flex: 1 1 auto;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .mutation-protein-cluster::-webkit-scrollbar {
    display: none;
  }

  .mutation-aa-chain {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    overflow-x: auto;
    overflow-y: hidden;
    min-width: 0;
    flex: 0 1 auto;
    padding: 0.2rem 0.2rem 0.2rem 0;
    scrollbar-width: none;
  }

  .mutation-aa-chain::-webkit-scrollbar {
    display: none;
  }

  .mutation-aa-bond {
    width: 12px;
    height: 6px;
    margin: 0 -3px;
    background: #8a6a3d;
    border-radius: 3px;
    flex-shrink: 0;
    z-index: 0;
  }

  .mutation-aa-chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    line-height: 0;
    z-index: 1;
  }

  .mutation-aa-remove {
    position: absolute;
    top: -0.15rem;
    right: -0.15rem;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 0.95rem;
    height: 0.95rem;
    margin: 0;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    background: #ffffff;
    color: #64748b;
    cursor: pointer;
  }

  .mutation-aa-remove svg {
    display: block;
    width: 0.58rem;
    height: 0.58rem;
  }

  .mutation-aa-remove:hover {
    color: #b91c1c;
    border-color: #fca5a5;
  }

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
    font-size: 0.32em;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    pointer-events: none;
    user-select: none;
  }

  .child-nav {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    height: 100%;
    padding: 0 0.75rem;
    flex-wrap: nowrap;
    overflow: hidden;
  }

  .child-nav-label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .child-nav-meta {
    margin-left: auto;
    font-size: 0.75rem;
    color: #94a3b8;
    flex-shrink: 0;
    text-align: right;
  }

  .child-nav-meta.is-stacked {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.05rem;
    line-height: 1.15;
  }

  .child-nav-meta-line {
    white-space: nowrap;
  }

  .child-nav-meta.is-warning {
    color: #b45309;
    font-weight: 600;
  }

  .phase-buttons {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.35rem;
    overflow-x: auto;
    min-width: 0;
  }

  .phase-buttons sl-button[disabled] {
    cursor: not-allowed;
  }

  .phase-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .reset-simulation-btn {
    flex-shrink: 0;
  }

  .sequence-input {
    flex: 1;
    min-width: 10rem;
    max-width: 20rem;
  }

  .child-nav--baukasten {
    flex-wrap: nowrap;
  }

  .baukasten-toolbar {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    padding: 0.1rem 0;
  }

  .baukasten-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    flex-shrink: 0;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    cursor: grab;
  }

  .baukasten-chip:active {
    cursor: grabbing;
  }

  .baukasten-chip .baukasten-name {
    font-size: 0.68rem;
    line-height: 1.1;
    font-weight: 500;
    color: #475569;
    text-align: center;
    max-width: 8rem;
    white-space: nowrap;
    pointer-events: none;
  }

  .baukasten-chip:hover .baukasten-name {
    color: #1e293b;
  }

  .baukasten-molecule {
    flex-shrink: 0;
    display: block;
    width: 36px;
    height: 36px;
    pointer-events: none;
    border-radius: 6px;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
    transition: transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease;
  }

  .baukasten-chip:hover .baukasten-molecule {
    transform: scale(1.08);
    filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3));
  }

  .baukasten-chip.is-dragging {
    opacity: 0.45;
  }

  .baukasten-empty {
    margin: 0;
    font-size: 0.85rem;
    color: #94a3b8;
    font-style: italic;
  }

  .base-buttons {
    display: flex;
    flex-direction: row;
    gap: 0.3rem;
    flex-shrink: 0;
  }

  .btn-a::part(base) { background-color: var(--color-adenine); color: white; border: none; }
  .btn-u::part(base) { background-color: var(--color-uracil); color: white; border: none; }
  .btn-t::part(base) { background-color: var(--color-thymine); color: white; border: none; }
  .btn-c::part(base) { background-color: var(--color-cytosine); color: black; border: none; }
  .btn-g::part(base) { background-color: var(--color-guanine);  color: black; border: none; }

  .base-buttons sl-button::part(base) {
    width: 2.25rem;
    min-width: 2.25rem;
    padding: 0 0.25rem;
    transition: filter 0.2s, transform 0.2s;
  }

  .base-buttons sl-button::part(base):hover { filter: brightness(0.95); transform: scale(1.1); }
`
