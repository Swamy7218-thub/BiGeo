'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const flaws = [
  {
    title: 'Piped Infrastructure',
    sub: 'Built for another era',
    points: ['38% of rural India has no last-mile pipe network', 'Cost to extend: ₹2–5 Lakh per household', 'Jal Jeevan Mission 7+ years behind schedule'],
  },
  {
    title: 'Bottled Water',
    sub: 'Plastic crisis disguised as a solution',
    points: ['240,000 nanoplastics per litre (Bloomberg, 2023)', 'Supply chain fails during floods — peak demand, zero supply', '₹15–20/L delivered cost. Unaffordable for 60% of users'],
  },
  {
    title: 'Conventional AWGs',
    sub: 'Technically right, commercially broken',
    points: ['500–600 Wh/L energy draw — grid-dependent, expensive', 'Fails below 50% RH — excludes semi-arid inland regions', 'No IoT, no remote monitoring, no service ecosystem in India'],
  },
  {
    title: 'RO + Borewell Systems',
    sub: 'Draining reserves we cannot refill',
    points: ['Groundwater replenishes in 15,000–75,000 years', '21 Indian cities to run out of groundwater by 2030', 'Water table dropping 0.3m/year in coastal AP & Telangana'],
  },
]

export default function About() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section ref={ref} className="py-20 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-12">
          <div className="section-label">Every existing solution</div>
          <h2 className="h2 mb-3">Has a fatal flaw.</h2>
          <p className="body max-w-xl">Four multi-billion dollar industries, all making the crisis worse.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {flaws.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
              className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50 hover:border-red-200 hover:bg-red-50/20 transition-all group">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-gray-900">{f.title}</div>
                  <div className="text-sm text-gray-500">{f.sub}</div>
                </div>
              </div>
              <ul className="space-y-2">
                {f.points.map((p, j) => (
                  <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">·</span>{p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
