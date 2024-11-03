/** @type {import("pliny/config").PlinyConfig } */

const siteMetadata = {
  title: "Hemant's Blog - Coding Tricks",
  author: 'Hemant Manwani',
  fullName: 'Hemant Manwani',
  headerTitle: "Hemant's Blog",
  description: 'My desire to practice my skills and share my acquired knowledge fuels my endeavors.',
  language: 'en-us',
  theme: 'system',
  siteUrl: 'https://coding-tricks.co.in',
  analyticsURL: '',
  siteRepo: '',
  siteLogo: '/static/images/avatar.jpg',
  image: '/static/images/avatar.jpg',
  socialBanner: '',
  email: 'hemant.manwani404@gmail.com',
  github: 'https://github.com/hemant404',
  facebook: 'https://www.facebook.com/hemant.manwani',
  linkedin: 'https://linkedin.com/in/hemant-manwani-1a035478',
  twitter: 'https://twitter.com/hemant404',
  youtube: 'https://youtube.com',
  locale: 'en-US',
  org: 'LoginRadius LLP',
  socialAccounts: {
    github: 'hemant404',
    linkedin: 'hemant-manwani-1a035478',
    facebook: 'hemant.manwani',
  },
  analytics: {
    umamiAnalytics: {
      umamiWebsiteId: process.env.UMAMI_WEBSITE_ID,
    },
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
      mapping: 'title',
      reactions: '1',
      metadata: '0',
      theme: 'light',
      darkTheme: 'transparent_dark',
      themeURL: '',
      lang: 'en',
      inputPosition: 'top',
    },
  },
  search: {
    provider: 'kbar',
    kbarConfig: {
      // path to load documents to search
      searchDocumentsPath: `${process.env.BASE_PATH || ''}/search.json`,
    },
  },
};

module.exports = siteMetadata;
