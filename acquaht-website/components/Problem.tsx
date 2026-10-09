import { problem, bottleneck } from '@/content/site'
import { Reveal, SectionHead, TagPill } from './ui'

export default function Problem() {
  return (
    <section id="problem" className="py-20 bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHead label={problem.label} title={problem.title} dark />

        <div className="grid md:grid-cols-3 gap-4 mb-20">
          {problem.stats.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.08} className="border border-white/10 rounded-2xl p-6 bg-white/5 flex flex-col">
              <div className="text-4xl md:text-5xl font-extrabold text-teal-400 mb-3 leading-none">{s.num}</div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4 flex-1">{s.label}</p>
              <div className="text-xs text-gray-500">{s.source}</div>
            </Reveal>
          ))}
        </div>

        <SectionHead label={bottleneck.label} title={bottleneck.title} body={bottleneck.body} dark />

        <Reveal className="border border-white/10 rounded-2xl p-6 md:p-8 bg-white/[0.03]">
          <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
            <div className="text-sm font-semibold text-gray-300">Share of the cooling that makes water</div>
            <TagPill tag="Modeled" />
          </div>
          <div className="space-y-5">
            {bottleneck.rows.map(r => (
              <div key={r.cond} className="grid grid-cols-[1fr] sm:grid-cols-[200px_1fr] gap-2 sm:gap-6 items-center">
                <div>
                  <div className="text-white font-bold text-sm">{r.cond}</div>
                  <div className="text-gray-500 text-xs">{r.name} · chill {r.chill} to the first drop</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-7 bg-white/5 rounded-md overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-md" style={{ width: `${r.share}%` }} />
                  </div>
                  <div className="w-12 text-right font-extrabold text-teal-300">{r.share}%</div>
                  <div className="hidden md:block w-24 text-right text-xs text-gray-500">{r.water} in air</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-6 leading-relaxed">{bottleneck.note}</p>
        </Reveal>
      </div>
    </section>
  )
}
