import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const GOOGLE_SHEET_WEBHOOK = process.env.GOOGLE_SHEET_WEBHOOK_URL || ''

export async function GET() {
  try {
    if (!GOOGLE_SHEET_WEBHOOK) {
      return NextResponse.json(
        { error: 'Google Sheet webhook URL not configured' },
        { status: 500 }
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(GOOGLE_SHEET_WEBHOOK, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await res.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err) {
    console.error('Dashboard fetch error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
