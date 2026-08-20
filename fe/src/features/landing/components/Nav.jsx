import { useState } from "react";
import Button from "./ui/Button.jsx";
import { nav, site } from "../content.js";
import { useAuth } from "../../auth";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const ctaLabel = user ? "Vào Dashboard" : nav.cta.label;
  const ctaHref = user ? "/dashboard" : nav.cta.href;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-sm">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:h-20"
      >
        <a
          href="#top"
          className="font-serif text-xl tracking-tight text-foreground md:text-2xl"
        >
          {site.name}
          <span aria-hidden="true" className="text-accent">.</span>
        </a>

        <ul className="hidden items-center gap-10 lg:flex">
          {nav.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium tracking-[0.05em] text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <Button href={ctaHref}>{ctaLabel}</Button>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-md text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true">
            {open ? (
              <path d="M1 1l20 12M21 1L1 13" stroke="currentColor" strokeWidth="1.5" />
            ) : (
              <path d="M0 1h22M0 7h22M0 13h22" stroke="currentColor" strokeWidth="1.5" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-border lg:hidden">
          <ul className="mx-auto max-w-6xl px-6 py-4">
            {nav.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-center text-base font-medium tracking-[0.05em] text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-3 border-t border-border pt-4">
              <Button href={ctaHref} className="w-full" onClick={() => setOpen(false)}>
                {ctaLabel}
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
