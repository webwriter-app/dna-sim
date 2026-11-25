/// <reference types="mocha" />
import "mocha/mocha.js"
import {assert} from "chai"
import {getMochaConfig} from "@webwriter/build/test"
import {WebwriterDnaSimulation} from "../src/widgets/webwriter-dna-simulation"
import {dataBlock, lessonData, mount, ready, reset} from "./helpers"
import {emptyFasta, headerlessFasta, invalidFasta, multiFasta, rnaFasta, shortFasta, validFasta} from "./fixtures/fasta"

mocha.setup(getMochaConfig())

const file = (text: string, name = "strand.fasta") => new File([text], name, {type: "text/x-fasta"})
const content = () => dataBlock(lessonData())

describe("<webwriter-dna-simulation> FASTA import and export", function () {
  afterEach(reset)

  it("declares the FASTA formats in the conversion maps", function () {
    assert.deepEqual(Object.keys(WebwriterDnaSimulation.convertFrom), [".fasta", ".fa"])
    assert.deepEqual(Object.keys(WebwriterDnaSimulation.convertTo), [".fasta"])
  })

  it("imports a valid file only when the apply function runs", async function () {
    const el = await mount({content: content()})
    const apply = await el.importFasta(file(validFasta))
    assert.equal(el.lessonDnaSequence, "TACGAAATT")
    apply()
    await ready(el)
    assert.equal(el.lessonDnaSequence, "TACGAAATTCCGGGATC")
    assert.equal(JSON.parse(el.querySelector('script[slot="data"]')!.textContent!).dnaSequence, "TACGAAATTCCGGGATC")
  })

  it("reads RNA, a missing header and the first record of several", async function () {
    const el = await mount({content: content()})
    for (const [text, expected] of [[rnaFasta, "TACGAAATT"], [headerlessFasta, "TACGAA"], [multiFasta, "TACGAA"]]) {
      (await el.importFasta(file(text)))()
      await ready(el)
      assert.equal(el.lessonDnaSequence, expected)
    }
  })

  it("rejects invalid files with a message and changes nothing", async function () {
    const el = await mount({content: content()})
    for (const text of [invalidFasta, emptyFasta, shortFasta, ">long\n" + "A".repeat(2001)]) {
      let message = ""
      try { await el.importFasta(file(text)) } catch (error) { message = (error as Error).message }
      assert.notEqual(message, "", text.slice(0, 12))
    }
    assert.match((await el.importFasta(file(invalidFasta)).catch((e: Error) => e.message)) as string, /"X" at position 4/)
    assert.equal(el.lessonDnaSequence, "TACGAAATT")
  })

  it("exports the authored template strand and round-trips", async function () {
    const el = await mount({content: dataBlock(lessonData({dnaSequence: "ACGT".repeat(40)}))})
    const out = el.exportFasta()!
    assert.match(out.name, /\.fasta$/)
    const text = await out.text()
    assert.match(text, /^>DNA template strand/)
    assert.equal(text.split("\n")[1].length, 70)
    const other = await mount({content: content()})
    ;(await other.importFasta(out))()
    await ready(other)
    assert.equal(other.lessonDnaSequence, "ACGT".repeat(40))
  })

  it("refuses an import while the lesson cannot be edited", async function () {
    const el = await mount({content: content(), editable: false})
    let message = ""
    try { await el.importFasta(file(validFasta)) } catch (error) { message = (error as Error).message }
    assert.notEqual(message, "")
  })
})

describe("<webwriter-dna-simulation> signals and effects", function () {
  afterEach(reset)

  it("publishes stable phase, sequence and complete signals", async function () {
    const el = await mount({content: content()})
    const signals = el.signals
    assert.strictEqual(el.signals, signals)
    assert.equal(signals.phase.get(), "Replication")
    assert.equal(signals.sequence.get(), "TACGAAATT")
    assert.isFalse(signals.complete.get())
    el.setPhase("Transcription")
    el.lessonDnaSequence = "CCCAAA"
    await ready(el)
    assert.equal(signals.phase.get(), "Transcription")
    assert.equal(signals.sequence.get(), "CCCAAA")
  })

  it("shows the sequence of a connected source and falls back when it aborts", async function () {
    const el = await mount({content: content()})
    // The test bundle cannot import @webwriter/lit (shared dependency), so it takes the State class from the widget.
    const State = (el.published.source as any).constructor as new (value: unknown) => {set(value: unknown): void; get(): unknown}
    const source = new State("ggg-ccc")
    const lifetime = new AbortController()
    WebwriterDnaSimulation.effects["sequence-from"].connect.call(el as any, source, lifetime.signal)
    await ready(el)
    assert.equal(el.dnaSequence, "GGGCCC")
    assert.equal(el.lessonDnaSequence, "TACGAAATT")
    source.set("TTTAAA")
    await ready(el)
    assert.equal(el.dnaSequence, "TTTAAA")
    source.set(42)
    await ready(el)
    assert.equal(el.dnaSequence, "TACGAAATT")
    source.set("AAACCC")
    await ready(el)
    assert.equal(el.dnaSequence, "AAACCC")
    lifetime.abort()
    await ready(el)
    assert.equal(el.dnaSequence, "TACGAAATT")
  })
})

mocha.run()
