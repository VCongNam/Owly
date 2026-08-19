import Button from "./ui/Button.jsx";
import Reveal from "./ui/Reveal.jsx";
import { hero } from "../content.js";
import { useAuth } from "../../auth";

function Star({ className }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M50 0 L58 42 L100 50 L58 58 L50 100 L42 58 L0 50 L42 42 Z" />
    </svg>
  );
}

export default function Hero() {
  const { user } = useAuth();
  const primaryHref = user ? "/dashboard" : hero.primaryCta.href;
  const primaryLabel = user ? "Đi tới Dashboard" : hero.primaryCta.label;

  return (
    <section id="top" className="relative overflow-hidden">
      <Star className="absolute left-[6%] top-[30%] hidden h-10 w-10 text-accent/25 lg:block" />
      <Star className="absolute right-[16%] top-[20%] hidden h-4 w-4 text-accent/20 lg:block" />
      <Star className="absolute bottom-[28%] right-[8%] hidden h-6 w-6 text-accent/40 lg:block" />

      <div className="mx-auto max-w-5xl px-6 pb-24 pt-24 text-center md:pb-36 md:pt-40">
        <Reveal>
          <p className="small-caps text-accent">{hero.label}</p>
        </Reveal>

        <Reveal delay={120}>
          <h1 className="mt-8 font-serif text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-foreground md:text-7xl md:leading-[1.05]">
            {hero.titleTop}
            <br />
            <em className="text-accent">{hero.titleAccent}</em>
          </h1>
        </Reveal>

        <Reveal delay={240}>
          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {hero.sub}
          </p>
        </Reveal>

        <Reveal delay={360}>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href={primaryHref} size="lg" className="w-full sm:w-auto">
              {primaryLabel}
            </Button>
            <Button
              href={hero.secondaryCta.href}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              {hero.secondaryCta.label}
            </Button>
          </div>
        </Reveal>

        <Reveal delay={480}>
          <div className="mt-16 flex items-center justify-center gap-4">
            <span aria-hidden="true" className="h-px w-12 bg-border" />
            <p className="small-caps text-muted-foreground">{hero.note}</p>
            <span aria-hidden="true" className="h-px w-12 bg-border" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
