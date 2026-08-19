import { footer, site } from "../content.js";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <a href="#top" className="font-serif text-2xl tracking-tight text-foreground">
              {site.name}
              <span aria-hidden="true" className="text-accent">.</span>
            </a>
            <p className="mt-4 max-w-xs leading-relaxed text-muted-foreground">
              {footer.blurb}
            </p>
          </div>

          {footer.columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h3 className="small-caps text-foreground">{column.heading}</h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#top"
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-accent"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">{footer.copyright}</p>
          <p className="small-caps text-muted-foreground">{footer.colophon}</p>
        </div>
      </div>
    </footer>
  );
}
