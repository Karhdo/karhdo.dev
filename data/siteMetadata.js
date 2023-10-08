// @ts-check
/** @type {import("pliny/config").PlinyConfig } */

const siteMetadata = {
  title: "Karhdo's Coding Adventure",
  author: 'Trong Khanh',
  fullName: 'Do Trong Khanh',
  headerTitle: "Karhdo's Blog",
  description: 'My desire to practice my skills and share my acquired knowledge fuels my endeavors.',
  language: 'en-us',
  theme: 'system',
  siteUrl: 'https://tailwind-nextjs-starter-blog.vercel.app',
  siteRepo: 'https://github.com/Karhdo/karhdo.dev',
  siteLogo: '/static/images/avatar.png',
  image: '/static/images/avatar.png',
  socialBanner: '/static/images/twitter-card.png',
  email: 'dotrongkhanh.dev@gmail.com',
  github: 'https://github.com/Karhdo',
  facebook: 'https://www.facebook.com/karhdo.dev/',
  linkedin: 'https://www.linkedin.com/in/karhdo/',
  twitter: 'https://twitter.com/karhdo',
  youtube: 'https://youtube.com',
  locale: 'en-US',
  socialAccounts: {
    github: 'Karhdo',
    linkedin: 'karhdo',
    facebook: 'karhdo.dev',
  },
  analytics: {
    plausibleDataDomain: '',
    simpleAnalytics: false,
    umamiWebsiteId: '',
    posthogProjectApiKey: '',
    googleAnalyticsId: '',
  },
  newsletter: {
    provider: 'buttondown',
  },
  comments: {
    provider: 'giscus',
    giscusConfig: {
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
      repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID,
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
      mapping: 'pathname',
      reactions: '1',
      metadata: '0',
      theme: 'light',
      darkTheme: 'transparent_dark',
      themeURL: '',
      lang: 'en',
      inputPosition: 'top',
    },
  },
};

module.exports = siteMetadata;
