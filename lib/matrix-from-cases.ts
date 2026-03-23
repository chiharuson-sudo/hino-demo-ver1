// ============================================================
// 市技報データ（HQA_CASES）から 事象×部品 マトリクスを集計
// ============================================================

import type { HQACase } from "./hqa-knowledge"
import { HQA_CASES, classifyComponentFromText, classifyEventFromText } from "./hqa-knowledge"
import type {
  ComponentCategory,
  EventCategory,
  MatrixVehicleFilter,
} from "./stats-data"
import { COMPONENT_COLS, EVENT_ROWS, TRENDING_COMPONENT } from "./stats-data"

function classifyEvent(c: HQACase): EventCategory {
  return classifyEventFromText(c.symptom, c.inspection)
}

function classifyComponent(c: HQACase): ComponentCategory {
  return classifyComponentFromText(c.component, c.repair, c.analysis, c.symptom)
}

function vehicleMatches(filter: MatrixVehicleFilter, c: HQACase): boolean {
  if (filter === "全て") return true
  const vt = (c.vehicle_type ?? "").trim()
  return vt === filter
}

function emptyMatrix(): Record<
  EventCategory,
  Record<ComponentCategory, number>
> {
  const m = {} as Record<EventCategory, Record<ComponentCategory, number>>
  for (const ev of EVENT_ROWS) {
    m[ev] = {} as Record<ComponentCategory, number>
    for (const comp of COMPONENT_COLS) {
      m[ev][comp] = 0
    }
  }
  return m
}

/**
 * 市技報全件から 車両型フィルタごとのマトリクス件数を算出
 */
export function buildDefectMatrixFromCases(): Record<
  MatrixVehicleFilter,
  Record<EventCategory, Record<ComponentCategory, number>>
> {
  const filters: MatrixVehicleFilter[] = ["全て", "大型", "中型", "小型"]
  const out = {} as Record<
    MatrixVehicleFilter,
    Record<EventCategory, Record<ComponentCategory, number>>
  >

  for (const f of filters) {
    out[f] = emptyMatrix()
    const list =
      f === "全て" ? HQA_CASES : HQA_CASES.filter((c) => vehicleMatches(f, c))

    for (const c of list) {
      const ev = classifyEvent(c)
      const comp = classifyComponent(c)
      out[f][ev][comp] = (out[f][ev][comp] ?? 0) + 1
    }
  }

  return out
}

export function matrixCellCount(
  matrix: Record<
    MatrixVehicleFilter,
    Record<EventCategory, Record<ComponentCategory, number>>
  >,
  filter: MatrixVehicleFilter,
  event: EventCategory,
  component: ComponentCategory
): number {
  return matrix[filter]?.[event]?.[component] ?? 0
}

export function matrixTotal(
  matrix: Record<
    MatrixVehicleFilter,
    Record<EventCategory, Record<ComponentCategory, number>>
  >,
  filter: MatrixVehicleFilter
): number {
  let s = 0
  for (const ev of EVENT_ROWS) {
    for (const comp of COMPONENT_COLS) {
      s += matrixCellCount(matrix, filter, ev, comp)
    }
  }
  return s
}

export function matrixSoftwareTotal(
  matrix: Record<
    MatrixVehicleFilter,
    Record<EventCategory, Record<ComponentCategory, number>>
  >,
  filter: MatrixVehicleFilter
): number {
  let s = 0
  for (const ev of EVENT_ROWS) {
    s += matrixCellCount(matrix, filter, ev, TRENDING_COMPONENT)
  }
  return s
}

/** ドリルダウン：セルに該当する実事例 */
export function getCasesForMatrixCellUI(
  filter: MatrixVehicleFilter,
  event: EventCategory,
  component: ComponentCategory
): HQACase[] {
  return HQA_CASES.filter((c) => {
    if (!vehicleMatches(filter, c)) return false
    return classifyEvent(c) === event && classifyComponent(c) === component
  })
}
