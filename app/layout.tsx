import 'css/tailwind.css';
import 'css/twemoji.css';
import 'pliny/search/algolia.css';
import 'react-medium-image-zoom/dist/styles.css';
import 'remark-github-blockquote-alert/alert.css';

import { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { SearchProvider, SearchConfig } from 'pliny/search';
// import { Analytics, AnalyticsConfig } from 'pliny/analytics';

import Header from '@/components/header';
import Footer from '@/components/footer';
import siteMetadata from '@/data/siteMetadata';
import { SectionContainer, TiltedGridBackground } from '@/components/ui';

import { ThemeProviders } from './theme-providers';
import { UmamiAnalytics } from '@/components/analytics/umami';

const FONT_OUTFIT = Outfit({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.title}`,
  },
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: './',
    siteName: siteMetadata.title,
    images: [siteMetadata.socialBanner],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': `${siteMetadata.siteUrl}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    title: siteMetadata.title,
    card: 'summary_large_image',
    images: [siteMetadata.socialBanner],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const basePath = process.env.BASE_PATH || '';

  return (
    <html lang={siteMetadata.language} className={`${FONT_OUTFIT.variable} scroll-smooth`} suppressHydrationWarning>
      <link rel="apple-touch-icon" sizes="76x76" href={`${basePath}/static/favicons/apple-touch-icon.png`} />
      <link rel="icon" type="image/png" sizes="32x32" href="/static/favicons/tennis-racquet.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/static/favicons/tennis-racquet.png" />
      <link rel="manifest" href={`${basePath}/static/favicons/site.webmanifest`} />
      <link rel="mask-icon" href={`${basePath}/static/favicons/safari-pinned-tab.svg`} color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fff" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000" />
      <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />
      <body className="bg-white pl-[calc(100vw-100%)] text-black antialiased dark:bg-dark dark:text-white">
        <TiltedGridBackground className="inset-x-0 top-0 z-[-1] h-[60vh]" />

        <ThemeProviders>
          {/* <Analytics analyticsConfig={siteMetadata.analytics as AnalyticsConfig} /> */}
          <UmamiAnalytics websiteId={siteMetadata.analytics?.umamiAnalytics?.umamiWebsiteId} />
          <SectionContainer>
            <SearchProvider searchConfig={siteMetadata.search as SearchConfig}>
              <Header />
              <main className="mb-auto mt-20">{children}</main>
              <Footer />
            </SearchProvider>
          </SectionContainer>
        </ThemeProviders>
      </body>
    </html>
  );
}
