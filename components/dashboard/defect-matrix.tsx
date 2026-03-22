"use client"

import { useMemo, useState } from "react"
import { BarChart3, TrendingUp } from "lucide-react"
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DEFECT_MATRIX,
  DTC_VEHICLE_COUNTS,
  EVENT_CATEGORIES,
  MONTHLY_COUNTS,
  SUMMARY_STATS,
  type EventCategory,
  type VehicleType,
  getDTCCountByVehicle,
  getMatrixCount,
  getTotalCount,
} from "@/lib/matrix-ui-stats"

const VEHICLE_FILTERS: VehicleType[] = ["全て", "大型", "中型", "小型"]
const VEHICLE_COLS = ["大型", "中型", "小型"] as const

function heatClass(value: number, maxVal: number): string {
  if (value === 0) return "text-muted-foreground"
  const r = maxVal > 0 ? value / maxVal : 0
  if (r < 0.15) return "bg-amber-50 text-amber-900 font-medium"
  if (r < 0.4) return "bg-orange-100 text-orange-900 font-semibold"
  return "bg-red-100 text-red-900 font-bold"
}

function mapHighlightEvent(raw?: string): EventCategory | undefined {
  if (!raw) return undefined
  const t = raw.trim()
  if (EVENT_CATEGORIES.includes(t as EventCategory)) return t as EventCategory
  if (t.includes("異音") || t.includes("振動")) return "異音・振動"
  if (t.includes("通信")) return "通信異常"
  if (t.includes("走行不能") || t.includes("不能")) return "走行不能"
  if (t.includes("性能") || t.includes("低下")) return "性能低下"
  if (t.includes("警告灯") || t.includes("点灯")) return "警告灯点灯"
  return undefined
}

function mapVehicle(raw?: string): "大型" | "中型" | "小型" | undefined {
  if (!raw) return undefined
  if (raw.includes("大型")) return "大型"
  if (raw.includes("中型")) return "中型"
  if (raw.includes("小型")) return "小型"
  return undefined
}

export interface DefectMatrixProps {
  highlightEvent?: string
  /** 解析結果の車両型（大型・中型・小型）— マトリクス列の強調に使用 */
  highlightVehicleCategory?: string
}

export function DefectMatrix({
  highlightEvent,
  highlightVehicleCategory,
}: DefectMatrixProps) {
  const [filter, setFilter] = useState<VehicleType>("全て")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<{
    event: EventCategory
    vehicle: (typeof VEHICLE_COLS)[number]
    count: number
  } | null>(null)

  const rowCategory = mapHighlightEvent(highlightEvent)
  const colVehicle = mapVehicle(highlightVehicleCategory)

  const maxCell = useMemo(() => {
    let m = 0
    for (const ev of EVENT_CATEGORIES) {
      for (const vt of VEHICLE_COLS) {
        m = Math.max(m, DEFECT_MATRIX[vt][ev] ?? 0)
      }
    }
    return m
  }, [])

  const totalFiltered = getTotalCount(filter)

  const monthlyMax = useMemo(
    () => Math.max(...MONTHLY_COUNTS.map((x) => x.count), 1),
    []
  )

  const openCell = (event: EventCategory, vehicle: (typeof VEHICLE_COLS)[number]) => {
    const count = DEFECT_MATRIX[vehicle][event] ?? 0
    if (count === 0) return
    setSelected({ event, vehicle, count })
    setDialogOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* サマリーカード */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {"総事例数"}
              </p>
              <p className="text-2xl font-bold text-[#D30515]">
                {SUMMARY_STATS.total_cases.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">{" 件"}</span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {"完治率 / 最多DTC"}
              </p>
              <p className="text-lg font-bold text-card-foreground">
                {SUMMARY_STATS.cure_rate}
                {"% / "}
                <span className="font-mono text-[#D30515]">{SUMMARY_STATS.top_dtc}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {SUMMARY_STATS.top_dtc_count.toLocaleString()}
                {" 件"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {"大型車比率"}
              </p>
              <p className="text-2xl font-bold text-card-foreground">
                {SUMMARY_STATS.large_truck_ratio}
                <span className="text-sm">{" %"}</span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {"最多修理内容"}
              </p>
              <p className="text-xs font-medium leading-snug text-card-foreground">
                {SUMMARY_STATS.most_common_repair}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* メイン：事象 × 車両型マトリクス */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-card-foreground">
                    {"不具合マトリクス（車両型 × 事象カテゴリ）"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {
                      "H28規制大トラ BST/EBS/ABS ランプ点灯・機能不良（6,249件）に基づく集計"
                    }
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {"表示合計: " + getTotalCount(filter).toLocaleString() + " 件"}
                </Badge>
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="min-w-[120px] text-xs font-semibold text-muted-foreground">
                      {"事象 \\ 車両型"}
                    </TableHead>
                    {(filter === "全て" ? VEHICLE_COLS : [filter]).map((vt) => (
                      <TableHead
                        key={vt}
                        className={`text-center text-xs font-semibold ${
                          colVehicle === vt ? "text-[#D30515]" : "text-muted-foreground"
                        }`}
                      >
                        {vt}
                      </TableHead>
                    ))}
                    <TableHead className="text-center text-xs font-semibold text-muted-foreground">
                      {"行計"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {EVENT_CATEGORIES.map((event) => {
                    const rowSum = getMatrixCount(filter, event)
                    const isRowHi = rowCategory === event
                    return (
                      <TableRow
                        key={event}
                        className={`border-border ${isRowHi ? "bg-red-50/50" : ""}`}
                      >
                        <TableCell
                          className={`text-xs font-medium ${
                            isRowHi ? "text-[#D30515] font-semibold" : "text-card-foreground"
                          }`}
                        >
                          {event}
                        </TableCell>
                        {(filter === "全て" ? VEHICLE_COLS : [filter]).map((vt) => {
                          const value =
                            vt === "大型" || vt === "中型" || vt === "小型"
                              ? DEFECT_MATRIX[vt][event] ?? 0
                              : 0
                          const isCellHi =
                            rowCategory === event &&
                            colVehicle === vt &&
                            filter === "全て"
                          return (
                            <TableCell key={vt} className="p-0 text-center text-xs">
                              <button
                                type="button"
                                disabled={value === 0}
                                onClick={() =>
                                  openCell(event, vt as (typeof VEHICLE_COLS)[number])
                                }
                                className={`flex h-full w-full items-center justify-center px-3 py-2 transition-all ${heatClass(value, maxCell)} ${
                                  value > 0
                                    ? "cursor-pointer hover:ring-2 hover:ring-[#D30515]/40 hover:ring-offset-1"
                                    : "cursor-default"
                                } ${
                                  isCellHi ? "ring-2 ring-[#D30515] ring-offset-1" : ""
                                }`}
                              >
                                {value.toLocaleString()}
                              </button>
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-center text-xs font-semibold text-card-foreground">
                          {rowSum.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="border-border bg-muted/50">
                    <TableCell className="text-xs font-bold text-card-foreground">
                      {"列計"}
                    </TableCell>
                    {(filter === "全て" ? VEHICLE_COLS : [filter]).map((vt) => {
                      const colSum =
                        vt === "大型" || vt === "中型" || vt === "小型"
                          ? EVENT_CATEGORIES.reduce(
                              (s, ev) => s + (DEFECT_MATRIX[vt][ev] ?? 0),
                              0
                            )
                          : 0
                      return (
                        <TableCell
                          key={vt}
                          className="text-center text-xs font-bold text-card-foreground"
                        >
                          {colSum.toLocaleString()}
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-center text-xs font-bold text-[#D30515]">
                      {totalFiltered.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* DTC × 車両型 */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#D30515]" />
              <CardTitle className="text-sm font-semibold text-card-foreground">
                {"DTC別 × 車両型 件数（上位）"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{"DTC"}</TableHead>
                  <TableHead className="text-center text-xs">{"大型"}</TableHead>
                  <TableHead className="text-center text-xs">{"中型"}</TableHead>
                  <TableHead className="text-center text-xs">{"小型"}</TableHead>
                  <TableHead className="text-center text-xs">{"計"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DTC_VEHICLE_COUNTS.map((row) => (
                  <TableRow key={row.dtc_code}>
                    <TableCell className="font-mono text-xs font-semibold text-[#D30515]">
                      {row.dtc_code}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {row.大型.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {row.中型.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {row.小型.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold">
                      {row.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 月別推移 */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-600" />
              <CardTitle className="text-sm font-semibold text-card-foreground">
                {"月別発生件数（直近24ヶ月）"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[96px] items-end gap-0.5 overflow-x-auto pb-1">
              {MONTHLY_COUNTS.map((m) => (
                <div
                  key={m.year_month}
                  className="flex min-w-[18px] flex-1 flex-col items-center gap-1"
                  title={`${m.year_month}: ${m.count}件`}
                >
                  <div
                    className="w-full max-w-[24px] rounded-t bg-primary/80"
                    style={{
                      height: `${Math.max(6, (m.count / monthlyMax) * 100)}%`,
                      minHeight: 4,
                    }}
                  />
                  <span className="rotate-45 text-[8px] text-muted-foreground">
                    {m.year_month.slice(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {"セル詳細"}
              {selected && (
                <>
                  <span className="text-muted-foreground">{" — "}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selected.event}
                  </Badge>
                  <span className="text-muted-foreground">{" × "}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selected.vehicle}
                  </Badge>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-left text-xs">
              {selected && (
                <>
                  <p className="mb-2">
                    {"該当セルの件数: "}
                    <strong>{selected.count.toLocaleString()}</strong>
                    {" 件"}
                  </p>
                  <p className="text-muted-foreground">
                    {
                      "集計は市技報データベース（6,249件）に基づく推計です。DTC別内訳の参考として上位コードの件数を示します。"
                    }
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {DTC_VEHICLE_COUNTS.slice(0, 3).map((d) => (
                      <li key={d.dtc_code} className="font-mono text-[11px]">
                        {d.dtc_code}
                        {"（"}
                        {getDTCCountByVehicle(d.dtc_code, selected.vehicle as VehicleType)}
                        {" / "}
                        {selected.vehicle}
                        {"）"}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
