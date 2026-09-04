'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const built = [
  {
    title: 'Refrigeration + Water Treatment',
    stats: ['6.89 kW compressor, COP 3.39.', 'Six-stage treatment, WHO & BIS IS 10500 tested.'],
    verdict: 'Sells today, as a dehumidifier',
    good: true,
  },
  {
    title: 'The Desiccant Stage',
    stats: ['No sorbent has run in the machine yet.', 'Target: 93 LPD at 30% RH.'],
    verdict: 'Not yet built — this round funds it',
    good: false,
  },
]

const economics = [
  { label: 'Build cost', val: '₹1,78,000 ($1.88K)', note: 'itemised through RYLT' },
  { label: 'Selling price', val: '₹3,75,000 ($3.95K)', note: 'unconfirmed' },
  { label: 'Service fee', val: '₹2,500 ($26)/month', note: 'Inkbird monitoring' },
  { label: 'Gross profit', val: '₹1.97L ($2.08K)', note: 'at ₹3.75L ($3.95K) price' },
  { label: 'Gross margin', val: '52.5%', note: 'if pricing holds' },
]

const competitors = [
  { provider: 'Maithri MEGHDOOT Premium', output: '150 LPD', power: '2.0 kW', eff: '3.13', publishes: false },
  { provider: 'Watergen', output: '$-priced, imported', power: '—', eff: 'not published', publishes: false },
  { provider: 'SkyWater', output: '$-priced, imported', power: '—', eff: 'not published', publishes: false },
  { provider: 'Tankers & bottled water', output: '—', power: '—', eff: '—', publishes: null },
  { provider: 'AcquaHT 200 LPD', output: '221.7 LPD', power: '2.71 kW', eff: '3.41', publishes: true },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="economics" ref={ref} className="py-20 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* What's built */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-10">
          <div className="section-label">Honest Gap</div>
          <h2 className="h2 mb-3">What's built. What isn't.</h2>
          <p className="body max-w-xl">The gap is real, and it is exactly what the money is for.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {built.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-7 border ${b.good ? 'border-teal-100 bg-teal-50/40' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="text-xl font-extrabold text-gray-900 mb-4">{b.title}</div>
              <ul className="space-y-2 mb-5">
                {b.stats.map((s, j) => (
                  <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5 flex-shrink-0">·</span>{s}
                  </li>
                ))}
              </ul>
              <div className={`text-sm font-semibold ${b.good ? 'text-teal-700' : 'text-red-500'}`}>
                {b.good ? '✓' : '✗'} {b.verdict}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Economics */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }} className="mb-16">
          <div className="section-label mb-3">Economics</div>
          <h2 className="h2 mb-3">Per-unit economics, today.</h2>
          <p className="body max-w-xl mb-8">Payback: ~4 months vs bottled water (₹20/L / $0.21/L). ~25 months sold as a dehumidifier.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {economics.map((e, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                <div className="text-xs text-gray-400 mb-1">{e.label}</div>
                <div className="font-bold text-gray-900 text-lg mb-0.5">{e.val}</div>
                <div className="text-xs text-gray-500">{e.note}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">ASSUMED — selling price is unconfirmed, and needs confirmation before quoting any customer.</p>
        </motion.div>

        {/* Competitive landscape */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}>
          <div className="section-label mb-3">Why nobody else solves this</div>
          <h2 className="h2 mb-3">Every published spec sheet in this industry is rated at high humidity.</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs font-bold tracking-wide text-gray-400 uppercase border-b border-gray-200">
                  <th className="py-3 pr-4">Provider</th>
                  <th className="py-3 pr-4">Output</th>
                  <th className="py-3 pr-4">Power</th>
                  <th className="py-3 pr-4">L/kWh (80% RH)</th>
                  <th className="py-3">Publishes &lt; 80% RH</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${c.provider === 'AcquaHT 200 LPD' ? 'bg-teal-50/50' : ''}`}>
                    <td className={`py-3 pr-4 font-medium ${c.provider === 'AcquaHT 200 LPD' ? 'text-teal-800 font-bold' : 'text-gray-800'}`}>{c.provider}</td>
                    <td className="py-3 pr-4 text-gray-600">{c.output}</td>
                    <td className="py-3 pr-4 text-gray-600">{c.power}</td>
                    <td className="py-3 pr-4 text-gray-600">{c.eff}</td>
                    <td className="py-3">
                      {c.publishes === true && <span className="text-teal-600 font-bold">✓</span>}
                      {c.publishes === false && <span className="text-red-400 font-bold">✗</span>}
                      {c.publishes === null && <span className="text-gray-300">n/a</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-5 max-w-2xl">
            AcquaHT is the only maker publishing 30% RH numbers. The real competitor today is tankers and bottled water.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
