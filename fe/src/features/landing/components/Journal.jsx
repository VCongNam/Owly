import Card from "./ui/Card.jsx";
import Reveal from "./ui/Reveal.jsx";
import SectionLabel from "./ui/SectionLabel.jsx";
import { journal } from "../content.js";

export default function Journal() {
  return (
    <section
      id="journal"
      aria-labelledby="journal-title"
      className="border-t border-border py-28 md:py-36"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionLabel>{journal.label}</SectionLabel>

        <Reveal>
          <div className="mx-auto mb-16 max-w-2xl text-center md:mb-20">
            <h2
              id="journal-title"
              className="font-serif text-4xl leading-[1.2] tracking-[-0.01em] text-foreground md:text-[2.5rem]"
            >
              {journal.heading}
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">{journal.sub}</p>
          </div>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-3">
          {journal.posts.map((post, i) => (
            <Reveal key={post.title} delay={i * 120} className="h-full">
              <Card hoverEffect className="group flex h-full flex-col">
                <div className="flex items-center gap-3">
                  <span className="small-caps text-accent">{post.category}</span>
                  <span aria-hidden="true" className="h-px w-6 bg-border" />
                  <span className="small-caps text-muted-foreground">{post.date}</span>
                </div>
                <h3 className="mt-5 font-serif text-2xl leading-[1.3] text-foreground">
                  <a
                    href="#journal"
                    className="underline-offset-[6px] decoration-accent group-hover:underline"
                  >
                    {post.title}
                  </a>
                </h3>
                <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
                <a
                  href="#journal"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium tracking-[0.05em] text-foreground underline-offset-4 hover:underline hover:decoration-accent"
                >
                  Xem chi tiết <span aria-hidden="true" className="text-accent">→</span>
                </a>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
