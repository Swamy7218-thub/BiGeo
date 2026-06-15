import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Stats from '@/components/Stats'
import About from '@/components/About'
import Solutions from '@/components/Solutions'
import HowItWorks from '@/components/HowItWorks'
import WhoWeServe from '@/components/WhoWeServe'
import FAQ from '@/components/FAQ'
import ContactCTA from '@/components/ContactCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Stats />
      <About />
      <Solutions />
      <HowItWorks />
      <WhoWeServe />
      <FAQ />
      <ContactCTA />
      <Footer />
    </main>
  )
}
