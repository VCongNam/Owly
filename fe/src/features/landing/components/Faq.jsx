import { useState } from "react";
import Reveal from "./ui/Reveal.jsx";
import SectionLabel from "./ui/SectionLabel.jsx";
import { faq } from "../content.js";

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-border py-28 md:py-36">
      <div className="mx-auto max-w-3xl px-6">
        <SectionLabel>{faq.label}</SectionLabel>

        <h2
          id="faq-title"
          className="text-center font-serif text-4xl leading-[1.2] tracking-[-0.01em] text-foreground md:text-[2.5rem]"
        >
          {faq.heading}
        </h2>

        <div className="mt-16">
          {faq.items.map((item, i) => {
            const open = openIndex === i;
            return (
              <Reveal key={item.q} delay={i * 60}>
                <div className="border-b border-border">
                  <h3>
                    <button
                      type="button"
                      className="flex min-h-[44px] w-full touch-manipulation items-center justify-between gap-6 py-5 text-left transition-colors duration-200 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-expanded={open}
                      aria-controls={`faq-panel-${i}`}
                      id={`faq-button-${i}`}
                      onClick={() => setOpenIndex(open ? -1 : i)}
                    >
                      <span className="font-serif text-lg font-medium leading-[1.3] md:text-xl">
                        {item.q}
                      </span>
                      <svg
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                        className={`h-4 w-4 shrink-0 text-accent transition-transform duration-200 ease-out ${
                          open ? "rotate-180" : ""
                        }`}
                        fill="none"
                      >
                        <path d="M2 5l6 6 6-6" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-button-${i}`}
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-xl pb-6 leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-12 text-center">
          <a
            href={faq.contact.href}
            className="text-sm font-medium tracking-[0.05em] text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-foreground hover:underline hover:decoration-accent"
          >
            {faq.contact.text}
          </a>
        </p>
      </div>
    </section>
  );
}
