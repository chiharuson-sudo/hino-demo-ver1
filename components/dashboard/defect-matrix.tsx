"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import Link from "next/link"
import { Download, ExternalLink, Loader2, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  COMPONENT_COLS,
  EVENT_ROWS,
  TRENDING_COMPONENT,
  type ComponentCategory,
  type EventCategory,
  type MatrixVehicleFilter,
} from "@/lib/stats-data"

const VEHICLE_FILTERS: MatrixVehicleFilter[] = ["全て", "大型", "中型", "小型"]

type MatrixPayload = Record<
  MatrixVehicleFilter,
  Record<EventCategory, Record<ComponentCategory, number>>
>

interface InquiryRecord {
  id: string
  chassisNumber: string
  dtcCode: string
  status: "調査中" | "対策済" | "保留" | "新規"
  vehicleCategory: "大型" | "中型" | "小型"
  date: string
}

function cellCount(
  matrix: MatrixPayload | null,
  filter: MatrixVehicleFilter,
  event: EventCategory,
  component: ComponentCategory
): number {
  if (!matrix) return 0
  return matrix[filter]?.[event]?.[component] ?? 0
}

function matrixTotalLocal(matrix: MatrixPayload | null, filter: MatrixVehicleFilter): number {
  if (!matrix) return 0
  let s = 0
  for (const ev of EVENT_ROWS) {
    for (const comp of COMPONENT_COLS) {
      s += cellCount(matrix, filter, ev, comp)
    }
  }
  return s
}

function softwareTotalLocal(matrix: MatrixPayload | null, filter: MatrixVehicleFilter): number {
  if (!matrix) return 0
  let s = 0
  for (const ev of EVENT_ROWS) {
    s += cellCount(matrix, filter, ev, TRENDING_COMPONENT)
  }
  return s
}

function heatClass(
  value: number,
  isSoftwareCol: boolean,
  maxRegular: number,
  maxSw: number
): string {
  if (value === 0) return "bg-white text-muted-foreground"
  const max = isSoftwareCol ? maxSw : maxRegular
  const denom = max > 0 ? max : value
  const r = value / denom
  if (isSoftwareCol) {
    if (r <= 1 / 3) return "bg-[#F3E5F5] text-violet-950 font-medium"
    if (r <= 2 / 3) return "bg-[#E1BEE7] text-violet-950 font-semibold"
    return "bg-[#CE93D8] text-violet-950 font-bold"
  }
  if (r <= 1 / 3) return "bg-[#FFF3E0] text-amber-950 font-medium"
  if (r <= 2 / 3) return "bg-[#FFE0B2] text-orange-950 font-semibold"
  return "bg-[#FFCC80] text-orange-950 font-bold"
}

function mapHighlightEvent(raw?: string): EventCategory | undefined {
  if (!raw) return undefined
  const t = raw.trim()
  if (EVENT_ROWS.includes(t as EventCategory)) return t as EventCategory
  if (t.includes("プログラム")) return "通信異常"
  if (t.includes("通信")) return "通信異常"
  if (t.includes("油脂") || t.includes("漏れ")) return "性能低下"
  if (t.includes("破損")) return "警告灯点灯"
  if (t.includes("異音") || t.includes("振動")) return "異音・振動"
  if (t.includes("走行不能") || t.includes("自走不可")) return "走行不能"
  if (t.includes("作動不良") || t.includes("作動")) return "走行不能"
  if (t.includes("警告灯") || t.includes("点灯")) return "警告灯点灯"
  if (t.includes("性能")) return "性能低下"
  return undefined
}

function mapHighlightComponent(raw?: string): ComponentCategory | undefined {
  if (!raw) return undefined
  const t = raw.toLowerCase()
  if (t.includes("ソフト") || t.includes("制御ソフト") || t.includes("プログラム"))
    return "ソフトウェア"
  if (t.includes("bsd") || t.includes("bst") || t.includes("ブレーキシグナル"))
    return "電子電装"
  if (t.includes("ドライブ") || t.includes("トレーン") || t.includes("トレイン") || t.includes("変速"))
    return "ドライブトレーン"
  if (t.includes("シャシ") || t.includes("制動") || t.includes("ブレーキ") || t.includes("ebs") || t.includes("abs"))
    return "シャシ"
  if (t.includes("電子") || t.includes("ecu") || t.includes("電装"))
    return "電子電装"
  if (t.includes("ボデ") || t.includes("ボディ")) return "ボデー"
  if (t.includes("エンジン")) return "エンジン"
  return undefined
}

export interface DefectMatrixProps {
  highlightEvent?: string
  highlightComponent?: string
}

export function DefectMatrix({ highlightEvent, highlightComponent }: DefectMatrixProps) {
  const [filter, setFilter] = useState<MatrixVehicleFilter>("全て")
  const [matrix, setMatrix] = useState<MatrixPayload | null>(null)
  const [matrixLoading, setMatrixLoading] = useState(true)
  const [matrixError, setMatrixError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cellRecordsLoading, setCellRecordsLoading] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{
    event: EventCategory
    component: ComponentCategory
    records: InquiryRecord[]
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setMatrixLoading(true)
      setMatrixError(null)
      try {
        const res = await fetch("/api/matrix-data")
        if (!res.ok) throw new Error("load failed")
        const data = (await res.json()) as { matrix: MatrixPayload }
        if (!cancelled) setMatrix(data.matrix)
      } catch {
        if (!cancelled) setMatrixError("市技報データからマトリクスを読み込めませんでした")
      } finally {
        if (!cancelled) setMatrixLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const rowHi = mapHighlightEvent(highlightEvent)
  const colHi = mapHighlightComponent(highlightComponent)

  const { maxRegular, maxSw } = useMemo(() => {
    if (!matrix) return { maxRegular: 0, maxSw: 0 }
    let mr = 0
    let ms = 0
    for (const ev of EVENT_ROWS) {
      for (const comp of COMPONENT_COLS) {
        const v = cellCount(matrix, filter, ev, comp)
        if (comp === TRENDING_COMPONENT) ms = Math.max(ms, v)
        else mr = Math.max(mr, v)
      }
    }
    return { maxRegular: mr, maxSw: ms }
  }, [matrix, filter])

  const total = matrixTotalLocal(matrix, filter)
  const swTotal = softwareTotalLocal(matrix, filter)

  const handleCellClick = async (event: EventCategory, component: ComponentCategory) => {
    const count = cellCount(matrix, filter, event, component)
    if (count === 0 || !matrix) return
    setSelectedCell({ event, component, records: [] })
    setDialogOpen(true)
    setCellRecordsLoading(true)
    try {
      const params = new URLSearchParams({
        filter,
        event,
        component,
      })
      const res = await fetch(`/api/matrix-cell?${params.toString()}`)
      if (!res.ok) throw new Error("cell failed")
      const data = (await res.json()) as { records: InquiryRecord[] }
      setSelectedCell({ event, component, records: data.records })
    } catch {
      setSelectedCell({ event, component, records: [] })
    } finally {
      setCellRecordsLoading(false)
    }
  }

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      const res = await fetch("/api/export")
      if (!res.ok) throw new Error("export failed")
      const blob = await res.blob()
      const cd = res.headers.get("Content-Disposition")
      const m = cd?.match(/filename="([^"]+)"/)
      const name = m?.[1] ?? "export.xlsx"
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    } finally {
      setExporting(false)
    }
  }, [])

  const getStatusBadge = (status: InquiryRecord["status"]) => {
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

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle className="text-base font-bold text-card-foreground">
                  {"本日の不具合マトリクス"}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {"事象（行）× 部品（列）— 市技報データを集計。セルをクリックして該当事例を表示"}
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-muted/80 text-[10px] text-muted-foreground">
                    {"合計：" + total.toLocaleString() + " 件"}
                  </Badge>
                  <Badge className="gap-1 border-violet-200 bg-violet-100 text-[10px] font-semibold text-violet-900 hover:bg-violet-100">
                    <TrendingUp className="h-3 w-3" />
                    {"SW/制御：" + swTotal.toLocaleString() + " 件"}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm border border-border bg-white" />
                    {"0"}
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FFF3E0] ring-1 ring-orange-200" />
                    {"低"}
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FFE0B2] ring-1 ring-orange-300" />
                    {"中"}
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FFCC80] ring-1 ring-orange-400" />
                    {"高（相対）"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-border text-card-foreground hover:bg-muted"
                    asChild
                  >
                    <Link
                      href="/dtc-export-rationale"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {"根拠を別タブで表示"}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    variant="outline"
                    size="sm"
                    className="border-[#D30515] text-[#D30515] hover:bg-[#D30515] hover:text-white"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {"生成中..."}
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        {"DTC振り分け根拠をエクスポート"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {"車両型フィルタ:"}
              </span>
              <div className="inline-flex h-8 flex-wrap items-center rounded-md border border-border bg-muted p-0.5">
                {VEHICLE_FILTERS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilter(cat)}
                    className={`relative inline-flex h-7 items-center justify-center rounded-sm px-3 text-xs font-medium transition-all ${
                      filter === cat
                        ? "bg-[#D30515] text-white shadow-sm"
                        : "text-muted-foreground hover:text-card-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {filter !== "全て" && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {"フィルタ: " + filter}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {matrixError && (
            <p className="mb-3 text-sm text-destructive">{matrixError}</p>
          )}
          {matrixLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              {"読み込み中..."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="min-w-[130px] text-xs font-semibold text-muted-foreground">
                      {"事象 \\ 部品"}
                    </TableHead>
                    {COMPONENT_COLS.map((comp) => {
                      const isSw = comp === TRENDING_COMPONENT
                      const isHi = colHi === comp
                      return (
                        <TableHead
                          key={comp}
                          className={`text-center text-xs font-semibold ${
                            isHi
                              ? "text-[#D30515]"
                              : isSw
                                ? "text-violet-800"
                                : "text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {comp}
                            {isSw && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-800">
                                <TrendingUp className="h-3 w-3 shrink-0" />
                                <span className="tabular-nums">{swTotal}</span>
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
                  {EVENT_ROWS.map((event) => {
                    const rowTotal = COMPONENT_COLS.reduce(
                      (s, c) => s + cellCount(matrix, filter, event, c),
                      0
                    )
                    const isNewRow = event === "通信異常"
                    const isRowHi = rowHi === event
                    return (
                      <TableRow
                        key={event}
                        className={`border-border ${isRowHi ? "bg-red-50/50" : ""}`}
                      >
                        <TableCell
                          className={`text-xs font-medium ${
                            isRowHi ? "font-semibold text-[#D30515]" : "text-card-foreground"
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
                        {COMPONENT_COLS.map((comp) => {
                          const value = cellCount(matrix, filter, event, comp)
                          const isSw = comp === TRENDING_COMPONENT
                          const isCellHi = rowHi === event && colHi === comp
                          return (
                            <TableCell key={comp} className="p-0 text-center text-xs">
                              <button
                                type="button"
                                disabled={value === 0}
                                onClick={() => handleCellClick(event, comp)}
                                className={`flex h-full min-h-[40px] w-full items-center justify-center px-2 py-2 transition-all ${heatClass(
                                  value,
                                  isSw,
                                  maxRegular,
                                  maxSw
                                )} ${
                                  value > 0
                                    ? "cursor-pointer hover:ring-2 hover:ring-[#D30515]/40 hover:ring-offset-1"
                                    : "cursor-default"
                                } ${isCellHi ? "ring-2 ring-[#D30515] ring-offset-1" : ""}`}
                                title={
                                  value > 0
                                    ? `${event} × ${comp}: ${value}件`
                                    : undefined
                                }
                              >
                                {value === 0 ? "0" : value.toLocaleString()}
                              </button>
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-center text-xs font-semibold text-card-foreground">
                          {rowTotal.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="border-border bg-muted/50">
                    <TableCell className="text-xs font-bold text-card-foreground">
                      {"計"}
                    </TableCell>
                    {COMPONENT_COLS.map((comp) => {
                      const colTotal = EVENT_ROWS.reduce(
                        (s, ev) => s + cellCount(matrix, filter, ev, comp),
                        0
                      )
                      const isSw = comp === TRENDING_COMPONENT
                      return (
                        <TableCell
                          key={comp}
                          className={`text-center text-xs font-bold ${
                            isSw ? "text-violet-900" : "text-card-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {colTotal.toLocaleString()}
                            {isSw && <TrendingUp className="h-3 w-3 text-violet-600" />}
                          </div>
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-center text-xs font-bold text-[#D30515]">
                      {total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[#D30515]">{"問い合わせ一覧"}</span>
              {selectedCell && (
                <>
                  <span className="text-muted-foreground">{"—"}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedCell.event}
                  </Badge>
                  <span className="text-muted-foreground">{"×"}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      selectedCell.component === TRENDING_COMPONENT
                        ? "border-violet-200 text-violet-800"
                        : ""
                    }`}
                  >
                    {selectedCell.component}
                  </Badge>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {filter !== "全て"
                ? `${filter}向け — 市技報の該当セル ${selectedCell?.records.length ?? 0} 件`
                : `全車両 — 市技報の該当セル ${selectedCell?.records.length ?? 0} 件`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {cellRecordsLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {"読み込み中..."}
              </div>
            ) : selectedCell && selectedCell.records.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      {"問い合わせID"}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      {"車台番号"}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      {"DTCコード"}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      {"日付"}
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      {"ステータス"}
                    </TableHead>
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
                <p className="text-sm text-muted-foreground">
                  {"該当する問い合わせはありません"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
