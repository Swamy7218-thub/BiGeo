import type { Metadata } from 'next'
import './globals.css'

const title = 'AcquaHT Labs: making water from air work where the air is dry'
const description =
  'AcquaHT Labs builds atmospheric water generators and the dry-air technology condensation machines lack. Water made on site for coastal hotels and resorts, and humidity control for food plants. Hyderabad, India.'

export const metadata: Metadata = {
  metadataBase: new URL('https://acquahtlabs.in'),
  title,
  description,
  keywords: 'atmospheric water generator, water from air, dry climate AWG, hotel drinking water, humidity control, AcquaHT Labs, Hyderabad',
  openGraph: {
    title,
    description,
    url: 'https://acquahtlabs.in',
    siteName: 'AcquaHT Labs',
    locale: 'en_IN',
    type: 'website',
    images: ['/images/prototype.webp'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
