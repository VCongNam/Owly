import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Stats from "./components/Stats.jsx";
import Features from "./components/Features.jsx";
import Benefits from "./components/Benefits.jsx";
import Testimonials from "./components/Testimonials.jsx";
import Pricing from "./components/Pricing.jsx";
import Faq from "./components/Faq.jsx";
import Journal from "./components/Journal.jsx";
import CtaSection from "./components/CtaSection.jsx";
import Footer from "./components/Footer.jsx";

export function LandingPage() {
  return (
    <div className="landing-light-mode min-h-screen bg-background text-foreground font-sans antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
      >
        Bỏ qua đến nội dung chính
      </a>

      {/* Atmosphere: print grain and a warm ambient glow */}
      <div aria-hidden="true" className="paper-texture" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-40 -top-40 z-0 h-[42rem] w-[42rem] rounded-full bg-accent opacity-[0.02] blur-3xl"
      />

      <Nav />

      <main id="main" className="relative">
        <Hero />
        <Stats />
        <Features />
        <Benefits />
        <Testimonials />
        <Pricing />
        <Faq />
        <Journal />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;
