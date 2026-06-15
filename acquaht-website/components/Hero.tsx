'use client'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-navy-900">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-3xl" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col lg:flex-row items-center gap-16">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex-1 text-center lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="section-tag mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Trusted by 16+ Global Accelerators
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6"
          >
            Your access to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              clean water
            </span>
            {' '}shouldn't depend on your pin code.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0"
          >
            AcquaHT Labs extracts clean, safe drinking water directly from the air using solar-powered technology.
            No pipelines. No groundwater. 100% sustainable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <a href="#contact" className="btn-primary text-base px-8 py-4">Get Clean Water Now</a>
            <a href="#how-it-works" className="btn-outline text-base px-8 py-4">How It Works</a>
          </motion.div>
        </motion.div>

        {/* Visual — AWG illustration */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex-1 flex justify-center"
        >
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute inset-4 rounded-full border border-cyan-400/10 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />

            {/* Center glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48 md:w-60 md:h-60">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-xl" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-navy-700 to-navy-800 border border-cyan-500/30 flex items-center justify-center shadow-2xl shadow-cyan-500/20 animate-float">
                  {/* Water drop SVG */}
                  <svg className="w-24 h-24 text-cyan-400" viewBox="0 0 100 100" fill="none">
                    <path d="M50 10 C50 10 20 45 20 62 C20 79.5 34 90 50 90 C66 90 80 79.5 80 62 C80 45 50 10 50 10Z"
                      fill="url(#dropGrad)" stroke="rgba(6,182,212,0.4)" strokeWidth="1"/>
                    <path d="M35 70 C35 70 30 62 35 55" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="dropGrad" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9"/>
                        <stop offset="100%" stopColor="#0891B2" stopOpacity="0.7"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Orbiting dots */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-cyan-400/60"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${deg}deg) translateY(-140px) translate(-50%, -50%)`,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80L60 69.3C120 58.7 240 37.3 360 32C480 26.7 600 37.3 720 42.7C840 48 960 48 1080 42.7C1200 37.3 1320 26.7 1380 21.3L1440 16V80H0Z"
            fill="#0A1628"/>
        </svg>
      </div>
    </section>
  )
}
