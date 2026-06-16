'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const products = [
  {
    model: 'AcquaHT-80',
    tier: 'HOUSEHOLDS & CLINICS',
    output: '80 L/day',
    power: '5 kW',
    efficiency: '4.0 L/kWh',
    price: '₹2.8L',
    segments: ['Rural family clusters (5–8 HH)', 'Primary health centres', 'NGO water kiosks'],
    highlight: false,
  },
  {
    model: 'AcquaHT-160',
    tier: 'COMMERCIAL & SCHOOLS',
    output: '150 L/day',
    power: '~9 kW',
    efficiency: '4.0 L/kWh',
    price: '₹3.2L',
    segments: ['Schools and hostels', 'Small hotels, resorts', 'Corporate campuses'],
    highlight: true,
  },
  {
    model: 'AcquaHT-240',
    tier: 'INDUSTRIAL & GOVT',
    output: '250 L/day',
    power: '~15 kW',
    efficiency: '4.0 L/kWh',
    price: '₹3.5L',
    segments: ['Municipalities', 'Disaster relief & military', 'Industrial facilities'],
    highlight: false,
  },
]

const revenue = [
  { stream: 'Unit Sales', rev: '₹2.8–3.5L/unit', margin: '28–32%', desc: 'One-time hardware revenue. Households, hotels, NGOs, industrial clients.' },
  { stream: 'IoT Subscription', rev: '₹800–1,200/mo', margin: '~65%', desc: 'Cloud dashboard, remote diagnostics, predictive maintenance. Auto-renewing, sticky.' },
  { stream: 'Bottled Water (B2B)', rev: '₹4–6/litre', margin: '~40%', desc: 'Sugarcane-pulp bottles. Zero nanoplastics. Healthcare, hospitality, schools.' },
  { stream: 'Govt Deployments', rev: 'Tiered/grant-linked', margin: 'Milestone', desc: 'Municipalities, Jal Jeevan Mission, state water boards. Largest ticket, long-term anchor.' },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="products" ref={ref} className="py-20 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-12">
          <div className="section-label">Products</div>
          <h2 className="h2 mb-3">Three products. One platform.</h2>
          <p className="body max-w-xl">Scalable across every segment — from rural households to government municipalities.</p>
          <p className="text-sm text-gray-400 mt-2">All models: Wi-Fi control · Auto-defrost · IP54 rated · Filter replacement every 3–6 months · Operating range 10–45°C</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {products.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-7 border-2 relative ${p.highlight ? 'border-teal-600 bg-teal-50' : 'border-gray-100 bg-white'}`}>
              {p.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-teal-600 text-white px-3 py-1 rounded-full">Most Popular</div>}
              <div className="text-xs font-bold tracking-widest text-gray-400 mb-1">{p.tier}</div>
              <div className="text-2xl font-extrabold text-gray-900 mb-4">{p.model}</div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[['Output', p.output], ['Power', p.power], ['Efficiency', p.efficiency], ['Price', p.price]].map(([k, v]) => (
                  <div key={k} className={`rounded-lg p-2.5 ${p.highlight ? 'bg-teal-100/50' : 'bg-gray-50'}`}>
                    <div className="text-xs text-gray-400 mb-0.5">{k}</div>
                    <div className={`font-bold text-sm ${p.highlight ? 'text-teal-800' : 'text-gray-800'}`}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {p.segments.map((s, j) => (
                  <div key={j} className="text-sm text-gray-600 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {s}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Business model */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}>
          <div className="section-label mb-6">Business Model — Multiple Revenue Streams</div>
          <div className="grid sm:grid-cols-2 gap-4">
            {revenue.map((r, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="font-bold text-gray-900">{r.stream}</div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-teal-700">{r.rev}</div>
                    <div className="text-xs text-gray-400">Margin: {r.margin}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 leading-relaxed">{r.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-teal-50 border border-teal-100 rounded-xl text-sm text-teal-800">
            <span className="font-bold">Unit Economics (AcquaHT-80):</span> COGS ~₹2.0L · ASP ₹2.8–3.5L · Gross Margin 28–32% · Customer payback: 18–24 months vs. bottled water
          </div>
        </motion.div>
      </div>
    </section>
  )
}
