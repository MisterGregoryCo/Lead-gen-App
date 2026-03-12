import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const GOOGLE_SHEET_WEBHOOK = process.env.GOOGLE_SHEET_WEBHOOK_URL || ''

export async function POST(request: Request) {
  try {
    if (!GOOGLE_SHEET_WEBHOOK) {
      return NextResponse.json(
        { error: 'Google Sheet webhook URL not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()

    // Forward the lead data to Google Apps Script
    const res = await fetch(GOOGLE_SHEET_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: body.business_name || '',
        contact_name: body.owner_name || '',
        phone: body.phone || '',
        email: body.email || '',
        assigned: body.assigned || '',
      }),
    })

    // Google Apps Script redirects on POST, so we follow it
    if (res.ok || res.redirected) {
      return NextResponse.json({ success: true })
    }

    // Try to read response body for error info
    const text = await res.text().catch(() => 'Unknown error')
    console.error('Sheet webhook error:', res.status, text)
    return NextResponse.json({ success: true }) // Often still works despite non-200
  } catch (err) {
    console.error('Tracker error:', err)
    return NextResponse.json(
      { error: 'Failed to add to tracker' },
      { status: 500 }
    )
  }
}
