import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AcquaHT Labs — Atmospheric Water, Engineered for Dry Climates',
  description:
    'AcquaHT Labs builds atmospheric water generators engineered for dry air, not just humid climates — where existing machines fail and water is scarcest. No pipelines. No groundwater dependency.',
  keywords: 'atmospheric water generator, dry climate AWG, clean water, AcquaHT Labs, water technology India',
  openGraph: {
    title: 'AcquaHT Labs — Atmospheric Water, Engineered for Dry Climates',
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
