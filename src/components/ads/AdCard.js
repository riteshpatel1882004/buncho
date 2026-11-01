// One sponsor banner. Used on /problems, in the live preview on /advertise and in the admin review page.
// A plain <img> on purpose: advertisers' logos can live on any host, so next/image would need every domain listed.
export default function AdCard({ ad }) {
  const initial = ad.companyName?.trim().charAt(0).toUpperCase() || '•';

  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 sm:min-h-44 sm:p-5"
    >
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted">Sponsored</p>
        <div className="mt-2.5 flex items-center gap-3 sm:mt-3">
          {ad.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.logoUrl}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-10 w-10 shrink-0 rounded-lg border border-line bg-white object-contain p-1"
            />
          ) : (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-base font-semibold text-accent">{initial}</span>
          )}
          <h3 className="min-w-0 truncate text-base font-semibold">{ad.companyName}</h3>
        </div>
        <p className="mt-2.5 line-clamp-2 text-sm font-medium leading-snug sm:mt-3">{ad.tagline}</p>
        {ad.description && <p className="mt-1 line-clamp-2 text-xs text-muted sm:line-clamp-3">{ad.description}</p>}
      </div>

      <span className="mt-3 inline-flex w-fit items-center rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink group-hover:opacity-90 sm:mt-4">
        {ad.ctaLabel} <span aria-hidden="true" className="ml-1">→</span>
      </span>
    </a>
  );
}