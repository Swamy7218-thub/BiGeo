'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const team = [
  {
    name: 'Jerra Swamynathan',
    role: 'Founder & CEO',
    detail: 'Mechanical Engineer. Mercedes-Benz beVisioneers Fellow 2025 — 1 of 1,000 fellows worldwide. Also: IWA Connect Plus · World Bank · UN-Habitat · UNDP-Citi · HBS Aspire.',
    initials: 'JS',
    color: 'bg-teal-600',
  },
  {
    name: 'Vaidhatri Sanugula',
    role: 'Biotechnology & Research',
    detail: 'Biotechnology graduate with experience in molecular biology, microbiology, PCR and genotyping — supporting AcquaHT\'s water-quality research.',
    initials: 'VS',
    color: 'bg-blue-600',
  },
  {
    name: 'Sumanth Malyala',
    role: 'R&D Engineer',
    detail: 'R&D engineer driving product development, prototyping, testing and technology optimization.',
    initials: 'SM',
    color: 'bg-purple-600',
  },
  {
    name: 'Nalla Sai Smaran',
    role: 'Co-founder & BDE',
    detail: 'CSE Engineer focused on business development, customer acquisition and commercial growth.',
    initials: 'NS',
    color: 'bg-orange-600',
  },
]

const advisors = 'Advisors: Prof. Soumyajit Roy, IISER Kolkata · Vijender Mogili, Bala Vikasa · RYLT (manufacturing partner).'

const logos = ['Emergent Ventures', 'MeitY TIDE 2.0 · IIM Calcutta', 'IIM Shillong', 'Mercedes-Benz beVisioneers', 'Bala Vikasa', 'AIC AKASH Cohort 5 · IIIT Hyderabad']

export default function FAQ() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <section id="team" ref={ref} className="py-20 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="mb-12">
          <div className="section-label">Team</div>
          <h2 className="h2 mb-3">Founder-market fit at every position.</h2>
          <p className="body max-w-xl">Swamynathan Jerra, Founder · 100% ownership. A team that has built the hardware and lived the water problem firsthand.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-5 mb-8">
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

        <p className="text-sm text-gray-500 mb-10 max-w-2xl">{advisors}</p>

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
