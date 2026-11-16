import "../src/widgets/webwriter-dna-simulation"
import type {WebwriterDnaSimulation} from "../src/widgets/webwriter-dna-simulation"

export type Widget = Omit<WebwriterDnaSimulation, "localize"> & Record<string, any> & Pick<WebwriterDnaSimulation, "updateComplete">

export const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

export const ready = async (el: Element & {updateComplete: Promise<unknown>}) => {
  await el.updateComplete
  await nextFrame()
  await el.updateComplete
}

export const until = async (condition: () => boolean, frames = 60) => {
  for (let i = 0; i < frames && !condition(); i++) await nextFrame()
  return condition()
}

export const dataBlock = (data: Record<string, unknown>) =>
  `<script slot="data" type="application/json">${JSON.stringify(data)}</script>`

export const lessonData = (extra: Record<string, unknown> = {}) => ({
  format: "webwriter-dna-simulation", version: 1, dnaSequence: "TACGAAATT", mutationTargetProtein: "", ...extra,
})

export const reset = () => {
  document.body.replaceChildren()
  document.designMode = "off"
}

/** Mounts one widget in edit mode (contenteditable) with optional attributes and authored children. */
export const mount = async ({attrs = {}, content = "", managed = false, editable = true}: {
  attrs?: Record<string, string>, content?: string, managed?: boolean, editable?: boolean,
} = {}) => {
  document.body.replaceChildren()
  const el = document.createElement("webwriter-dna-simulation") as Widget
  if (editable) el.setAttribute("contenteditable", "true")
  if (managed) el.addEventListener("datarequest", event => event.preventDefault())
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value)
  el.innerHTML = content
  document.body.append(el)
  await ready(el)
  return el
}
