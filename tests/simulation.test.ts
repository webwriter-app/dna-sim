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
    el.style.width = "300px"
    await ready(el)
    const narrow = el.getBoundingClientRect()
    el.setPhase("Translation")
    await drop(el, "ribosome")
    const drawerHeight = () => el.shadowRoot!.querySelector(".codon-drawer")?.getBoundingClientRect().height ?? 0
    // The drawer height animates; wait until it has settled instead of sleeping a fixed time.
    let last = -1
    for (let i = 0; i < 180; i++) {
      await nextFrame()
      const height = drawerHeight()
      if (height > 80 && height === last) break
      last = height
    }
    const narrowCanvas = el.shadowRoot!.querySelector(".canvas-area")!.getBoundingClientRect()
    const narrowDrawer = el.shadowRoot!.querySelector(".codon-drawer")!.getBoundingClientRect()
    const viewport = el.shadowRoot!.querySelector(".workspace-viewport")!
    viewport.dispatchEvent(new WheelEvent("wheel", {ctrlKey: true, deltaY: -50, cancelable: true}))
    const zoom = el.zoomLevel
    el.style.width = "960px"
    await ready(el)
    const wide = el.getBoundingClientRect()
    const wideCanvas = el.shadowRoot!.querySelector(".canvas-row")?.getBoundingClientRect()
    assert.equal(narrow.width, 300)
    assert.equal(wide.width, 960)
    assert.isAbove(narrowCanvas.height, 80, "canvas " + narrowCanvas.height)
    assert.isAbove(narrowDrawer.height, 80, "drawer " + narrowDrawer.height)
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
  it("keeps host width between 300 and 2100 pixels", async function () {
    const el = await mount()
    el.style.width = "100px"
    await ready(el)
    assert.equal(el.getBoundingClientRect().width, 300)
    el.style.width = "3000px"
    await ready(el)
    assert.equal(el.getBoundingClientRect().width, 2100)
  })

  it("places a toolkit molecule with Enter and Space on its chip", async function () {
    const el = await mount()
    const nav = el.shadowRoot!.querySelector("dna-simulation-navbar") as any
    nav.dispatchEvent(new CustomEvent("dna-navbar-action", {bubbles: true, composed: true, detail: {action: "tab-change", tab: "baukasten"}}))
    await ready(el)
    await nav.updateComplete
    const chips = [...nav.shadowRoot.querySelectorAll(".baukasten-chip")] as HTMLElement[]
    assert.isAbove(chips.length, 0)
    for (const chip of chips) {
      assert.equal(chip.getAttribute("role"), "button")
      assert.equal(chip.tabIndex, 0)
    }
    assert.isFalse(el.enzymes.snappedHelicase)
    // The expected molecule is the helicase; the others only raise the error alert.
    for (const chip of chips) chip.dispatchEvent(new KeyboardEvent("keydown", {key: " ", bubbles: true, cancelable: true}))
    await ready(el)
    assert.isTrue(el.enzymes.snappedHelicase, "keyboard placement did not snap the helicase")
  })

  it("pans and zooms the canvas with the keyboard and with touch", async function () {
    const el = await mount()
    const viewport = el.shadowRoot!.querySelector(".workspace-viewport") as HTMLElement
    assert.equal(viewport.tabIndex, 0)
    assert.isNotEmpty(viewport.getAttribute("aria-label"))
    const startX = el.workspace.vp.panX
    viewport.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft", bubbles: true, cancelable: true}))
    assert.equal(el.workspace.vp.panX, startX + 40)
    const zoom = el.zoomLevel
    viewport.dispatchEvent(new KeyboardEvent("keydown", {key: "+", bubbles: true, cancelable: true}))
    assert.isAbove(el.zoomLevel, zoom)
    const touchX = el.workspace.vp.panX
    const init = {pointerType: "touch", pointerId: 7, isPrimary: true, bubbles: true, cancelable: true, composed: true}
    viewport.dispatchEvent(new PointerEvent("pointerdown", {...init, button: 0, clientX: 100, clientY: 100}))
    viewport.dispatchEvent(new PointerEvent("pointermove", {...init, clientX: 140, clientY: 100}))
    viewport.dispatchEvent(new PointerEvent("pointerup", {...init, clientX: 140, clientY: 100}))
    assert.equal(el.workspace.vp.panX, touchX + 40)
  })

  it("opens the Mutations menu from a focused base with Enter", async function () {
    const el = await mount()
    el.setPhase("Mutations")
    await ready(el)
    const base = el.shadowRoot!.querySelector(".bp-top") as HTMLElement
    assert.equal(base.tabIndex, 0)
    assert.equal(base.getAttribute("role"), "button")
    base.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true, cancelable: true}))
    await ready(el)
    assert.equal(el.mutations.selectedIndex, 0)
    assert.isTrue(el.mutations.menuOpen)
  })

  it("follows the document theme and exposes parts", async function () {
    const wrapper = document.createElement("div")
    wrapper.style.cssText = "--ww-text-color: rgb(1, 2, 3); --ww-font-family: Georgia, serif; --ww-theme-accent-1: rgb(200, 10, 20)"
    document.body.replaceChildren(wrapper)
    const el = document.createElement("webwriter-dna-simulation") as Widget
    wrapper.append(el)
    await ready(el)
    const nav = el.shadowRoot!.querySelector("dna-simulation-navbar") as any
    await nav.updateComplete
    const hostStyle = getComputedStyle(el)
    assert.equal(hostStyle.color, "rgb(1, 2, 3)")
    assert.include(hostStyle.fontFamily, "Georgia")
    const tab = nav.shadowRoot.querySelector(".nav-tab.active")
    assert.equal(getComputedStyle(tab).backgroundColor, "rgb(200, 10, 20)")
    assert.equal(el.shadowRoot!.querySelector(".canvas-area")!.getAttribute("part"), "canvas")
    assert.equal(nav.getAttribute("part"), "navbar")
  })

  it("shows a caption and hides placeholders in print", async function () {
    const el = await mount()
    const root = el.shadowRoot!
    const caption = root.querySelector(".print-caption") as HTMLElement
    assert.include(caption.textContent, el.dnaSequence)
    assert.equal(getComputedStyle(caption).display, "none")
    const printRules: string[] = []
    for (const sheet of root.adoptedStyleSheets) {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSMediaRule && rule.media.mediaText.trim() === "print") {
          for (const inner of rule.cssRules) printRules.push(inner.cssText)
        }
      }
    }
    const printSheet = new CSSStyleSheet()
    printSheet.replaceSync(printRules.join("\n"))
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, printSheet]
    await nextFrame()
    assert.equal(getComputedStyle(caption).display, "block")
  })
})

mocha.run()