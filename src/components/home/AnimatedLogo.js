// The big logo in the final call-to-action. It stays exactly where it is; the life comes from effects:
// sonar rings spreading out from the icon, a light sweep across the tile, a glowing "b",
// a wave of light running through the letters, and a blinking full stop. Pure CSS, no JavaScript.
// The keyframes live in globals.css and switch off for visitors who prefer reduced motion.
const LETTERS = 'buncho'.split('');

export default function AnimatedLogo() {
  return (
    <span className="inline-flex items-center gap-5" aria-label="buncho.">
      <span aria-hidden="true" className="relative grid h-24 w-24 shrink-0 place-items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="logo-ring absolute inset-0 rounded-[1.7rem] border-2 border-[#04140a]/45"
            style={{ animationDelay: `${i * 1}s` }}
          />
        ))}
        <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-[1.7rem] bg-[#04140a] text-[4.25rem] font-extrabold leading-none text-[#34d67b] shadow-[0_20px_32px_rgba(4,20,10,0.25)]">
          <span className="logo-b -translate-y-1">b</span>
          <span className="logo-sweep absolute inset-y-0 -left-1/3 w-1/3 bg-[#34d67b]/25" />
        </span>
      </span>

      <span aria-hidden="true" className="text-[4.25rem] font-extrabold leading-none tracking-tight text-[#04140a]">
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