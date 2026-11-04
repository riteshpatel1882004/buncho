// The logo in the final call-to-action. It stays exactly where it is; the life comes from effects:
// a light sweep across the tile, a glowing "b", a wave of light running through the letters,
// and a blinking full stop. Pure CSS, no JavaScript. Smaller on phones, full size from the lg breakpoint.
// The keyframes live in globals.css and switch off for visitors who prefer reduced motion.
const LETTERS = 'buncho'.split('');

export default function AnimatedLogo() {
  return (
    <span className="inline-flex items-center gap-3 lg:gap-5" aria-label="buncho.">
      <span
        aria-hidden="true"
        className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#04140a] text-[2.5rem] font-extrabold leading-none text-[#34d67b] shadow-[0_12px_24px_rgba(4,20,10,0.25)] lg:h-24 lg:w-24 lg:rounded-[1.7rem] lg:text-[4.25rem] lg:shadow-[0_20px_32px_rgba(4,20,10,0.25)]"
      >
        <span className="logo-b -translate-y-0.5 lg:-translate-y-1">b</span>
        <span className="logo-sweep absolute inset-y-0 -left-1/3 w-1/3 bg-[#34d67b]/25" />
      </span>

      <span aria-hidden="true" className="text-[2.5rem] font-extrabold leading-none tracking-tight text-[#04140a] lg:text-[4.25rem]">
        {LETTERS.map((ch, i) => (
          <span key={i} className="logo-letter" style={{ animationDelay: `${i * 0.18}s` }}>
            {ch}
          </span>
        ))}
        <span className="logo-dot">.</span>
      </span>
    </span>
  );
}