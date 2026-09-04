'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const steps = [
  { num: '01', title: 'Dry air in', desc: '35°C, 30% RH — the exact condition where refrigeration alone struggles.' },
  { num: '02', title: 'Stage 1 — Desiccant bed captures', desc: 'A desiccant bed captures moisture at room temperature, before the air ever reaches the condenser.' },
  { num: '03', title: 'Stage 2 — Waste heat regenerates the bed', desc: 'Heat the compressor already rejects dries out the desiccant, so it can capture again — no external heat source needed.' },
  { num: '04', title: 'Existing refrigeration condenses it', desc: 'The refrigeration cycle AcquaHT already sells today condenses the recovered moisture into water.' },
]

const target = [
  { label: '93 LPD', desc: 'target output at 30% RH' },
  { label: '1.43 L/kWh', desc: 'target efficiency' },
  { label: '+66%', desc: 'more water, same power' },
]

const heatRecovery = [
  { label: '147 kg/h', desc: 'R407C refrigerant flow' },
  { label: '8.92 kW', desc: 'total condenser rejection' },
  { label: '0', desc: 'external heat source needed' },
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
            Dry air in. Water out.
          </h2>
          <p className="text-teal-100/70 text-lg max-w-2xl">
            Two stages recover water the refrigeration cycle alone cannot — desiccant capture, then
            waste-heat regeneration, feeding the same refrigeration core AcquaHT already sells today.
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

          {/* Target stats */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="section-label text-teal-400/60 mb-6">Design Target</div>
            <div className="space-y-6">
              {target.map((e, i) => (
                <div key={i} className="border-b border-white/5 pb-5 last:border-0 last:pb-0">
                  <div className="text-3xl font-extrabold text-teal-400 mb-1">{e.label}</div>
                  <div className="text-teal-100/60 text-sm">{e.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-xs text-amber-300/70 font-semibold tracking-wide uppercase mb-2">Projected — not yet built</div>
              <div className="text-xs text-teal-300/50 leading-relaxed">
                Design target, not yet built. Up from 56.1 LPD / 0.86 L/kWh today. This round funds the
                first sorbent cycle.
              </div>
            </div>
          </motion.div>
        </div>

        {/* Waste heat recovery */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="section-label text-teal-400/60 mb-3">The heat was already there</div>
          <p className="text-white text-lg font-semibold mb-2 max-w-2xl">
            1.29 kW of usable heat the compressor already rejects — enough to dry a desiccant.
          </p>
          <p className="text-teal-100/60 text-sm mb-6 max-w-2xl">
            Compressor discharge gas, on its way to the condenser, runs at ~80°C. Heat recovery pulls
            1.29 kW of usable heat before it reaches the condenser, which still runs at its normal 45°C
            condensing temperature.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {heatRecovery.map((h, i) => (
              <div key={i} className="border border-white/10 rounded-xl p-5 bg-white/[0.03]">
                <div className="text-2xl font-extrabold text-teal-400 mb-1">{h.label}</div>
                <div className="text-teal-100/60 text-sm">{h.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-teal-300/40 mt-5 leading-relaxed max-w-2xl">
            CALCULATED — MOF harvesters and salt-in-matrix composites are already published; none built
            at Indian cost, none using a compressor's own waste heat.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
