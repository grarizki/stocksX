// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  modules: [
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
  ],

  i18n: {
    locales: [
      { code: 'id', language: 'id-ID', file: 'id.json', name: 'Bahasa Indonesia' },
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
    ],
    defaultLocale: 'id',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  app: {
    head: {
      title: 'StoxLyz - Your Trusted Market',
      htmlAttrs: { lang: 'id' },
      meta: [
        { name: 'description', content: 'Indonesian stock market information for retail investors' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#09090b' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://stoxlyz.com' },
        { property: 'og:site_name', content: 'StoxLyz' },
        { property: 'og:title', content: 'StoxLyz - Your Trusted Market' },
        { property: 'og:description', content: 'Indonesian stock market information for retail investors' },
        { property: 'og:locale', content: 'id_ID' },
        { property: 'og:locale:alternate', content: 'en_US' },
        // Twitter / X Card
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'StoxLyz - Your Trusted Market' },
        { name: 'twitter:description', content: 'Indonesian stock market information for retail investors' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        // Non-blocking font load: preload as style, swap to stylesheet on load
        {
          rel: 'preload',
          as: 'style',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
          onload: "this.onload=null;this.rel='stylesheet'",
        },
      ],
      // <noscript> fallback for browsers with JS disabled
      noscript: [
        { innerHTML: '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">' },
      ],
    },
    pageTransition: false,
  },

  nitro: {
    compressPublicAssets: true,
    routeRules: {
      // Allow bfcache on all HTML pages — no no-store
      '/**': { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } },
      // Static assets can be cached long-term
      '/_nuxt/**': { headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    },
  },
})
