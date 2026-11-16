import {execFileSync} from "node:child_process"
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs"
import {tmpdir} from "node:os"
import {join, resolve} from "node:path"

const config = JSON.parse(readFileSync("lit-localize.json", "utf8"))
const xliffDir = resolve(config.interchange.xliffDir)
const workDir = mkdtempSync(join(tmpdir(), "dna-simulation-locales-"))

try {
  const configPath = join(workDir, "lit-localize.json")
  writeFileSync(configPath, JSON.stringify({
    ...config,
    targetLocales: config.targetLocales.filter(tag => existsSync(join(xliffDir, tag + ".xlf"))),
    tsConfig: resolve(config.tsConfig),
    output: {
      ...config.output,
      outputDir: resolve(config.output.outputDir),
      localeCodesModule: resolve(config.output.localeCodesModule),
    },
    interchange: {...config.interchange, xliffDir},
  }))
  for (const command of ["extract", "build"]) {
    execFileSync("lit-localize", ["--config=" + configPath, command], {stdio: "inherit"})
  }
} finally {
  rmSync(workDir, {recursive: true, force: true})
}
