import Link from 'next/link';
import DifficultyBadge from '@/components/DifficultyBadge';
import { InsightsInline } from '@/components/Insights';
import Popup from '@/components/Popup';
import { Empty } from './Section';

/** Small card with a button that opens every saved problem in a popup. */
export default function SavedCard({ items, pro }) {
  const count = items.length;

  return (
    <section id="saved" aria-labelledby="saved-h" className="card p-5 sm:p-6">
      <h2 id="saved-h" className="text-base font-semibold tracking-tight">Saved for later</h2>

      {count ? (
        <>
          <p className="mt-1 text-sm text-muted">{count} problem{count === 1 ? '' : 's'} saved</p>
          <div className="mt-5">
            <Popup
              title="Saved for later"
              subtitle={`${count} problem${count === 1 ? '' : 's'}`}
              buttonLabel="View all saved"
              buttonClassName="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
            >
              <ul className="-mx-2 space-y-1">
                {items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/problems/${item.slug}`}
                      className="flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-surface-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block break-words font-medium">{item.title}</span>
                        <InsightsInline pro={pro} problem={item} className="mt-0.5 flex-wrap break-words" />
                      </span>
                      <DifficultyBadge difficulty={item.difficulty} plain />
                    </Link>
                  </li>
                ))}
              </ul>
            </Popup>
          </div>
        </>
      ) : (
        <div className="mt-5">
          <Empty>Use Save for later on any problem to collect it here.</Empty>
        </div>
      )}
    </section>
  );
}