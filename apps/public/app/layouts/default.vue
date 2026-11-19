<script setup lang="ts">
// Passenger site: the theme only (brand colour and Outfit font), not the admin layout (doc 09).
const links = [
  { label: 'Bus', to: '/' },
  { label: 'Tours', to: '/tours' },
  { label: 'Rentals', to: '/rentals' },
  { label: 'Protection', to: '/protection' },
  { label: 'Help', to: '/help' },
]
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-default">
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <NuxtLink to="/" class="text-lg font-semibold text-primary">TTKLIA</NuxtLink>
        <nav class="hidden gap-4 text-sm md:flex">
          <NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="hover:text-primary">{{ link.label }}</NuxtLink>
        </nav>
        <div class="flex-1" />
        <ThemeToggle />
        <UButton to="/account" icon="i-bx-user" label="Account" variant="ghost" color="neutral" />
      </div>
    </header>
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <slot />
    </main>
    <footer class="border-t border-default py-6 text-center text-sm text-muted">TTKLIA</footer>
  </div>
</template>
