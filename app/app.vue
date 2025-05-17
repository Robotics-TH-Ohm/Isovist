<script setup lang="ts">
const title = 'Kidnapped Robot Problem and Isovist'
const description = `Simulated robot localization based on isovist feature matching. Analyze visible space geometry to determine the robot's position on a grid map.`

useHead({
  title,
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: description },
  ],
  link: [
    { rel: 'icon', href: '/bot.svg' },
  ],
  htmlAttrs: {
    lang: 'en',
  },
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
