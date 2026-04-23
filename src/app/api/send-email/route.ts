import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("EMAIL REQUEST:", body)

    // TODO: integrate Resend later
    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: "Email failed" }, { status: 500 })
  }
}
