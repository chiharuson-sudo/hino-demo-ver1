import ExcelJS from "exceljs"
import { getAllCasesSortedByNo, type HQACase } from "@/lib/case-database"

export const runtime = "nodejs"
export const maxDuration = 300

function selectPrimaryDTC(c: HQACase): {
  selected: string
  reason: string
  rule: string
  confidence: string
} {
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

function getRoutingTarget(_dtc: string): string {
  return "【EBS・ブレーキグループ】"
}

function getPriority(dtc: string): string {
  return dtc === "2A0408" ? "高" : dtc ? "中" : "低"
}

function matchEvent(c: HQACase, event: string): boolean {
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

function matchComponent(c: HQACase, component: string): boolean {
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

export async function GET() {
  const cases = getAllCasesSortedByNo()
  const wb = new ExcelJS.Workbook()

  const ws1 = wb.addWorksheet("DTC振り分け根拠")

  const HEADERS = [
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
  ]

  ws1.addRow(HEADERS)
  const headerRow = ws1.getRow(1)
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD30515" },
    }
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true }
    cell.alignment = { vertical: "middle", horizontal: "center" }
  })
  headerRow.height = 20

  cases.forEach((c, idx) => {
    const sel = selectPrimaryDTC(c)
    const faultAt =
      typeof c.fault_at === "string" && c.fault_at.length >= 10
        ? c.fault_at.slice(0, 10)
        : c.fault_at ?? ""
    const rowData = [
      c.no,
      c.shigihono,
      c.gas_code,
      c.vehicle_model,
      c.vehicle_no,
      c.mileage,
      faultAt,
      c.symptom.slice(0, 150),
      c.inspection.slice(0, 100),
      c.analysis.slice(0, 100),
      c.diag_raw,
      c.dtc_codes.join(", "),
      sel.selected,
      sel.reason,
      sel.rule,
      sel.confidence,
      getRoutingTarget(sel.selected),
      getPriority(sel.selected),
    ]
    ws1.addRow(rowData)
    const row = ws1.getRow(idx + 2)

    if (sel.confidence === "低") {
      row.eachCell((cell, colNumber) => {
        if (colNumber !== 13) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFDE7" },
          }
        }
      })
    }

    const dtcCell = row.getCell(13)
    if (sel.selected === "2A0408") {
      dtcCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFE0E0" },
      }
    } else if (sel.selected) {
      dtcCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF3E0" },
      }
    }
  })

  ws1.columns = [
    { width: 6 },
    { width: 20 },
    { width: 10 },
    { width: 16 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    { width: 40 },
    { width: 35 },
    { width: 35 },
    { width: 20 },
    { width: 20 },
    { width: 10 },
    { width: 45 },
    { width: 20 },
    { width: 8 },
    { width: 22 },
    { width: 8 },
  ]

  const EVENTS = ["警告灯点灯", "走行不能", "異音・振動", "通信異常", "性能低下"]
  const COMPONENTS = [
    "制動装置（BST）",
    "EBS ECU",
    "ハーネス・コネクター",
    "その他",
  ] as const
  const VTYPES = ["全て", "大型", "中型"] as const

  VTYPES.forEach((vtype) => {
    const ws = wb.addWorksheet(`マトリクス_${vtype}`)
    ws.addRow(["事象 \\ 部品", ...COMPONENTS, "計"])
    const hRow = ws.getRow(1)
    hRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD30515" },
      }
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true }
      cell.alignment = { horizontal: "center" }
    })

    const colTotals = new Array(COMPONENTS.length).fill(0) as number[]

    EVENTS.forEach((event, ri) => {
      const rowCounts = COMPONENTS.map((comp) => {
        return cases.filter((c) => {
          const vtMatch = vtype === "全て" || c.vehicle_type === vtype
          const evMatch = matchEvent(c, event)
          const compMatch = matchComponent(c, comp)
          return vtMatch && evMatch && compMatch
        }).length
      })
      rowCounts.forEach((v, ci) => {
        colTotals[ci] += v
      })
      const rowTotal = rowCounts.reduce((s, v) => s + v, 0)
      ws.addRow([event, ...rowCounts, rowTotal])

      const row = ws.getRow(ri + 2)
      rowCounts.forEach((cnt, ci) => {
        const cell = row.getCell(ci + 2)
        cell.alignment = { horizontal: "center" }
        if (cnt >= 5)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFCC80" },
          }
        else if (cnt >= 3)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFE0B2" },
          }
        else if (cnt >= 1)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFF3E0" },
          }
      })
    })

    const grandTotal = colTotals.reduce((s, v) => s + v, 0)
    ws.addRow(["計", ...colTotals, grandTotal])
    const totRow = ws.getRow(EVENTS.length + 2)
    totRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      }
      cell.font = { bold: true }
      cell.alignment = { horizontal: "center" }
    })

    ws.columns = [
      { width: 14 },
      { width: 18 },
      { width: 10 },
      { width: 20 },
      { width: 10 },
      { width: 8 },
    ]
  })

  const buffer = await wb.xlsx.writeBuffer()
  const date = new Date().toISOString().slice(0, 10)

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="HQA_DTC振り分け根拠_${date}.xlsx"`,
    },
  })
}
