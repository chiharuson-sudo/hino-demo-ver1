// ============================================================
// HQA一次振り分けAI - UI表示用集計データ
// ソース：H28規制大トラ BST/EBS/ABSランプ点灯・機能不良（6,249件）
// ============================================================

// ============================================================
// 型定義
// ============================================================

export type VehicleType = "全て" | "大型" | "中型" | "小型"
export type EventCategory =
  | "警告灯点灯"
  | "走行不能"
  | "異音・振動"
  | "通信異常"
  | "性能低下"

export interface MatrixCell {
  vehicle_type: VehicleType
  event_category: EventCategory
  count: number
}

export interface DTCVehicleCount {
  dtc_code: string
  大型: number
  中型: number
  小型: number
  total: number
}

export interface MonthlyCount {
  year_month: string
  count: number
}

// ============================================================
// 1. 不具合マトリックス（車両型 × 事象カテゴリ）
// ============================================================

export const DEFECT_MATRIX: Record<string, Record<EventCategory, number>> = {
  大型: {
    警告灯点灯: 5581,
    走行不能: 19,
    "異音・振動": 8,
    通信異常: 1,
    性能低下: 9,
  },
  中型: {
    警告灯点灯: 625,
    走行不能: 3,
    "異音・振動": 0,
    通信異常: 0,
    性能低下: 0,
  },
  小型: {
    警告灯点灯: 0,
    走行不能: 0,
    "異音・振動": 0,
    通信異常: 0,
    性能低下: 0,
  },
}

export const EVENT_CATEGORIES: EventCategory[] = [
  "警告灯点灯",
  "走行不能",
  "異音・振動",
  "通信異常",
  "性能低下",
]

const VEHICLE_KEYS = ["大型", "中型", "小型"] as const

/** 車両型フィルタリング後の合計を取得 */
export function getMatrixCount(
  vehicleType: VehicleType,
  eventCategory: EventCategory
): number {
  if (vehicleType === "全て") {
    return VEHICLE_KEYS.reduce(
      (sum, vt) => sum + (DEFECT_MATRIX[vt]?.[eventCategory] ?? 0),
      0
    )
  }
  return DEFECT_MATRIX[vehicleType]?.[eventCategory] ?? 0
}

/** 全件数を取得 */
export function getTotalCount(vehicleType: VehicleType): number {
  return EVENT_CATEGORIES.reduce(
    (sum, ec) => sum + getMatrixCount(vehicleType, ec),
    0
  )
}

// ============================================================
// 2. DTC別×車両型の件数
// ============================================================

export const DTC_VEHICLE_COUNTS: DTCVehicleCount[] = [
  { dtc_code: "2B0402", 大型: 2599, 中型: 235, 小型: 0, total: 2835 },
  { dtc_code: "2C0402", 大型: 2060, 中型: 214, 小型: 0, total: 2275 },
  { dtc_code: "160405", 大型: 384, 中型: 88, 小型: 0, total: 472 },
  { dtc_code: "150405", 大型: 384, 中型: 69, 小型: 0, total: 453 },
  { dtc_code: "2A0408", 大型: 358, 中型: 83, 小型: 0, total: 441 },
  { dtc_code: "160404", 大型: 19, 中型: 1, 小型: 0, total: 20 },
  { dtc_code: "150404", 大型: 17, 中型: 2, 小型: 0, total: 19 },
]

/** DTCコードで検索 */
export function getDTCVehicleCount(dtcCode: string): DTCVehicleCount | null {
  return DTC_VEHICLE_COUNTS.find((d) => d.dtc_code === dtcCode) ?? null
}

/** 車両型でフィルタしたDTC件数を返す */
export function getDTCCountByVehicle(
  dtcCode: string,
  vehicleType: VehicleType
): number {
  const data = getDTCVehicleCount(dtcCode)
  if (!data) return 0
  if (vehicleType === "全て") return data.total
  if (vehicleType === "小型") return data.小型
  if (vehicleType === "中型") return data.中型
  if (vehicleType === "大型") return data.大型
  return 0
}

// ============================================================
// 3. 月別発生件数（直近24ヶ月）
// ============================================================

export const MONTHLY_COUNTS: MonthlyCount[] = [
  { year_month: "2024-02", count: 47 },
  { year_month: "2024-03", count: 32 },
  { year_month: "2024-04", count: 29 },
  { year_month: "2024-05", count: 45 },
  { year_month: "2024-06", count: 25 },
  { year_month: "2024-07", count: 42 },
  { year_month: "2024-08", count: 34 },
  { year_month: "2024-09", count: 29 },
  { year_month: "2024-10", count: 25 },
  { year_month: "2024-11", count: 32 },
  { year_month: "2024-12", count: 23 },
  { year_month: "2025-01", count: 13 },
  { year_month: "2025-02", count: 9 },
  { year_month: "2025-03", count: 8 },
  { year_month: "2025-04", count: 7 },
  { year_month: "2025-05", count: 7 },
  { year_month: "2025-06", count: 7 },
  { year_month: "2025-07", count: 15 },
  { year_month: "2025-08", count: 8 },
  { year_month: "2025-09", count: 11 },
  { year_month: "2025-10", count: 9 },
  { year_month: "2025-11", count: 3 },
  { year_month: "2025-12", count: 6 },
  { year_month: "2026-01", count: 2 },
]

// ============================================================
// 4. サマリーカード用データ
// ============================================================

export const SUMMARY_STATS = {
  total_cases: 6249,
  cure_rate: 63,
  top_dtc: "2B0402",
  top_dtc_count: 2835,
  large_truck_ratio: 89,
  most_common_repair: "ブレーキシグナルトランスミッター（BST）交換",
}
