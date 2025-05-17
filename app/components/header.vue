<script setup lang="ts">
const colorMode = useColorMode()
if (colorMode.preference === 'system') {
  colorMode.preference = 'dark'
}
</script>

<template>
  <div class="absolute top-0 right-0 flex gap-2">
    <UTooltip text="Papier">
      <UButton
        icon="i-lucide-newspaper"
        variant="soft"
        to="https://github.com/Robotics-TH-Ohm/Isovist-Report/blob/main/main.pdf"
        target="_blank"
        size="sm"
      />
    </UTooltip>

    <UTooltip text="Github Repo">
      <UButton
        icon="i-lucide-github"
        variant="soft"
        to="https://robotics-th-ohm.github.io/Isovist/"
        target="_blank"
        size="sm"
      />
    </UTooltip>

    <UTooltip :text="colorMode.preference === 'dark' ? 'Dark Mode' : 'Light Mode'">
      <UButton
        :icon="colorMode.preference === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
        variant="soft"
        square
        size="sm"
        @click="colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'"
      />
    </UTooltip>
  </div>

  <h1 class="text-success text-xl font-semibold">
    Kidnapped Robot Problem & Isovisten
  </h1>
</template>
