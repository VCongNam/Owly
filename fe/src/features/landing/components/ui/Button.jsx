const base =
  "inline-flex min-h-[44px] cursor-pointer select-none touch-manipulation items-center justify-center gap-2 rounded-md font-medium tracking-[0.05em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const variants = {
  primary:
    "bg-accent text-accent-foreground shadow-sm hover:-translate-y-0.5 hover:bg-accent-secondary hover:shadow-accent active:translate-y-0",
  outline:
    "border border-foreground bg-transparent text-foreground hover:border-accent hover:bg-muted hover:text-accent",
  ghost:
    "text-muted-foreground underline-offset-4 hover:text-foreground hover:underline hover:decoration-accent",
};

const sizes = {
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
  ...props
}) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
