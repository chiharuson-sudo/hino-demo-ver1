import { NextResponse } from "next/server"
import type { HQACase } from "@/lib/hqa-knowledge"
import { getCasesForMatrixCellUI } from "@/lib/matrix-from-cases"
import {
  COMPONENT_COLS,
  EVENT_ROWS,
  type ComponentCategory,
  type EventCategory,
  type MatrixVehicleFilter,
} from "@/lib/stats-data"

export const runtime = "nodejs"

const FILTERS: MatrixVehicleFilter[] = ["全て", "大型", "中型", "小型"]

function isMatrixVehicleFilter(s: string): s is MatrixVehicleFilter {
  return (FILTERS as string[]).includes(s)
}

function mapRepairStatus(r: string): "調査中" | "対策済" | "保留" | "新規" {
  const t = (r ?? "").trim()
  if (/完治|修理完了|解消|対策済|交換.*完了|復旧/i.test(t)) return "対策済"
  if (/保留|見送り/i.test(t)) return "保留"
  if (/調査|継続|様子見|追跡|確認中/i.test(t)) return "調査中"
  return "新規"
}

function mapVehicleCategory(vt: string): "大型" | "中型" | "小型" {
  const t = (vt ?? "").trim()
  if (t === "中型") return "中型"
  if (t === "小型") return "小型"
  return "大型"
}

export interface MatrixCellInquiryRecord {
  id: string
  chassisNumber: string
  dtcCode: string
  status: "調査中" | "対策済" | "保留" | "新規"
  vehicleCategory: "大型" | "中型" | "小型"
  date: string
}

function mapCaseToInquiry(c: HQACase): MatrixCellInquiryRecord {
  return {
    id: `HQA-${c.no}`,
    chassisNumber: c.vehicle_no?.trim() || "—",
    dtcCode: c.dtc_codes[0]?.trim() || "—",
    status: mapRepairStatus(c.repair_result),
    vehicleCategory: mapVehicleCategory(c.vehicle_type),
    date: (c.fault_at ?? c.issued_at ?? "").slice(0, 10) || "—",
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const filterRaw = url.searchParams.get("filter") ?? ""
  const eventRaw = url.searchParams.get("event") ?? ""
  const componentRaw = url.searchParams.get("component") ?? ""

  if (!isMatrixVehicleFilter(filterRaw)) {
    return NextResponse.json({ error: "invalid filter" }, { status: 400 })
  }
  if (!EVENT_ROWS.includes(eventRaw as EventCategory)) {
    return NextResponse.json({ error: "invalid event" }, { status: 400 })
  }
  if (!COMPONENT_COLS.includes(componentRaw as ComponentCategory)) {
    return NextResponse.json({ error: "invalid component" }, { status: 400 })
  }

  const cases = getCasesForMatrixCellUI(
    filterRaw,
    eventRaw as EventCategory,
    componentRaw as ComponentCategory
  )
  const records = cases.map(mapCaseToInquiry)
  return NextResponse.json({ records })
}
