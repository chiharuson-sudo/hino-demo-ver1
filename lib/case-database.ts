// ============================================================
// HQA市技報 事例データベース アクセス層
// データ：public/data/hqa_cases.json（HQA_CASES は hqa-knowledge で定義）
// ============================================================

import {
  HQA_CASES,
  classifyComponentFromText,
  classifyEventFromText,
  type HQACase,
} from "./hqa-knowledge"

export type { HQACase }

export const TOTAL_CASES = HQA_CASES.length

/** Noで1件取得（エクスポート時のNo順ソート用） */
export function getCaseByNo(no: number): HQACase | undefined {
  return HQA_CASES.find((c) => c.no === no)
}

/** DTCコードで絞り込み */
export function getCasesByDTC(dtcCode: string): HQACase[] {
  return HQA_CASES.filter((c) => c.dtc_codes.includes(dtcCode))
}

/** 複数DTCのいずれかに一致 */
export function getCasesByDTCList(dtcCodes: string[]): HQACase[] {
  return HQA_CASES.filter((c) =>
    c.dtc_codes.some((d) => dtcCodes.includes(d))
  )
}

/** 車両型で絞り込み */
export function getCasesByVehicleType(
  vehicleType: "大型" | "中型" | "小型" | "全て"
): HQACase[] {
  if (vehicleType === "全て") return HQA_CASES
  return HQA_CASES.filter((c) => c.vehicle_type === vehicleType)
}

/** 修理結果で絞り込み */
export function getCasesByRepairResult(result: string): HQACase[] {
  return HQA_CASES.filter((c) => c.repair_result === result)
}

/** DTC × 車両型で絞り込み */
export function getCasesByDTCAndVehicle(
  dtcCode: string,
  vehicleType: string
): HQACase[] {
  return HQA_CASES.filter(
    (c) =>
      c.dtc_codes.includes(dtcCode) &&
      (vehicleType === "全て" || c.vehicle_type === vehicleType)
  )
}

/** マトリクスのドリルダウン用：事象×部品×車両型で絞り込み */
export function getCasesForMatrixCell(
  vehicleType: string,
  event: string,
  component: string
): HQACase[] {
  return HQA_CASES.filter((c) => {
    const vtMatch = vehicleType === "全て" || c.vehicle_type === vehicleType
    const evMatch = matchEvent(c, event)
    const compMatch = matchComponent(c, component)
    return vtMatch && evMatch && compMatch
  })
}

/** DTC別完治事例を取得（エクスポート根拠表示用） */
export function getCuredExamples(dtcCode: string, limit = 5): HQACase[] {
  return getCasesByDTC(dtcCode)
    .filter((c) => c.repair_result === "完治")
    .slice(0, limit)
}

/** No順にソートして全件返す（Excelエクスポート用） */
export function getAllCasesSortedByNo(): HQACase[] {
  return [...HQA_CASES].sort((a, b) => a.no - b.no)
}

/** DTC別件数サマリー */
export function getDTCStats(dtcCode: string) {
  const cases = getCasesByDTC(dtcCode)
  const total = cases.length
  const cure = cases.filter((c) => c.repair_result === "完治").length
  return {
    total,
    cure,
    cure_rate: total > 0 ? Math.round((cure / total) * 100) : 0,
    by_vehicle: {
      大型: cases.filter((c) => c.vehicle_type === "大型").length,
      中型: cases.filter((c) => c.vehicle_type === "中型").length,
      小型: cases.filter((c) => c.vehicle_type === "小型").length,
    },
    repair_dist: cases.reduce<Record<string, number>>((acc, c) => {
      acc[c.repair_result] = (acc[c.repair_result] ?? 0) + 1
      return acc
    }, {}),
  }
}

/** Excelマトリクス・エクスポート用：事象が該当列か（classifyEventFromText と一致） */
export function matchEvent(c: HQACase, event: string): boolean {
  return classifyEventFromText(c.symptom, c.inspection) === event
}

/** Excelマトリクス・エクスポート用：部品が該当列か（classifyComponentFromText と一致） */
export function matchComponent(c: HQACase, component: string): boolean {
  return (
    classifyComponentFromText(
      c.component,
      c.repair,
      c.analysis,
      c.symptom
    ) === component
  )
}
