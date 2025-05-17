<script setup lang="ts">
const colorMode = useColorMode()
if (colorMode.preference === 'system') {
  colorMode.preference = 'dark'
}
</script>

<template>
  <div class="absolute top-0 right-0 flex gap-2">
    <UButton
      icon="i-lucide-newspaper"
      variant="soft"
      to="https://github.com/Robotics-TH-Ohm/Isovist-Report/blob/main/main.pdf"
      target="_blank"
      size="sm"
    />
    <UButton
      icon="i-lucide-github"
      variant="soft"
      to="https://robotics-th-ohm.github.io/Isovist/"
      target="_blank"
      size="sm"
    />
    <UButton
      :icon="colorMode.preference === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
      variant="soft"
      square
      size="sm"
      @click="colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'"
    />
  </div>

  <h1 class="text-success font-bold text-xl mt-2 tracking-widest">
    Kidnapped Robot and Isovist
  </h1>
</template>
