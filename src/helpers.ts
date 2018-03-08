import * as ts_module from "typescript/lib/tsserverlibrary"

export function resolvePositionOrRange(positionOrRange: number | ts_module.TextRange) {
  return typeof positionOrRange === "number"
    ? { pos: positionOrRange, end: positionOrRange }
    : positionOrRange
}
