'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const crisis = [
  { num: '2.1B', label: 'people lack safe drinking water globally', source: 'WHO/UNICEF 2023' },
  { num: '163M', label: 'Indians drink contaminated water daily', source: 'UNICEF India' },
  { num: '40%', label: 'global water deficit projected by 2030', source: 'UN Water' },
  { num: '21', label: 'Indian cities face groundwater depletion by 2030', source: 'NITI Aayog' },
]

const indiaStats = [
  { num: '91%', label: 'rural households have no piped water' },
  { num: '₹1.5T', label: 'annual economic loss from water scarcity (6% of GDP)' },
  { num: '1.4Cr', label: 'school days lost annually to water-borne illness' },
  { num: '7 yrs', label: 'Jal Jeevan Mission behind schedule' },
]

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="problem" ref={ref} className="py-20 bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-14">
          <div className="section-label text-gray-500">The Problem</div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 max-w-3xl">
            The water crisis is here. <span className="text-teal-400">Now.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl">
            This is not a future risk. Groundwater refills in 15,000–75,000 years. Bottled water carries 240,000 nanoplastics per litre. Every current solution makes the problem worse.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {crisis.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
              className="border border-white/10 rounded-2xl p-6 bg-white/5">
              <div className="text-4xl md:text-5xl font-extrabold text-teal-400 mb-2 leading-none">{s.num}</div>
              <div className="text-gray-300 text-sm mb-2 leading-snug">{s.label}</div>
              <div className="text-xs text-gray-600 font-medium">{s.source}</div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}>
          <div className="section-label text-gray-500 mb-6">India: The Largest Underserved Water Market on Earth</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {indiaStats.map((s, i) => (
              <div key={i} className="border border-white/5 rounded-xl p-5 bg-white/[0.03]">
                <div className="text-3xl font-extrabold text-white mb-1">{s.num}</div>
                <div className="text-gray-400 text-sm leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
