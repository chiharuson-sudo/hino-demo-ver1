"use client"

import { useState, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { InputPanel } from "@/components/dashboard/input-panel"
import { ResultPanel, type TriageResult } from "@/components/dashboard/result-panel"
import { DefectMatrix, type NewInquiryRecord } from "@/components/dashboard/defect-matrix"

// Software/control keywords for prioritized detection
const SOFTWARE_KEYWORDS = [
  "update", "アップデート", "更新",
  "communication error", "通信エラー", "通信異常",
  "program", "プログラム",
  "sensor logic", "センサーロジック", "センサー",
  "ソフトウェア", "制御ソフト", "ファームウェア",
  "ecu", "コンピュータ", "電子制御",
]

// ── Parse Dify API response text into TriageResult ──────────────────────────
function parseDifyResponse(outputText: string, inputText: string): TriageResult | null {
  try {
    const lowerInput = inputText.toLowerCase()
    const isSoftwareIssue = SOFTWARE_KEYWORDS.some((kw) => lowerInput.includes(kw))

    // Attempt JSON parse first (if Dify returns structured JSON)
    try {
      const json = JSON.parse(outputText)
      if (json.vehicleCategory && json.eventType && json.component) {
        return {
          vehicleCategory: json.vehicleCategory,
          eventType: json.eventType,
          component: json.component,
          isSoftwareIssue: json.isSoftwareIssue ?? isSoftwareIssue,
          reasoning: json.reasoning ?? outputText,
          recommendedAction: json.recommendedAction ?? "",
          engineeringGroup: json.engineeringGroup ?? "",
          confidence: json.confidence ?? 85,
          dtcCodes: json.dtcCodes ?? [],
        }
      }
    } catch {
      // Not JSON, parse as text
    }

    // Text-based parsing from Dify's output
    const vehicleMatch = outputText.match(/車両型[：:]?\s*(大型|中型|小型)/u)
    const eventMatch = outputText.match(/事象[：:]?\s*([^\s,、。]+)/u)
    const componentMatch = outputText.match(/部品[：:]?\s*([^\s,、。]+)/u)
    const groupMatch = outputText.match(/(?:グループ|転送先)[：:]?\s*([^\s,、。]+)/u)
    const confidenceMatch = outputText.match(/確信度[：:]?\s*(\d+)/u)

    // Extract DTC codes (patterns like 2A0408, 150404, 7F0530)
    const dtcMatches = outputText.match(/\b[0-9A-Fa-f]{4,6}\b/g) ?? []
    const dtcCodes = [...new Set(dtcMatches.filter((c) => /^[0-9A-Fa-f]{5,6}$/.test(c)))]

    const vehicleCategory = vehicleMatch?.[1] ?? "大型"
    const eventType = eventMatch?.[1] ?? "警告灯点灯"
    const component = componentMatch?.[1] ?? (isSoftwareIssue ? "制御ソフトウェア" : "エンジン")
    const engineeringGroup = groupMatch?.[1] ?? (isSoftwareIssue ? "ソフトウェア・電子制御グループ" : "エンジングループ")
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1], 10) : 85

    const recommendedAction = isSoftwareIssue
      ? "【だいあな】へ登録し、【ソフトウェア・電子制御グループ】への転送を推奨します。"
      : `【だいあな】へ登録し、【${engineeringGroup}】へ転送してください。`

    return {
      vehicleCategory,
      eventType,
      component,
      isSoftwareIssue,
      reasoning: outputText,
      recommendedAction,
      engineeringGroup,
      confidence,
      dtcCodes,
    }
  } catch {
    return null
  }
}

// ── Local fallback triage logic ─────────────────────────────────────────────
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
  } else if (lowerText.includes("プログラム") && (lowerText.includes("不具合") || lowerText.includes("異常") || lowerText.includes("エラー"))) {
    eventType = "プログラム不具合"
  } else if (lowerText.includes("異音") || lowerText.includes("音")) {
    eventType = "異音"
  } else if (lowerText.includes("作動不良") || lowerText.includes("作動")) {
    eventType = "作動不良"
  } else if (lowerText.includes("破損") || lowerText.includes("割れ") || lowerText.includes("壊")) {
    eventType = "破損"
  } else if (lowerText.includes("漏れ") || lowerText.includes("油脂") || lowerText.includes("オイル")) {
    eventType = "油脂漏れ"
  }

  let component = "エンジン"
  let engineeringGroup = "エンジングループ"

  if (isSoftwareIssue) {
    component = "制御ソフトウェア"
    engineeringGroup = "ソフトウェア・電子制御グループ"
  } else if (lowerText.includes("bsd") || lowerText.includes("ブラインドスポット")) {
    component = "BSD"
    engineeringGroup = "電装グループ"
  } else if (lowerText.includes("ドライブトレイン") || lowerText.includes("トランスミッション") || lowerText.includes("変速")) {
    component = "ドライブトレイン"
    engineeringGroup = "駆動グループ"
  } else if (lowerText.includes("制動") || lowerText.includes("ブレーキ")) {
    component = "制動装置"
    engineeringGroup = "シャシーグループ"
  } else if (lowerText.includes("電子制御") || lowerText.includes("ecu") || lowerText.includes("コンピュータ")) {
    component = "電子制御"
    engineeringGroup = "電装グループ"
  }

  let confidence = 65
  const keywords = [
    "大型", "中型", "小型", "エンジン", "bsd", "制動", "ブレーキ",
    "異音", "作動不良", "警告灯", "破損", "漏れ", "ドライブトレイン", "電子制御",
    ...SOFTWARE_KEYWORDS,
  ]
  const matchCount = keywords.filter((kw) => lowerText.includes(kw)).length
  confidence = Math.min(97, 65 + matchCount * 8)

  // Extract DTC-like codes from input text
  const dtcMatches = text.match(/\b[0-9A-Fa-f]{4,6}\b/g) ?? []
  const dtcCodes = [...new Set(dtcMatches.filter((c) => /^[0-9A-Fa-f]{5,6}$/.test(c)))]

  const hwSwDetermination = "記述内容から、原因がハードウェア起因かソフトウェア起因かを判定しました。"
  const softwareNote = isSoftwareIssue
    ? "ソフトウェア関連キーワードを検出したため、「制御ソフトウェア」に分類しました。近年増加傾向にあるソフトウェア・制御系不具合の可能性が高いと判断しています。"
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
  }
}

// ── Map component name from triage result to matrix column name ─────────────
function mapComponentToMatrixColumn(component: string): string {
  const mapping: Record<string, string> = {
    "制御ソフトウェア": "ソフトウェア/制御",
    "ソフトウェア": "ソフトウェア/制御",
    "BSD": "BSD",
    "エンジン": "エンジン",
    "ドライブトレイン": "ドライブトレイン",
    "制動装置": "制動装置",
    "電子制御": "電子制御",
  }
  return mapping[component] ?? component
}

export default function Page() {
  const [inputText, setInputText] = useState("")
  const [result, setResult] = useState<TriageResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState("")
  const [newInquiry, setNewInquiry] = useState<NewInquiryRecord | null>(null)
  const [useDifyApi, setUseDifyApi] = useState(true)

  const handleAnalyze = useCallback(async () => {
    if (!inputText.trim()) return
    setIsAnalyzing(true)
    setResult(null)
    setNewInquiry(null)

    let analysisResult: TriageResult | null = null

    if (useDifyApi) {
      try {
        setAnalysisStatus("Dify APIに接続中...")
        const response = await fetch("/api/dify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ defect_report: inputText }),
        })

        const json = await response.json()

        if (!json.fallback && json.data?.data?.outputs?.text) {
          setAnalysisStatus("AIがマニュアルを解析中...")
          const outputText = json.data.data.outputs.text
          analysisResult = parseDifyResponse(outputText, inputText)
        }

        if (!analysisResult) {
          setAnalysisStatus("ローカルAIでフォールバック解析中...")
        }
      } catch {
        setAnalysisStatus("API接続失敗 — ローカル解析にフォールバック...")
      }
    }

    // Fallback to local simulation
    if (!analysisResult) {
      setAnalysisStatus("AIがマニュアルを解析中...")
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500))
      analysisResult = simulateTriageAnalysis(inputText)
    }

    setResult(analysisResult)
    setIsAnalyzing(false)
    setAnalysisStatus("")

    // Build a new inquiry record for the matrix
    const matrixComponent = mapComponentToMatrixColumn(analysisResult.component)
    const dtcCode = analysisResult.dtcCodes?.[0]
      ?? (analysisResult.isSoftwareIssue ? "7F0530" : "2A0408")
    const today = new Date().toISOString().slice(0, 10)

    setNewInquiry({
      event: analysisResult.eventType,
      component: matrixComponent,
      record: {
        id: `INQ-NEW-${Date.now().toString(36).toUpperCase()}`,
        chassisNumber: `HNTF-${Math.floor(10000 + Math.random() * 90000)}`,
        dtcCode,
        status: "新規",
        vehicleCategory: analysisResult.vehicleCategory as "大型" | "中型" | "小型",
        date: today,
      },
    })
  }, [inputText, useDifyApi])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        useDifyApi={useDifyApi}
        onToggleDifyApi={setUseDifyApi}
      />

      <main className="flex-1 p-4 lg:p-6">
        {/* Top: Input + Result Panels */}
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-2 lg:gap-6">
          <InputPanel
            inputText={inputText}
            onInputChange={setInputText}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            analysisStatus={analysisStatus}
          />
          <ResultPanel result={result} isAnalyzing={isAnalyzing} analysisStatus={analysisStatus} />
        </div>

        {/* Bottom: Defect Matrix */}
        <div className="mx-auto mt-4 max-w-7xl lg:mt-6">
          <DefectMatrix
            highlightEvent={result?.eventType}
            highlightComponent={result ? mapComponentToMatrixColumn(result.component) : undefined}
            newInquiry={newInquiry}
          />
        </div>

        {/* Footer */}
        <footer className="mx-auto mt-4 max-w-7xl text-center text-[10px] text-muted-foreground lg:mt-6">
          <p>
            {"HQA 一次振り分け支援 AI — Demo Version — "}
            {"本システムはデモ用であり、実際のAI推論エンジンとは異なります。"}
          </p>
        </footer>
      </main>
    </div>
  )
}
