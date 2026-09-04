'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const airCards = [
  {
    title: 'Humid Air — 80% RH',
    good: true,
    output: '221.7 LPD output',
    cost: '₹2.35 ($0.02) per litre',
    verdict: 'Machine performs well',
  },
  {
    title: 'Dry Air — 30% RH',
    good: false,
    output: '56.1 LPD output',
    cost: '₹9.30 ($0.10) per litre',
    verdict: 'Machine underperforms',
  },
]

const singleStats = [
  {
    num: '₹9.30 ($0.10)',
    label: 'Cost per litre, in electricity alone, at 30% humidity.',
    note: 'CALCULATED — from psychrometric analysis of AcquaHT\'s own 200 LPD unit, at ₹8/unit.',
  },
  {
    num: '75%',
    label: 'of the cooling energy is wasted on air that carries almost no water, at 30% RH.',
    note: 'CALCULATED — the machine cools 1,024 kg of air/hour from 35°C to 18°C. At 80% RH only 4% is wasted this way.',
  },
]

export default function About() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section ref={ref} className="py-20 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-12">
          <div className="section-label">The core problem</div>
          <h2 className="h2 mb-3">Not all air is equal.</h2>
          <p className="body max-w-xl">Same machine. Same power draw. Output drops 75% as the air dries out.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {airCards.map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
              className={`border rounded-2xl p-6 ${a.good ? 'border-teal-100 bg-teal-50/40' : 'border-gray-100 bg-gray-50/50'}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${a.good ? 'bg-teal-100' : 'bg-red-100'}`}>
                  {a.good ? (
                    <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  )}
                </div>
                <div className="font-bold text-gray-900">{a.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg p-3 bg-white border border-gray-100">
                  <div className="text-xs text-gray-400 mb-0.5">Output</div>
                  <div className="font-bold text-sm text-gray-800">{a.output}</div>
                </div>
                <div className="rounded-lg p-3 bg-white border border-gray-100">
                  <div className="text-xs text-gray-400 mb-0.5">Cost / litre</div>
                  <div className="font-bold text-sm text-gray-800">{a.cost}</div>
                </div>
              </div>
              <div className={`text-sm font-semibold ${a.good ? 'text-teal-700' : 'text-red-500'}`}>
                {a.good ? '✓' : '✗'} {a.verdict}
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-12 max-w-xl">
          CALCULATED — psychrometric analysis of AcquaHT's own 200 LPD unit, at ₹8 ($0.08)/unit.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {singleStats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.1 }}
              className="border border-gray-100 rounded-2xl p-7 bg-gray-50/50">
              <div className="big-number-accent mb-3">{s.num}</div>
              <p className="text-gray-700 font-medium mb-3">{s.label}</p>
              <p className="text-xs text-gray-400">{s.note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
