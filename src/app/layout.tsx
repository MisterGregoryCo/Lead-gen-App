import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LeadGen - Cold Outreach Lead Generator',
  description: 'Generate random cold leads for service and trades businesses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
