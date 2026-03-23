// ============================================================
// HQA 統合ナレッジ：市技報JSON + 整備解説書（DTC）
// ============================================================

import casesJson from "@/public/data/hqa_cases.json"
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
