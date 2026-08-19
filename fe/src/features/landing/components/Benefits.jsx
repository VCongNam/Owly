import Reveal from "./ui/Reveal.jsx";
import SectionLabel from "./ui/SectionLabel.jsx";
import { benefits } from "../content.js";

function Check() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="mt-1.5 h-4 w-4 shrink-0 text-accent"
      fill="none"
    >
      <path d="M2 8.5l4 4L14 3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Layered abstract of a typeset page — gradient panel, offset sheet, floating card. */
function TypesetAbstract() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[4/5] w-full max-w-sm">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-accent/25" />
      <div className="absolute -bottom-6 -left-8 h-24 w-24 rounded-full bg-accent/10" />

      <div className="absolute inset-0 rounded-lg border border-border bg-gradient-to-br from-card via-muted to-accent-secondary/25 shadow-lg" />

      <div className="absolute inset-x-6 top-6 -bottom-2 rotate-[1.5deg] rounded-md border border-border bg-muted/70 shadow-sm" />

      <div className="absolute inset-x-4 bottom-4 top-10 rounded-md border border-border bg-card p-6 shadow-md transition-transform duration-200 ease-out hover:-translate-y-1">
        <p className="small-caps text-accent">Nền tảng Owly</p>
        <p className="mt-5 font-serif text-6xl leading-[0.8] text-foreground">O</p>
        <div className="mt-5 space-y-2.5">
          <span className="block h-px w-full bg-border" />
          <span className="block h-px w-11/12 bg-border" />
          <span className="block h-px w-full bg-border" />
          <span className="block h-px w-4/5 bg-border" />
          <span className="block h-px w-full bg-border" />
          <span className="block h-px w-2/3 bg-border" />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="h-1.5 w-1.5 rotate-45 bg-accent" />
          <span className="h-px flex-1 bg-border" />
        </div>
        <p className="mt-6 font-serif italic text-muted-foreground">
          &hellip;quản lý lớp học tinh tế & hiệu quả.
        </p>
      </div>
    </div>
  );
}

export default function Benefits() {
  return (
    <section
      id="benefits"
      aria-labelledby="benefits-title"
      className="border-t border-border py-28 md:py-36"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 md:grid-cols-[1.3fr_0.7fr] md:gap-12 lg:gap-20">
        <Reveal>
          <SectionLabel align="left" className="mb-6">
            {benefits.label}
          </SectionLabel>
          <h2
            id="benefits-title"
            className="font-serif text-4xl leading-[1.2] tracking-[-0.01em] text-foreground md:text-[2.5rem]"
          >
            {benefits.heading}
          </h2>
          {benefits.paragraphs.map((paragraph) => (
            <p
              key={paragraph.slice(0, 24)}
              className="mt-6 text-lg leading-relaxed text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
          <ul className="mt-8 space-y-4">
            {benefits.points.map((point) => (
              <li key={point} className="flex items-start gap-4">
                <Check />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150}>
          <TypesetAbstract />
        </Reveal>
      </div>
    </section>
  );
}
