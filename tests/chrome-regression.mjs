#!/usr/bin/env node
// Dependency-free real-Chrome regression smoke for the DNA widget.
// Run from this package with Node 22+: node tests/chrome-regression.mjs
import {spawn} from "node:child_process"
import {createServer} from "node:http"
import {mkdtemp, readFile, rm} from "node:fs/promises"
import {tmpdir} from "node:os"
import {resolve} from "node:path"
import {once} from "node:events"

const root = resolve(import.meta.dirname, "..")
const chrome = process.env.CHROME_BIN ?? (process.platform === "darwin"
  ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  : "google-chrome")
const failures = []
let passed = 0
const assert = (condition, message) => { if (!condition) throw new Error(message) }

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname
    const fixture = pathname === "/"
    const bundle = "/dist/widgets/webwriter-dna-simulation.js"
    if (!fixture && pathname !== bundle) {
      response.writeHead(404).end("Not found")
      return
    }
    const file = fixture ? "tests/fixture.html" : bundle.slice(1)
    const data = await readFile(resolve(root, file))
    const mime = fixture ? "text/html" : "text/javascript"
    response.writeHead(200, {"content-type": `${mime}; charset=utf-8`, "cache-control": "no-store"})
    response.end(data)
  } catch {
    response.writeHead(404).end("Not found")
  }
})

const temp = await mkdtemp(resolve(tmpdir(), "dna-widget-chrome-"))
let browser
let cdp
try {
  server.listen(0, "127.0.0.1")
  await once(server, "listening")
  const port = server.address().port
  const baseUrl = `http://127.0.0.1:${port}/`
  browser = spawn(chrome, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", `--user-data-dir=${temp}`, "about:blank",
  ], {stdio: "ignore"})
  try { await once(browser, "spawn") }
  catch (error) { throw new Error("Chrome did not start. Set CHROME_BIN to its executable.", {cause: error}) }
  const activePortPath = resolve(temp, "DevToolsActivePort")
  let debugPort
  for (let i = 0; i < 100; i++) {
    try { debugPort = Number((await readFile(activePortPath, "utf8")).split("\n")[0]); break }
    catch { if (browser.exitCode !== null) throw new Error(`Chrome exited (${browser.exitCode}); set CHROME_BIN if needed`); await new Promise(r => setTimeout(r, 100)) }
  }
  if (!debugPort) throw new Error("Chrome did not publish a DevTools port")
  const page = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(baseUrl)}`, {method: "PUT"}).then(r => r.json())
  cdp = new WebSocket(page.webSocketDebuggerUrl)
  await once(cdp, "open")
  let nextId = 0
  const pending = new Map()
  cdp.addEventListener("message", event => {
    const message = JSON.parse(event.data)
    if (!message.id) return
    const callbacks = pending.get(message.id)
    if (!callbacks) return
    pending.delete(message.id)
    message.error ? callbacks.reject(new Error(message.error.message)) : callbacks.resolve(message.result)
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, {resolve, reject})
    cdp.send(JSON.stringify({id, method, params}))
  })
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", {expression, awaitPromise: true, returnByValue: true})
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
    return result.result?.value
  }
  await send("Page.enable")
  await send("Runtime.enable")
  await send("Page.navigate", {url: baseUrl})
  for (let i = 0; i < 100; i++) {
    try { if (await evaluate("Boolean(customElements.get('webwriter-dna-simulation'))")) break }
    catch { /* document is still navigating */ }
    await new Promise(r => setTimeout(r, 100))
  }
  assert(await evaluate("Boolean(customElements.get('webwriter-dna-simulation'))"), "widget bundle did not register its custom element")
  await evaluate("customElements.whenDefined('webwriter-dna-simulation')")

  const run = async (name, body) => {
    try {
      const result = await evaluate(`(${body.toString()})()`)
      assert(result?.ok, result?.message ?? "browser assertions failed")
      passed++
      process.stdout.write(`PASS ${name}\n`)
    } catch (error) {
      failures.push({name, error: error.message})
      process.stderr.write(`FAIL ${name}: ${error.message}\n`)
    }
  }

  const ready = async (el) => { await el.updateComplete; await new Promise(resolve => requestAnimationFrame(() => resolve())); await el.updateComplete }
  const mount = async ({attrs = {}, content = "", managed = false} = {}) => {
    document.body.replaceChildren()
    const el = document.createElement("webwriter-dna-simulation")
    el.setAttribute("contenteditable", "true")
    if (managed) el.addEventListener("datarequest", event => event.preventDefault())
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value)
    el.innerHTML = content
    document.body.append(el)
    await window.__dnaTest.ready(el)
    return el
  }
  await evaluate(`window.__dnaTest = {ready: ${ready.toString()}, mount: ${mount.toString()}}`)

  await run("defaults and legacy sequence/protein attributes", async () => {
    const {mount} = window.__dnaTest
    let el = await mount()
    if (el.dnaSequence !== "TACGAAATT" || el.lessonDnaSequence !== "TACGAAATT") return {ok:false,message:"unexpected default lesson sequence"}
    el.remove()
    el = await mount({attrs: {"dna-sequence": "acg-n", "mutation-target-protein": "met ala"}})
    return {ok: el.lessonDnaSequence === "ACG" && el.lessonTargetProtein === "Met-Ala", message:`legacy attrs read as ${el.lessonDnaSequence} / ${el.lessonTargetProtein}`}
  })

  await run("editable lesson setters preserve JSON keys and unrelated authored nodes", async () => {
    const {mount, ready} = window.__dnaTest
    const el = await mount({content: `<p id="authored">keep</p><script slot="data" type="application/json">{"format":"webwriter-dna-simulation","version":1,"dnaSequence":"TACGAAATT","mutationTargetProtein":"","otherKey":{"keep":true}}</script><em id="other">also keep</em>`})
    const block = el.querySelector('script[slot="data"]')
    el.lessonDnaSequence = "CCCTAA"
    el.lessonTargetProtein = "Met Ala"
    await ready(el)
    const data = JSON.parse(block.textContent)
    return {ok: data.dnaSequence === "CCCTAA" && data.mutationTargetProtein === "Met-Ala" && data.otherKey.keep === true && el.querySelector('script[slot="data"]') === block && el.querySelector("#authored")?.textContent === "keep" && el.querySelector("#other")?.textContent === "also keep", message:`JSON update mismatch: ${JSON.stringify(data)}; ${el.innerHTML}`}
  })

  await run("learner sequence changes and default cross-phase mutation do not write authored DOM", async () => {
    const {mount, ready} = window.__dnaTest
    const el = await mount({content: `<p id="keep">text</p><script slot="data" type="application/json">{"format":"webwriter-dna-simulation","version":1,"dnaSequence":"TACGAAATT","mutationTargetProtein":"","extra":7}</script>`})
    el.setAttribute("contenteditable", "false")
    await ready(el)
    const before = el.innerHTML
    el.setDnaSequence("CCCCCC")
    el.currentPhase = "Mutations"
    await ready(el)
    el.substituteBase(0, "A")
    await ready(el)
    return {ok: el.dnaSequence === "ACCCCC" && el.mutationsSequence === "ACCCCC" && el.innerHTML === before && el.crossPhaseMutations === true, message:`learner mutation wrote authored DOM or used wrong cross-phase sequences (${el.dnaSequence}/${el.mutationsSequence}; enabled=${el.crossPhaseMutations})`}
  })

  await run("managed data readiness gates writes and accepts external updates", async () => {
    const {mount, ready} = window.__dnaTest
    const el = await mount({managed:true, content:`<script slot="data" type="application/json">{"format":"webwriter-dna-simulation","version":1,"dnaSequence":"TACGAAATT","mutationTargetProtein":""}</script>`})
    const block = el.querySelector('script[slot="data"]')
    const request = new Event("datarequest", {bubbles:true, cancelable:true})
    block.dispatchEvent(request)
    await ready(el)
    block.dispatchEvent(new CustomEvent("datapending", {bubbles:true, detail:{mode:"individual"}}))
    el.lessonDnaSequence = "CCCC"
    const stayedPending = !el.dataReady && JSON.parse(block.textContent).dnaSequence === "TACGAAATT"
    block.textContent = JSON.stringify({format:"webwriter-dna-simulation",version:1,dnaSequence:"ATGCCC",mutationTargetProtein:"",remote:true})
    block.dispatchEvent(new CustomEvent("datachange", {bubbles:true, detail:{mode:"individual"}}))
    await ready(el)
    return {ok: stayedPending && el.dataReady && el.lessonDnaSequence === "ATGCCC" && el.dnaSequence === "ATGCCC" && JSON.parse(block.textContent).remote === true, message:"managed readiness or remote data synchronization failed"}
  })

  await run("restore action and disconnect/reconnect resynchronize lesson state", async () => {
    const {mount, ready} = window.__dnaTest
    const el = await mount({content:`<script slot="data" type="application/json">{"format":"webwriter-dna-simulation","version":1,"dnaSequence":"ATGCCC","mutationTargetProtein":"Met Ala","extension":"preserve"}</script>`})
    const block = el.querySelector('script[slot="data"]')
    const action = el.actions.restoreLessonDefaults
    el.restoreLessonDefaults()
    await ready(el)
    const restored = el.lessonDnaSequence === "TACGAAATT" && el.lessonTargetProtein === "" && JSON.parse(block.textContent).extension === "preserve" && Boolean(action)
    el.remove()
    document.body.append(el)
    await ready(el)
    return {ok: restored && el.lessonDnaSequence === "TACGAAATT" && el.dataReady, message:"restore action or reconnect lifecycle failed"}
  })

  await run("options and action descriptors are available and editable options persist", async () => {
    const {mount, ready} = window.__dnaTest
    const el = await mount({attrs:{showinfocards:"false"}})
    if (el.showInfoCards !== false) return {ok:false,message:"showinfocards=\"false\" was not read as false"}
    const actions = el.actions
    el.showInfoCards = true
    await ready(el)
    const enabled = el.showInfoCards && el.hasAttribute("showinfocards") && !el.hasAttribute("hide-info-cards")
    el.showInfoCards = false
    el.enableTranslation = false
    await ready(el)
    return {ok: enabled && el.showInfoCards === false && !el.hasAttribute("showinfocards") && el.hasAttribute("hide-info-cards") && el.enableTranslation === false && el.options && el.optionGroups?.lesson && actions?.restoreLessonDefaults, message:`options/actions or persistence mismatch: showInfoCards=${el.showInfoCards}, attrs=${el.getAttributeNames()}, enableTranslation=${el.enableTranslation}`}
  })

  await run("en-US and de-DE language changes stay local to each widget", async () => {
    const {ready} = window.__dnaTest
    document.body.replaceChildren()
    const english = document.createElement("webwriter-dna-simulation")
    const german = document.createElement("webwriter-dna-simulation")
    english.setAttribute("contenteditable", "false")
    german.setAttribute("contenteditable", "false")
    english.lang = "en-US"
    const germanSection = document.createElement("section")
    germanSection.lang = "de-DE"
    germanSection.append(german)
    document.body.append(english, germanSection)
    await ready(english); await ready(german)
    const englishNav = english.shadowRoot.querySelector("dna-simulation-navbar")
    const germanNav = german.shadowRoot.querySelector("dna-simulation-navbar")
    await englishNav.updateComplete; await germanNav.updateComplete
    const labels = [english.msg("Replication"), german.msg("Replication")]
    const visible = [englishNav.shadowRoot.querySelector(".phase-buttons")?.textContent, germanNav.shadowRoot.querySelector(".phase-buttons")?.textContent]
    const drawer = [english.options.enableReplication.label._, german.options.enableReplication.label._]
    const independentlyLocalized = labels[0] === "Replication" && labels[1] === "Replikation" &&
      visible[0]?.includes("Replication") && visible[1]?.includes("Replikation") &&
      drawer[0] === "Replication" && drawer[1] === "Replikation"
    germanSection.lang = "en-GB"
    for (let i = 0; i < 60 && german.options.enableReplication.label._ !== "Replication"; i++) {
      await new Promise(requestAnimationFrame)
    }
    const inheritedChange = german.options.enableReplication.label._ === "Replication" &&
      english.options.enableReplication.label._ === "Replication" && !german.hasAttribute("lang")
    return {
      ok: independentlyLocalized && inheritedChange,
      message: `language mismatch (locale=${english.localize.getLocale()}/${german.localize.getLocale()}, visible=${visible.join(" | ")}, drawer=${drawer.join(" | ")})`,
    }
  })

  await run("Replication, Transcription, Translation, and Mutations render on phase changes", async () => {
    const {mount, ready} = window.__dnaTest
    const el = await mount()
    const nav = el.shadowRoot.querySelector("dna-simulation-navbar")
    for (const phase of ["Replication", "Transcription", "Translation", "Mutations"]) {
      nav.dispatchEvent(new CustomEvent("dna-navbar-action", {
        bubbles:true, composed:true, detail:{action:"phase-change", phase},
      }))
      await ready(el)
      await nav.updateComplete
      const active = [...nav.shadowRoot.querySelectorAll(".phase-buttons sl-button")]
        .find(button => button.getAttribute("variant") === "primary")
      if (el.currentPhase !== phase || nav.currentPhase !== phase || !active?.textContent.includes(phase)) {
        return {ok:false,message:`phase ${phase} did not render as active in widget/navbar`}
      }
      if (phase === "Transcription") {
        const transfer = new DataTransfer()
        el.startMoleculeDrag(new DragEvent("dragstart", {dataTransfer:transfer}), "rna-polymerase")
        await ready(el)
        const slot = el.shadowRoot.querySelector(".molecule-drop-slot")
        if (!slot) return {ok:false,message:"Transcription fork drop slot did not render"}
        slot.dispatchEvent(new DragEvent("drop", {bubbles:true, composed:true, cancelable:true, dataTransfer:transfer}))
        await ready(el)
        await nav.updateComplete
        if (!nav.showPhaseBar || !nav.shadowRoot.querySelector("sl-input.phase-bar-input")) {
          return {ok:false,message:"dropping RNA polymerase did not start Transcription input"}
        }
      }
      if (phase === "Mutations" && (!nav.showProteinTab || nav.showToolkitTab)) {
        return {ok:false,message:"Mutations phase did not switch to its protein drawer tab"}
      }
    }
    return {ok:true}
  })

  await run("narrow and wide containers produce finite nonzero geometry", async () => {
    const {mount, ready} = window.__dnaTest
    const el = await mount()
    el.style.display = "block"
    el.style.width = "280px"
    await ready(el)
    const narrow = el.getBoundingClientRect()
    el.setPhase("Translation")
    const transfer = new DataTransfer()
    el.startMoleculeDrag(new DragEvent("dragstart", {dataTransfer:transfer}), "ribosome")
    await ready(el)
    const slot = el.shadowRoot.querySelector(".molecule-drop-slot")
    if (!slot) return {ok:false,message:"Translation ribosome slot did not render"}
    slot.dispatchEvent(new DragEvent("drop", {bubbles:true, composed:true, cancelable:true, dataTransfer:transfer}))
    await ready(el)
    await new Promise(resolve => setTimeout(resolve, 350))
    const narrowCanvas = el.shadowRoot.querySelector(".canvas-area").getBoundingClientRect()
    const narrowDrawer = el.shadowRoot.querySelector(".codon-drawer").getBoundingClientRect()
    const viewport = el.shadowRoot.querySelector(".workspace-viewport")
    viewport.dispatchEvent(new WheelEvent("wheel", {ctrlKey:true, deltaY:-50, cancelable:true}))
    const zoom = el.zoomLevel
    el.style.width = "960px"
    await ready(el)
    const wide = el.getBoundingClientRect()
    const wideCanvas = el.shadowRoot.querySelector(".canvas-row")?.getBoundingClientRect()
    return {
      ok: narrow.width === 280 && wide.width === 960 && narrowCanvas.height > 80 &&
        narrowDrawer.height > 80 && narrowDrawer.top >= narrowCanvas.bottom - 1 &&
        wideCanvas?.height > 0 && Number.isFinite(wideCanvas.width) && zoom > 75 && el.zoomLevel === zoom &&
        !el.hasAttribute("zoom-level"),
      message: `narrow canvas ${narrowCanvas.height}px, drawer ${narrowDrawer.height}px,
        wide canvas ${wideCanvas?.width}×${wideCanvas?.height}px, zoom ${zoom} → ${el.zoomLevel}`,
    }
  })

  await send("Emulation.setEmulatedMedia", {media: "print"})
  await run("print keeps the strand visible and hides interactive controls", async () => {
    const {mount} = window.__dnaTest
    const el = await mount()
    const root = el.shadowRoot
    const strand = root.querySelector(".strand-outer")
    const navbar = root.querySelector("dna-simulation-navbar")
    const reset = root.querySelector(".phase-reset-btn")
    return {
      ok: strand.getBoundingClientRect().height > 0 &&
        getComputedStyle(navbar).display === "none" && reset.getBoundingClientRect().height === 0,
      message: "print media hid the DNA strand or showed simulation controls",
    }
  })
  await send("Emulation.setEmulatedMedia", {media: ""})

  if (failures.length) process.exitCode = 1
} catch (error) {
  process.stderr.write(`FATAL ${error.stack ?? error}\n`)
  process.exitCode = 1
} finally {
  cdp?.close()
  if (browser && browser.exitCode === null) {
    browser.kill("SIGTERM")
    await Promise.race([once(browser, "exit"), new Promise(resolve => setTimeout(resolve, 3000))])
  }
  await new Promise(resolve => server.close(resolve))
  try { await rm(temp, {recursive:true, force:true, maxRetries:5, retryDelay:100}) } catch {}
}
process.stdout.write(`${passed} passed, ${failures.length} failed\n`)
