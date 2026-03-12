import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    // Get count of unused leads
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('is_used', false)

    if (!count || count === 0) {
      return NextResponse.json(
        { error: 'No leads available. Please seed the database first.' },
        { status: 404 }
      )
    }

    // Pick a random offset
    const randomOffset = Math.floor(Math.random() * count)

    // Fetch one random unused lead
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('is_used', false)
      .range(randomOffset, randomOffset)
      .limit(1)

    if (error || !leads || leads.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch lead' },
        { status: 500 }
      )
    }

    const lead = leads[0]

    // Mark the lead as used
    await supabase
      .from('leads')
      .update({ is_used: true })
      .eq('id', lead.id)

    return NextResponse.json({ lead, remaining: count - 1 })
  } catch (err) {
    console.error('Error fetching lead:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
