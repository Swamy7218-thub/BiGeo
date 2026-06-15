'use client'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const steps = [
  {
    num: '01',
    title: 'Capture Humidity From Air',
    desc: 'Our AWG unit draws in ambient air and passes it through a proprietary condensation system, extracting moisture even in low-humidity environments.',
    icon: '🌬️',
  },
  {
    num: '02',
    title: 'Filter & Mineralize',
    desc: 'The captured water is purified through multi-stage filtration — removing impurities, bacteria, and contaminants — then mineralized to perfect drinking quality.',
    icon: '⚗️',
  },
  {
    num: '03',
    title: 'Deliver Clean Water',
    desc: 'Pure, safe water is dispensed on demand. The smart dashboard notifies you of production levels, filter health, and performance in real time.',
    icon: '💧',
  },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" ref={ref} className="py-24 bg-navy-800 relative overflow-hidden">
      {/* Wave top */}
      <div className="absolute top-0 left-0 right-0 rotate-180">
        <svg viewBox="0 0 1440 60" fill="none">
          <path d="M0 60L60 52C120 44 240 28 360 24C480 20 600 28 720 32C840 36 960 36 1080 32C1200 28 1320 20 1380 16L1440 12V60H0Z" fill="#030B1A"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <div className="section-tag mx-auto">Process</div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle mx-auto text-center">
            Three simple steps from thin air to clean drinking water.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                className="relative text-center"
              >
                {/* Step number bubble */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold text-navy-900">
                    {step.num}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="mt-16 glass-card p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left border-cyan-500/20"
        >
          <div className="text-4xl">🔧</div>
          <div>
            <div className="font-semibold text-white mb-1">Low Maintenance, High Reliability</div>
            <div className="text-slate-400 text-sm">
              Users only need to replace filters periodically. Remote diagnostics and smart alerts notify you of upcoming maintenance needs, filter health, and performance issues — ensuring consistent operation without daily checks.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
