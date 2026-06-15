import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AcquaHT Labs — Clean Water From Air',
  description:
    'AcquaHT Labs makes safe drinking water accessible, sustainable, and affordable using atmospheric water harvesting technology. No pipelines. No groundwater dependency.',
  keywords: 'atmospheric water generator, clean water, AWG, AcquaHT Labs, water technology India',
  openGraph: {
    title: 'AcquaHT Labs — Clean Water From Air',
    description: 'Your access to clean water shouldn\'t depend on your pin code.',
    url: 'https://acquahtlabs.in',
    siteName: 'AcquaHT Labs',
    locale: 'en_IN',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
