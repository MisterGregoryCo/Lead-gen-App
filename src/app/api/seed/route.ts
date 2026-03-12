import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Service-based and trades-based business types
const industries = [
  'Plumbing',
  'HVAC',
  'Electrical',
  'Roofing',
  'Landscaping',
  'Painting',
  'General Contractor',
  'Pest Control',
  'Cleaning Service',
  'Auto Repair',
  'Tree Service',
  'Fencing',
  'Flooring',
  'Concrete & Masonry',
  'Appliance Repair',
  'Locksmith',
  'Garage Door Repair',
  'Pool Service',
  'Pressure Washing',
  'Handyman',
]

const cities = [
  { city: 'Dallas', state: 'TX' },
  { city: 'Houston', state: 'TX' },
  { city: 'Austin', state: 'TX' },
  { city: 'San Antonio', state: 'TX' },
  { city: 'Phoenix', state: 'AZ' },
  { city: 'Tucson', state: 'AZ' },
  { city: 'Denver', state: 'CO' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'Miami', state: 'FL' },
  { city: 'Tampa', state: 'FL' },
  { city: 'Orlando', state: 'FL' },
  { city: 'Jacksonville', state: 'FL' },
  { city: 'Nashville', state: 'TN' },
  { city: 'Charlotte', state: 'NC' },
  { city: 'Raleigh', state: 'NC' },
  { city: 'Las Vegas', state: 'NV' },
  { city: 'Portland', state: 'OR' },
  { city: 'Seattle', state: 'WA' },
  { city: 'Minneapolis', state: 'MN' },
  { city: 'Indianapolis', state: 'IN' },
  { city: 'Columbus', state: 'OH' },
  { city: 'Kansas City', state: 'MO' },
  { city: 'Oklahoma City', state: 'OK' },
  { city: 'Memphis', state: 'TN' },
  { city: 'Louisville', state: 'KY' },
  { city: 'Sacramento', state: 'CA' },
  { city: 'San Diego', state: 'CA' },
  { city: 'Los Angeles', state: 'CA' },
  { city: 'Chicago', state: 'IL' },
  { city: 'Detroit', state: 'MI' },
  { city: 'St. Louis', state: 'MO' },
  { city: 'Pittsburgh', state: 'PA' },
  { city: 'Philadelphia', state: 'PA' },
  { city: 'Baltimore', state: 'MD' },
  { city: 'Richmond', state: 'VA' },
  { city: 'Birmingham', state: 'AL' },
  { city: 'New Orleans', state: 'LA' },
  { city: 'Salt Lake City', state: 'UT' },
  { city: 'Boise', state: 'ID' },
  { city: 'Albuquerque', state: 'NM' },
]

// Business name prefixes and suffixes for realistic names
const prefixes = [
  'Premier', 'All-Pro', 'Elite', 'Reliable', 'Superior',
  'First Choice', 'Precision', 'Quality', 'Ace', 'Pro',
  'Express', 'Advanced', 'Rapid', 'Affordable', 'Expert',
  'Master', 'Top Notch', 'Five Star', 'Trusted', 'Champion',
  'Patriot', 'Liberty', 'American', 'Eagle', 'Summit',
  'Apex', 'Prime', 'Alpha', 'Delta', 'Metro',
]

const suffixes = [
  'Services', 'Solutions', 'Pros', 'Experts', 'Co.',
  'Group', 'Specialists', 'LLC', 'Inc.', 'Team',
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generatePhone(): string {
  const area = Math.floor(Math.random() * 800) + 200
  const mid = Math.floor(Math.random() * 900) + 100
  const last = Math.floor(Math.random() * 9000) + 1000
  return `(${area}) ${mid}-${last}`
}

function generateEmail(businessName: string, city: string): string | null {
  // 60% chance of having an email
  if (Math.random() > 0.6) return null
  const clean = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15)
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', `${clean}.com`]
  const prefixes = ['info', 'contact', 'hello', 'office', 'service']
  return `${randomItem(prefixes)}@${randomItem(domains)}`
}

function generateUrl(businessName: string): string | null {
  // 80% chance of having a website
  if (Math.random() > 0.8) return null
  const clean = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 20)
  return `https://www.${clean}.com`
}

function generateLead() {
  const industry = randomItem(industries)
  const location = randomItem(cities)
  const prefix = randomItem(prefixes)
  const suffix = randomItem(suffixes)
  const businessName = `${prefix} ${industry} ${suffix}`

  return {
    business_name: businessName,
    url: generateUrl(businessName),
    city: location.city,
    state: location.state,
    phone: generatePhone(),
    email: generateEmail(businessName, location.city),
    google_rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
    google_review_count: Math.floor(Math.random() * 300) + 1,
    site_score: Math.floor(Math.random() * 60) + 30, // 30 to 90
    industry: industry,
    is_used: false,
  }
}

export async function POST(request: Request) {
  try {
    // Check for auth token to prevent unauthorized seeding
    const authHeader = request.headers.get('authorization')
    const seedToken = process.env.SEED_TOKEN || 'seed-me-please'

    if (authHeader !== `Bearer ${seedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const count = Math.min(body.count || 100, 500)

    // Generate leads
    const leads = Array.from({ length: count }, () => generateLead())

    // Insert in batches of 50
    const batchSize = 50
    let inserted = 0
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize)
      const { error } = await supabase.from('leads').insert(batch)
      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json(
          { error: 'Failed to insert leads', details: error.message },
          { status: 500 }
        )
      }
      inserted += batch.length
    }

    return NextResponse.json({
      message: `Successfully seeded ${inserted} leads`,
      count: inserted,
    })
  } catch (err) {
    console.error('Seed error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
