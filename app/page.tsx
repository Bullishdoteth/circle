import Header from "@/components/shared/landingPage/header";
import Footer from "@/components/shared/landingPage/footer";
import Hero from "@/components/shared/landingPage/hero";
import FAQs from "@/components/shared/landingPage/faq";
import HowItWorks from "@/components/shared/landingPage/howItWorks"
import Features from "@/components/shared/landingPage/features";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <HowItWorks />
      <Features />
      <FAQs />
      <Footer />
    </>
  )
}