'use client'
import { motion } from 'framer-motion'
import type { Tag } from '@/content/site'

export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const tagStyle: Record<Tag, string> = {
  Demonstrated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Modeled: 'bg-sky-50 text-sky-700 border-sky-200',
  Target: 'bg-amber-50 text-amber-700 border-amber-200',
  'In development': 'bg-violet-50 text-violet-700 border-violet-200',
  'Third-party data': 'bg-gray-50 text-gray-600 border-gray-200',
  Planned: 'bg-orange-50 text-orange-700 border-orange-200',
}

export function TagPill({ tag }: { tag: Tag }) {
  return (
    <span className={`inline-block text-[10px] font-bold tracking-wider uppercase border px-2 py-0.5 rounded-full ${tagStyle[tag]}`}>
      {tag}
    </span>
  )
}

export function SectionHead({ label, title, body, dark = false }: { label: string; title: string; body?: string; dark?: boolean }) {
  return (
    <Reveal className="mb-12 max-w-3xl">
      <div className={`section-label ${dark ? 'text-teal-300/70' : ''}`}>{label}</div>
      <h2 className={dark ? 'h2 text-white' : 'h2'}>{title}</h2>
      {body && <p className={`mt-4 text-lg leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{body}</p>}
    </Reveal>
  )
}

export const tagLegend: Tag[] = ['Demonstrated', 'Modeled', 'In development', 'Target', 'Planned', 'Third-party data']
