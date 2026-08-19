import { useState } from "react";
import Button from "./ui/Button.jsx";
import Input from "./ui/Input.jsx";
import Reveal from "./ui/Reveal.jsx";
import SectionLabel from "./ui/SectionLabel.jsx";
import { cta } from "../content.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";

export default function CtaSection() {
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section
      aria-labelledby="cta-title"
      className="relative overflow-hidden border-t border-border py-28 md:py-40"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-[0.02] blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <SectionLabel>{cta.label}</SectionLabel>

        <Reveal>
          <h2
            id="cta-title"
            className="font-serif text-4xl leading-[1.15] tracking-[-0.01em] text-foreground md:text-5xl"
          >
            {cta.heading}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {cta.sub}
          </p>

          {submitted ? (
            <p className="mt-10 font-serif text-lg italic text-foreground">
              {cta.successMessage}
            </p>
          ) : (
            <form
              className="mx-auto mt-10 flex max-w-md flex-col gap-4 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
                if (user) {
                  setTimeout(() => navigate("/dashboard"), 1200);
                }
              }}
            >
              <label htmlFor="invitation-email" className="sr-only">
                Email address
              </label>
              <Input
                id="invitation-email"
                name="email"
                type="email"
                required
                placeholder={cta.emailPlaceholder}
                className="flex-1"
              />
              <Button type="submit" size="lg" className="shrink-0">
                {cta.buttonLabel}
              </Button>
            </form>
          )}

          <p className="small-caps mt-8 text-muted-foreground">{cta.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
