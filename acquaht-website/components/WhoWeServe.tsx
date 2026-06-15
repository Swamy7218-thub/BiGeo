'use client'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const users = [
  { icon: '🏠', title: 'Households', desc: 'Families without reliable pipeline access get safe water on demand.' },
  { icon: '🏫', title: 'Schools', desc: 'Safe hydration for students in underserved and rural communities.' },
  { icon: '🏥', title: 'Hospitals', desc: 'Sterile, purified water supply for critical healthcare settings.' },
  { icon: '🪖', title: 'Remote Outposts', desc: 'Military and field operations in areas with no water infrastructure.' },
  { icon: '🌆', title: 'Urban Dwellers', desc: 'Eco-conscious city residents seeking a plastic-free water solution.' },
  { icon: '🆘', title: 'Disaster Relief', desc: 'Rapid deployment of clean water during floods, droughts, and crises.' },
]

export default function WhoWeServe() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 bg-navy-900 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <div className="section-tag mx-auto">Who We Serve</div>
          <h2 className="section-title">Clean Water for Everyone</h2>
          <p className="section-subtitle mx-auto text-center">
            Our solutions adapt to any setting — from remote villages to urban hospitals to disaster zones.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="glass-card p-6 hover:border-cyan-500/30 hover:bg-white/[0.08] transition-all duration-300 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{u.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{u.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{u.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
