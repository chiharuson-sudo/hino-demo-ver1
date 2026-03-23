/**
 * 複数DTCから解析の主因となる1件を選定する（デモ用ルール）
 */

export interface PrimaryDTCSelection {
  selectedDtc: string
  selection_reason: string
  rule_applied: string
}

const PRIORITY_ORDER = [
  "2A0408",
  "2B0402",
  "2C0402",
  "160405",
  "150405",
  "160404",
  "150404",
]

function normalizeCode(c: string): string {
  return c.replace(/[^0-9A-Fa-f]/gi, "").toUpperCase()
}

export function selectPrimaryDTC(rawCodes: string[]): PrimaryDTCSelection {
  const codes = rawCodes.map(normalizeCode).filter(Boolean)
  if (codes.length === 0) {
    return {
      selectedDtc: "",
      selection_reason: "検出DTCがないため選定不可",
      rule_applied: "EMPTY_INPUT",
    }
  }

  for (const p of PRIORITY_ORDER) {
    if (codes.includes(p)) {
      return {
        selectedDtc: p,
        selection_reason: `優先リストに該当（${p}はBST/EBS系で重要度が高い）`,
        rule_applied: "PRIORITY_TABLE_MATCH",
      }
    }
  }

  const first = codes[0]
  return {
    selectedDtc: first,
    selection_reason: "優先リストに無いため、検出順の先頭を採用",
    rule_applied: "FIRST_DETECTED_FALLBACK",
  }
}
