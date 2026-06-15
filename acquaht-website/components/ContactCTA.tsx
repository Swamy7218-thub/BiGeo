'use client'
import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function ContactCTA() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, wire this to your backend / AWS SES
    setSent(true)
  }

  return (
    <section id="contact" ref={ref} className="py-24 bg-navy-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — CTA copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="section-tag">Get Started</div>
            <h2 className="section-title">Ready for clean water, anywhere?</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Whether you're an individual, school, hospital, or relief organization — AcquaHT Labs has
              a solution for you. Reach out and our team will help you find the perfect setup.
            </p>
            <div className="flex flex-col gap-4">
              {[
                { icon: '📧', label: 'Email', val: 'jerraswamynathan@gmail.com' },
                { icon: '🌐', label: 'Website', val: 'acquahtlabs.in' },
                { icon: '📍', label: 'Location', val: 'Siddipet, Telangana, India' },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-3 text-slate-400">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <div className="text-xs text-slate-500">{c.label}</div>
                    <div className="text-sm text-slate-300">{c.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {sent ? (
              <div className="glass-card p-10 text-center border-cyan-500/30">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-slate-400">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card p-8 flex flex-col gap-5 border-white/10">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Your Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your water needs..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 transition-colors resize-none"
                  />
                </div>
                <button type="submit" className="btn-primary w-full text-center py-4">
                  Send Message →
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
