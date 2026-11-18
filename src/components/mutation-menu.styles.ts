import {css} from "lit"

/** Mutations phase context menu. */
export const mutationMenuStyles = css`
  /* Mutations menu — anchored to the clicked base via sl-popup. */
  .mutation-menu-popup {
    pointer-events: none;
  }

  .mutation-menu-popup::part(popup) {
    z-index: 6;
    pointer-events: auto;
  }

  .mutation-menu {
    --mutation-row-height: 2.35rem;
    --mutation-row-gap: 0.1rem;
    display: flex;
    align-items: flex-start;
    gap: 0;
    pointer-events: auto;
    font-family: inherit;
    /* One shadow for the whole menu — per-panel shadows tinted each other. */
    filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.16));
  }

  /* When the popup flips to the left of the base, open submenus outward (left). */
  .mutation-menu.is-flyout-left {
    flex-direction: row-reverse;
  }

  /* Align row labels to the right (toward the base / submenu hint side). */
  .mutation-menu.is-flyout-left .mutation-menu-item {
    text-align: right;
  }

  .mutation-menu.is-flyout-left .mutation-menu-item > :last-child {
    margin-left: auto;
  }

  .mutation-menu-primary,
  .mutation-menu-flyout {
    display: flex;
    flex-direction: column;
    gap: var(--mutation-row-gap);
    padding: 0.3rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #f1f5f9;
  }

  .mutation-menu-primary {
    min-width: 10.5rem;
  }

  /* Overlap the shared edge so parent + child read as one continuous panel. */
  .mutation-menu-flyout {
    width: max-content;
    flex-shrink: 0;
    box-sizing: border-box;
    margin-left: -1px;
  }

  .mutation-menu.is-flyout-left .mutation-menu-flyout {
    margin-left: 0;
    margin-right: -1px;
  }

  /* Reserves flyout width so sl-popup flip uses combined size from the start. */
  .mutation-menu-flyout--spacer {
    /* ~ Insert label + gap + base icon, or icon → icon row — tuned in CSS only. */
    width: 6.75rem;
    min-height: var(--mutation-row-height);
    visibility: hidden;
    pointer-events: none;
    border-color: transparent;
    background: transparent;
    box-shadow: none;
    margin-left: 0;
    margin-right: 0;
  }

  /* Align Insertion flyout under the Insertion row (1st row + gap). */
  .mutation-menu-flyout.is-insertion {
    margin-top: calc(var(--mutation-row-height) + var(--mutation-row-gap));
  }

  .mutation-menu-item,
  .mutation-menu-option {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    height: var(--mutation-row-height);
    min-height: var(--mutation-row-height);
    margin: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #334155;
    font: inherit;
    font-weight: 500;
    line-height: 1;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
  }

  .mutation-menu-item {
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    padding: 0 0.65rem;
    font-size: 0.88rem;
  }

  .mutation-menu-item > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .mutation-menu-option {
    width: max-content;
    gap: 0.4rem;
    padding: 0 0.4rem;
    font-size: 0.85rem;
  }

  .mutation-menu-flyout.is-insertion .mutation-menu-option {
    gap: 0.7rem;
  }

  .mutation-menu-item:hover,
  .mutation-menu-item.is-active,
  .mutation-menu-option:hover {
    background: var(--dna-accent, var(--sl-color-primary-600, #2563eb));
    color: #ffffff;
  }

  /* CSS chevron — avoids glyph baseline misalignment of › / ‹. */
  .mutation-menu-chevron {
    flex-shrink: 0;
    width: 0.55rem;
    height: 0.55rem;
    font-size: 0;
    border-right: 2.5px solid currentColor;
    border-bottom: 2.5px solid currentColor;
    transform: rotate(-45deg);
    opacity: 0.9;
  }

  .mutation-menu.is-flyout-left .mutation-menu-chevron {
    transform: rotate(135deg);
  }

  .mutation-menu-arrow {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.85;
    font-size: 0.95rem;
    line-height: 1;
  }

  .mutation-menu-base {
    display: block;
    width: 1.55rem;
    height: 1.55rem;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }
`
