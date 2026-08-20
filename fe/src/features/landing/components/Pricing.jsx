import Button from "./ui/Button.jsx";
import Card from "./ui/Card.jsx";
import Reveal from "./ui/Reveal.jsx";
import SectionLabel from "./ui/SectionLabel.jsx";
import { pricing } from "../content.js";
import { useAuth } from "../../auth";

export default function Pricing() {
  const { user } = useAuth();

  const tierCount = pricing.tiers.length;

  const gridClass =
    tierCount === 1
      ? "grid-cols-1 max-w-md mx-auto"
      : tierCount === 2
      ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
      : "grid-cols-1 md:grid-cols-3";

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="border-t border-border py-28 md:py-36"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionLabel>{pricing.label}</SectionLabel>

        <Reveal>
          <div className="mx-auto mb-16 max-w-2xl text-center md:mb-20">
            <h2
              id="pricing-title"
              className="font-serif text-4xl leading-[1.2] tracking-[-0.01em] text-foreground md:text-[2.5rem]"
            >
              {pricing.heading}
            </h2>

            <p className="mt-5 text-lg text-muted-foreground">
              {pricing.sub}
            </p>
          </div>
        </Reveal>

        <div className={`grid gap-8 lg:gap-10 ${gridClass}`}>
          {pricing.tiers.map((tier, i) => {
            const btnHref = user ? "/dashboard" : "/signup";

            return (
              <Reveal
                key={tier.name}
                delay={i * 120}
                className="h-full"
              >
                <Card
                  featured={tier.featured}
                  accentTop={tier.featured}
                  hoverEffect={!tier.featured}
                  className={`flex h-full flex-col ${
                    tier.featured && tierCount > 1
                      ? "md:-translate-y-4"
                      : ""
                  }`}
                >
                  {tier.featured && (
                    <p className="small-caps -mt-2 mb-3 text-accent">
                      Phổ biến nhất
                    </p>
                  )}

                  <h3 className="font-serif text-2xl leading-[1.3] text-foreground">
                    {tier.name}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {tier.blurb}
                  </p>

                  <p className="mt-6 flex items-baseline gap-2">
                    <span className="font-serif text-5xl tracking-tight text-foreground">
                      {tier.price}
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {tier.period}
                    </span>
                  </p>

                  <ul className="mt-8 flex-1 space-y-3 border-t border-border pt-8">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          className="shrink-0 text-accent"
                        >
                          —
                        </span>

                        <span className="text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    href={btnHref}
                    variant={tier.featured ? "primary" : "outline"}
                    className="mt-8 w-full"
                  >
                    {user ? "Vào ứng dụng" : tier.cta}
                  </Button>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <p className="small-caps mt-16 text-center text-muted-foreground">
          {pricing.note}
        </p>
      </div>
    </section>
  );
}