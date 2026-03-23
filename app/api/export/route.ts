import ExcelJS from "exceljs"
import { getAllCasesSortedByNo } from "@/lib/case-database"
import {
  buildExportMatrixSections,
  buildRationaleRowCells,
  DTC_RATIONALE_HEADERS,
  EXPORT_MATRIX_COMPONENTS,
  EXPORT_MATRIX_EVENTS,
  getRationaleTone,
  type RationaleTone,
} from "@/lib/dtc-export-rationale"

export const runtime = "nodejs"
export const maxDuration = 300

/** HTML（Tailwind）のトーンに揃えた塗り（ARGB: AARRGGBB） */
function excelFillForTone(t: RationaleTone): { argb: string } | null {
  switch (t) {
    case "new":
      return { argb: "FFFEE2E2" }
    case "narrowed":
      return { argb: "FFFFEDD5" }
    case "low":
      return { argb: "FFFEF9C3" }
    case "inferred":
      return { argb: "FFE0F2FE" }
    default:
      return null
  }
}

export async function GET() {
  const cases = getAllCasesSortedByNo()
  const wb = new ExcelJS.Workbook()

  const ws1 = wb.addWorksheet("DTC振り分け根拠")

  ws1.addRow([...DTC_RATIONALE_HEADERS])
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
    const { cells } = buildRationaleRowCells(c)
    ws1.addRow(cells)
    const row = ws1.getRow(idx + 2)
    const tone = getRationaleTone(c)
    const fill = excelFillForTone(tone)
    if (fill) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: fill,
        }
      })
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

  const matrixSections = buildExportMatrixSections(cases)

  matrixSections.forEach(({ vtype, rows, colTotals, grandTotal }) => {
    const ws = wb.addWorksheet(`マトリクス_${vtype}`)
    ws.addRow(["事象 \\ 部品", ...EXPORT_MATRIX_COMPONENTS, "計"])
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

    rows.forEach((r, ri) => {
      ws.addRow([r.event, ...r.counts, r.rowTotal])
      const row = ws.getRow(ri + 2)
      r.counts.forEach((cnt, ci) => {
        const cell = row.getCell(ci + 2)
        cell.alignment = { horizontal: "center" }
        if (cnt < 1) return
        const tone = r.cellTones[ci]
        const fill = excelFillForTone(tone)
        if (fill) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: fill,
          }
        }
      })
    })

    ws.addRow(["計", ...colTotals, grandTotal])
    const totRow = ws.getRow(EXPORT_MATRIX_EVENTS.length + 2)
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
      { width: 11 },
      { width: 11 },
      { width: 11 },
      { width: 11 },
      { width: 11 },
      { width: 11 },
      { width: 8 },
    ]
  })

  const buffer = await wb.xlsx.writeBuffer()
  const date = new Date().toISOString().slice(0, 10)
  const asciiName = `HQA_DTC_export_${date}.xlsx`
  const displayName = `HQA_DTC振り分け根拠_${date}.xlsx`
  const disposition = `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(displayName)}`

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": disposition,
    },
  })
}
