"use client"

import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface InputPanelProps {
  inputText: string
  onInputChange: (value: string) => void
  onAnalyze: () => void
  isAnalyzing: boolean
}

export function InputPanel({
  inputText,
  onInputChange,
  onAnalyze,
  isAnalyzing,
}: InputPanelProps) {
  return (
    <Card className="flex h-full flex-col border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-card-foreground">
            {"不具合記述入力"}
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
            {"GSPS連携イメージ"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {"不具合の内容を入力してください。AIが自動的に車両型、事象、部品を判定します。"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <Textarea
          placeholder="例: 大型トラック走行中にエンジン警告灯が点灯し、異音が発生。BSD装置の作動不良の可能性あり。"
          className="flex-1 resize-none border-border bg-muted/50 text-sm text-card-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          rows={8}
        />
        <Button
          className="w-full gap-2 bg-primary font-bold text-primary-foreground hover:bg-primary/90"
          onClick={onAnalyze}
          disabled={isAnalyzing || !inputText.trim()}
        >
          <Send className="h-4 w-4" />
          {isAnalyzing ? "解析中..." : "AI解析実行"}
        </Button>
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {"サンプル入力"}
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              "大型車で走行中、エンジン警告灯が点灯した。",
              "中型トラック制動時に異音が発生する。",
              "小型車のBSD装置が作動不良を起こしている。",
              "大型車でECUアップデート後にセンサーロジック通信エラーが発生。通信異常の可能性あり。",
            ].map((sample) => (
              <button
                key={sample}
                className="rounded px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => onInputChange(sample)}
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
