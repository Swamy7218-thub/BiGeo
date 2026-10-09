'use client'
import { motion } from 'framer-motion'
import { hero, honesty } from '@/content/site'
import { TagPill, tagLegend } from './ui'

export default function Hero() {
  return (
    <section id="top" className="pt-28 pb-16 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center mb-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="tag mb-6">{hero.eyebrow}</span>
            <h1 className="h1 mt-6 mb-6">
              {hero.titleStart}{' '}
              <span className="text-teal-600">{hero.titleAccent}</span>
            </h1>
            <p className="body max-w-xl mb-8">{hero.body}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#contact" className="btn-primary justify-center">Get in touch →</a>
              <a href="#technology" className="btn-outline justify-center">See how it works</a>
            </div>
          </motion.div>

          <motion.figure initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-2xl bg-slate-800 p-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/dry-land-map.webp" alt="World map of land whose driest month is below 40% relative humidity"
              className="w-full h-auto" width={1600} height={1151} />
            <figcaption className="text-[11px] text-slate-400 leading-snug px-1 pt-2">{hero.mapCaption}</figcaption>
          </motion.figure>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {hero.stats.map(s => (
            <div key={s.num} className="stat-card shadow-sm flex flex-col">
              <div className="text-3xl md:text-4xl font-extrabold text-teal-600 tracking-tight leading-none mb-2">{s.num}</div>
              <div className="text-sm text-gray-600 font-medium mb-3 flex-1">{s.label}</div>
              <div><TagPill tag={s.tag} /></div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border border-gray-100 bg-gray-50 p-5 mb-10">
          <p className="text-sm text-gray-700 leading-relaxed mb-3"><span className="font-bold">How to read our numbers. </span>{honesty}</p>
          <div className="flex flex-wrap gap-2">
            {tagLegend.map(t => <TagPill key={t} tag={t} />)}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <div className="section-label">Support for the founder and AcquaHT</div>
          <div className="flex flex-wrap gap-2">
            {hero.backers.map(a => (
              <span key={a} className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full">{a}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
