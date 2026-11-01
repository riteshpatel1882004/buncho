import Popup from '@/components/Popup';
import BadgeArt from '@/components/badges/BadgeArt';
import { sortEarned } from '@/lib/badges';

const PREVIEW = 6;

// Public profile: earned badges only (locked ones are never shown here, not even to the owner).
// The first few show on the card, the rest open in a popup.
export default function BadgeGrid({ badges }) {
  const earned = sortEarned(badges);
  if (!earned.length) return null;
  const shown = earned.slice(0, PREVIEW);

  return (
    <section aria-label="Badges" className="card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold tracking-tight">Badges</h2>
        <p className="text-sm text-muted">{earned.length} earned</p>
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-x-2 gap-y-4">
        {shown.map((b, i) => (
          <li key={b.id} title={`${b.name}: ${b.desc}`} className="flex flex-col items-center text-center">
            <span className="badge-pop block" style={{ '--d': `${200 + i * 120}ms` }}>
              <BadgeArt badge={b} size={64} animate delay={200 + i * 120} />
            </span>
            <span className="mt-2 text-[0.72rem] font-semibold leading-tight">{b.name}</span>
          </li>
        ))}
      </ul>

      {earned.length > PREVIEW && (
        <div className="mt-5">
          <Popup
            title="Badges"
            subtitle={`${earned.length} earned`}
            buttonLabel={`View all ${earned.length} badges`}
            buttonClassName="w-full rounded-xl border border-line bg-surface-2/60 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
          >
            <ul className="grid gap-3 sm:grid-cols-2">
              {earned.map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/60 p-3">
                  <span className="shrink-0">
                    <BadgeArt badge={b} size={56} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{b.name}</span>
                    <span className="block text-xs leading-snug text-muted">{b.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Popup>
        </div>
      )}
    </section>
  );
}