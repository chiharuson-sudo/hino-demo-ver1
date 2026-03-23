import { NextResponse } from "next/server"
import { buildDefectMatrixFromCases } from "@/lib/matrix-from-cases"

export const runtime = "nodejs"

export async function GET() {
  const matrix = buildDefectMatrixFromCases()
  return NextResponse.json({ matrix })
}
