'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const traction = [
  { label: 'ISB AIC Social Impact 3.0', detail: '12 of 700 applicants selected. Direct ISB faculty mentorship and impact investors.', type: 'Accelerator' },
  { label: 'MeitY TIDE 2.0 — IIM Calcutta', detail: 'Entrepreneur-in-Residence. Equity-free grant, lab access, IIM Calcutta startup network.', type: 'Government' },
  { label: 'Mercedes-Benz beVisioneers 2025', detail: 'Selected from 1,000 global innovators. Mentorship, funding, international summit access.', type: 'Fellowship' },
  { label: 'IIM Shillong + Meghalaya Govt', detail: '₹2L prize + 3-year incubation. Direct intro to state water board procurement team.', type: '1st Prize' },
  { label: 'UN Habitat Youth Assembly', detail: 'Top 40 globally. 12 countries, fully funded. Positions AcquaHT for multilateral water fund.', type: 'Global' },
  { label: 'UNDP / Citi Youth Co:Lab 2026', detail: 'National Springboard Final 50. Accelerated access to UNDP development programmes.', type: 'National' },
  { label: 'Intinta Innovator 2024 — TSIC', detail: 'Telangana State Innovation Cell recognition. Opens state-level government pilot channel.', type: 'State Govt' },
  { label: 'T-Hub · NVIDIA Inception · IIT Hyd', detail: 'Active incubation. Hardware labs, cloud credits, and deep-tech talent network.', type: 'Ecosystem' },
]

const typeColor: Record<string, string> = {
  'Accelerator': 'bg-purple-50 text-purple-700 border-purple-100',
  'Government': 'bg-blue-50 text-blue-700 border-blue-100',
  'Fellowship': 'bg-amber-50 text-amber-700 border-amber-100',
  '1st Prize': 'bg-green-50 text-green-700 border-green-100',
  'Global': 'bg-cyan-50 text-cyan-700 border-cyan-100',
  'National': 'bg-orange-50 text-orange-700 border-orange-100',
  'State Govt': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Ecosystem': 'bg-teal-50 text-teal-700 border-teal-100',
}

export default function WhoWeServe() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="traction" ref={ref} className="py-20 bg-gray-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-12">
          <div className="section-label">Traction</div>
          <h2 className="h2 mb-3">MVP built. IP in filing. We've already won rooms that took others years.</h2>
          <p className="body max-w-xl">8 programs across government, global, and ecosystem — selected competitively in every case.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {traction.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.07 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-teal-200 hover:shadow-sm transition-all">
              <div className={`inline-block text-[10px] font-bold tracking-wider border px-2 py-0.5 rounded-full mb-3 ${typeColor[t.type]}`}>
                {t.type}
              </div>
              <div className="font-bold text-gray-900 text-sm mb-2 leading-snug">{t.label}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{t.detail}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
