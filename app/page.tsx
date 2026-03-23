"use client"

import { useState, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { InputPanel } from "@/components/dashboard/input-panel"
import { ResultPanel, type TriageResult } from "@/components/dashboard/result-panel"
import { DefectMatrix } from "@/components/dashboard/defect-matrix"

const SOFTWARE_KEYWORDS = [
  "update", "アップデート", "更新",
  "communication error", "通信エラー", "通信異常",
  "program", "プログラム",
  "sensor logic", "センサーロジック", "センサー",
  "ソフトウェア", "制御ソフト", "ファームウェア",
  "ecu", "コンピュータ", "電子制御",
]

function extractJsonBlock(text: string): string | null {
  const m = text.match(/```json\s*([\s\S]*?)\s*```/)
  return m ? m[1].trim() : null
}

function normalizeVehicleType(raw: string): string {
  const v = raw.trim()
  if (v.includes("大型")) return "大型"
  if (v.includes("中型")) return "中型"
  if (v.includes("小型")) return "小型"
  return "大型"
}

function priorityToConfidence(p: string): number {
  if (p.includes("高")) return 88
  if (p.includes("低")) return 55
  return 72
}

function parseRoutingGroup(routing: string): string {
  const m = routing.match(/【([^】]+)】/)
  return m ? m[1] : routing.replace(/への転送.*$/u, "").trim() || "（要確認）"
}

function mapParsedJsonToTriage(j: Record<string, unknown>): TriageResult | null {
  try {
    const ds = j.dtc_selection as Record<string, unknown> | undefined
    const vehicleRaw = String(j.vehicle_type ?? "大型")
    const vehicleCategory = normalizeVehicleType(vehicleRaw)
    const eventType = String(j.event_category ?? "警告灯点灯")
    const component = String(j.component ?? "不明")
    const isSoftwareIssue = Boolean(j.is_software_issue)
    const dtcCodes = Array.isArray(j.dtc_codes)
      ? (j.dtc_codes as unknown[]).map((x) => String(x))
      : []
    const priority = String(j.priority ?? "中")
    const routing_target = String(j.routing_target ?? "")
    const reasoning = String(j.reasoning ?? "")
    const recommended_action = String(j.recommended_action ?? "")
    const selectedDtc = String(
      j.selected_dtc ?? ds?.selected_dtc ?? ""
    )

    return {
      vehicleCategory,
      eventType,
      component,
      isSoftwareIssue,
      reasoning,
      recommendedAction: recommended_action,
      engineeringGroup: parseRoutingGroup(routing_target),
      confidence: priorityToConfidence(priority),
      dtcCodes,
      selectedDtc: selectedDtc || undefined,
    }
  } catch {
    return null
  }
}

/** Gemini（/api/analyze）のマークダウン＋JSON出力を TriageResult に変換 */
function parseGeminiAnalyzeResponse(outputText: string): TriageResult | null {
  const jsonStr = extractJsonBlock(outputText)
  if (!jsonStr) return null
  try {
    const j = JSON.parse(jsonStr) as Record<string, unknown>
    return mapParsedJsonToTriage(j)
  } catch {
    return null
  }
}

function simulateTriageAnalysis(text: string): TriageResult {
  const lowerText = text.toLowerCase()

  let vehicleCategory = "大型"
  if (lowerText.includes("小型") || lowerText.includes("小さ")) {
    vehicleCategory = "小型"
  } else if (lowerText.includes("中型")) {
    vehicleCategory = "中型"
  }

  const isSoftwareIssue = SOFTWARE_KEYWORDS.some((kw) => lowerText.includes(kw))

  let eventType = "警告灯点灯"
  if (lowerText.includes("通信") && (lowerText.includes("異常") || lowerText.includes("エラー"))) {
    eventType = "通信異常"
  } else if (
    lowerText.includes("プログラム") &&
    (lowerText.includes("不具合") || lowerText.includes("異常") || lowerText.includes("エラー"))
  ) {
    eventType = "通信異常"
  } else if (lowerText.includes("異音") || lowerText.includes("振動")) {
    eventType = "異音・振動"
  } else if (lowerText.includes("走行不能") || lowerText.includes("走れない")) {
    eventType = "走行不能"
  } else if (lowerText.includes("性能") || lowerText.includes("出力低下")) {
    eventType = "性能低下"
  } else if (lowerText.includes("作動不良") || lowerText.includes("作動")) {
    eventType = "走行不能"
  } else if (lowerText.includes("破損") || lowerText.includes("割れ") || lowerText.includes("壊")) {
    eventType = "警告灯点灯"
  } else if (lowerText.includes("漏れ") || lowerText.includes("油脂") || lowerText.includes("オイル")) {
    eventType = "性能低下"
  }

  let component = "エンジン"
  let engineeringGroup = "エンジングループ"

  if (isSoftwareIssue) {
    component = "ソフトウェア"
    engineeringGroup = "ソフトウェア・電子制御グループ"
  } else if (lowerText.includes("bsd") || lowerText.includes("ブラインドスポット")) {
    component = "電子電装"
    engineeringGroup = "EBS・ブレーキグループ"
  } else if (
    lowerText.includes("ドライブトレーン") ||
    lowerText.includes("トランスミッション") ||
    lowerText.includes("変速")
  ) {
    component = "ドライブトレーン"
    engineeringGroup = "駆動グループ"
  } else if (
    lowerText.includes("制動") ||
    lowerText.includes("ブレーキ") ||
    lowerText.includes("ebs") ||
    lowerText.includes("abs")
  ) {
    component = "電子電装"
    engineeringGroup = "EBS・ブレーキグループ"
  } else if (
    lowerText.includes("電子制御") ||
    lowerText.includes("ecu") ||
    lowerText.includes("コンピュータ")
  ) {
    component = "電子電装"
    engineeringGroup = "電装グループ"
  }

  let confidence = 65
  const keywords = [
    "大型", "中型", "小型", "エンジン", "bsd", "制動", "ブレーキ",
    "異音", "作動不良", "警告灯", "破損", "漏れ", "ドライブトレーン", "電子制御",
    ...SOFTWARE_KEYWORDS,
  ]
  const matchCount = keywords.filter((kw) => lowerText.includes(kw)).length
  confidence = Math.min(97, 65 + matchCount * 8)

  const dtcMatches = text.match(/\b[0-9A-Fa-f]{4,6}\b/g) ?? []
  const dtcCodes = [...new Set(dtcMatches.filter((c) => /^[0-9A-Fa-f]{5,6}$/.test(c)))]

  const hwSwDetermination = "記述内容から、原因がハードウェア起因かソフトウェア起因かを判定しました。"
  const softwareNote = isSoftwareIssue
    ? "ソフトウェア関連キーワードを検出したため、「ソフトウェア」に分類しました。"
    : `今回はハードウェア起因と判定し、物理部品「${component}」に分類しました。`

  const reasoning = `まず、記述内容から車両サイズを「${vehicleCategory}」と特定しました。${hwSwDetermination} 次に、「${eventType}」という事象（現象）に着目し、関連する部品として「${component}」を推定しました。${softwareNote} この事象パターンと部品の組み合わせから、担当エンジニアリンググループは「${engineeringGroup}」が最適と判断しました。`

  const recommendedAction = isSoftwareIssue
    ? "【だいあな】へ登録し、【ソフトウェア・電子制御グループ】への転送を推奨します。"
    : `【だいあな】へ登録し、【${engineeringGroup}】へ転送してください。`

  return {
    vehicleCategory,
    eventType,
    component,
    isSoftwareIssue,
    reasoning,
    recommendedAction,
    engineeringGroup,
    confidence,
    dtcCodes,
    selectedDtc: dtcCodes[0],
  }
}

export default function Page() {
  const [inputText, setInputText] = useState("")
  const [result, setResult] = useState<TriageResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState("")
  const [useGeminiApi, setUseGeminiApi] = useState(true)

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) return
    setIsAnalyzing(true)
    setResult(null)

    let analysisResult: TriageResult | null = null

    if (useGeminiApi) {
      try {
        setAnalysisStatus("Gemini APIに接続中...")
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ defect_report: inputText }),
        })

        const json = (await response.json()) as {
          result?: string
          parsed?: Record<string, unknown> | null
          error?: string
        }

        if (response.ok && json.parsed && typeof json.parsed === "object") {
          setAnalysisStatus("解析結果を整形中...")
          analysisResult = mapParsedJsonToTriage(json.parsed)
        }
        if (!analysisResult && response.ok && json.result) {
          setAnalysisStatus("解析結果を整形中...")
          analysisResult = parseGeminiAnalyzeResponse(json.result)
        }

        if (!analysisResult) {
          setAnalysisStatus("ローカル解析にフォールバック中...")
        }
      } catch {
        setAnalysisStatus("API接続失敗 — ローカル解析にフォールバック...")
      }
    }

    if (!analysisResult) {
      setAnalysisStatus("ローカル推論を実行中...")
      await new Promise((resolve) => setTimeout(resolve, 1200))
      analysisResult = simulateTriageAnalysis(inputText)
    }

    setResult(analysisResult)
    setIsAnalyzing(false)
    setAnalysisStatus("")
  }, [inputText, useGeminiApi])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader useGeminiApi={useGeminiApi} onToggleGeminiApi={setUseGeminiApi} />

      <main className="flex-1 p-4 lg:p-6">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-2 lg:gap-6">
          <InputPanel
            inputText={inputText}
            onInputChange={setInputText}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
          <ResultPanel result={result} isAnalyzing={isAnalyzing} />
        </div>

        {analysisStatus ? (
          <p className="mx-auto mt-2 max-w-7xl text-center text-xs text-muted-foreground">
            {analysisStatus}
          </p>
        ) : null}

        <div className="mx-auto mt-4 max-w-7xl lg:mt-6">
          <DefectMatrix
            highlightEvent={result?.eventType}
            highlightComponent={result?.component}
          />
        </div>

        <footer className="mx-auto mt-4 max-w-7xl text-center text-[10px] text-muted-foreground lg:mt-6">
          <p>
            {"HQA 一次振り分け支援 AI — Demo Version — "}
            {"本システムはデモ用です。解析は Gemini API（またはローカル推論）に基づきます。"}
          </p>
        </footer>
      </main>
    </div>
  )
}
