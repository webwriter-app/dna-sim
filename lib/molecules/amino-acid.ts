import {html, type TemplateResult} from "lit"

import aminoAcidSvg from "../../assets/amino-acid.svg"

/** Brown circle badge with the amino-acid short name (e.g. Leu) centered on top. */
export function renderAminoAcidBadge(label: string, size = 36): TemplateResult {
  return html`
    <span
      class="amino-acid-badge"
      style="width:${size}px; height:${size}px; font-size:${size}px"
      title="${label}">
      <img src="${aminoAcidSvg}" alt="" draggable="false"/>
      <span class="amino-acid-label">${label}</span>
    </span>
  `
}
