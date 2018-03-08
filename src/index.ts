import * as ts_module from "typescript/lib/tsserverlibrary"
import { resolvePositionOrRange } from "./helpers"

function init(modules: { typescript: typeof ts_module }) {
  const ts = modules.typescript

  function create(info: ts.server.PluginCreateInfo) {
    const { logger } = info.project.projectService

    function log(...args: any[]) {
      logger.info("[kingdaro-test-plugin] " + args.map(String).join(" "))
    }

    log("setup")

    const proxy: ts.LanguageService = Object.create(null)
    for (let k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
      const x = info.languageService[k]
      proxy[k] = (...args: Array<{}>) => {
        log(`called ${k} with args ${args.map(String).join(", ")}`)
        return x.apply(info.languageService, args)
      }
    }

    proxy.getApplicableRefactors = (
      fileName: string,
      positionOrRange: number | ts_module.TextRange,
    ) => {
      const refactors = info.languageService.getApplicableRefactors(fileName, positionOrRange)

      const sourceFile = info.languageService.getProgram().getSourceFile(fileName)
      if (sourceFile) {
        const range = resolvePositionOrRange(positionOrRange)
        const text = sourceFile.text.slice(range.pos, range.end)

        if (text.includes("a + b")) {
          const newRefactor: ts_module.ApplicableRefactorInfo = {
            name: "flip the numbers",
            description: "lol",
            actions: [{ name: "number_flipper", description: "flip the numbers" }],
          }

          return [newRefactor, ...refactors]
        }
      }

      return refactors
    }

    proxy.getEditsForRefactor = (
      fileName: string,
      formatOptions: ts_module.FormatCodeSettings,
      positionOrRange: number | ts_module.TextRange,
      refactorName: string,
      actionName: string,
    ) => {
      if (actionName === "number_flipper") {
        const range = resolvePositionOrRange(positionOrRange)

        const sourceFile = info.languageService.getProgram().getSourceFile(fileName)

        if (sourceFile) {
          const text = sourceFile.text.slice(range.pos, range.end)

          const editStart = range.pos + text.indexOf("a + b")

          const editSpan: ts_module.TextSpan = { start: editStart, length: "a + b".length }

          return {
            edits: [
              {
                fileName,
                textChanges: [{ span: editSpan, newText: "b + a" }],
              },
            ],
            renameFilename: undefined,
            renameLocation: undefined,
          }
        }
      }

      return info.languageService.getEditsForRefactor(
        fileName,
        formatOptions,
        positionOrRange,
        refactorName,
        actionName,
      )
    }

    return proxy
  }

  return { create }
}

export = init
