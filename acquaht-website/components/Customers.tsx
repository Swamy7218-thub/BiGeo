import { customers, businessModel } from '@/content/site'
import { Reveal, SectionHead, TagPill } from './ui'

export default function Customers() {
  const max = Math.max(...customers.cities.map(c => c.lpd))
  return (
    <section id="customers" className="py-20 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHead label={customers.label} title={customers.title} />

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 mb-24">
          <div className="space-y-5">
            {customers.segments.map((s, i) => (
              <Reveal key={s.name} delay={i * 0.08} className="border border-gray-100 rounded-2xl p-6">
                <div className="h3 mb-2">{s.name}</div>
                <p className="text-sm text-gray-600 mb-4">{s.who}</p>
                <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1">Pays today</dt>
                    <dd className="text-gray-700">{s.paysToday}</dd>
                  </div>
                  <div className="bg-teal-50 rounded-xl p-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-teal-700 mb-1">Our offer</dt>
                    <dd className="text-gray-800">{s.offer}</dd>
                  </div>
                </dl>
              </Reveal>
            ))}
            <p className="text-sm text-gray-500">{customers.later}</p>
          </div>

          <Reveal delay={0.1} className="border border-gray-100 rounded-2xl p-6 bg-gray-50/60">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <div className="text-sm font-semibold text-gray-700">Litres a day by city, yearly average</div>
              <TagPill tag="Modeled" />
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-4 items-start">
              <div className="space-y-3">
                {customers.cities.map(c => (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{c.name}</span>
                      <span className="font-bold text-gray-900">≈{c.lpd}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(c.lpd / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/india-map.webp" alt="Map of India by driest-month humidity" loading="lazy" className="w-full h-auto" width={1000} height={891} />
            </div>
            <p className="text-xs text-gray-400 mt-5 leading-relaxed">{customers.citiesNote}</p>
          </Reveal>
        </div>

        <SectionHead label={businessModel.label} title={businessModel.title} />

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Reveal className="bg-teal-950 text-white rounded-2xl p-7">
            <div className="text-xs font-bold tracking-widest uppercase text-teal-300/70 mb-2">Water as a service · planned price</div>
            <div className="text-5xl font-extrabold text-teal-300 mb-2">{businessModel.headline}</div>
            <p className="text-teal-100/80 mb-6">{businessModel.headlineDetail}</p>
            <ul className="space-y-3">
              {businessModel.points.map(p => (
                <li key={p} className="flex gap-3 text-sm text-teal-50/90"><span className="text-teal-400">✓</span>{p}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="border border-gray-100 rounded-2xl p-7">
            <div className="section-label">One litre, three prices · ex-GST</div>
            <div className="space-y-4 mb-6">
              {businessModel.prices.map(p => (
                <div key={p.label} className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                  <div>
                    <div className="text-sm text-gray-700 mb-1">{p.label}</div>
                    <TagPill tag={p.tag} />
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 whitespace-nowrap">{p.value}</div>
                </div>
              ))}
            </div>
            <div className="section-label">Other ways we earn</div>
            <ul className="space-y-2">
              {businessModel.other.map(o => (
                <li key={o.who} className="text-sm"><span className="font-semibold text-gray-900">{o.who}:</span> <span className="text-gray-600">{o.what}</span></li>
              ))}
            </ul>
          </Reveal>
        </div>
        <p className="text-xs text-gray-400">{businessModel.note}</p>
      </div>
    </section>
  )
}
