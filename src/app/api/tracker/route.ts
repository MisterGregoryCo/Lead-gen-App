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

    let res = await fetch(GOOGLE_SHEET_WEBHOOK, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'text/plain',
      },
      redirect: 'manual',
    })

    console.log('Initial response status:', res.status)

    let redirectCount = 0
    while ((res.status === 302 || res.status === 301 || res.status === 307) && redirectCount < 5) {
      const redirectUrl = res.headers.get('location')
      console.log('Redirect #' + (redirectCount + 1) + ' to:', redirectUrl)

      if (!redirectUrl) break

      res = await fetch(redirectUrl, {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'text/plain',
        },
        redirect: 'manual',
      })

      console.log('Redirect #' + (redirectCount + 1) + ' response status:', res.status)
      redirectCount++
    }

    const responseText = await res.text().catch(() => '')
    console.log('Final response status:', res.status, 'body:', responseText)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Tracker error:', err)
    return NextResponse.json(
      { error: 'Failed to add to tracker' },
      { status: 500 }
    )
  }
}
