// ============================================================
// HQA市技報 事例データベース アクセス層
// データ：public/data/hqa_cases.json（HQA_CASES は hqa-knowledge で定義）
// ============================================================

import { HQA_CASES, type HQACase } from "./hqa-knowledge"

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

function matchEvent(c: HQACase, event: string): boolean {
  const t = `${c.symptom} ${c.inspection}`.toLowerCase()
  switch (event) {
    case "警告灯点灯":
      return /ランプ点灯|警告灯|ebs点灯|abs点灯|ウォーニング|異常表示/.test(t)
    case "走行不能":
      return /走行不能|自走不可/.test(t)
    case "異音・振動":
      return /異音|振動/.test(t)
    case "通信異常":
      return /通信|can/.test(t)
    case "性能低下":
      return /効き不良|性能/.test(t)
    default:
      return false
  }
}

function matchComponent(c: HQACase, component: string): boolean {
  const t = `${c.component} ${c.repair} ${c.analysis}`
  const bst = /bst|ブレーキシグナル|トランスミッター/i.test(t)
  const ecu = /ecu/i.test(t)
  const harness = /ハーネス|配線|コネクター/.test(t)
  switch (component) {
    case "制動装置（BST）":
      return bst && !ecu
    case "EBS ECU":
      return ecu
    case "ハーネス・コネクター":
      return harness
    case "その他":
      return !bst && !ecu && !harness
    default:
      return false
  }
}
