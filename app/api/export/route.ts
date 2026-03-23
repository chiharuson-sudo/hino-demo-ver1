import ExcelJS from "exceljs"
import { getAllCasesSortedByNo } from "@/lib/case-database"
import {
  buildExportMatrixSections,
  buildRationaleRowCells,
  DTC_RATIONALE_HEADERS,
  EXPORT_MATRIX_COMPONENTS,
  EXPORT_MATRIX_EVENTS,
} from "@/lib/dtc-export-rationale"

export const runtime = "nodejs"
export const maxDuration = 300

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
    const { cells, sel } = buildRationaleRowCells(c)
    ws1.addRow(cells)
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
      { width: 18 },
      { width: 10 },
      { width: 20 },
      { width: 10 },
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
