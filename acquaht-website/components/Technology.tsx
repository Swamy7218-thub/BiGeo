import { insight, howItWorks } from '@/content/site'
import { Reveal, SectionHead, TagPill } from './ui'

export default function Technology() {
  return (
    <section id="technology" className="py-20 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHead label={insight.label} title={insight.title} body={insight.body} />

        <div className="grid md:grid-cols-3 gap-5 mb-24">
          {insight.cards.map((c, i) => (
            <Reveal key={c.where} delay={i * 0.08} className="border border-gray-100 rounded-2xl p-6 bg-gray-50/60 flex flex-col">
              <div className="text-xs font-bold tracking-widest uppercase text-teal-700 mb-1">{c.where}</div>
              <div className="text-sm text-gray-500 mb-4">{c.cond}</div>
              <div className="h3 mb-2">{c.issue}</div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5 flex-1">{c.detail}</p>
              <div className="border-t border-gray-200 pt-4">
                <div className="font-extrabold text-gray-900 mb-2">{c.output}</div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">{c.market}</span>
                  <TagPill tag={c.tag} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <SectionHead label={howItWorks.label} title={howItWorks.title} />

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {howItWorks.steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.06} className="border border-gray-100 rounded-2xl p-5 flex flex-col">
              <div className="text-teal-600 font-extrabold text-sm mb-2">{s.num}</div>
              <div className="font-bold text-gray-900 mb-2">{s.title}</div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">{s.text}</p>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{s.status}</div>
            </Reveal>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mb-20">
          {howItWorks.modes.map(m => (
            <div key={m.name} className="text-sm border border-teal-100 bg-teal-50 text-teal-800 rounded-lg px-4 py-2">
              <span className="font-bold">{m.name}:</span> {m.path}
            </div>
          ))}
        </div>

        <Reveal className="grid md:grid-cols-2 gap-8 items-center">
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={howItWorks.water.image} alt="Water treatment cartridges and UV unit" loading="lazy"
              className="rounded-2xl w-full h-auto border border-gray-100" width={1000} height={775} />
            <figcaption className="text-xs text-gray-400 mt-2">{howItWorks.water.caption}</figcaption>
          </figure>
          <div>
            <div className="section-label">Water quality</div>
            <h3 className="text-2xl font-bold text-gray-950 mb-4">{howItWorks.water.title}</h3>
            <p className="text-gray-600 leading-relaxed">{howItWorks.water.text}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
