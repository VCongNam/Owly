import { stats } from "../content.js";

export default function Stats() {
  return (
    <section aria-label="Owly in numbers" className="border-y border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-12 px-6 py-16 md:grid-cols-4 md:divide-x md:divide-border md:py-20">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center md:px-6 md:first:pl-0">
            <p className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
              {stat.value}
            </p>
            <p className="small-caps mt-3 text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
