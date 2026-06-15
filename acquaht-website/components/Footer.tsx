export default function Footer() {
  return (
    <footer className="bg-navy-900 border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-navy-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <span className="font-bold text-lg text-white">Acqua<span className="text-cyan-400">HT</span> Labs</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Making safe drinking water accessible, sustainable, and affordable through atmospheric water harvesting technology.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Company</div>
            <div className="flex flex-col gap-2">
              {['About', 'Solutions', 'How It Works', 'FAQ'].map((l) => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Contact</div>
            <div className="flex flex-col gap-2 text-sm text-slate-400">
              <span>jerraswamynathan@gmail.com</span>
              <span>Siddipet, Telangana</span>
              <span>India — 502102</span>
              <span className="text-xs mt-1 text-slate-500">CIN: U36000TS2023PTC179371</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} AcquaHT Labs Private Limited. All rights reserved.</span>
          <span>Incorporated Nov 24, 2023 · RoC-Hyderabad</span>
        </div>
      </div>
    </footer>
  )
}
