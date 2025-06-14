// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@vueuse/nuxt', '@nuxt/fonts'],
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  ui: {
    theme: {
      colors: ['primary', 'success', 'info', 'error', 'warning'],
    },
  },
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',
  hooks: {
    'prerender:routes': function ({ routes }) {
      routes.clear()
    },
  },
  eslint: {
    config: {
      standalone: false,
      nuxt: {
        sortConfigKeys: true,
      },
    },
  },
})
