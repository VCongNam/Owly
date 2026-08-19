import Card from "./ui/Card.jsx";
import Reveal from "./ui/Reveal.jsx";
import SectionLabel from "./ui/SectionLabel.jsx";
import { testimonials } from "../content.js";

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="border-t border-border py-28 md:py-36"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionLabel>{testimonials.label}</SectionLabel>

        <h2
          id="testimonials-title"
          className="mx-auto mb-16 max-w-2xl text-center font-serif text-4xl leading-[1.2] tracking-[-0.01em] text-foreground md:mb-20 md:text-[2.5rem]"
        >
          {testimonials.heading}
        </h2>

        <div className="grid gap-8 lg:grid-cols-3">
          {testimonials.items.map((item, i) => (
            <Reveal key={item.name} delay={i * 120} className="h-full">
              <Card hoverEffect className="flex h-full flex-col">
                <span
                  aria-hidden="true"
                  className="font-serif text-6xl leading-[0.5] text-accent"
                >
                  &ldquo;
                </span>
                <blockquote className="mt-6 flex-1 font-serif text-lg italic leading-relaxed text-foreground">
                  {item.quote}
                </blockquote>
                <footer className="mt-8 border-t border-border pt-5">
                  <p className="small-caps text-foreground">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.role}</p>
                </footer>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
