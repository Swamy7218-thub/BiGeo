'use client'
import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const impact = [
  { num: '40,150 L', label: 'safe water produced per unit per year' },
  { num: '40,000+', label: 'single-use plastic bottles eliminated' },
  { num: '~50', label: 'people given reliable water access' },
  { num: '₹3–6L', label: 'saved vs. bottled water over 3 years' },
  { num: '1.2 tCO₂e', label: 'carbon offset vs. diesel pumping' },
  { num: '5–7 days', label: 'for atmospheric water to replenish' },
]

const sdgs = [
  { num: '6', label: 'Clean Water & Sanitation' },
  { num: '3', label: 'Good Health' },
  { num: '13', label: 'Climate Action' },
  { num: '11', label: 'Sustainable Cities' },
  { num: '10', label: 'Reduced Inequalities' },
]

const ask = [
  { pct: '40%', amt: '₹4.0L', use: 'IP & Patents', desc: 'Provisional + utility filings on solar-hybrid AWG architecture and IoT stack.' },
  { pct: '30%', amt: '₹3.0L', use: 'Integrations & MVP-to-Pilot', desc: 'ESP32 cloud stack, sensor calibration, sugarcane-bottle line integration.' },
  { pct: '20%', amt: '₹2.0L', use: 'Compliance & Testing', desc: 'BIS certification, WHO water-quality lab testing, field validation protocols.' },
  { pct: '10%', amt: '₹1.0L', use: 'First Pilot Deployment', desc: '1 anchor unit deployed with NGO/institutional partner. Live field data.' },
]

export default function ContactCTA() {
  const [form, setForm] = useState({ name: '', email: '', org: '', message: '' })
  const [sent, setSent] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      {/* Impact */}
      <section className="py-20 bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label text-gray-500 mb-3">Impact</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Every unit is a measurable development outcome.</h2>
          <p className="text-gray-400 mb-10">1 unit. 1 year.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {impact.map((s, i) => (
              <div key={i} className="border border-white/10 rounded-xl p-5">
                <div className="text-2xl font-extrabold text-teal-400 mb-1">{s.num}</div>
                <div className="text-gray-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="section-label text-gray-500 mb-4">UN SDG Alignment</div>
          <div className="flex flex-wrap gap-3">
            {sdgs.map((s, i) => (
              <div key={i} className="flex items-center gap-2 border border-white/10 rounded-full px-4 py-2">
                <span className="text-xs font-bold text-teal-400">SDG {s.num}</span>
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Ask */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label mb-3">The Ask</div>
          <h2 className="h2 mb-2">Raising ₹10 Lakh Seed Round.</h2>
          <p className="body max-w-xl mb-10">To complete IP filings, finish integrations, and ship our first pilot — unlocking a milestone-linked growth-stage tranche of ₹50L–₹1Cr.</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {ask.map((a, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-extrabold text-teal-600">{a.pct}</span>
                  <span className="text-sm font-bold text-gray-900">{a.amt} · {a.use}</span>
                </div>
                <div className="text-sm text-gray-500">{a.desc}</div>
              </div>
            ))}
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 text-sm text-teal-800">
            <span className="font-bold">Growth-stage triggers (6–9 months):</span> 1–2 pilot units live · ≥1 patent filed · ≥1 institutional LOI · Indicative tranche ₹50L–₹1Cr
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" ref={ref} className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}>
              <div className="section-label mb-3">Contact</div>
              <h2 className="h2 mb-4">Clean water shouldn't depend on your pin code.</h2>
              <p className="body mb-8">We are solving India's water crisis from the air down. Whether you're an investor, institutional partner, NGO, or government body — let's talk.</p>
              <div className="space-y-4">
                {[
                  { label: 'Email', val: 'admin@acquahtlabs.in', href: 'mailto:admin@acquahtlabs.in' },
                  { label: 'Founder', val: 'Swamynathan Jerra', href: '#' },
                  { label: 'Location', val: 'Hyderabad, Telangana, India', href: '#' },
                  { label: 'Website', val: 'acquahtlabs.in', href: 'https://acquahtlabs.in' },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-4">
                    <div className="text-xs font-bold text-gray-400 w-16">{c.label}</div>
                    <a href={c.href} className="text-gray-800 font-medium hover:text-teal-600 transition-colors text-sm">{c.val}</a>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.2 }}>
              {sent ? (
                <div className="border border-gray-100 rounded-2xl bg-white p-10 text-center shadow-sm">
                  <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h3>
                  <p className="text-gray-500 text-sm">Swamynathan will get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="border border-gray-100 rounded-2xl bg-white p-8 shadow-sm flex flex-col gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Your Name</label>
                      <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="Jane Doe" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors"/>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Organisation</label>
                      <input type="text" value={form.org} onChange={e => setForm({...form, org: e.target.value})}
                        placeholder="Your org (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email</label>
                    <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      placeholder="jane@example.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Message</label>
                    <textarea required rows={4} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                      placeholder="I'm interested in..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors resize-none"/>
                  </div>
                  <button type="submit" className="btn-primary justify-center py-3">Send Message →</button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}
