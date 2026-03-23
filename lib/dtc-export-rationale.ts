// ============================================================
// DTC振り分け根拠（Excelエクスポート / 別タブHTML）共通ロジック
// ============================================================

import type { HQACase } from "./case-database"
import { matchComponent, matchEvent } from "./case-database"
import { COMPONENT_COLS, EVENT_ROWS } from "./stats-data"

export type DtcSelection = {
  selected: string
  reason: string
  rule: string
  confidence: string
}

export function selectPrimaryDTC(c: HQACase): DtcSelection {
  const dtcs = c.dtc_codes
  if (dtcs.length === 0)
    return { selected: "", reason: "DTCなし", rule: "-", confidence: "低" }
  if (dtcs.length === 1)
    return {
      selected: dtcs[0],
      reason: "単一DTC",
      rule: "単一DTCルール",
      confidence: "高",
    }

  if (dtcs.includes("2A0408"))
    return {
      selected: "2A0408",
      reason: "赤警告DTCが含まれるため2A0408を優先",
      rule: "赤警告優先ルール",
      confidence: "高",
    }

  const analysisNorm = `${c.inspection} ${c.analysis}`.toUpperCase()
  for (const dtc of dtcs) {
    if (analysisNorm.includes(dtc))
      return {
        selected: dtc,
        reason: `確認結果・解析結果に${dtc}が明示されているため選択`,
        rule: "テキスト明示ルール",
        confidence: "高",
      }
  }

  const symptomText = c.symptom
  if (/断線/.test(symptomText)) {
    const t = dtcs.find((d) => ["160405", "150405"].includes(d))
    if (t)
      return {
        selected: t,
        reason: "断線キーワードを検出",
        rule: "症状キーワードルール",
        confidence: "中",
      }
  }
  if (/ショート/.test(symptomText)) {
    const t = dtcs.find((d) => ["160404", "150404"].includes(d))
    if (t)
      return {
        selected: t,
        reason: "ショートキーワードを検出",
        rule: "症状キーワードルール",
        confidence: "中",
      }
  }

  const freq = [
    "2B0402",
    "2C0402",
    "160405",
    "150405",
    "2A0408",
    "2B0400",
    "160404",
    "150404",
    "2C0404",
  ]
  const selected = freq.find((d) => dtcs.includes(d)) ?? dtcs[0]
  return {
    selected,
    reason: "発生件数が最多のDTCを選択",
    rule: "発生頻度ルール",
    confidence: "低",
  }
}

export function getRoutingTarget(_dtc: string): string {
  return "【EBS・ブレーキグループ】"
}

export function getPriority(dtc: string): string {
  return dtc === "2A0408" ? "高" : dtc ? "中" : "低"
}

/** 根拠マトリクス・行の背景色（優先度: 新規判断 > 複数絞り込み > 確信度低） */
export type RationaleTone = "new" | "narrowed" | "low" | "neutral"

export function getRationaleTone(c: HQACase): RationaleTone {
  const sel = selectPrimaryDTC(c)
  if (c.dtc_codes.length === 0) return "new"
  if (c.dtc_codes.length > 1) return "narrowed"
  if (sel.confidence === "低") return "low"
  return "neutral"
}

const TONE_RANK: Record<RationaleTone, number> = {
  neutral: 0,
  low: 1,
  narrowed: 2,
  new: 3,
}

/** セル内の複数件から、最も強いトーンを採用（混在時は赤 > 橙 > 黄） */
export function aggregateCellTone(casesInCell: HQACase[]): RationaleTone {
  if (casesInCell.length === 0) return "neutral"
  let best: RationaleTone = "neutral"
  for (const c of casesInCell) {
    const t = getRationaleTone(c)
    if (TONE_RANK[t] > TONE_RANK[best]) best = t
  }
  return best
}

function filterCasesForExportMatrixCell(
  all: HQACase[],
  vtype: string,
  event: string,
  component: string
): HQACase[] {
  return all.filter((c) => {
    const vtMatch = vtype === "全て" || c.vehicle_type === vtype
    return vtMatch && matchEvent(c, event) && matchComponent(c, component)
  })
}

export const DTC_RATIONALE_HEADERS = [
  "No",
  "市技報No",
  "排ガス記号",
  "車両型式",
  "車両番号",
  "走行距離",
  "故障日",
  "不具合の状況",
  "確認結果",
  "解析結果",
  "元のダイアグ",
  "検出DTC一覧",
  "選択DTC",
  "選択根拠",
  "適用ルール",
  "信頼度",
  "転送先グループ",
  "優先度",
] as const

/** テーブル列「選択DTC」のインデックス（0始まり） */
export const DTC_SELECTED_COLUMN_INDEX = 12

export function buildRationaleRowCells(c: HQACase): {
  cells: (string | number)[]
  sel: DtcSelection
} {
  const sel = selectPrimaryDTC(c)
  const faultAt =
    typeof c.fault_at === "string" && c.fault_at.length >= 10
      ? c.fault_at.slice(0, 10)
      : String(c.fault_at ?? "")
  const cells: (string | number)[] = [
    c.no,
    c.shigihono,
    c.gas_code,
    c.vehicle_model,
    c.vehicle_no,
    c.mileage,
    faultAt,
    String(c.symptom ?? "").slice(0, 150),
    String(c.inspection ?? "").slice(0, 100),
    String(c.analysis ?? "").slice(0, 100),
    c.diag_raw,
    c.dtc_codes.join(", "),
    sel.selected,
    sel.reason,
    sel.rule,
    sel.confidence,
    getRoutingTarget(sel.selected),
    getPriority(sel.selected),
  ]
  return { cells, sel }
}

export const EXPORT_MATRIX_EVENTS = EVENT_ROWS

export const EXPORT_MATRIX_COMPONENTS = COMPONENT_COLS

export const EXPORT_MATRIX_VTYPES = ["全て", "大型", "中型"] as const

export type ExportMatrixSection = {
  vtype: string
  rows: {
    event: string
    counts: number[]
    rowTotal: number
    cellTones: RationaleTone[]
  }[]
  colTotals: number[]
  grandTotal: number
}

export function buildExportMatrixSections(cases: HQACase[]): ExportMatrixSection[] {
  return EXPORT_MATRIX_VTYPES.map((vtype) => {
    const colTotals = new Array(EXPORT_MATRIX_COMPONENTS.length).fill(0) as number[]
    const rows = EXPORT_MATRIX_EVENTS.map((event) => {
      const counts = EXPORT_MATRIX_COMPONENTS.map((comp) =>
        cases.filter((c) => {
          const vtMatch = vtype === "全て" || c.vehicle_type === vtype
          return vtMatch && matchEvent(c, event) && matchComponent(c, comp)
        }).length
      )
      const cellTones = EXPORT_MATRIX_COMPONENTS.map((comp) =>
        aggregateCellTone(filterCasesForExportMatrixCell(cases, vtype, event, comp))
      )
      counts.forEach((v, ci) => {
        colTotals[ci] += v
      })
      const rowTotal = counts.reduce((s, v) => s + v, 0)
      return { event, counts, rowTotal, cellTones }
    })
    const grandTotal = colTotals.reduce((s, v) => s + v, 0)
    return { vtype, rows, colTotals, grandTotal }
  })
}
