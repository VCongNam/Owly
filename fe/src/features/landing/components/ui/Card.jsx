export default function Card({
  as: Tag = "div",
  accentTop = false,
  elevated = false,
  featured = false,
  hoverEffect = false,
  className = "",
  ...props
}) {
  const surface = featured
    ? "border-accent/30 bg-accent-muted shadow-md"
    : elevated
      ? "border-border bg-card shadow-md"
      : "border-border bg-card shadow-sm";

  const classes = [
    "rounded-lg border p-8",
    surface,
    accentTop && "border-t-2 border-t-accent",
    hoverEffect &&
      "transition-all duration-200 ease-out hover:border-border-hover hover:bg-muted/30 hover:shadow-md",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Tag className={classes} {...props} />;
}
