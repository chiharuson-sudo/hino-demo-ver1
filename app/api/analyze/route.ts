import { buildSystemPrompt } from "@/lib/prompt"
import { NextResponse } from "next/server"

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 503 }
    )
  }

  let defect_report: string
  try {
    const body = await req.json()
    defect_report = typeof body.defect_report === "string" ? body.defect_report : ""
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!defect_report.trim()) {
    return NextResponse.json({ error: "defect_report is required" }, { status: 400 })
  }

  const systemPrompt = buildSystemPrompt(defect_report)
  const userText = `以下の市技報を分析してください。\n\n${defect_report}`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userText }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  })

  const data = (await response.json()) as {
    error?: { message?: string; status?: string }
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  if (!response.ok) {
    return NextResponse.json(
      {
        error: data.error?.message ?? `Gemini API returned ${response.status}`,
      },
      { status: 502 }
    )
  }

  const parts = data.candidates?.[0]?.content?.parts
  const content = parts?.map((p) => p.text ?? "").join("") ?? ""
  if (!content) {
    return NextResponse.json({ error: "Empty response from Gemini" }, { status: 502 })
  }

  return NextResponse.json({ result: content })
}
