import { contact, nav } from '@/content/site'

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white py-12 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.webp" alt="AcquaHT Labs" className="h-10 w-auto mb-4" width={600} height={171} loading="lazy" />
            <p className="text-gray-400 text-sm leading-relaxed">Making water from air work where the air is dry.</p>
            <p className="text-gray-600 text-xs mt-3">CIN: {contact.cin}</p>
          </div>

          <div>
            <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-4">Pages</div>
            <div className="flex flex-col gap-2">
              {[...nav, { label: 'Contact', href: '#contact' }].map(l => (
                <a key={l.href} href={l.href} className="text-sm text-gray-400 hover:text-teal-400 transition-colors">{l.label}</a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-4">Contact</div>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <a href={`mailto:${contact.email}`} className="hover:text-teal-400 transition-colors">{contact.email}</a>
              <span>{contact.location}</span>
              <span>Founded {contact.founded}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 text-xs text-gray-600">
          © {new Date().getFullYear()} {contact.company}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
