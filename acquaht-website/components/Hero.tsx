'use client'
import { motion } from 'framer-motion'

const keyStats = [
  { num: '163M', label: 'Indians lack safe water' },
  { num: '40%', label: 'less energy than rivals' },
  { num: '₹2/L', label: 'delivered cost' },
  { num: '$15B', label: 'market by 2030' },
]

const awards = [
  'ISB AIC Social Impact 3.0',
  'MeitY TIDE 2.0 · IIM Calcutta',
  'Mercedes-Benz beVisioneers 2025',
  'IIM Shillong — 1st Prize',
  'UN Habitat Youth Assembly — Top 40',
  'T-Hub · NVIDIA Inception',
]

export default function Hero() {
  return (
    <section id="top" className="pt-24 pb-16 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Badge row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-wrap gap-2 mb-8">
          <span className="tag">Climate-Tech</span>
          <span className="tag">Water Innovation</span>
          <span className="tag">Deep-Tech Hardware</span>
          <span className="tag">India First</span>
        </motion.div>

        {/* Main headline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
          <h1 className="h1 mb-6 max-w-4xl">
            We pull{' '}
            <span className="text-teal-600">clean water</span>
            {' '}directly from air.
          </h1>
          <p className="body max-w-2xl mb-4">
            Solar-powered Atmospheric Water Generators for a water-scarce world — starting with India.
            No pipes. No plastic. No groundwater extraction.
          </p>
          <p className="text-gray-500 text-base mb-8 max-w-xl">
            <span className="font-semibold text-gray-700">Swamynathan Jerra</span>, Founder & CEO ·{' '}
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
          <div className="section-label">Validated by</div>
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
