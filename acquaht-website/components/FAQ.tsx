'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

const faqs = [
  {
    q: 'How does the atmospheric water generator work?',
    a: 'Our AWG unit draws in ambient air and passes it through a proprietary condensation system that extracts moisture from humidity. The captured water is then purified through multi-stage filtration — removing impurities, bacteria, and contaminants — and finally mineralized to perfect drinking quality. No groundwater, no pipelines required.',
  },
  {
    q: 'What humidity levels are needed for the system to work?',
    a: 'Our systems are optimized to operate efficiently at humidity levels as low as 30%. For best results and maximum output, environments with 50%+ relative humidity are ideal. We offer models tailored for arid, semi-arid, and tropical climates across India.',
  },
  {
    q: 'How much maintenance does the device require?',
    a: 'AcquaHT is designed for low-maintenance operation. Users only need to replace filters periodically and perform occasional cleaning. The system includes remote diagnostics and a smart dashboard that notifies you of upcoming maintenance needs, filter health, and performance issues — ensuring consistent operation without daily checks.',
  },
  {
    q: 'Where can the device be installed?',
    a: 'Our technology adapts to your unique needs. Whether for homes, offices, schools, hospitals, or remote locations — we ensure seamless installation and personalized water solutions tailored just for you. Our team guides you through the entire setup process.',
  },
  {
    q: 'How do I get in touch or place an order?',
    a: 'You can reach us via our contact form below, through live chat on our website, or directly on WhatsApp and phone. Our team is available to help you choose the perfect model, guide installation, and ensure you are fully supported from day one.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="faq" ref={ref} className="py-24 bg-navy-800 relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-14"
        >
          <div className="section-tag mx-auto">FAQ</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle mx-auto text-center">Everything you need to know about AcquaHT Labs.</p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {faqs.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08 }}
              className="glass-card overflow-hidden"
            >
              <button
                className="w-full text-left p-6 flex items-center justify-between gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-white">{f.q}</span>
                <span className={`text-cyan-400 transition-transform duration-300 flex-shrink-0 ${open === i ? 'rotate-45' : ''}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                      {f.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
