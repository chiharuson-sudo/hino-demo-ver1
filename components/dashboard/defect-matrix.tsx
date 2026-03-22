"use client"

import { useState, useMemo } from "react"
import { TrendingUp, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

// ── Constants ────────────────────────────────────────────────────────────────
const COMPONENTS = ["エンジン", "BSD", "ドライブトレイン", "制動装置", "電子制御", "ソフトウェア/制御"] as const
const EVENTS = ["異音", "作動不良", "警告灯点灯", "破損", "油脂漏れ", "通信異常", "プログラム不具合"] as const
const VEHICLE_CATEGORIES = ["全て", "大型", "中型", "小型"] as const
type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number]
const TRENDING_COLUMN = "ソフトウェア/制御"

// ── Inquiry record type ──────────────────────────────────────────────────────
interface InquiryRecord {
  id: string
  chassisNumber: string
  dtcCode: string
  status: "調査中" | "対策済" | "保留" | "新規"
  vehicleCategory: "大型" | "中型" | "小型"
  date: string
}

// ── Per-category matrix data ─────────────────────────────────────────────────
// Each cell maps to a set of inquiry records per vehicle category
type MatrixEntry = Record<VehicleCategory, InquiryRecord[]>

function makeRecords(
  event: string,
  component: string,
  records: Omit<InquiryRecord, "id">[]
): InquiryRecord[] {
  return records.map((r, i) => ({
    ...r,
    id: `INQ-${event.slice(0, 2)}${component.slice(0, 2)}-${String(i + 1).padStart(3, "0")}`,
  }))
}

// Build the full dataset with realistic DTC codes from Hino
function buildDataset(): Record<string, Record<string, MatrixEntry>> {
  const data: Record<string, Record<string, MatrixEntry>> = {}

  for (const event of EVENTS) {
    data[event] = {}
    for (const comp of COMPONENTS) {
      data[event][comp] = { "全て": [], "大型": [], "中型": [], "小型": [] }
    }
  }

  // Helper to push records
  const add = (event: string, comp: string, recs: Omit<InquiryRecord, "id">[]) => {
    const records = makeRecords(event, comp, recs)
    for (const r of records) {
      data[event][comp]["全て"].push(r)
      data[event][comp][r.vehicleCategory].push(r)
    }
  }

  // ─ Populate with realistic DTC-bearing sample data ─
  // 異音
  add("異音", "エンジン", [
    { chassisNumber: "HNTF-10032", dtcCode: "2A0408", status: "調査中", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNTF-10115", dtcCode: "150404", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-20481", dtcCode: "2A0408", status: "対策済", vehicleCategory: "中型", date: "2026-02-14" },
  ])
  add("異音", "ドライブトレイン", [
    { chassisNumber: "HNTF-10201", dtcCode: "4A0302", status: "調査中", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNSM-30099", dtcCode: "4A0510", status: "新規", vehicleCategory: "小型", date: "2026-02-15" },
  ])
  add("異音", "制動装置", [
    { chassisNumber: "HNTF-10310", dtcCode: "5C0201", status: "調査中", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-20112", dtcCode: "5C0308", status: "新規", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNSM-30344", dtcCode: "5C0201", status: "保留", vehicleCategory: "小型", date: "2026-02-14" },
    { chassisNumber: "HNTF-10478", dtcCode: "5C0110", status: "対策済", vehicleCategory: "大型", date: "2026-02-13" },
  ])
  add("異音", "ソフトウェア/制御", [
    { chassisNumber: "HNTF-10502", dtcCode: "7F0101", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
  ])

  // 作動不良
  add("作動不良", "エンジン", [
    { chassisNumber: "HNMD-20055", dtcCode: "2A0612", status: "調査中", vehicleCategory: "中型", date: "2026-02-15" },
  ])
  add("作動不良", "BSD", [
    { chassisNumber: "HNTF-10601", dtcCode: "6B0101", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-20602", dtcCode: "6B0204", status: "調査中", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNSM-30603", dtcCode: "6B0101", status: "保留", vehicleCategory: "小型", date: "2026-02-15" },
    { chassisNumber: "HNTF-10604", dtcCode: "6B0308", status: "対策済", vehicleCategory: "大型", date: "2026-02-14" },
    { chassisNumber: "HNMD-20605", dtcCode: "6B0101", status: "新規", vehicleCategory: "中型", date: "2026-02-14" },
  ])
  add("作動不良", "制動装置", [
    { chassisNumber: "HNTF-10710", dtcCode: "5C0415", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
  ])
  add("作動不良", "電子制御", [
    { chassisNumber: "HNTF-10801", dtcCode: "7E0201", status: "調査中", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-20802", dtcCode: "7E0305", status: "新規", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNSM-30803", dtcCode: "7E0201", status: "対策済", vehicleCategory: "小型", date: "2026-02-14" },
  ])
  add("作動不良", "ソフトウェア/制御", [
    { chassisNumber: "HNTF-10901", dtcCode: "7F0210", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-20902", dtcCode: "7F0318", status: "調査中", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNSM-30903", dtcCode: "7F0210", status: "新規", vehicleCategory: "小型", date: "2026-02-15" },
    { chassisNumber: "HNTF-10904", dtcCode: "7F0425", status: "保留", vehicleCategory: "大型", date: "2026-02-14" },
    { chassisNumber: "HNMD-20905", dtcCode: "7F0318", status: "新規", vehicleCategory: "中型", date: "2026-02-14" },
    { chassisNumber: "HNTF-10906", dtcCode: "7F0101", status: "調査中", vehicleCategory: "大型", date: "2026-02-13" },
  ])

  // 警告灯点灯
  add("警告灯点灯", "エンジン", [
    { chassisNumber: "HNTF-11001", dtcCode: "2A0408", status: "調査中", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-21002", dtcCode: "150404", status: "新規", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNTF-11003", dtcCode: "2A0612", status: "対策済", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNSM-31004", dtcCode: "2A0408", status: "新規", vehicleCategory: "小型", date: "2026-02-14" },
    { chassisNumber: "HNTF-11005", dtcCode: "150404", status: "調査中", vehicleCategory: "大型", date: "2026-02-14" },
    { chassisNumber: "HNMD-21006", dtcCode: "2A0408", status: "保留", vehicleCategory: "中型", date: "2026-02-13" },
  ])
  add("警告灯点灯", "BSD", [
    { chassisNumber: "HNTF-11101", dtcCode: "6B0510", status: "調査中", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-21102", dtcCode: "6B0510", status: "新規", vehicleCategory: "中型", date: "2026-02-15" },
  ])
  add("警告灯点灯", "ドライブトレイン", [
    { chassisNumber: "HNTF-11201", dtcCode: "4A0712", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
  ])
  add("警告灯点灯", "電子制御", [
    { chassisNumber: "HNTF-11301", dtcCode: "7E0510", status: "調査中", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-21302", dtcCode: "7E0612", status: "新規", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNSM-31303", dtcCode: "7E0510", status: "対策済", vehicleCategory: "小型", date: "2026-02-14" },
    { chassisNumber: "HNTF-11304", dtcCode: "7E0718", status: "新規", vehicleCategory: "大型", date: "2026-02-14" },
  ])
  add("警告灯点灯", "ソフトウェア/制御", [
    { chassisNumber: "HNTF-11401", dtcCode: "7F0530", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-21402", dtcCode: "7F0625", status: "調査中", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNSM-31403", dtcCode: "7F0530", status: "新規", vehicleCategory: "小型", date: "2026-02-15" },
    { chassisNumber: "HNTF-11404", dtcCode: "7F0738", status: "保留", vehicleCategory: "大型", date: "2026-02-14" },
    { chassisNumber: "HNMD-21405", dtcCode: "7F0625", status: "新規", vehicleCategory: "中型", date: "2026-02-14" },
    { chassisNumber: "HNTF-11406", dtcCode: "7F0210", status: "調査中", vehicleCategory: "大型", date: "2026-02-13" },
    { chassisNumber: "HNSM-31407", dtcCode: "7F0101", status: "新規", vehicleCategory: "小型", date: "2026-02-13" },
    { chassisNumber: "HNTF-11408", dtcCode: "7F0530", status: "対策済", vehicleCategory: "大型", date: "2026-02-12" },
  ])

  // 破損
  add("破損", "BSD", [
    { chassisNumber: "HNMD-21501", dtcCode: "6B0712", status: "新規", vehicleCategory: "中型", date: "2026-02-15" },
  ])
  add("破損", "ドライブトレイン", [
    { chassisNumber: "HNTF-11601", dtcCode: "4A0915", status: "調査中", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-21602", dtcCode: "4A0915", status: "新規", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNSM-31603", dtcCode: "4A1020", status: "対策済", vehicleCategory: "小型", date: "2026-02-14" },
  ])
  add("破損", "制動装置", [
    { chassisNumber: "HNTF-11701", dtcCode: "5C0620", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNSM-31702", dtcCode: "5C0620", status: "調査中", vehicleCategory: "小型", date: "2026-02-15" },
  ])

  // 油脂漏れ
  add("油脂漏れ", "エンジン", [
    { chassisNumber: "HNTF-11801", dtcCode: "2A0815", status: "調査中", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-21802", dtcCode: "2A0918", status: "新規", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNTF-11803", dtcCode: "2A0815", status: "保留", vehicleCategory: "大型", date: "2026-02-14" },
    { chassisNumber: "HNSM-31804", dtcCode: "2A0918", status: "対策済", vehicleCategory: "小型", date: "2026-02-13" },
  ])
  add("油脂漏れ", "ドライブトレイン", [
    { chassisNumber: "HNTF-11901", dtcCode: "4A1125", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-21902", dtcCode: "4A1125", status: "調査中", vehicleCategory: "中型", date: "2026-02-15" },
  ])
  add("油脂漏れ", "制動装置", [
    { chassisNumber: "HNSM-32001", dtcCode: "5C0825", status: "新規", vehicleCategory: "小型", date: "2026-02-15" },
  ])

  // 通信異常
  add("通信異常", "BSD", [
    { chassisNumber: "HNTF-12101", dtcCode: "6B0920", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
  ])
  add("通信異常", "電子制御", [
    { chassisNumber: "HNTF-12201", dtcCode: "7E0830", status: "調査中", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-22202", dtcCode: "7E0935", status: "新規", vehicleCategory: "中型", date: "2026-02-15" },
  ])
  add("通信異常", "ソフトウェア/制御", [
    { chassisNumber: "HNTF-12301", dtcCode: "7F0840", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-22302", dtcCode: "7F0945", status: "調査中", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNSM-32303", dtcCode: "7F0840", status: "新規", vehicleCategory: "小型", date: "2026-02-15" },
    { chassisNumber: "HNTF-12304", dtcCode: "7F1050", status: "保留", vehicleCategory: "大型", date: "2026-02-14" },
    { chassisNumber: "HNMD-22305", dtcCode: "7F0945", status: "新規", vehicleCategory: "中型", date: "2026-02-14" },
    { chassisNumber: "HNTF-12306", dtcCode: "7F0840", status: "調査中", vehicleCategory: "大型", date: "2026-02-13" },
    { chassisNumber: "HNSM-32307", dtcCode: "7F1050", status: "新規", vehicleCategory: "小型", date: "2026-02-13" },
    { chassisNumber: "HNTF-12308", dtcCode: "7F0840", status: "対策済", vehicleCategory: "大型", date: "2026-02-12" },
    { chassisNumber: "HNMD-22309", dtcCode: "7F0945", status: "新規", vehicleCategory: "中型", date: "2026-02-12" },
  ])

  // プログラム不具合
  add("プログラム不具合", "電子制御", [
    { chassisNumber: "HNTF-12401", dtcCode: "7E1040", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
  ])
  add("プログラム不具合", "ソフトウェア/制御", [
    { chassisNumber: "HNTF-12501", dtcCode: "7F1160", status: "新規", vehicleCategory: "大型", date: "2026-02-15" },
    { chassisNumber: "HNMD-22502", dtcCode: "7F1265", status: "調査中", vehicleCategory: "中型", date: "2026-02-15" },
    { chassisNumber: "HNSM-32503", dtcCode: "7F1160", status: "新規", vehicleCategory: "小型", date: "2026-02-15" },
    { chassisNumber: "HNTF-12504", dtcCode: "7F1370", status: "保留", vehicleCategory: "大型", date: "2026-02-14" },
    { chassisNumber: "HNMD-22505", dtcCode: "7F1265", status: "新規", vehicleCategory: "中型", date: "2026-02-14" },
    { chassisNumber: "HNTF-12506", dtcCode: "7F1160", status: "調査中", vehicleCategory: "大型", date: "2026-02-13" },
    { chassisNumber: "HNSM-32507", dtcCode: "7F1370", status: "新規", vehicleCategory: "小型", date: "2026-02-13" },
  ])

  return data
}

const FULL_DATASET = buildDataset()

// ── Helpers ──────────────────────────────────────────────────────────────────
function getCellColor(value: number, isTrendingCol: boolean): string {
  if (value === 0) return ""
  if (isTrendingCol) {
    if (value <= 2) return "bg-violet-50 text-violet-700 font-medium"
    if (value <= 5) return "bg-violet-100 text-violet-800 font-semibold"
    return "bg-violet-200 text-violet-900 font-bold"
  }
  if (value <= 2) return "bg-amber-50 text-amber-700 font-medium"
  if (value <= 4) return "bg-orange-100 text-orange-800 font-semibold"
  return "bg-red-100 text-red-800 font-bold"
}

function getStatusBadge(status: InquiryRecord["status"]) {
  switch (status) {
    case "新規":
      return "border-red-200 bg-red-50 text-red-700"
    case "調査中":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "保留":
      return "border-slate-200 bg-slate-50 text-slate-600"
    case "対策済":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
}

// ── Props ────────────────────────────────────────────────────────────────────
interface DefectMatrixProps {
  highlightEvent?: string
  highlightComponent?: string
}

// ── Component ────────────────────────────────────────────────────────────────
export function DefectMatrix({ highlightEvent, highlightComponent }: DefectMatrixProps) {
  const [activeCategory, setActiveCategory] = useState<VehicleCategory>("全て")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{
    event: string
    component: string
    records: InquiryRecord[]
  } | null>(null)

  // Compute filtered counts
  const matrixCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {}
    for (const event of EVENTS) {
      counts[event] = {}
      for (const comp of COMPONENTS) {
        counts[event][comp] = FULL_DATASET[event]?.[comp]?.[activeCategory]?.length ?? 0
      }
    }
    return counts
  }, [activeCategory])

  const totalDefects = useMemo(
    () =>
      EVENTS.reduce(
        (sum, event) =>
          sum + COMPONENTS.reduce((s, comp) => s + (matrixCounts[event]?.[comp] ?? 0), 0),
        0
      ),
    [matrixCounts]
  )

  const softwareTotal = useMemo(
    () => EVENTS.reduce((sum, event) => sum + (matrixCounts[event]?.[TRENDING_COLUMN] ?? 0), 0),
    [matrixCounts]
  )

  const handleCellClick = (event: string, component: string) => {
    const records = FULL_DATASET[event]?.[component]?.[activeCategory] ?? []
    if (records.length === 0) return
    setSelectedCell({ event, component, records })
    setDialogOpen(true)
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-card-foreground">
                  {"本日の不具合マトリクス"}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {"事象 (行) \u00D7 部品 (列) \u2014 セルをクリックして詳細を表示"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {"合計: " + totalDefects + " 件"}
                </Badge>
                <Badge className="gap-1 bg-violet-100 text-[10px] font-semibold text-violet-800 hover:bg-violet-100">
                  <TrendingUp className="h-3 w-3" />
                  {"SW/制御: " + softwareTotal + " 件"}
                </Badge>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted" />
                  {"0"}
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-50 ring-1 ring-amber-200" />
                  {"1-2"}
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-100 ring-1 ring-orange-200" />
                  {"3-4"}
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-100 ring-1 ring-red-200" />
                  {"5+"}
                </div>
              </div>
            </div>

            {/* ── Vehicle Category Segmented Control ── */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {"車両型フィルタ:"}
              </span>
              <div className="inline-flex h-8 items-center rounded-md border border-border bg-muted p-0.5">
                {VEHICLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`relative inline-flex h-7 items-center justify-center rounded-sm px-3 text-xs font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-[#D30515] text-white shadow-sm"
                        : "text-muted-foreground hover:text-card-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {activeCategory !== "全て" && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {"フィルタ: " + activeCategory}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-[130px] text-xs font-semibold text-muted-foreground">
                    {"事象 \\ 部品"}
                  </TableHead>
                  {COMPONENTS.map((comp) => {
                    const isTrending = comp === TRENDING_COLUMN
                    return (
                      <TableHead
                        key={comp}
                        className={`text-center text-xs font-semibold ${
                          comp === highlightComponent
                            ? "text-[#D30515]"
                            : isTrending
                              ? "text-violet-700"
                              : "text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {comp}
                          {isTrending && (
                            <span className="relative flex h-4 w-4 items-center justify-center" title="増加傾向 — 要注意">
                              <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
                              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
                            </span>
                          )}
                        </div>
                      </TableHead>
                    )
                  })}
                  <TableHead className="text-center text-xs font-semibold text-muted-foreground">
                    {"計"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EVENTS.map((event) => {
                  const rowTotal = COMPONENTS.reduce(
                    (sum, comp) => sum + (matrixCounts[event]?.[comp] ?? 0),
                    0
                  )
                  const isHighlightedRow = event === highlightEvent
                  const isNewRow = event === "通信異常" || event === "プログラム不具合"
                  return (
                    <TableRow
                      key={event}
                      className={`border-border ${isHighlightedRow ? "bg-red-50/50" : ""}`}
                    >
                      <TableCell
                        className={`text-xs font-medium ${
                          isHighlightedRow ? "text-[#D30515] font-semibold" : "text-card-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {event}
                          {isNewRow && (
                            <span className="rounded bg-violet-100 px-1 py-0.5 text-[9px] font-bold leading-none text-violet-700">
                              {"NEW"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {COMPONENTS.map((comp) => {
                        const value = matrixCounts[event]?.[comp] ?? 0
                        const isHighlightedCell =
                          event === highlightEvent && comp === highlightComponent
                        const isTrendingCol = comp === TRENDING_COLUMN
                        return (
                          <TableCell
                            key={comp}
                            className={`p-0 text-center text-xs`}
                          >
                            <button
                              onClick={() => handleCellClick(event, comp)}
                              disabled={value === 0}
                              className={`flex h-full w-full items-center justify-center px-4 py-2 transition-all ${getCellColor(value, isTrendingCol)} ${
                                value > 0
                                  ? "cursor-pointer hover:ring-2 hover:ring-[#D30515]/40 hover:ring-offset-1"
                                  : "cursor-default text-muted-foreground"
                              } ${
                                isHighlightedCell
                                  ? "ring-2 ring-[#D30515] ring-offset-1"
                                  : isTrendingCol && value > 0
                                    ? "border-l border-r border-violet-100"
                                    : ""
                              }`}
                              title={value > 0 ? `${event} \u00D7 ${comp}: ${value}件 \u2014 クリックで詳細` : ""}
                            >
                              {value}
                            </button>
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-center text-xs font-semibold text-card-foreground">
                        {rowTotal}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {/* Total Row */}
                <TableRow className="border-border bg-muted/50">
                  <TableCell className="text-xs font-bold text-card-foreground">
                    {"計"}
                  </TableCell>
                  {COMPONENTS.map((comp) => {
                    const colTotal = EVENTS.reduce(
                      (sum, event) => sum + (matrixCounts[event]?.[comp] ?? 0),
                      0
                    )
                    const isTrending = comp === TRENDING_COLUMN
                    return (
                      <TableCell
                        key={comp}
                        className={`text-center text-xs font-bold ${
                          isTrending ? "text-violet-800" : "text-card-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {colTotal}
                          {isTrending && (
                            <TrendingUp className="h-3 w-3 text-violet-600" />
                          )}
                        </div>
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center text-xs font-bold text-[#D30515]">
                    {totalDefects}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Drill-Down Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <span className="text-[#D30515]">{"問い合わせ一覧"}</span>
              {selectedCell && (
                <>
                  <span className="text-muted-foreground">{"\u2014"}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedCell.event}
                  </Badge>
                  <span className="text-muted-foreground">{"\u00D7"}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      selectedCell.component === TRENDING_COLUMN
                        ? "border-violet-200 text-violet-700"
                        : ""
                    }`}
                  >
                    {selectedCell.component}
                  </Badge>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {activeCategory !== "全て"
                ? `${activeCategory}車のみ表示中 \u2014 ${selectedCell?.records.length ?? 0}件`
                : `全車両 \u2014 ${selectedCell?.records.length ?? 0}件`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {selectedCell && selectedCell.records.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs font-semibold text-muted-foreground">{"問い合わせID"}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{"車台番号"}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{"DTCコード"}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{"日付"}</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">{"ステータス"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCell.records.map((record) => (
                    <TableRow key={record.id} className="border-border">
                      <TableCell className="text-xs font-medium text-card-foreground">
                        <div className="flex items-center gap-1.5">
                          {record.id}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-card-foreground">
                        {record.chassisNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] font-semibold text-[#D30515]"
                        >
                          {record.dtcCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {record.date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${getStatusBadge(record.status)}`}
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">{"該当する問い合わせはありません"}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
