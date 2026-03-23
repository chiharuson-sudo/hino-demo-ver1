// ============================================================
// HQA 統合ナレッジ：市技報JSON + 整備解説書（DTC）
// ============================================================

import casesJson from "@/public/data/hqa_cases.json"
import type { ComponentCategory, EventCategory } from "./stats-data"
import { lookupDTCFromText } from "./knowledge"

export interface HQACase {
  no: number
  shigihono: string
  gas_code: string
  vehicle_type: string
  vehicle_model: string
  vehicle_no: string
  mileage: number
  issued_at: string
  fault_at: string
  symptom: string
  inspection: string
  analysis: string
  repair: string
  repair_result: string
  diag_raw: string
  dtc_codes: string[]
  component: string
}

export const HQA_CASES = casesJson as HQACase[]

export { buildKnowledgeContext } from "./knowledge"

/** 不具合記述テキストからDTCコードを抽出（整備解説書登録分） */
export function extractDTCs(defect_report: string): string[] {
  return lookupDTCFromText(defect_report).map((d) => d.code)
}

/**
 * DTCコードがない案件の部品カテゴリを
 * 部位名称・修理内容・解析結果・症状テキストから推定する
 */
export function classifyComponentFromText(
  buhin: string,
  repair: string,
  analysis: string,
  symptom: string
): ComponentCategory {
  const t = `${buhin} ${repair} ${analysis} ${symptom}`.toUpperCase()

  if (/プログラム|ソフトウェア|ファームウェア|アップデート|UPDATE|リプロ/.test(t))
    return "ソフトウェア"

  if (
    /EBS|ABS|ECU|BST|ブレーキシグナル|トランスミッタ|CAN|VSC|ASR|センサー/.test(t) &&
    !/プログラム|ソフトウェア|リプロ/.test(t)
  )
    return "電子電装"

  if (
    /ブレーキ|シャシ|サスペンション|アクスル|タイヤ|ステアリング/.test(t) &&
    !/EBS|ABS|BST|ECU/.test(t)
  )
    return "シャシ"

  if (/エンジン|ENGINE|燃料|噴射|ターボ|冷却/.test(t)) return "エンジン"

  if (/トランスミッション|クラッチ|ドライブ|シャフト|デフ|変速/.test(t))
    return "ドライブトレーン"

  if (/ボデー|ボディ|荷台|ドア|窓|シート/.test(t)) return "ボデー"

  return "電子電装"
}

/** 事象カテゴリをテキストから推定する */
export function classifyEventFromText(symptom: string, title: string): EventCategory {
  const t = `${symptom} ${title}`
  if (/ランプ点灯|警告灯|EBS点灯|ABS点灯|ウォーニング|異常表示|ランプが点灯/.test(t))
    return "警告灯点灯"
  if (/走行不能|自走不可/.test(t)) return "走行不能"
  if (/異音|振動/.test(t)) return "異音・振動"
  if (/通信|CAN/.test(t)) return "通信異常"
  if (/効き不良|性能/.test(t)) return "性能低下"
  return "警告灯点灯"
}
