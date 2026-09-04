'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const crisis = [
  { num: '15,000–75,000 yrs', label: 'for a natural aquifer to refill', source: 'IWMI' },
  { num: '680B L/day', label: 'evaporates worldwide — 60 days\' global use', source: 'WRI' },
  { num: '2.1B people', label: 'lack safe water — 163M in India, 40% global deficit by 2030', source: 'WHO/UNICEF · WEF' },
  { num: '~240,000/L', label: 'nanoplastics found in bottled water', source: 'Bloomberg' },
  { num: '500–600 Wh/L', label: 'typical energy draw of existing AWGs', source: 'IEA' },
]

const replenish = [
  { num: '5–7 days', label: 'for water-from-air to replenish, vs. 15,000–75,000-yr aquifer refill' },
  { num: '110 LPD → 40,150 L/yr', label: 'typical output per unit — blended planning average*' },
  { num: '~40,000/yr', label: 'single-use plastic bottles eliminated per unit, per year' },
  { num: 'Zero', label: 'nanoplastics — vs. ~240,000 per litre in bottled water' },
]

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="problem" ref={ref} className="py-20 bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-14">
          <div className="section-label text-gray-500">World Water Crisis</div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 max-w-3xl">
            The world is short on easy water — and the machines built to fix it only work in the{' '}
            <span className="text-teal-400">easy half.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl">
            This is not a future risk. Groundwater refills in 15,000–75,000 years. Bottled water carries
            ~240,000 nanoplastics per litre. And even atmospheric water generators — built to solve this —
            are rated for humid air, not the dry air where water is scarcest.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {crisis.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
              className="border border-white/10 rounded-2xl p-6 bg-white/5">
              <div className="text-3xl md:text-4xl font-extrabold text-teal-400 mb-2 leading-none">{s.num}</div>
              <div className="text-gray-300 text-sm mb-2 leading-snug">{s.label}</div>
              <div className="text-xs text-gray-600 font-medium">{s.source}</div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}
          className="border border-teal-500/20 rounded-2xl p-7 bg-teal-500/5 mb-14">
          <div className="text-[11px] font-bold tracking-widest text-teal-400/70 uppercase mb-2">Calculated — AcquaHT's own finding</div>
          <p className="text-white text-lg md:text-xl font-semibold leading-snug max-w-3xl">
            Even the machines built to solve this fail exactly where water is scarcest: dry air.
            AcquaHT's 200 LPD unit produces 221.7 LPD at 80% humidity but only 56.1 LPD at 30% — costing
            ₹9.30/L ($0.10/L) in electricity, more than bottled water.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}>
          <div className="section-label text-gray-500 mb-6">Water from air replenishes in days — not millennia</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {replenish.map((s, i) => (
              <div key={i} className="border border-white/5 rounded-xl p-5 bg-white/[0.03]">
                <div className="text-2xl md:text-3xl font-extrabold text-white mb-1">{s.num}</div>
                <div className="text-gray-400 text-sm leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-4 max-w-2xl leading-relaxed">
            * 110 L/day is a blended planning average, not a new spec — AcquaHT's measured output ranges
            56.1–221.7 LPD (30–80% RH). Sources: IWMI · WRI · IEA · World Economic Forum · UNICEF · Bloomberg.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
