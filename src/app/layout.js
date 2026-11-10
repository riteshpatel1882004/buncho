import { Suspense } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RouteProgress from '@/components/RouteProgress';
import { clerkAppearance } from '@/lib/clerk-appearance';
import { GoogleAnalytics } from '@next/third-parties/google'
import {
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  SITE_URL,
  X_HANDLE,
  DEFAULT_OG_IMAGE,
} from '@/lib/seo';

const display = Inter({
  subsets: ['latin'],
  variable: '--f-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--f-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--f-mono',
  display: 'swap',
});

const HOME_TITLE = `${SITE_NAME}: ${SITE_TAGLINE}`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'AI interview questions',
    'machine learning interview questions',
    'generative AI interview questions',
    'LLM interview questions',
    'RAG interview questions',
    'AI engineer interview preparation',
    'ML engineer interview practice',
    'mock interview practice',
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'education',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: HOME_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
    ...(X_HANDLE && {
      site: X_HANDLE,
      creator: X_HANDLE,
    }),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    }),
    ...(process.env.BING_SITE_VERIFICATION && {
      other: {
        'msvalidate.01': process.env.BING_SITE_VERIFICATION,
      },
    }),
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f0f0' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('buncho-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      afterSignOutUrl="/"
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={`${display.variable} ${body.variable} ${mono.variable}`}
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body className="flex min-h-dvh flex-col">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink"
          >
            Skip to content
          </a>

          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>

          <Navbar />

          <main id="main" className="flex-1">
            {children}
          </main>

          <Footer />

          {/* Vercel visitor analytics */}
          <Analytics />

          {/* Real-user performance monitoring */}
          <SpeedInsights />

          <GoogleAnalytics gaId="G-F8NQXVD35Z" />
        </body>
      </html>
    </ClerkProvider>
  );
}