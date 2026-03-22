"use client"

import { Truck, AlertTriangle, Cog, Brain, ArrowRight, CheckCircle2, Cpu } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export interface TriageResult {
  vehicleCategory: string
  eventType: string
  component: string
  isSoftwareIssue: boolean
  reasoning: string
  recommendedAction: string
  engineeringGroup: string
  confidence: number
  dtcCodes?: string[]
}

interface ResultPanelProps {
  result: TriageResult | null
  isAnalyzing: boolean
}

export function ResultPanel({ result, isAnalyzing }: ResultPanelProps) {
  if (isAnalyzing) {
    return (
      <Card className="flex h-full flex-col border-border">
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <Brain className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-card-foreground">{"AI解析中..."}</p>
              <p className="text-xs text-muted-foreground">{"車両型 → 事象 → 部品の順で判定しています"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!result) {
    return (
      <Card className="flex h-full flex-col border-border">
        <CardContent className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Brain className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">{"解析結果がここに表示されます"}</p>
              <p className="text-xs text-muted-foreground">
                {"左のパネルに不具合記述を入力し、「AI解析実行」を押してください"}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="rounded bg-muted px-2 py-0.5">{"車両型"}</span>
              <ArrowRight className="h-3 w-3" />
              <span className="rounded bg-muted px-2 py-0.5">{"事象"}</span>
              <ArrowRight className="h-3 w-3" />
              <span className="rounded bg-muted px-2 py-0.5">{"部品"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-card-foreground">
            {"トリアージ結果"}
          </CardTitle>
          <Badge variant="outline" className="gap-1 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            {"解析完了"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Triage Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1.5 bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
            <Truck className="h-3.5 w-3.5" />
            {"#車両型: " + result.vehicleCategory}
          </Badge>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <Badge className="gap-1.5 bg-amber-600 px-3 py-1.5 text-xs font-bold text-white">
            <AlertTriangle className="h-3.5 w-3.5" />
            {"#事象: " + result.eventType}
          </Badge>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          <Badge
            className={`gap-1.5 px-3 py-1.5 text-xs font-bold text-white ${
              result.isSoftwareIssue
                ? "bg-violet-600"
                : "bg-sky-600"
            }`}
          >
            {result.isSoftwareIssue ? (
              <Cpu className="h-3.5 w-3.5" />
            ) : (
              <Cog className="h-3.5 w-3.5" />
            )}
            {"#部品: " + result.component}
          </Badge>
        </div>

        {/* Software Issue Alert Banner */}
        {result.isSoftwareIssue && (
          <div className="flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2">
            <Cpu className="h-4 w-4 shrink-0 text-violet-600" />
            <p className="text-xs font-medium text-violet-800">
              {"ソフトウェア/制御系不具合を検出 — 【ソフトウェア・電子制御グループ】への転送を推奨"}
            </p>
          </div>
        )}

        <Separator />

        {/* Reasoning Box */}
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-card-foreground">{"AIによる判断理由"}</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {result.reasoning}
          </p>
        </div>

        {/* Recommended Action */}
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {"推奨アクション"}
          </p>
          <p className="text-xs font-medium text-card-foreground">
            {result.recommendedAction}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {"【だいあな】登録"}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {"【" + result.engineeringGroup + "】転送"}
            </Badge>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mt-auto">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-semibold text-card-foreground">{"AI確信度"}</p>
            <span className="text-xs font-bold text-primary">{result.confidence + "%"}</span>
          </div>
          <Progress value={result.confidence} className="h-2.5" />
          <p className="mt-1 text-[10px] text-muted-foreground">
            {result.confidence >= 80
              ? "高確信度 — 自動振り分け推奨"
              : result.confidence >= 60
                ? "中確信度 — 担当者確認推奨"
                : "低確信度 — 手動振り分け推奨"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
