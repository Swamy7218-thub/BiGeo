'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const steps = [
  { num: '01', title: 'Air Intake & Filtration', desc: 'Draws ambient air through pre-filters removing dust, bacteria, pollen, and VOCs. Works at 30–95% RH, 10–45°C.' },
  { num: '02', title: 'Condensation Cycle', desc: 'Refrigeration-based condensation cools air below dew point. COP up to 4.0 L/kWh — 40% more efficient than industry average.' },
  { num: '03', title: 'Multi-Stage Purification', desc: 'Sediment → Pre-Carbon → RO → UF → Post-Carbon → Mineral → Ozonization. Exceeds WHO and BIS standards.' },
  { num: '04', title: 'Storage & Delivery', desc: 'Food-grade SS304 tank (20L). Optional biodegradable sugarcane-pulp bottles. Zero plastic. Zero nanoplastics.' },
  { num: '05', title: 'IoT Smart Monitoring', desc: 'ESP32 + cloud dashboard. Real-time TDS, RH, temperature, water level, fault alerts. Remote servicing cuts maintenance cost 60%.' },
]

const edge = [
  { label: '≤260 Wh/L', desc: 'vs. 500–600 Wh/L industry average' },
  { label: '4.0 L/kWh', desc: 'COP — best-in-class condensation efficiency' },
  { label: '30% RH', desc: 'lowest operating humidity in India' },
  { label: '221 L/day', desc: 'max water output per unit' },
]

export default function Solutions() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="solution" ref={ref} className="py-20 bg-teal-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-14">
          <div className="section-label text-teal-400/60">The Solution</div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Air in. Safe water out.
          </h2>
          <p className="text-teal-100/70 text-lg max-w-2xl">
            We pull water directly from air. No pipes. No plastic. No groundwater extraction.
            Just solar energy and atmospheric humidity.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Steps */}
          <div className="space-y-5">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.1 }}
                className="flex gap-4">
                <div className="text-teal-400 font-bold text-sm w-7 flex-shrink-0 pt-0.5">{s.num}</div>
                <div>
                  <div className="font-bold text-white mb-1">{s.title}</div>
                  <div className="text-teal-100/60 text-sm leading-relaxed">{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Edge stats */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="section-label text-teal-400/60 mb-6">Our Technology Edge</div>
            <div className="space-y-6">
              {edge.map((e, i) => (
                <div key={i} className="border-b border-white/5 pb-5 last:border-0 last:pb-0">
                  <div className="text-3xl font-extrabold text-teal-400 mb-1">{e.label}</div>
                  <div className="text-teal-100/60 text-sm">{e.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-xs text-teal-300/50 leading-relaxed">
                Key moat: The only Indian AWG operating natively at 30% RH with solar-hybrid power — the conditions defining 60% of our target geography.
              </div>
              <div className="mt-3 text-xs text-teal-400/40">
                Validated at ISB AIC · MeitY TIDE 2.0 · IIM Calcutta · IIM Shillong International Water Conference (1st Prize)
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
