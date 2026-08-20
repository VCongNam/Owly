export default function SectionLabel({ children, align = "center", className = "" }) {
  const line = <span aria-hidden="true" className="h-px flex-1 bg-border" />;
  return (
    <div className={`mb-8 flex items-center gap-4 ${className}`}>
      {align !== "left" && line}
      <span className="small-caps shrink-0 text-accent">{children}</span>
      {line}
    </div>
  );
}
