


import { DIFFICULTY_LABEL } from './constants';
import { CATEGORIES, categoryOf, problemHref } from './categories';

/* ------------------------------------------------------------------ */
/* Site-wide SEO constants and helpers. Everything SEO related reads   */
/* from here so the domain, brand and X handle are set in one place.   */
/* ------------------------------------------------------------------ */

export const SITE_NAME = 'Buncho';
export const SITE_TAGLINE = 'AI, ML and GenAI interview practice with AI feedback';
export const SITE_DESCRIPTION =
  'Practice AI, ML and GenAI interview questions out loud or in writing. Get AI feedback, study reference solutions and track your progress. Free to start.';

function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  // Production fallback so canonicals and the sitemap can never point at localhost
  if (process.env.NODE_ENV === 'production') return 'https://buncho.live';
  return 'http://localhost:3000';
}

export const SITE_URL = resolveSiteUrl();

// X (Twitter) handle, with or without the leading @. Used for twitter:site and Organization.sameAs.
const rawHandle = (process.env.NEXT_PUBLIC_X_HANDLE || '').trim().replace(/^@/, '');
export const X_HANDLE = rawHandle ? `@${rawHandle}` : '';
export const X_URL = rawHandle ? `https://x.com/${rawHandle}` : '';

export const DEFAULT_OG_IMAGE = '/opengraph-image?v=2';

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;



/** Rough readable version of inline LaTeX: \sqrt{d_k} becomes sqrt(dk). Good enough for a snippet. */
function texToText(tex) {
  return tex
    .replace(/\\(?:text|mathrm|mathbf|operatorname)\{([^}]*)\}/g, '$1')
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/[{]/g, '(')
    .replace(/[}]/g, ')')
    .replace(/\s+/g, '')
    .trim();
}

/** Markdown to plain text, for meta descriptions and structured data. */
export function plainText(md = '') {
  return String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$([^$\n]+)\$/g, (_, tex) => ` ${texToText(tex)} `)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cuts at a word boundary and adds an ellipsis only when something was removed. */
export function truncate(text = '', max = 155) {
  const t = String(text).trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-]+$/, '')}\u2026`;
}

/** Keeps a title inside ~60 characters (the "| Buncho" template adds 8 more). */
export function fitTitle(main, suffix, max = 52) {
  if (!suffix) return main;
  const combined = `${main}: ${suffix}`;
  return combined.length <= max ? combined : main;
}

/* --------------------------- metadata builder ------------------------ */

/**
 * Builds a complete Next.js metadata object. Next replaces (not merges) openGraph and twitter when a page
 * defines them, so every page goes through this to keep canonical, Open Graph and X cards consistent.
 */
export function buildMetadata({
  title,
  absoluteTitle,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  type = 'website',
  noindex = false,
  nofollow = false,
  canonical = true,
}) {
  const fullTitle = absoluteTitle ?? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`);
  const images = [{ url: image, width: 1200, height: 630, alt: imageAlt || fullTitle }];

  const meta = {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: 'en_US',
      title: fullTitle,
      description,
      url: path,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: images.map((i) => i.url),
      ...(X_HANDLE && { site: X_HANDLE, creator: X_HANDLE }),
    },
  };

  if (canonical && path && !noindex) meta.alternates = { canonical: path };

  if (noindex) {
    meta.robots = {
      index: false,
      follow: !nofollow,
      googleBot: { index: false, follow: !nofollow },
    };
  }
  return meta;
}

/** True when a list page carries search or filter params, which should not be indexed. */
export const hasActiveFilters = (filters = {}, { ignoreTopic = false } = {}) =>
  Boolean(filters.q || filters.difficulty || filters.type || filters.access || filters.status || filters.sub || filters.company || (!ignoreTopic && filters.topic));

/* ----------------------- structured data builders -------------------- */

export const organizationJsonLd = () => ({
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  ...(X_URL && { sameAs: [X_URL] }),
});

export const websiteJsonLd = () => ({
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  inLanguage: 'en',
  publisher: { '@id': `${SITE_URL}/#organization` },
});

export const breadcrumbJsonLd = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const itemListJsonLd = (problems, startAt = 1) => ({
  '@type': 'ItemList',
  numberOfItems: problems.length,
  itemListElement: problems.map((p, i) => ({
    '@type': 'ListItem',
    position: startAt + i,
    url: absoluteUrl(problemHref(p.slug, p.topic?.slug)),
    name: p.title,
  })),
});

export const collectionPageJsonLd = ({ name, description, path, problems = [], startAt = 1 }) => ({
  '@type': 'CollectionPage',
  '@id': `${absoluteUrl(path)}#page`,
  url: absoluteUrl(path),
  name,
  description,
  inLanguage: 'en',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  ...(problems.length > 0 && { mainEntity: itemListJsonLd(problems, startAt) }),
});

const LEVEL = { EASY: 'Beginner', MEDIUM: 'Intermediate', HARD: 'Advanced' };

export const problemJsonLd = (problem) => ({
  '@type': 'LearningResource',
  '@id': `${absoluteUrl(problemHref(problem.slug, problem.topic.slug))}#resource`,
  url: absoluteUrl(problemHref(problem.slug, problem.topic.slug)),
  name: problem.title,
  description: truncate(plainText(problem.description), 300),
  inLanguage: 'en',
  learningResourceType: problem.isChallenge ? 'Production incident exercise' : 'Interview practice question',
  educationalLevel: LEVEL[problem.difficulty] ?? DIFFICULTY_LABEL[problem.difficulty],
  timeRequired: `PT${Math.max(1, problem.estimatedMinutes || 10)}M`,
  isAccessibleForFree: !problem.proOnly,
  about: problem.topic.name,
  teaches: problem.subcategory || problem.topic.name,
  ...(problem.roles?.length > 0 && { audience: { '@type': 'Audience', audienceType: problem.roles.join(', ') } }),
  datePublished: problem.createdAt.toISOString(),
  dateModified: problem.updatedAt.toISOString(),
  isPartOf: {
    '@type': 'CollectionPage',
    name: `${problem.topic.name} interview questions`,
    url: absoluteUrl(categoryOf(problem.topic.slug) !== 'ai' ? CATEGORIES[categoryOf(problem.topic.slug)].path : `/problems?topic=${problem.topic.slug}`),
  },
  publisher: { '@id': `${SITE_URL}/#organization` },
});

/** Wraps several schema.org nodes into one @graph document. */
export const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) });