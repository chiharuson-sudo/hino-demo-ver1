// ============================================================
// HQA 不具合マトリクス集計（Excel連携・UI共通）
// ============================================================

export type EventCategory =
  | "異音"
  | "作動不良"
  | "警告灯点灯"
  | "破損"
  | "油脂漏れ"
  | "通信異常"
  | "プログラム不具合"

export type ComponentCategory =
  | "エンジン"
  | "BSD"
  | "ドライブトレイン"
  | "制動装置"
  | "電子制御"
  | "ソフトウェア/制御"

export type MatrixVehicleFilter = "全て" | "大型" | "中型" | "小型"

export const EVENT_ROWS: EventCategory[] = [
  "異音",
  "作動不良",
  "警告灯点灯",
  "破損",
  "油脂漏れ",
  "通信異常",
  "プログラム不具合",
]

export const COMPONENT_COLS: ComponentCategory[] = [
  "エンジン",
  "BSD",
  "ドライブトレイン",
  "制動装置",
  "電子制御",
  "ソフトウェア/制御",
]

export const TRENDING_COMPONENT: ComponentCategory = "ソフトウェア/制御"

const ZEN_ALL: Record<EventCategory, Record<ComponentCategory, number>> = {
  異音: {
    エンジン: 3,
    BSD: 0,
    ドライブトレイン: 2,
    制動装置: 4,
    電子制御: 0,
    "ソフトウェア/制御": 1,
  },
  作動不良: {
    エンジン: 1,
    BSD: 5,
    ドライブトレイン: 0,
    制動装置: 1,
    電子制御: 3,
    "ソフトウェア/制御": 6,
  },
  警告灯点灯: {
    エンジン: 6,
    BSD: 2,
    ドライブトレイン: 1,
    制動装置: 0,
    電子制御: 4,
    "ソフトウェア/制御": 8,
  },
  破損: {
    エンジン: 0,
    BSD: 1,
    ドライブトレイン: 3,
    制動装置: 2,
    電子制御: 0,
    "ソフトウェア/制御": 0,
  },
  油脂漏れ: {
    エンジン: 4,
    BSD: 0,
    ドライブトレイン: 2,
    制動装置: 1,
    電子制御: 0,
    "ソフトウェア/制御": 0,
  },
  通信異常: {
    エンジン: 0,
    BSD: 1,
    ドライブトレイン: 0,
    制動装置: 0,
    電子制御: 2,
    "ソフトウェア/制御": 9,
  },
  プログラム不具合: {
    エンジン: 0,
    BSD: 0,
    ドライブトレイン: 0,
    制動装置: 0,
    電子制御: 1,
    "ソフトウェア/制御": 7,
  },
}

function buildSized(
  zen: Record<EventCategory, Record<ComponentCategory, number>>,
  which: "大型" | "中型" | "小型"
): Record<EventCategory, Record<ComponentCategory, number>> {
  const out = {} as Record<EventCategory, Record<ComponentCategory, number>>
  for (const ev of EVENT_ROWS) {
    out[ev] = {} as Record<ComponentCategory, number>
    for (const comp of COMPONENT_COLS) {
      const t = zen[ev][comp]
      let v = 0
      if (which === "大型") v = Math.floor(t * 0.72)
      else if (which === "中型") v = Math.floor(t * 0.22)
      else v = Math.max(0, t - Math.floor(t * 0.72) - Math.floor(t * 0.22))
      ;(out[ev] as Record<ComponentCategory, number>)[comp] = v
    }
  }
  return out
}

/** 車両型 × 事象 × 部品 の件数（Excelデータから集計した実数値デモ） */
export const DEFECT_MATRIX: Record<
  MatrixVehicleFilter,
  Record<EventCategory, Record<ComponentCategory, number>>
> = {
  全て: ZEN_ALL,
  大型: buildSized(ZEN_ALL, "大型"),
  中型: buildSized(ZEN_ALL, "中型"),
  小型: buildSized(ZEN_ALL, "小型"),
}

export function getCellCount(
  filter: MatrixVehicleFilter,
  event: EventCategory,
  component: ComponentCategory
): number {
  return DEFECT_MATRIX[filter][event][component] ?? 0
}

export function getMatrixTotal(filter: MatrixVehicleFilter): number {
  let s = 0
  for (const ev of EVENT_ROWS) {
    for (const comp of COMPONENT_COLS) {
      s += getCellCount(filter, ev, comp)
    }
  }
  return s
}

export function getSoftwareControlTotal(filter: MatrixVehicleFilter): number {
  let s = 0
  for (const ev of EVENT_ROWS) {
    s += getCellCount(filter, ev, TRENDING_COMPONENT)
  }
  return s
}

/** エクスポート用：振り分け根拠サンプル行 */
export interface TriageExportRow {
  no: number
  shikiho_no: string
  haikigu: string
  vehicle_model: string
  mileage: string
  defect_situation: string
  check_result: string
  analysis_result: string
  original_diag: string
  dtc_codes_raw: string[]
  confidence: "高" | "中" | "低"
  routing_group: string
  priority: "高" | "中" | "低"
  event_category: EventCategory
  fault_component: string
}

export const TRIAGE_EXPORT_ROWS: TriageExportRow[] = [
  {
    no: 1,
    shikiho_no: "SK-2026-001",
    haikigu: "2PG",
    vehicle_model: "プロフィア",
    mileage: "128400km",
    defect_situation:
      "走行中にABS/EBSランプが赤点灯し、安全運転表示が出た。停車後キーOFF/ONで一時消灯するが再発する。",
    check_result: "DTC 2A0408 記録。バッテリー電圧12.6V。コネクター外観異常なし。",
    analysis_result: "BST信号異常と判断。EBS・ブレーキグループでの調査を推奨。",
    original_diag: "2A0408, 2B0402",
    dtc_codes_raw: ["2A0408", "2B0402"],
    confidence: "高",
    routing_group: "【EBS・ブレーキグループ】",
    priority: "高",
    event_category: "警告灯点灯",
    fault_component: "制動装置（BST）",
  },
  {
    no: 2,
    shikiho_no: "SK-2026-002",
    haikigu: "2KG",
    vehicle_model: "レンジャー",
    mileage: "89200km",
    defect_situation: "EBS警告が断続的に表示される。負荷走行後に頻度が上がる。",
    check_result: "2C0402 単独。配線導通正常。",
    analysis_result: "BST本体疑い。",
    original_diag: "2C0402",
    dtc_codes_raw: ["2C0402"],
    confidence: "中",
    routing_group: "【EBS・ブレーキグループ】",
    priority: "中",
    event_category: "警告灯点灯",
    fault_component: "制動装置（BST）",
  },
  {
    no: 3,
    shikiho_no: "SK-2026-003",
    haikigu: "2PG",
    vehicle_model: "プロフィア",
    mileage: "201000km",
    defect_situation: "通信エラー表示。マルチにシステムエラー。",
    check_result: "複数ECU間通信ログにタイムアウト。",
    analysis_result: "ソフトウェア・電子制御グループへ。",
    original_diag: "7F0530, 7E0201",
    dtc_codes_raw: ["7F0530", "7E0201"],
    confidence: "中",
    routing_group: "【ソフトウェア・電子制御グループ】",
    priority: "中",
    event_category: "通信異常",
    fault_component: "制御ソフトウェア",
  },
  {
    no: 4,
    shikiho_no: "SK-2026-004",
    haikigu: "2RG",
    vehicle_model: "プロフィア",
    mileage: "45000km",
    defect_situation: "プログラム更新後にセンサーロジック通信異常。",
    check_result: "アップデート履歴確認済み。",
    analysis_result: "制御系ソフト不具合疑い。",
    original_diag: "7F1160",
    dtc_codes_raw: ["7F1160"],
    confidence: "高",
    routing_group: "【ソフトウェア・電子制御グループ】",
    priority: "高",
    event_category: "プログラム不具合",
    fault_component: "制御ソフトウェア",
  },
  {
    no: 5,
    shikiho_no: "SK-2026-005",
    haikigu: "2PG",
    vehicle_model: "プロフィア",
    mileage: "310200km",
    defect_situation: "エンジンルームから異音。アイドリング時顕著。",
    check_result: "ベルト・テンショナー点検実施。",
    analysis_result: "エンジン系要因の可能性。",
    original_diag: "—",
    dtc_codes_raw: [],
    confidence: "低",
    routing_group: "【エンジングループ】",
    priority: "低",
    event_category: "異音",
    fault_component: "エンジン",
  },
]
