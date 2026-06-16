'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const team = [
  {
    name: 'Swamynathan Jerra',
    role: 'Founder & CEO',
    detail: 'EiR IIMCIP · Mercedes-Benz beVisioneers · Ex: TGIC, inSIG 2025. B.Tech Mechanical Engineering. Grew up in Siddipet, Telangana — lived the water problem firsthand.',
    initials: 'SJ',
    color: 'bg-teal-600',
  },
  {
    name: 'Vaidhatri Sanugula',
    role: 'Co-Founder — Water Quality',
    detail: 'M.Sc Biotechnology. Leads purification R&D and WHO compliance. Designed multi-stage filtration with >6-log pathogen kill. Oversees quality assurance across all models.',
    initials: 'VS',
    color: 'bg-blue-600',
  },
  {
    name: 'Sumanth Malyala',
    role: 'Co-Founder — R&D',
    detail: 'B.Tech Mechanical Engineering. Optimised AWG COP from 2.5 → 4.0 L/kWh in 18 months. Designed AcquaHT-80 specs. Manages STPI IoT OpenLab and MeitY lab partnerships.',
    initials: 'SM',
    color: 'bg-purple-600',
  },
  {
    name: 'Sai Smaran Nalla',
    role: 'Co-Founder — BD & IoT',
    detail: 'B.Tech Computer Science. Built ESP32-based cloud monitoring stack from scratch. Manages T-Hub, NVIDIA Inception, Microsoft Founders Hub. Drives NGO/CSR pipeline.',
    initials: 'SN',
    color: 'bg-orange-600',
  },
]

const logos = ['IIT Hyderabad', 'T-Hub', 'NVIDIA Inception', 'Microsoft Founders Hub', 'STPI IoT OpenLab', 'MeitY TIDE 2.0']

export default function FAQ() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="team" ref={ref} className="py-20 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-12">
          <div className="section-label">Team</div>
          <h2 className="h2 mb-3">Founder-market fit at every position.</h2>
          <p className="body max-w-xl">A team that has lived the problem, built the hardware, and won the rooms that matter.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5 mb-12">
          {team.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
              className="border border-gray-100 rounded-2xl p-6 flex gap-4">
              <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {t.initials}
              </div>
              <div>
                <div className="font-bold text-gray-900">{t.name}</div>
                <div className="text-sm text-teal-600 font-medium mb-2">{t.role}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{t.detail}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 }}>
          <div className="section-label mb-4">Institutional Support</div>
          <div className="flex flex-wrap gap-2">
            {logos.map((l, i) => (
              <span key={i} className="text-xs font-semibold text-gray-600 border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-full">{l}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
