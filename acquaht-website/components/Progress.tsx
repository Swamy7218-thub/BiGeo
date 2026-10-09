import { progress } from '@/content/site'
import { Reveal, SectionHead } from './ui'

export default function Progress() {
  return (
    <section id="progress" className="py-20 bg-gray-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHead label={progress.label} title={progress.title} />

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Reveal className="bg-white border border-emerald-100 rounded-2xl p-6">
            <div className="text-xs font-bold tracking-widest uppercase text-emerald-700 mb-4">Done</div>
            <ul className="space-y-4">
              {progress.done.map(d => (
                <li key={d.title} className="flex gap-3">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <div><div className="font-bold text-gray-900 text-sm">{d.title}</div><div className="text-sm text-gray-600">{d.detail}</div></div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="bg-white border border-amber-100 rounded-2xl p-6">
            <div className="text-xs font-bold tracking-widest uppercase text-amber-700 mb-4">Not yet · funded and dated</div>
            <ul className="space-y-4">
              {progress.next.map(d => (
                <li key={d.title} className="flex gap-3">
                  <span className="text-amber-500 font-bold mt-0.5">○</span>
                  <div><div className="font-bold text-gray-900 text-sm">{d.title}</div><div className="text-sm text-gray-600">{d.detail}</div></div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal>
          <div className="section-label">Roadmap</div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {progress.roadmap.map((r, i) => (
              <li key={r.when} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="text-xs font-bold text-teal-700 mb-1">{String(i + 1).padStart(2, '0')} · {r.when}</div>
                <div className="text-sm text-gray-800">{r.what}</div>
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-400 mt-4">{progress.roadmapNote}</p>
        </Reveal>
      </div>
    </section>
  )
}
