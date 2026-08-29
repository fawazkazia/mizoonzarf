/** Slim continuously-scrolling marquee strip. Purely CSS-driven (no JS
 * state needed), so it stays a server component. The message list is
 * rendered twice back to back and animated by exactly -50% so the loop
 * seams invisibly. */
export function RunningBanner({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  const loop = [...messages, ...messages];

  return (
    <section className="overflow-hidden bg-ink py-2.5">
      <div className="flex w-max animate-marquee items-center gap-12 motion-reduce:animate-none">
        {loop.map((message, i) => (
          <span key={i} className="flex shrink-0 items-center gap-12 whitespace-nowrap text-xs uppercase tracking-[0.2em] text-paper/80">
            {message}
            <span className="text-gold-soft" aria-hidden="true">
              ✦
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
