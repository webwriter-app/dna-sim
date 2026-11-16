/// <reference types="mocha" />
import "mocha/mocha.js"
import {assert} from "chai"
import {getMochaConfig} from "@webwriter/build/test"
import {mount, nextFrame, ready, reset, type Widget} from "./helpers"

mocha.setup(getMochaConfig())

const drop = async (el: Widget, molecule: string) => {
  const transfer = new DataTransfer()
  el.startMoleculeDrag(new DragEvent("dragstart", {dataTransfer: transfer}), molecule)
  await ready(el)
  const slot = el.shadowRoot!.querySelector(".molecule-drop-slot")
  assert.isOk(slot, `${molecule} drop slot did not render`)
  slot!.dispatchEvent(new DragEvent("drop", {bubbles: true, composed: true, cancelable: true, dataTransfer: transfer}))
  await ready(el)
}

describe("<webwriter-dna-simulation> simulation", function () {
  afterEach(reset)

  it("Replication, Transcription, Translation, and Mutations render on phase changes", async function () {
    const el = await mount()
    const nav = el.shadowRoot!.querySelector("dna-simulation-navbar") as any
    for (const phase of ["Replication", "Transcription", "Translation", "Mutations"]) {
      nav.dispatchEvent(new CustomEvent("dna-navbar-action", {
        bubbles: true, composed: true, detail: {action: "phase-change", phase},
      }))
      await ready(el)
      await nav.updateComplete
      const active = [...nav.shadowRoot.querySelectorAll(".phase-buttons sl-button")]
        .find((button: any) => button.getAttribute("variant") === "primary") as HTMLElement | undefined
      assert.equal(el.currentPhase, phase)
      assert.equal(nav.currentPhase, phase)
      assert.include(active?.textContent, phase, `phase ${phase} did not render as active`)
      if (phase === "Transcription") {
        await drop(el, "rna-polymerase")
        await nav.updateComplete
        assert.isTrue(nav.showPhaseBar, "dropping RNA polymerase did not start Transcription input")
        assert.isOk(nav.shadowRoot.querySelector("sl-input.phase-bar-input"))
      }
      if (phase === "Mutations") {
        assert.isTrue(nav.showProteinTab)
        assert.isFalse(nav.showToolkitTab)
      }
    }
  })

  it("narrow and wide containers produce finite nonzero geometry", async function () {
    this.timeout(15000)
    const el = await mount()
    el.style.display = "block"
    el.style.width = "280px"
    await ready(el)
    const narrow = el.getBoundingClientRect()
    el.setPhase("Translation")
    await drop(el, "ribosome")
    await new Promise(resolve => setTimeout(resolve, 350))
    const narrowCanvas = el.shadowRoot!.querySelector(".canvas-area")!.getBoundingClientRect()
    const narrowDrawer = el.shadowRoot!.querySelector(".codon-drawer")!.getBoundingClientRect()
    const viewport = el.shadowRoot!.querySelector(".workspace-viewport")!
    viewport.dispatchEvent(new WheelEvent("wheel", {ctrlKey: true, deltaY: -50, cancelable: true}))
    const zoom = el.zoomLevel
    el.style.width = "960px"
    await ready(el)
    const wide = el.getBoundingClientRect()
    const wideCanvas = el.shadowRoot!.querySelector(".canvas-row")?.getBoundingClientRect()
    assert.equal(narrow.width, 280)
    assert.equal(wide.width, 960)
    assert.isAbove(narrowCanvas.height, 80)
    assert.isAbove(narrowDrawer.height, 80)
    assert.isAtLeast(narrowDrawer.top, narrowCanvas.bottom - 1)
    assert.isAbove(wideCanvas!.height, 0)
    assert.isTrue(Number.isFinite(wideCanvas!.width))
    assert.isAbove(zoom, 75)
    assert.equal(el.zoomLevel, zoom)
    assert.isFalse(el.hasAttribute("zoom-level"))
  })

  // The old test emulated print media through the DevTools protocol. A page cannot switch its own media type,
  // so the rules of the widget's `@media print` blocks are copied out of their media query into a sheet of the
  // shadow root: the same declarations apply, and the same strand and control checks run against them.
  it("print keeps the strand visible and hides interactive controls", async function () {
    const el = await mount()
    const root = el.shadowRoot!
    const printRules: string[] = []
    for (const sheet of root.adoptedStyleSheets) {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSMediaRule && rule.media.mediaText.trim() === "print") {
          for (const inner of rule.cssRules) printRules.push(inner.cssText)
        }
      }
    }
    assert.isAbove(printRules.length, 0, "the widget has no @media print rules")
    const printSheet = new CSSStyleSheet()
    printSheet.replaceSync(printRules.join("\n"))
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, printSheet]
    await nextFrame()
    const strand = root.querySelector(".strand-outer")!
    const navbar = root.querySelector("dna-simulation-navbar")!
    const resetButton = root.querySelector(".phase-reset-btn")!
    assert.isAbove(strand.getBoundingClientRect().height, 0, "print media hid the DNA strand")
    assert.equal(getComputedStyle(navbar).display, "none")
    assert.equal(resetButton.getBoundingClientRect().height, 0)
  })
})

mocha.run()
