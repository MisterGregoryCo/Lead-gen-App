import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Lead = {
  id: string
  business_name: string
  url: string | null
  city: string
  state: string
  phone: string | null
  email: string | null
  google_rating: number | null
  google_review_count: number | null
  site_score: number | null
  industry: string
  is_used: boolean
  created_at: string
}
