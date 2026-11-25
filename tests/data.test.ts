/// <reference types="mocha" />
import "mocha/mocha.js"
import {assert} from "chai"
import {getMochaConfig} from "@webwriter/build/test"
import {dataBlock, lessonData, mount, ready, reset} from "./helpers"

mocha.setup(getMochaConfig())

describe("<webwriter-dna-simulation> lesson data", function () {
  afterEach(reset)

  it("defaults and legacy sequence/protein attributes", async function () {
    let el = await mount()
    assert.equal(el.dnaSequence, "TACGAAATT")
    assert.equal(el.lessonDnaSequence, "TACGAAATT")
    el.remove()
    el = await mount({attrs: {"dna-sequence": "acg-n", "mutation-target-protein": "met ala"}})
    assert.equal(el.lessonDnaSequence, "ACG")
    assert.equal(el.lessonTargetProtein, "Met-Ala")
  })

  it("editable lesson setters preserve JSON keys and unrelated authored nodes", async function () {
    const el = await mount({content: `<p id="authored">keep</p>${dataBlock(lessonData({otherKey: {keep: true}}))}<em id="other">also keep</em>`})
    const block = el.querySelector('script[slot="data"]')!
    el.lessonDnaSequence = "CCCTAA"
    el.lessonTargetProtein = "Met Ala"
    await ready(el)
    const data = JSON.parse(block.textContent!)
    assert.equal(data.dnaSequence, "CCCTAA")
    assert.equal(data.mutationTargetProtein, "Met-Ala")
    assert.isTrue(data.otherKey.keep)
    assert.strictEqual(el.querySelector('script[slot="data"]'), block)
    assert.equal(el.querySelector("#authored")?.textContent, "keep")
    assert.equal(el.querySelector("#other")?.textContent, "also keep")
  })

  it("learner sequence changes and default cross-phase mutation do not write authored DOM", async function () {
    const el = await mount({content: `<p id="keep">text</p>${dataBlock(lessonData({extra: 7}))}`})
    el.setAttribute("contenteditable", "false")
    await ready(el)
    const before = el.innerHTML
    el.setDnaSequence("CCCCCC")
    el.currentPhase = "Mutations"
    await ready(el)
    el.substituteBase(0, "A")
    await ready(el)
    assert.equal(el.dnaSequence, "ACCCCC")
    assert.equal(el.mutationsSequence, "ACCCCC")
    assert.equal(el.innerHTML, before)
    assert.isTrue(el.crossPhaseMutations)
  })

  it("managed data readiness gates writes and accepts external updates", async function () {
    const el = await mount({managed: true, content: dataBlock(lessonData())})
    const block = el.querySelector('script[slot="data"]')!
    block.dispatchEvent(new Event("datarequest", {bubbles: true, cancelable: true}))
    await ready(el)
    block.dispatchEvent(new CustomEvent("datapending", {bubbles: true, detail: {mode: "individual"}}))
    el.lessonDnaSequence = "CCCC"
    assert.isFalse(el.dataReady)
    assert.equal(JSON.parse(block.textContent!).dnaSequence, "TACGAAATT")
    block.textContent = JSON.stringify(lessonData({dnaSequence: "ATGCCC", remote: true}))
    block.dispatchEvent(new CustomEvent("datachange", {bubbles: true, detail: {mode: "individual"}}))
    await ready(el)
    assert.isTrue(el.dataReady)
    assert.equal(el.lessonDnaSequence, "ATGCCC")
    assert.equal(el.dnaSequence, "ATGCCC")
    assert.isTrue(JSON.parse(block.textContent!).remote)
  })

  it("restore action and disconnect/reconnect resynchronize lesson state", async function () {
    const el = await mount({content: dataBlock(lessonData({dnaSequence: "ATGCCC", mutationTargetProtein: "Met Ala", extension: "preserve"}))})
    const block = el.querySelector('script[slot="data"]')!
    const action = el.actions.restoreLessonDefaults
    el.restoreLessonDefaults()
    await ready(el)
    assert.equal(el.lessonDnaSequence, "TACGAAATT")
    assert.equal(el.lessonTargetProtein, "")
    assert.equal(JSON.parse(block.textContent!).extension, "preserve")
    assert.isOk(action)
    el.remove()
    document.body.append(el)
    await ready(el)
    assert.equal(el.lessonDnaSequence, "TACGAAATT")
    assert.isTrue(el.dataReady)
  })

  it("lesson block is created whole from attributes and an unreadable block is kept", async function () {
    let el = await mount({attrs: {"dna-sequence": "ACGT"}})
    el.lessonTargetProtein = "Met Ala"
    await ready(el)
    const created = el.querySelector(':scope > script[slot="data"]') as HTMLScriptElement
    const data = created && JSON.parse(created.textContent!)
    assert.equal(data?.format, "webwriter-dna-simulation")
    assert.equal(data.version, 1)
    assert.equal(data.dnaSequence, "ACGT")
    assert.equal(data.mutationTargetProtein, "Met-Ala")
    assert.equal(created.type, "application/json")
    const text = '{"format":"other","payload":[1]}'
    el = await mount({content: `<script slot="data" type="application/json">${text}</script>`})
    el.lessonDnaSequence = "CCC"
    await ready(el)
    assert.equal(el.querySelector('script[slot="data"]')!.textContent, text)
    assert.isTrue(el.actions.restoreLessonDefaults.disabled)
  })

  it("options and action descriptors are available and editable options persist", async function () {
    const el = await mount({attrs: {showinfocards: "false"}})
    assert.isFalse(el.showInfoCards, 'showinfocards="false" was not read as false')
    const actions = el.actions
    el.showInfoCards = true
    await ready(el)
    assert.isTrue(el.showInfoCards)
    assert.isTrue(el.hasAttribute("showinfocards"))
    assert.isFalse(el.hasAttribute("hide-info-cards"))
    el.showInfoCards = false
    el.enableTranslation = false
    await ready(el)
    assert.isFalse(el.showInfoCards)
    assert.isFalse(el.hasAttribute("showinfocards"))
    assert.isTrue(el.hasAttribute("hide-info-cards"))
    assert.isFalse(el.enableTranslation)
    assert.isOk(el.options)
    assert.isOk(el.optionGroups?.lesson)
    assert.isOk(actions?.restoreLessonDefaults)
  })
})

mocha.run()
