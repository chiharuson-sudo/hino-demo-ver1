"use client"

import { Shield, Cpu, Wifi, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DashboardHeaderProps {
  useGeminiApi: boolean
  onToggleGeminiApi: (value: boolean) => void
}

export function DashboardHeader({ useGeminiApi, onToggleGeminiApi }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-card-foreground">
              {"HQA 一次振り分け支援 AI"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {"Hino Quality Assurance \u2014 Demo"}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggleGeminiApi(!useGeminiApi)}
          className={`hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-medium transition-colors sm:flex ${
            useGeminiApi
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-border bg-muted text-muted-foreground hover:bg-accent"
          }`}
          title={useGeminiApi ? "Gemini API: ON" : "Gemini API: OFF（ローカル解析）"}
        >
          {useGeminiApi ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          {useGeminiApi ? "Gemini API: ON" : "ローカルモード"}
        </button>
        <Badge
          variant="destructive"
          className="flex items-center gap-1 bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground"
        >
          <Shield className="h-3 w-3" />
          {"SECRET / 秘"}
        </Badge>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <span className={`h-2 w-2 rounded-full ${useGeminiApi ? "bg-emerald-500" : "bg-amber-500"}`} />
          {useGeminiApi ? "AI Status: Online" : "AI Status: Local"}
        </div>
      </div>
    </header>
  )
}
