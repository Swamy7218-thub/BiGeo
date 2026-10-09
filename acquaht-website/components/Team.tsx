import { team, investors } from '@/content/site'
import { Reveal, SectionHead } from './ui'

export default function Team() {
  return (
    <>
      <section id="team" className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead label={team.label} title={team.title} />

          <div className="grid sm:grid-cols-2 gap-5 mb-10">
            {team.people.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.06} className="border border-gray-100 rounded-2xl p-6 flex gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt={p.name} loading="lazy" className="w-20 h-20 rounded-full object-cover flex-shrink-0 bg-gray-100" width={80} height={80} />
                <div>
                  <div className="font-bold text-gray-900">{p.name}</div>
                  <div className="text-sm text-teal-700 font-medium mb-2">{p.role}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{p.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
            <div className="section-label">Hiring with this round</div>
            <div className="flex flex-wrap gap-2">
              {team.hiring.map(h => (
                <span key={h} className="text-sm font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-full">{h}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="investors" className="py-20 bg-teal-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <Reveal>
            <div className="section-label text-teal-300/70">{investors.label}</div>
            <h2 className="h2 text-white mb-4">{investors.title}</h2>
            <p className="text-teal-100/80 text-lg leading-relaxed mb-6">{investors.body}</p>
            <a href="#contact" className="btn-primary bg-teal-500 hover:bg-teal-400 text-teal-950">Request the deck →</a>
          </Reveal>
          <Reveal delay={0.1} className="border border-white/10 rounded-2xl p-7 bg-white/5">
            <p className="text-xl font-semibold leading-snug text-white">“{investors.vision}”</p>
            <p className="text-sm text-teal-300/70 mt-4">Swamynathan Jerra, Founder & CEO</p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
