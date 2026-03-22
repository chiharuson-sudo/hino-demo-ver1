import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { defect_report } = await req.json()

  const apiKey = process.env.DIFY_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "DIFY_API_KEY is not configured", fallback: true },
      { status: 200 }
    )
  }

  try {
    const response = await fetch("https://api.dify.ai/v1/workflows/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: { defect_report },
        response_mode: "blocking",
        user: "hqa-triage-dashboard",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Dify API Error]", response.status, errorText)
      return NextResponse.json(
        { error: `Dify API returned ${response.status}`, fallback: true },
        { status: 200 }
      )
    }

    const data = await response.json()
    return NextResponse.json({ data, fallback: false })
  } catch (error) {
    console.error("[Dify API Error]", error)
    return NextResponse.json(
      { error: "Failed to connect to Dify API", fallback: true },
      { status: 200 }
    )
  }
}
