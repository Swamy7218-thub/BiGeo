'use client'
import { useState } from 'react'
import { contact } from '@/content/site'
import { Reveal } from './ui'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 transition-colors'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', org: '', topic: 'Hotel or resort', message: '', website: '' })
  const [status, setStatus] = useState<Status>('idle')

  // contact.php runs on Hostinger and emails the message to the team.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(form).toString(),
      })
      const data = await res.json().catch(() => ({ ok: false }))
      setStatus(res.ok && data.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(`${form.topic} enquiry from ${form.name || 'website'}`)}&body=${encodeURIComponent(form.message)}`

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <Reveal>
            <div className="section-label">Contact</div>
            <h2 className="h2 mb-4">Clean water shouldn’t depend on your pin code.</h2>
            <p className="body mb-8">
              Hotel or resort owner, food-processing plant, partner or investor: tell us what you need and we’ll reply.
            </p>
            <dl className="space-y-4 text-sm">
              {[
                { label: 'Email', val: contact.email, href: `mailto:${contact.email}` },
                { label: 'Founder', val: contact.founderEmail, href: `mailto:${contact.founderEmail}` },
                { label: 'Location', val: contact.location },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-4">
                  <dt className="text-xs font-bold text-gray-400 w-16">{c.label}</dt>
                  <dd>{c.href ? <a href={c.href} className="text-gray-800 font-medium hover:text-teal-600">{c.val}</a> : <span className="text-gray-800 font-medium">{c.val}</span>}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.1}>
            {status === 'sent' ? (
              <div className="border border-gray-100 rounded-2xl bg-white p-10 text-center shadow-sm">
                <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600 text-xl">✓</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message sent.</h3>
                <p className="text-gray-500 text-sm">Thank you. We’ll reply to {form.email} soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="border border-gray-100 rounded-2xl bg-white p-8 shadow-sm flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Your name</span>
                    <input type="text" required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Organisation</span>
                    <input type="text" maxLength={150} value={form.org} onChange={e => setForm({ ...form, org: e.target.value })} placeholder="Optional" className={input} />
                  </label>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Email</span>
                    <input type="email" required maxLength={150} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={input} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-500 mb-1.5 block">I am a</span>
                    <select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className={input}>
                      {['Hotel or resort', 'Food or industrial plant', 'Investor', 'Partner', 'Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                </div>
                {/* Hidden from people; bots fill it in, and contact.php drops those messages. */}
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website}
                  onChange={e => setForm({ ...form, website: e.target.value })} className="hidden" aria-hidden="true" />
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500 mb-1.5 block">Message</span>
                  <textarea required rows={4} maxLength={5000} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={`${input} resize-none`} />
                </label>
                <button type="submit" disabled={status === 'sending'} className="btn-primary justify-center py-3 disabled:opacity-60">
                  {status === 'sending' ? 'Sending…' : 'Send message →'}
                </button>
                {status === 'error' && (
                  <p className="text-sm text-red-600">
                    Sorry, the message didn’t go through. Please <a href={mailto} className="underline font-semibold">email us directly</a>.
                  </p>
                )}
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
