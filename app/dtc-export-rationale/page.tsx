import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAllCasesSortedByNo } from "@/lib/case-database"
import {
  buildExportMatrixSections,
  buildRationaleRowCells,
  DTC_RATIONALE_HEADERS,
  DTC_SELECTED_COLUMN_INDEX,
  EXPORT_MATRIX_COMPONENTS,
} from "@/lib/dtc-export-rationale"

export const metadata = {
  title: "DTC振り分け根拠一覧 | HQA",
  description: "Excelエクスポートと同内容のDTC振り分け根拠・マトリクス",
}

function heatClass(cnt: number): string {
  if (cnt >= 5) return "bg-[#FFCC80]"
  if (cnt >= 3) return "bg-[#FFE0B2]"
  if (cnt >= 1) return "bg-[#FFF3E0]"
  return "bg-white"
}

export default function DtcExportRationalePage() {
  const cases = getAllCasesSortedByNo()
  const matrixSections = buildExportMatrixSections(cases)
  const generatedAt = new Date().toISOString().slice(0, 19).replace("T", " ")

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-[#b91c1c]">
              {"DTC振り分け根拠（エクスポートと同内容）"}
            </h1>
            <p className="text-xs text-zinc-500">
              {"市技報 " + cases.length.toLocaleString() + " 件 — 生成: " + generatedAt}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {"ダッシュボードへ"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-10 px-4 py-8">
        <section>
          <h2 className="mb-3 text-sm font-bold text-zinc-800">
            {"1. マトリクス（Excelの「マトリクス_*」シート相当）"}
          </h2>
          <div className="space-y-8">
            {matrixSections.map((sec) => (
              <div key={sec.vtype}>
                <h3 className="mb-2 text-xs font-semibold text-zinc-600">
                  {"車両型: " + sec.vtype}
                </h3>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
                  <table className="w-full min-w-[520px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#D30515] text-white">
                        <th className="border border-zinc-200 px-2 py-2 text-left font-semibold">
                          {"事象 \\ 部品"}
                        </th>
                        {EXPORT_MATRIX_COMPONENTS.map((c) => (
                          <th
                            key={c}
                            className="border border-zinc-200 px-2 py-2 text-center font-semibold"
                          >
                            {c}
                          </th>
                        ))}
                        <th className="border border-zinc-200 px-2 py-2 text-center font-semibold">
                          {"計"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sec.rows.map((r) => (
                        <tr key={r.event}>
                          <td className="border border-zinc-200 bg-zinc-50 px-2 py-1.5 font-medium">
                            {r.event}
                          </td>
                          {r.counts.map((cnt, i) => (
                            <td
                              key={i}
                              className={`border border-zinc-200 px-2 py-1.5 text-center tabular-nums ${heatClass(cnt)}`}
                            >
                              {cnt}
                            </td>
                          ))}
                          <td className="border border-zinc-200 px-2 py-1.5 text-center font-semibold tabular-nums">
                            {r.rowTotal}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-zinc-200 font-bold">
                        <td className="border border-zinc-200 px-2 py-1.5">{"計"}</td>
                        {sec.colTotals.map((v, i) => (
                          <td
                            key={i}
                            className="border border-zinc-200 px-2 py-1.5 text-center tabular-nums"
                          >
                            {v}
                          </td>
                        ))}
                        <td className="border border-zinc-200 px-2 py-1.5 text-center tabular-nums text-[#b91c1c]">
                          {sec.grandTotal}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold text-zinc-800">
            {"2. DTC振り分け根拠（Excelの「DTC振り分け根拠」シート相当・全件）"}
          </h2>
          <p className="mb-2 text-xs text-zinc-500">
            {
              "信頼度「低」は行背景を薄い黄色、選択DTCが2A0408は赤系、それ以外の選択ありはオレンジ系で強調しています。"
            }
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-[11px] leading-snug">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-[#D30515] text-white">
                  {DTC_RATIONALE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap border border-zinc-300 px-1.5 py-2 text-left font-semibold first:sticky first:left-0 first:z-10 first:min-w-[3rem] first:bg-[#D30515]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const { cells, sel } = buildRationaleRowCells(c)
                  const low = sel.confidence === "低"
                  const rowBg = low ? "bg-amber-50/90" : "bg-white"
                  const stickyNoBg = low ? "bg-amber-50" : "bg-white"
                  return (
                    <tr key={c.no} className={"border-b border-zinc-100 " + rowBg}>
                      {cells.map((cell, i) => {
                        let cellClass =
                          "max-w-[14rem] border-r border-zinc-100 px-1.5 py-1 align-top break-words"
                        if (i === 0) {
                          cellClass +=
                            " sticky left-0 z-[1] border-r border-zinc-200 font-mono tabular-nums shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] " +
                            stickyNoBg
                        }
                        if (i === DTC_SELECTED_COLUMN_INDEX) {
                          if (sel.selected === "2A0408")
                            cellClass += " bg-red-100 font-semibold text-red-900"
                          else if (sel.selected)
                            cellClass += " bg-orange-50 font-medium text-orange-950"
                        }
                        return (
                          <td key={i} className={cellClass}>
                            {cell === "" ? "—" : String(cell)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
