export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`h-12 w-full rounded-md border border-border bg-transparent px-4 text-foreground transition-all duration-150 ease-out placeholder:text-muted-foreground/60 hover:border-border-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${className}`}
      {...props}
    />
  );
}
