import Card from "./ui/Card.jsx";
import Reveal from "./ui/Reveal.jsx";
import SectionLabel from "./ui/SectionLabel.jsx";
import { features } from "../content.js";

export default function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionLabel>{features.label}</SectionLabel>

        <Reveal>
          <div className="mx-auto mb-16 max-w-2xl text-center md:mb-20">
            <h2
              id="features-title"
              className="font-serif text-4xl leading-[1.2] tracking-[-0.01em] text-foreground md:text-[2.5rem]"
            >
              {features.heading}
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">{features.sub}</p>
          </div>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.items.map((feature, i) => (
            <Reveal key={feature.index} delay={(i % 3) * 100} className="h-full">
              <Card hoverEffect className="h-full">
                <p className="small-caps text-accent">No. {feature.index}</p>
                <h3 className="mt-4 font-serif text-xl font-semibold leading-[1.3] text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{feature.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
