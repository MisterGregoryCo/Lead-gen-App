import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Configuration ───────────────────────────────────────────────
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ''

const industries = [
  'Plumbing', 'HVAC', 'Electrical', 'Roofing', 'Landscaping',
  'Painting', 'General Contractor', 'Pest Control', 'Cleaning Service',
  'Auto Repair', 'Tree Service', 'Fencing', 'Flooring', 'Concrete & Masonry',
  'Appliance Repair', 'Locksmith', 'Garage Door Repair', 'Pool Service',
  'Pressure Washing', 'Handyman', 'Carpet Cleaning', 'Window Cleaning',
  'Gutter Service', 'Septic Service', 'Demolition', 'Excavation',
  'Siding Contractor', 'Insulation', 'Chimney Sweep', 'Welding',
]

const cities = [
  { city: 'Dallas', state: 'TX' }, { city: 'Houston', state: 'TX' },
  { city: 'Austin', state: 'TX' }, { city: 'San Antonio', state: 'TX' },
  { city: 'Phoenix', state: 'AZ' }, { city: 'Tucson', state: 'AZ' },
  { city: 'Denver', state: 'CO' }, { city: 'Atlanta', state: 'GA' },
  { city: 'Miami', state: 'FL' }, { city: 'Tampa', state: 'FL' },
  { city: 'Orlando', state: 'FL' }, { city: 'Jacksonville', state: 'FL' },
  { city: 'Nashville', state: 'TN' }, { city: 'Charlotte', state: 'NC' },
  { city: 'Raleigh', state: 'NC' }, { city: 'Las Vegas', state: 'NV' },
  { city: 'Portland', state: 'OR' }, { city: 'Seattle', state: 'WA' },
  { city: 'Minneapolis', state: 'MN' }, { city: 'Indianapolis', state: 'IN' },
  { city: 'Columbus', state: 'OH' }, { city: 'Kansas City', state: 'MO' },
  { city: 'Oklahoma City', state: 'OK' }, { city: 'Memphis', state: 'TN' },
  { city: 'Louisville', state: 'KY' }, { city: 'Sacramento', state: 'CA' },
  { city: 'San Diego', state: 'CA' }, { city: 'Los Angeles', state: 'CA' },
  { city: 'Chicago', state: 'IL' }, { city: 'Detroit', state: 'MI' },
  { city: 'St. Louis', state: 'MO' }, { city: 'Pittsburgh', state: 'PA' },
  { city: 'Philadelphia', state: 'PA' }, { city: 'Baltimore', state: 'MD' },
  { city: 'Richmond', state: 'VA' }, { city: 'Birmingham', state: 'AL' },
  { city: 'New Orleans', state: 'LA' }, { city: 'Salt Lake City', state: 'UT' },
  { city: 'Boise', state: 'ID' }, { city: 'Albuquerque', state: 'NM' },
  { city: 'Fort Worth', state: 'TX' }, { city: 'Omaha', state: 'NE' },
  { city: 'Spokane', state: 'WA' }, { city: 'Fresno', state: 'CA' },
  { city: 'Chattanooga', state: 'TN' }, { city: 'Knoxville', state: 'TN' },
  { city: 'Savannah', state: 'GA' }, { city: 'Charleston', state: 'SC' },
  { city: 'Greenville', state: 'SC' }, { city: 'Wichita', state: 'KS' },
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Google Places API (Real Scraping) ───────────────────────────
async function fetchRealLead(): Promise<any | null> {
  if (!GOOGLE_API_KEY) return null

  try {
    const industry = randomItem(industries)
    const location = randomItem(cities)
    const query = `${industry} in ${location.city}, ${location.state}`

    // Step 1: Text Search to find businesses
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()

    if (!searchData.results || searchData.results.length === 0) return null

    // Pick a random result from the first 15
    const maxIdx = Math.min(searchData.results.length, 15)
    const place = searchData.results[Math.floor(Math.random() * maxIdx)]

    // Step 2: Get Place Details for phone, website, etc.
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,user_ratings_total,formatted_address,url&key=${GOOGLE_API_KEY}`
    const detailsRes = await fetch(detailsUrl)
    const detailsData = await detailsRes.json()
    const details = detailsData.result || {}

    // Step 3: Try to get site score from PageSpeed Insights
    let siteScore: number | null = null
    if (details.website) {
      try {
        const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(details.website)}&category=performance&category=seo&strategy=mobile`
        const psiRes = await fetch(psiUrl, { signal: AbortSignal.timeout(10000) })
        const psiData = await psiRes.json()
        if (psiData.lighthouseResult?.categories) {
          const perfScore = (psiData.lighthouseResult.categories.performance?.score || 0) * 100
          const seoScore = (psiData.lighthouseResult.categories.seo?.score || 0) * 100
          siteScore = Math.round((perfScore + seoScore) / 2)
        }
      } catch {
        // PageSpeed timeout is fine, we just skip it
      }
    }

    // Step 4: Try to find email and owner from website
    let email: string | null = null
    let ownerName: string | null = null
    if (details.website) {
      try {
        const siteRes = await fetch(details.website, {
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadGen/1.0)' }
        })
        const html = await siteRes.text()

        // Extract email
        const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
        if (emailMatch) {
          // Filter out common non-business emails
          const filtered = emailMatch.filter((e: string) =>
            !e.includes('example.com') &&
            !e.includes('sentry') &&
            !e.includes('webpack') &&
            !e.includes('.png') &&
            !e.includes('.jpg')
          )
          if (filtered.length > 0) email = filtered[0]
        }

        // Try to find owner/manager name from common patterns
        const ownerPatterns = [
          /(?:owner|founded by|manager|president|ceo|proprietor)[:\s]*([A-Z][a-z]+ [A-Z][a-z]+)/i,
          /(?:meet|about)\s+(?:the\s+)?(?:owner|team)?[:\s]*([A-Z][a-z]+ [A-Z][a-z]+)/i,
        ]
        for (const pattern of ownerPatterns) {
          const match = html.match(pattern)
          if (match && match[1]) {
            ownerName = match[1].trim()
            break
          }
        }
      } catch {
        // Website scrape failure is fine
      }
    }

    return {
      business_name: details.name || place.name,
      url: details.website || null,
      city: location.city,
      state: location.state,
      phone: details.formatted_phone_number || null,
      email,
      google_rating: details.rating || null,
      google_review_count: details.user_ratings_total || null,
      site_score: siteScore,
      industry,
      owner_name: ownerName,
      is_used: true,
      source: 'google_places',
    }
  } catch (err) {
    console.error('Google Places error:', err)
    return null
  }
}

// ─── Fallback: Generated Lead ────────────────────────────────────
function generateLead() {
  const industry = randomItem(industries)
  const location = randomItem(cities)

  const prefixes = [
    'Premier', 'All-Pro', 'Elite', 'Reliable', 'Superior',
    'First Choice', 'Precision', 'Quality', 'Ace', 'Pro',
    'Express', 'Advanced', 'Rapid', 'Affordable', 'Expert',
    'Master', 'Top Notch', 'Five Star', 'Trusted', 'Champion',
    'Patriot', 'Liberty', 'American', 'Eagle', 'Summit',
    'Apex', 'Prime', 'Alpha', 'Delta', 'Metro',
    'Heritage', 'Frontline', 'Keystone', 'Pinnacle', 'Alliance',
  ]
  const suffixes = ['Services', 'Solutions', 'Pros', 'Experts', 'Co.', 'Group', 'LLC', 'Inc.']

  const firstNames = [
    'James', 'John', 'Robert', 'Michael', 'David', 'William', 'Richard',
    'Joseph', 'Thomas', 'Chris', 'Daniel', 'Matthew', 'Anthony', 'Mark',
    'Steven', 'Paul', 'Andrew', 'Brian', 'Kevin', 'Jason', 'Maria',
    'Jennifer', 'Lisa', 'Sarah', 'Karen', 'Michelle', 'Angela', 'Sandra',
  ]
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson',
    'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
    'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker',
  ]

  const prefix = randomItem(prefixes)
  const suffix = randomItem(suffixes)
  const businessName = `${prefix} ${industry} ${suffix}`
  const cleanName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)

  const area = Math.floor(Math.random() * 800) + 200
  const mid = Math.floor(Math.random() * 900) + 100
  const last = Math.floor(Math.random() * 9000) + 1000

  const hasEmail = Math.random() > 0.35
  const hasWebsite = Math.random() > 0.15
  const hasOwner = Math.random() > 0.4
  const emailPrefixes = ['info', 'contact', 'hello', 'office', 'service', 'admin']

  return {
    business_name: businessName,
    url: hasWebsite ? `https://www.${cleanName}.com` : null,
    city: location.city,
    state: location.state,
    phone: `(${area}) ${mid}-${last}`,
    email: hasEmail ? `${randomItem(emailPrefixes)}@${cleanName}.com` : null,
    google_rating: Math.round((3.0 + Math.random() * 2.0) * 10) / 10,
    google_review_count: Math.floor(Math.random() * 350) + 1,
    site_score: Math.floor(Math.random() * 65) + 25,
    industry,
    owner_name: hasOwner ? `${randomItem(firstNames)} ${randomItem(lastNames)}` : null,
    is_used: true,
    source: 'generated',
  }
}

// ─── Main API Handler ────────────────────────────────────────────
export async function GET() {
  try {
    // Try real scraping first (if Google API key is configured)
    let lead = await fetchRealLead()

    // Fall back to generated lead
    if (!lead) {
      lead = generateLead()
    }

    // Save to Supabase for history/analytics
    const { error: insertError } = await supabase.from('leads').insert({
      business_name: lead.business_name,
      url: lead.url,
      city: lead.city,
      state: lead.state,
      phone: lead.phone,
      email: lead.email,
      google_rating: lead.google_rating,
      google_review_count: lead.google_review_count,
      site_score: lead.site_score,
      industry: lead.industry,
      owner_name: lead.owner_name,
      is_used: true,
    })

    if (insertError) {
      console.error('Failed to save lead:', insertError)
      // Still return the lead even if save fails
    }

    // Get total lead count
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      lead,
      totalGenerated: count || 0,
      source: lead.source,
    })
  } catch (err) {
    console.error('Error generating lead:', err)
    return NextResponse.json(
      { error: 'Failed to generate lead. Please try again.' },
      { status: 500 }
    )
  }
}
