'use client'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const solutions = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 3c-1.5 2-5 6-5 9a5 5 0 0010 0c0-3-3.5-7-5-9z"/>
      </svg>
    ),
    title: 'Atmospheric Water Harvesting',
    desc: 'Harnessing cutting-edge technology to extract clean water directly from the air in just 5-7 days — no plastic, no pipelines, 100% renewable.',
    tag: 'Core Technology',
    color: 'from-cyan-500 to-cyan-700',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    ),
    title: 'Smart Water Management',
    desc: 'Real-time monitoring of water production, quality, and consumption via our smart dashboard. Track usage, optimize efficiency, reduce wastage.',
    tag: 'IoT Platform',
    color: 'from-blue-500 to-blue-700',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707"/>
      </svg>
    ),
    title: 'Solar-Powered AWG Units',
    desc: 'Pioneering solar-powered atmospheric water generators that deliver pure, safe water anywhere — off-grid, remote, or urban.',
    tag: 'Green Energy',
    color: 'from-yellow-500 to-orange-600',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
      </svg>
    ),
    title: 'Education & Sustainability',
    desc: 'Empowering communities through education on sustainable water practices and hygiene — promoting lasting impact and environmental stewardship.',
    tag: 'Community',
    color: 'from-green-500 to-emerald-700',
  },
]

export default function Solutions() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="solutions" ref={ref} className="py-24 bg-navy-900 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <div className="section-tag mx-auto">Our Solutions</div>
          <h2 className="section-title">Amazing Services</h2>
          <p className="section-subtitle mx-auto text-center">
            From harvesting water out of thin air to intelligent monitoring — we cover every drop of your water journey.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {solutions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card p-8 group hover:border-cyan-500/30 transition-all duration-300 hover:bg-white/[0.08]"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} p-0.5 mb-5`}>
                <div className="w-full h-full rounded-2xl bg-navy-800 flex items-center justify-center text-white group-hover:bg-navy-700 transition-colors">
                  {s.icon}
                </div>
              </div>
              <div className="text-xs font-medium text-cyan-400 mb-2 tracking-wider uppercase">{s.tag}</div>
              <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
              <p className="text-slate-400 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
