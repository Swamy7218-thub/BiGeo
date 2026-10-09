import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Problem from '@/components/Problem'
import Technology from '@/components/Technology'
import Product from '@/components/Product'
import Customers from '@/components/Customers'
import Progress from '@/components/Progress'
import Team from '@/components/Team'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Problem />
      <Technology />
      <Product />
      <Customers />
      <Progress />
      <Team />
      <Contact />
      <Footer />
    </main>
  )
}
