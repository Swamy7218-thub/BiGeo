'use client'
import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const gaps = [
  { num: '0', label: 'Sorbent cycles run in the machine' },
  { num: '0', label: 'Patents filed' },
  { num: 'Unconfirmed', label: 'Selling price (₹3,75,000 / $3.95K)' },
]

const roadmap = [
  { year: 'FY26 — actual', units: '1 unit', revenue: '₹0.75L ($791) revenue' },
  { year: 'FY27', units: '45 units', revenue: '₹1.69 Cr ($178.2K) + ₹6.8L ($7.17K) service' },
  { year: 'FY28', units: '120 units', revenue: '₹4.50 Cr ($474.2K) + ₹25L ($26.4K) service' },
  { year: 'FY29', units: '250 units', revenue: '₹9.38 Cr ($989.7K) + ₹56L ($59.0K) service' },
]

const ask = [
  { pct: '40%', amt: '₹2.37Cr ($250K)', use: 'Sorbent', desc: 'Development and testing.' },
  { pct: '20%', amt: '₹1.19Cr ($125K)', use: 'Waste-Heat Loop', desc: 'Waste-heat regeneration loop.' },
  { pct: '25%', amt: '₹1.48Cr ($156.3K)', use: 'Manufacturing & Certification', desc: 'Certification.' },
  { pct: '15%', amt: '₹88.9L ($93.8K)', use: 'Deployment', desc: 'Operations.' },
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
      {/* Honest gaps + Roadmap */}
      <section className="py-20 bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label text-gray-500 mb-3">What Hasn't Been Proven Yet</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Stated plainly, because it is exactly what this round funds.</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-4 mt-10">
            {gaps.map((g, i) => (
              <div key={i} className="border border-white/10 rounded-xl p-5">
                <div className="text-2xl font-extrabold text-amber-400 mb-1">{g.num}</div>
                <div className="text-gray-400 text-sm">{g.label}</div>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm mb-14">This round funds the first sorbent cycle.</p>

          <div className="section-label text-gray-500 mb-4">Roadmap</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {roadmap.map((r, i) => (
              <div key={i} className="border border-white/10 rounded-xl p-5 bg-white/[0.03]">
                <div className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-2">{r.year}</div>
                <div className="text-2xl font-extrabold text-white mb-1">{r.units}</div>
                <div className="text-gray-400 text-sm leading-snug">{r.revenue}</div>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm">Breakeven ~90 units. Projected, except FY26 which is actual.</p>
        </div>
      </section>

      {/* The Ask */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label mb-3">The Ask</div>
          <h2 className="h2 mb-2">Raising $500K–$750K.</h2>
          <p className="body max-w-xl mb-10">Pre-Seed round. 24 months of runway to a proven desiccant unit.</p>
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
            <span className="font-bold">Next raise unlocks when:</span> the desiccant unit beats 90 LPD at 30% RH,
            75 customers have paid full price, and per-unit cost is under ₹1.5L.
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
              <p className="body mb-8">We're closing the dry-air gap in atmospheric water — backed by Emergent Ventures, MeitY TIDE 2.0, and IIM Shillong. Whether you're an investor, a food-processing operator, or an NGO partner — let's talk.</p>
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
