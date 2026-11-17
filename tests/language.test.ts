/// <reference types="mocha" />
import "mocha/mocha.js"
import {assert} from "chai"
import {getMochaConfig} from "@webwriter/build/test"
import {ready, reset, until, type Widget} from "./helpers"

mocha.setup(getMochaConfig())

const navbarOf = async (widget: Widget) => {
  const navbar = widget.shadowRoot!.querySelector("dna-simulation-navbar") as HTMLElement & {updateComplete: Promise<unknown>}
  await navbar.updateComplete
  return navbar
}
const phaseText = (navbar: HTMLElement) => navbar.shadowRoot!.querySelector(".phase-buttons")?.textContent ?? ""

describe("<webwriter-dna-simulation> language", function () {
  afterEach(reset)

  it("en-US and de-DE language changes stay local to each widget", async function () {
    const english = document.createElement("webwriter-dna-simulation") as Widget
    const german = document.createElement("webwriter-dna-simulation") as Widget
    english.setAttribute("contenteditable", "false")
    german.setAttribute("contenteditable", "false")
    english.lang = "en-US"
    const germanSection = document.createElement("section")
    germanSection.lang = "de-DE"
    germanSection.append(german)
    document.body.append(english, germanSection)
    await ready(english); await ready(german)
    const englishNav = await navbarOf(english)
    const germanNav = await navbarOf(german)
    await until(() => phaseText(germanNav).includes("Replikation"))
    assert.equal(english.msg("Replication"), "Replication")
    assert.equal(german.msg("Replication"), "Replikation")
    assert.include(phaseText(englishNav), "Replication")
    assert.include(phaseText(germanNav), "Replikation")
    assert.equal((english.options as any).enableReplication.label._, "Replication")
    assert.equal((german.options as any).enableReplication.label._, "Replikation")
    germanSection.lang = "en-GB"
    await until(() => (german.options as any).enableReplication.label._ === "Replication")
    assert.equal((german.options as any).enableReplication.label._, "Replication")
    assert.equal((english.options as any).enableReplication.label._, "Replication")
    assert.isFalse(german.hasAttribute("lang"))
  })

  it("child components follow a language change of the widget", async function () {
    const section = document.createElement("section")
    section.lang = "de-DE"
    const widget = document.createElement("webwriter-dna-simulation") as Widget
    widget.setAttribute("contenteditable", "false")
    section.append(widget)
    document.body.append(section)
    await ready(widget)
    const navbar = await navbarOf(widget)
    assert.include(phaseText(navbar), "Replikation")
    section.lang = "en-GB"
    await until(() => phaseText(navbar).includes("Replication"))
    assert.include(phaseText(navbar), "Replication")
    assert.notInclude(phaseText(navbar), "Replikation")
  })

  it("regional and script locales reach the drawer and simulation", async function () {
    const cases = [
      ["fr-CA", "fr", "Réplication"],
      ["pt", "pt-PT", "Replicação"],
      ["pt-BR", "pt-BR", "Replicação"],
      ["zh-TW", "zh-Hant", "複製"],
    ]
    for (const [language, catalog, label] of cases) {
      const widget = document.createElement("webwriter-dna-simulation") as Widget
      widget.lang = language
      document.body.append(widget)
      await until(() => widget.localize.getLocale() === catalog)
      await ready(widget)
      const navbar = await navbarOf(widget)
      assert.equal(widget.localize.getLocale(), catalog, `${language} resolved ${widget.localize.getLocale()}`)
      assert.equal((widget.options as any).enableReplication.label._, label, `drawer label for ${language}`)
      assert.include(phaseText(navbar), label, `navbar label for ${language}`)
    }
  })
})

mocha.run()
