'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const traction = [
  { label: 'Founded', detail: 'November 2023, Hyderabad', type: 'Measured' },
  { label: 'Piloted', detail: '210 L across 2 field pilots, Malla Sagar & Cherlapally, Telangana', type: 'Measured' },
  { label: 'Funded', detail: '₹25.9L ($27.3K) raised, non-dilutive — Emergent Ventures, IIM Calcutta MeitY TIDE 2.0, IIM Shillong', type: 'Measured' },
  { label: 'Signed', detail: '₹75,000 ($791) first customer, food processing, May 2026 — not yet revenue', type: 'Signed' },
  { label: 'Partnered', detail: 'MoU with Bala Vikasa · AIC AKASH Cohort 5, IIIT Hyderabad', type: 'Partnered' },
]

const typeColor: Record<string, string> = {
  Measured: 'bg-teal-50 text-teal-700 border-teal-100',
  Signed: 'bg-green-50 text-green-700 border-green-100',
  Partnered: 'bg-blue-50 text-blue-700 border-blue-100',
}

const market = [
  { num: '75', label: 'Named, Reachable Sites', note: 'A bottom-up count, not a market estimate' },
  { num: '₹2.81Cr ($296.3K)', label: 'Hardware', note: '75 units × ₹3,75,000 ($3.95K)' },
  { num: '₹22.5L ($23.7K)', label: 'Service, Per Year', note: '75 units × ₹2,500 ($26)/month' },
]

const beachheads = [
  { title: 'Food Processing & Cold Storage', detail: 'Telangana, through direct relationships. First customer signed here.' },
  { title: 'Bala Vikasa Villages', detail: 'Rural distribution, through the signed MoU.' },
  { title: 'Coastal, High-Humidity Sites', detail: 'The machine already works well today; water pays back in months.' },
]

export default function WhoWeServe() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="traction" ref={ref} className="py-20 bg-gray-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-12">
          <div className="section-label">Traction</div>
          <h2 className="h2 mb-3">Real numbers, not a projection.</h2>
          <p className="body max-w-xl">210 L across 2 field pilots, non-dilutive funding, and a signed first customer.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
          {traction.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-teal-200 hover:shadow-sm transition-all">
              <div className={`inline-block text-[10px] font-bold tracking-wider border px-2 py-0.5 rounded-full mb-3 ${typeColor[t.type]}`}>
                ✓ {t.type}
              </div>
              <div className="font-bold text-gray-900 text-sm mb-2 leading-snug">{t.label}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{t.detail}</div>
            </motion.div>
          ))}
        </div>

        {/* Market */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }} className="mb-12">
          <div className="section-label mb-6">Market</div>
          <div className="grid sm:grid-cols-3 gap-4">
            {market.map((m, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="text-2xl md:text-3xl font-extrabold text-teal-600 mb-1">{m.num}</div>
                <div className="font-bold text-gray-800 mb-1">{m.label}</div>
                <div className="text-xs text-gray-400">{m.note}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Beachheads */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}>
          <div className="section-label mb-6">Three beachheads. One machine.</div>
          <div className="grid sm:grid-cols-3 gap-4">
            {beachheads.map((b, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="font-bold text-gray-900 mb-2">{b.title}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{b.detail}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
