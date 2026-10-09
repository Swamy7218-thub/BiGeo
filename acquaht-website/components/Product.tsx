import { product, performance } from '@/content/site'
import { Reveal, SectionHead, TagPill } from './ui'

export default function Product() {
  return (
    <section id="product" className="py-20 bg-gray-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHead label={product.label} title={product.title} />

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {product.photos.map((p, i) => (
            <Reveal key={p.src} delay={i * 0.08}>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.alt} loading="lazy" className="rounded-2xl w-full aspect-[4/5] object-cover border border-gray-200 bg-white" />
                <figcaption className="text-xs text-gray-500 mt-2">{p.caption}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-24">
          <Reveal className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="section-label">What’s inside the {product.name}</div>
            <ul className="space-y-4">
              {product.parts.map(p => (
                <li key={p.name}>
                  <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.detail}</div>
                </li>
              ))}
            </ul>
            <div className="section-label mt-6">Where it fits</div>
            <div className="flex flex-wrap gap-2">
              {product.fits.map(f => <span key={f} className="tag normal-case tracking-normal">{f}</span>)}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="section-label">Where it stands</div>
            <ul className="space-y-5">
              {product.status.map(s => (
                <li key={s.when} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <div className="font-bold text-gray-900">{s.when}</div>
                    <TagPill tag={s.tag} />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <SectionHead label={performance.label} title={performance.title} body={performance.body} />

        <Reveal className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 overflow-x-auto">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="text-sm font-semibold text-gray-700">Litres a day, {product.name}</div>
            <TagPill tag="Modeled" />
          </div>
          <table className="w-full text-sm border-collapse min-w-[520px]">
            <thead>
              <tr className="text-left text-xs font-bold tracking-wide text-gray-400 uppercase border-b border-gray-200">
                <th className="py-3 pr-4">Air</th>
                <th className="py-3 pr-4">Pilot build</th>
                <th className="py-3 pr-4">Today’s prototype</th>
                <th className="py-3">Energy (pilot)</th>
              </tr>
            </thead>
            <tbody>
              {performance.rows.map(r => (
                <tr key={r.cond} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pr-4"><div className="font-bold text-gray-900">{r.cond}</div><div className="text-xs text-gray-500">{r.name}</div></td>
                  <td className="py-3 pr-4 text-2xl font-extrabold text-teal-600">{r.pilot}</td>
                  <td className="py-3 pr-4 text-gray-700 font-semibold">{r.today}</td>
                  <td className="py-3 text-gray-700">{r.energy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">{performance.note}</p>
        </Reveal>

        <div className="grid lg:grid-cols-3 gap-4">
          <Reveal className="bg-teal-950 text-white rounded-2xl p-6">
            <div className="text-4xl font-extrabold text-teal-300 mb-2">{performance.highlight.num}</div>
            <p className="text-teal-100/80 text-sm leading-relaxed">{performance.highlight.text}</p>
          </Reveal>
          {performance.targets.map((t, i) => (
            <Reveal key={t.name} delay={0.08 * (i + 1)} className="bg-white border border-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="font-bold text-gray-900">{t.name}</div>
                <TagPill tag="Target" />
              </div>
              <p className="text-gray-700 font-semibold mb-1">{t.value}</p>
              <p className="text-xs text-gray-500">{t.when}</p>
            </Reveal>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-5">{performance.killRule}</p>
      </div>
    </section>
  )
}
