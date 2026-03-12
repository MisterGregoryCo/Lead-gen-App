'use client'

import { useState } from 'react'

type Lead = {
  id?: string
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
  owner_name: string | null
  source?: string
}

function getSiteScoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 80) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function getSiteScoreLabel(score: number | null): string {
  if (score === null) return 'N/A'
  if (score >= 80) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Poor'
}

function getRatingDisplay(rating: number | null) {
  if (rating === null) return { stars: 'N/A', color: 'text-gray-400' }
  const color = rating >= 4.5 ? 'text-green-400' : rating >= 3.5 ? 'text-yellow-400' : 'text-red-400'
  const full = Math.floor(rating)
  const stars = '\u2605'.repeat(full) + (rating % 1 >= 0.3 ? '\u00BD' : '')
  return { stars: `${stars} ${rating}`, color }
}

export default function Home() {
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leadCount, setLeadCount] = useState(0)
  const [totalGenerated, setTotalGenerated] = useState(0)
  const [animateKey, setAnimateKey] = useState(0)

  const fetchLead = async () => {
    if (loading) return // Prevent double-clicks
    setLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch('/api/lead', {
        signal: controller.signal,
        cache: 'no-store'
      })
      clearTimeout(timeoutId)

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch lead. Click to try again.')
        return
      }

      setLead(data.lead)
      setTotalGenerated(data.totalGenerated || 0)
      setLeadCount((prev) => prev + 1)
      setAnimateKey((prev) => prev + 1)
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Request timed out. Click Get Lead to try again.')
      } else {
        setError('Network error. Click Get Lead to try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const rating = lead ? getRatingDisplay(lead.google_rating) : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
              L
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">LeadGen</h1>
              <p className="text-xs text-gray-400">Cold Outreach Tool</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {leadCount > 0 && (
              <span className="px-3 py-1 bg-gray-800 rounded-full text-xs">
                {leadCount} leads pulled this session
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Get Lead Button */}
        <div className="text-center mb-12">
          <button
            onClick={fetchLead}
            disabled={loading}
            className="relative px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white text-xl font-semibold rounded-2xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Finding Lead...
              </span>
            ) : lead ? (
              'Get Another Lead'
            ) : (
              'Get Lead'
            )}
          </button>
          {!lead && !error && (
            <p className="mt-4 text-gray-500 text-sm">
              Click the button to generate a random cold lead
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Lead Card */}
        {lead && (
          <div key={animateKey} className="max-w-2xl mx-auto" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <div className="bg-gray-900/80 backdrop-blur border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-700/50 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {lead.business_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
                        {lead.industry}
                      </span>
                      {lead.source === 'google_places' && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-medium rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg ${rating?.color}`}>
                      {rating?.stars}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {lead.google_review_count !== null
                        ? `${lead.google_review_count} Google Reviews`
                        : 'No reviews'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-5 space-y-4">
                {/* Owner / Manager */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Owner / Manager</p>
                    {lead.owner_name ? (
                      <p className="text-white font-medium">{lead.owner_name}</p>
                    ) : (
                      <p className="text-gray-500 italic">Not available</p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
                    <p className="text-white font-medium">{lead.city}, {lead.state}</p>
                  </div>
                </div>

                {/* URL */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Website</p>
                    {lead.url ? (
                      <a href={lead.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium truncate block transition-colors">
                        {lead.url}
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">No website found</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Phone</p>
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="text-white font-medium hover:text-blue-300 transition-colors">
                        {lead.phone}
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">No phone found</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                        {lead.email}
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">No email found</p>
                    )}
                  </div>
                </div>

                {/* Site Score */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Site Score (Speed + SEO)</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${getSiteScoreColor(lead.site_score)}`}>
                        {lead.site_score !== null ? lead.site_score : 'N/A'}
                      </span>
                      <span className={`text-sm ${getSiteScoreColor(lead.site_score)}`}>
                        {getSiteScoreLabel(lead.site_score)}
                      </span>
                      {lead.site_score !== null && (
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              lead.site_score >= 80 ? 'bg-green-500' : lead.site_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${lead.site_score}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700/50 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Lead #{leadCount} &middot; {new Date().toLocaleDateString()}
                </p>
                <button
                  onClick={fetchLead}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Next Lead \u2192'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}
