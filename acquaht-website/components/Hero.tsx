'use client'
import { motion } from 'framer-motion'

const keyStats = [
  { num: '210 L', label: 'measured across 2 field pilots' },
  { num: '56–222', label: 'LPD, at 30–80% RH' },
  { num: '₹25.9L', label: 'raised, non-dilutive' },
  { num: '30% RH', label: 'lowest air we make water from' },
]

const awards = [
  'Emergent Ventures',
  'MeitY TIDE 2.0 · IIM Calcutta',
  'IIM Shillong',
  'Mercedes-Benz beVisioneers 2025',
  'AIC AKASH Cohort 5 · IIIT Hyderabad',
  'Bala Vikasa — MoU',
]

export default function Hero() {
  return (
    <section id="top" className="pt-24 pb-16 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-wrap gap-2 mb-8">
          <span className="tag">Climate-Tech</span>
          <span className="tag">Deep-Tech Hardware</span>
          <span className="tag">Dry-Climate AWG</span>
          <span className="tag">India First</span>
        </motion.div>

        {/* Main headline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <h1 className="h1 mb-6 max-w-4xl">
            Atmospheric water,{' '}
            <span className="text-teal-600">engineered for dry climates.</span>
          </h1>
          <p className="body max-w-2xl mb-4">
            Most machines that pull water from air only work where the air is already humid.
            AcquaHT is built for the dry half — where water is scarcest and existing machines fail.
          </p>
          <p className="text-gray-500 text-base mb-8 max-w-xl">
            <span className="font-semibold text-gray-700">Swamynathan Jerra</span>, Founder & CEO · Hyderabad, India · Founded November 2023 ·{' '}
            <a href="mailto:admin@acquahtlabs.in" className="text-teal-600 hover:underline">admin@acquahtlabs.in</a>
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3 mb-14">
          <a href="#contact" className="btn-primary">Get in Touch →</a>
          <a href="#solution" className="btn-outline">See How It Works</a>
        </motion.div>

        {/* Key stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {keyStats.map((s, i) => (
            <div key={i} className="stat-card shadow-sm">
              <div className="big-number-accent mb-1">{s.num}</div>
              <div className="text-sm text-gray-500 font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Social proof strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="section-label">Backed & validated by</div>
          <div className="flex flex-wrap gap-2">
            {awards.map((a, i) => (
              <span key={i} className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">{a}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
