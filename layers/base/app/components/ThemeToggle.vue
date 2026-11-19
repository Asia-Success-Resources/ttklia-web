<script setup lang="ts">
// Light/dark switch, the same toggle as fleet-management (components/ThemeToggle.vue):
// a pill track with a sliding knob, sun in light mode, moon in dark mode.
// Driven by Nuxt's colour mode, so the choice is saved and the system preference is the default.
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (dark: boolean) => {
    colorMode.preference = dark ? 'dark' : 'light'
  },
})
</script>

<template>
  <ClientOnly>
    <label class="relative inline-block h-7 w-14 cursor-pointer rounded-full has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary">
      <!-- Checkbox bound to the colour mode; visually hidden but still reachable by keyboard -->
      <input v-model="isDark" type="checkbox" class="sr-only" aria-label="Toggle theme">

      <!-- Track -->
      <div
        class="absolute inset-0 flex items-center justify-center rounded-full bg-gray-200 shadow-inner transition-colors dark:bg-zinc-700"
        aria-hidden="true"
      />

      <!-- Knob -->
      <div
        class="absolute top-1/2 flex size-6 -translate-y-1/2 transform items-center justify-center rounded-full text-base shadow-md transition-all duration-500 ease-in-out"
        :class="isDark ? 'translate-x-7 bg-zinc-900 text-yellow-400' : 'translate-x-1 bg-white text-gray-800'"
        aria-hidden="true"
      >
        <UIcon :name="isDark ? 'i-bx-moon' : 'i-bx-sun'" class="size-[1.125rem]" />
      </div>
    </label>

    <!-- Same-size placeholder until the colour mode is known on the client -->
    <template #fallback>
      <div class="h-7 w-14 rounded-full bg-gray-200 shadow-inner dark:bg-zinc-700" />
    </template>
  </ClientOnly>
</template>
