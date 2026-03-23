// ============================================================
// 市技報データ（HQA_CASES）から 事象×部品 マトリクスを集計
// ============================================================

import type { HQACase } from "./hqa-knowledge"
import { HQA_CASES } from "./hqa-knowledge"
import type {
  ComponentCategory,
  EventCategory,
  MatrixVehicleFilter,
} from "./stats-data"
import { COMPONENT_COLS, EVENT_ROWS } from "./stats-data"

const TEXT = (c: HQACase) =>
  `${c.symptom}\n${c.inspection}\n${c.analysis}\n${c.repair}\n${c.component}`

/** 事象（1件につき1行へ排他的に分類。どれにも当てはまらない場合は警告灯点灯系として扱う） */
function classifyEvent(c: HQACase): EventCategory {
  const t = TEXT(c)
  if (/プログラム|ソフトウェア|ファームウェア|制御ソフト|アップデート後|センサーロジック/i.test(t))
    return "プログラム不具合"
  if (/通信異常|通信エラー|CAN|タイムアウト|システムエラー.*通信|データ通信/i.test(t))
    return "通信異常"
  if (/破損|割れ|変形|折損|亀裂|欠け/i.test(t)) return "破損"
  if (/漏れ|オイル|油脂|油漏れ|液漏れ|滴下/i.test(t)) return "油脂漏れ"
  if (/異音|異響|きしみ|キシミ|鳴き|ガタ|振動/i.test(t)) return "異音"
  if (/作動不良|不作動|効かない|動かない|応答なし|不応|効き不良/i.test(t)) return "作動不良"
  if (/ランプ|点灯|警告|ウォーニング|異常表示|ABS|EBS|マルチインフォメーション/i.test(t))
    return "警告灯点灯"
  return "警告灯点灯"
}

/** 部位・系統（1件につき1列へ排他的に分類） */
function classifyComponent(c: HQACase): ComponentCategory {
  const t = TEXT(c)
  if (
    /プログラム|ソフトウェア|ファームウェア|制御ソフト|アップデート|センサーロジック/i.test(t) &&
    !/BST|ブレーキシグナル|トランスミッター/i.test(t)
  ) {
    return "ソフトウェア/制御"
  }
  if (/BST|ブレーキシグナル|トランスミッター|BSD/i.test(t)) return "BSD"
  if (/エンジン|燃料|インジェクター|EGR|DPF/i.test(t)) return "エンジン"
  if (/ドライブ|トランスミッション|変速|デフ|プロペラ|クラッチ|ミッション/i.test(t))
    return "ドライブトレイン"
  if (/制動|ブレーキ|EBS|ABS/i.test(t) && !/ブレーキシグナル|トランスミッター/i.test(t))
    return "制動装置"
  if (/ECU|電子制御|電装|センサー|配線|コンピュータ/i.test(t)) return "電子制御"
  if (/ブレーキ|EBS|ABS|BST/i.test(t)) return "制動装置"
  return "電子制御"
}

function vehicleMatches(filter: MatrixVehicleFilter, c: HQACase): boolean {
  if (filter === "全て") return true
  const vt = (c.vehicle_type ?? "").trim()
  return vt === filter
}

function emptyMatrix(): Record<
  EventCategory,
  Record<ComponentCategory, number>
> {
  const m = {} as Record<EventCategory, Record<ComponentCategory, number>>
  for (const ev of EVENT_ROWS) {
    m[ev] = {} as Record<ComponentCategory, number>
    for (const comp of COMPONENT_COLS) {
      m[ev][comp] = 0
    }
  }
  return m
}

/**
 * 市技報全件から 車両型フィルタごとのマトリクス件数を算出
 */
export function buildDefectMatrixFromCases(): Record<
  MatrixVehicleFilter,
  Record<EventCategory, Record<ComponentCategory, number>>
> {
  const filters: MatrixVehicleFilter[] = ["全て", "大型", "中型", "小型"]
  const out = {} as Record<
    MatrixVehicleFilter,
    Record<EventCategory, Record<ComponentCategory, number>>
  >

  for (const f of filters) {
    out[f] = emptyMatrix()
    const list =
      f === "全て" ? HQA_CASES : HQA_CASES.filter((c) => vehicleMatches(f, c))

    for (const c of list) {
      const ev = classifyEvent(c)
      const comp = classifyComponent(c)
      out[f][ev][comp] = (out[f][ev][comp] ?? 0) + 1
    }
  }

  return out
}

export function matrixCellCount(
  matrix: Record<
    MatrixVehicleFilter,
    Record<EventCategory, Record<ComponentCategory, number>>
  >,
  filter: MatrixVehicleFilter,
  event: EventCategory,
  component: ComponentCategory
): number {
  return matrix[filter]?.[event]?.[component] ?? 0
}

export function matrixTotal(
  matrix: Record<
    MatrixVehicleFilter,
    Record<EventCategory, Record<ComponentCategory, number>>
  >,
  filter: MatrixVehicleFilter
): number {
  let s = 0
  for (const ev of EVENT_ROWS) {
    for (const comp of COMPONENT_COLS) {
      s += matrixCellCount(matrix, filter, ev, comp)
    }
  }
  return s
}

export function matrixSoftwareTotal(
  matrix: Record<
    MatrixVehicleFilter,
    Record<EventCategory, Record<ComponentCategory, number>>
  >,
  filter: MatrixVehicleFilter
): number {
  let s = 0
  for (const ev of EVENT_ROWS) {
    s += matrixCellCount(matrix, filter, ev, "ソフトウェア/制御")
  }
  return s
}

/** ドリルダウン：セルに該当する実事例 */
export function getCasesForMatrixCellUI(
  filter: MatrixVehicleFilter,
  event: EventCategory,
  component: ComponentCategory
): HQACase[] {
  return HQA_CASES.filter((c) => {
    if (!vehicleMatches(filter, c)) return false
    return classifyEvent(c) === event && classifyComponent(c) === component
  })
}

