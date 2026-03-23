// ============================================================
// DTC振り分け根拠（Excelエクスポート / 別タブHTML）共通ロジック
// ============================================================

import type { HQACase } from "./case-database"

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

export function matchEvent(c: HQACase, event: string): boolean {
  const t = `${c.symptom} ${c.inspection}`
  const map: Record<string, RegExp> = {
    警告灯点灯: /ランプ点灯|警告灯|EBS点灯|ABS点灯|ウォーニング|異常表示/,
    走行不能: /走行不能|自走不可/,
    "異音・振動": /異音|振動/,
    通信異常: /通信|CAN/i,
    性能低下: /効き不良|性能/,
  }
  return map[event]?.test(t) ?? false
}

export function matchComponent(c: HQACase, component: string): boolean {
  const t = `${c.component} ${c.repair} ${c.analysis}`
  const bst = /BST|ブレーキシグナル|トランスミッター/i.test(t)
  const ecu = /ECU/i.test(t)
  const harness = /ハーネス|配線|コネクター/.test(t)
  if (component === "その他") return !bst && !ecu && !harness
  const map: Record<string, RegExp> = {
    "制動装置（BST）": /BST|ブレーキシグナル|トランスミッター/i,
    "EBS ECU": /ECU/i,
    "ハーネス・コネクター": /ハーネス|配線|コネクター/,
  }
  return map[component]?.test(t) ?? false
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

export const EXPORT_MATRIX_EVENTS = [
  "警告灯点灯",
  "走行不能",
  "異音・振動",
  "通信異常",
  "性能低下",
] as const

export const EXPORT_MATRIX_COMPONENTS = [
  "制動装置（BST）",
  "EBS ECU",
  "ハーネス・コネクター",
  "その他",
] as const

export const EXPORT_MATRIX_VTYPES = ["全て", "大型", "中型"] as const

export type ExportMatrixSection = {
  vtype: string
  rows: { event: string; counts: number[]; rowTotal: number }[]
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
      counts.forEach((v, ci) => {
        colTotals[ci] += v
      })
      const rowTotal = counts.reduce((s, v) => s + v, 0)
      return { event, counts, rowTotal }
    })
    const grandTotal = colTotals.reduce((s, v) => s + v, 0)
    return { vtype, rows, colTotals, grandTotal }
  })
}
