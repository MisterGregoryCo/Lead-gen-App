import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const GOOGLE_SHEET_WEBHOOK = process.env.GOOGLE_SHEET_WEBHOOK_URL || ''

export async function POST(request: Request) {
  try {
    if (!GOOGLE_SHEET_WEBHOOK) {
      console.error('GOOGLE_SHEET_WEBHOOK_URL not set')
      return NextResponse.json(
        { error: 'Google Sheet webhook URL not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()

    const payload = JSON.stringify({
      business_name: body.business_name || '',
      contact_name: body.owner_name || '',
      phone: body.phone || '',
      email: body.email || '',
      assigned: body.assigned || '',
    })

    console.log('Sending to Google Sheets:', payload)

    // Google Apps Script redirects POST requests (302).
    // We need to manually follow the redirect chain.
    // First, send with redirect: 'follow' to handle it automatically.
    let res = await fetch(GOOGLE_SHEET_WEBHOOK, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain', // Use text/plain to avoid CORS preflight issues
      },
      redirect: 'follow',
    })

    console.log('Google Sheets response status:', res.status, 'redirected:', res.redirected)

    // If we got a redirect that wasn't followed, manually follow it
    if (res.status === 302 || res.status === 301) {
      const redirectUrl = res.headers.get('location')
      console.log('Following redirect to:', redirectUrl)
      if (redirectUrl) {
        res = await fetch(redirectUrl, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'text/plain' },
          redirect: 'follow',
        })
        console.log('Redirect response status:', res.status)
      }
    }

    const responseText = await res.text().catch(() => '')
    console.log('Google Sheets response body:', responseText)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Tracker error:', err)
    return NextResponse.json(
      { error: 'Failed to add to tracker' },
      { status: 500 }
    )
  }
}
