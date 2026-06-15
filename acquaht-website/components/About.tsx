'use client'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const pillars = [
  { icon: '💧', title: 'Innovation', desc: 'Cutting-edge AWG technology that harvests water from ambient humidity.' },
  { icon: '🌍', title: 'Inclusion', desc: 'Reaching households, schools, and communities left behind by infrastructure.' },
  { icon: '🌱', title: 'Impact', desc: 'Zero plastic, solar-powered, climate-smart — built for a sustainable future.' },
]

export default function About() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="about" ref={ref} className="py-24 bg-navy-800 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="section-tag">About Us</div>
            <h2 className="section-title">Innovation. Inclusion. Impact.</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              At <span className="text-cyan-400 font-semibold">AcquaHT Labs</span>, we go beyond just providing water.
              We are on a mission to make safe drinking water accessible, sustainable, and affordable —
              empowering communities through technology, climate-smart solutions, and local entrepreneurship.
            </p>
            <p className="text-slate-400 mb-10 leading-relaxed">
              Our device captures ambient humidity, filters out impurities, and mineralizes the water to perfection —
              delivering clean, safe drinking water on demand. No pipelines. No groundwater dependency. 100% self-sustained.
            </p>

            <div className="flex flex-col gap-4">
              {pillars.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  className="flex items-start gap-4 glass-card p-4"
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <div className="font-semibold text-white mb-0.5">{p.title}</div>
                    <div className="text-sm text-slate-400">{p.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative glass-card p-8 rounded-3xl border border-cyan-500/20">
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-3xl blur-sm" />
              <div className="relative">
                {/* Mini dashboard mockup */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <div className="flex-1 h-5 bg-white/5 rounded-full ml-2" />
                </div>
                <div className="text-xs text-cyan-400 font-mono mb-3">LIVE — AcquaHT Smart Dashboard</div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Water Produced', val: '12.4 L', color: 'text-cyan-400' },
                    { label: 'Air Humidity', val: '68%', color: 'text-blue-400' },
                    { label: 'TDS Level', val: '42 ppm', color: 'text-green-400' },
                    { label: 'Solar Input', val: '3.2 kW', color: 'text-yellow-400' },
                  ].map((m) => (
                    <div key={m.label} className="bg-white/5 rounded-xl p-3">
                      <div className={`text-xl font-bold ${m.color}`}>{m.val}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-xs text-slate-500 mb-2">Production (Last 7 days)</div>
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-cyan-600/60 to-cyan-400/40 rounded-sm"
                        style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  System operating at 98.2% efficiency
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
