// One sponsor banner. Used on /problems, in the live preview on /advertise and in the admin review page.
// A plain <img> on purpose: advertisers' logos can live on any host, so next/image would need every domain listed.
export default function AdCard({ ad }) {
  const initial = ad.companyName?.trim().charAt(0).toUpperCase() || '•';

  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="group flex h-full min-w-0 flex-col justify-between rounded-2xl border border-line bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 sm:min-h-44 sm:p-5"
    >
      <div className="min-w-0">
        <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted sm:text-[0.65rem]">Sponsored</p>
        <div className="mt-2 flex items-center gap-2 sm:mt-3 sm:gap-3">
          {ad.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.logoUrl}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-8 w-8 shrink-0 rounded-lg border border-line bg-white object-contain p-1 sm:h-10 sm:w-10"
            />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-sm font-semibold text-accent sm:h-10 sm:w-10 sm:text-base">{initial}</span>
          )}
          <h3 className="min-w-0 truncate text-sm font-semibold sm:text-base">{ad.companyName}</h3>
        </div>
        <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug sm:mt-3 sm:text-sm">{ad.tagline}</p>
        {ad.description && <p className="mt-1 line-clamp-3 hidden text-xs text-muted sm:block">{ad.description}</p>}
      </div>

      <span className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-ink group-hover:opacity-90 sm:mt-4 sm:w-fit sm:px-3.5 sm:text-sm">
        {ad.ctaLabel} <span aria-hidden="true" className="ml-1">→</span>
      </span>
    </a>
  );
}