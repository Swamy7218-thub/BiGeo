export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white py-12 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M12 2C8 8 5 12 5 16a7 7 0 0014 0c0-4-3-8-7-14z"/></svg>
              </div>
              <span className="font-extrabold text-white">AcquaHT Labs</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Water from Air. Powered by Sun. Driven by Data.
            </p>
            <p className="text-gray-600 text-xs mt-3">CIN: U36000TS2023PTC179371</p>
          </div>

          <div>
            <div className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-4">Navigation</div>
            <div className="flex flex-col gap-2">
              {['Problem', 'Solution', 'Products', 'Traction', 'Team', 'Contact'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-gray-500 hover:text-teal-400 transition-colors">{l}</a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-4">Contact</div>
            <div className="flex flex-col gap-2 text-sm text-gray-500">
              <a href="mailto:admin@acquahtlabs.in" className="hover:text-teal-400 transition-colors">admin@acquahtlabs.in</a>
              <span>Hyderabad, Telangana, India</span>
              <span>Incorporated Nov 24, 2023</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>© {new Date().getFullYear()} AcquaHT Labs Private Limited. All rights reserved.</span>
          <span>Atmospheric water replenishes in 5–7 days. Groundwater takes 75,000 years.</span>
        </div>
      </div>
    </footer>
  )
}
