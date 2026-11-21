<script setup lang="ts">
// Passenger site: the theme only (brand colour and Outfit font), not the admin layout (doc 09).
// Two brands from one app: the menu, name, title suffix and colours follow useBrand() (doc 09, teeko.ai).
const { brand, isTeeko, name, nav, footer } = useBrand()

useHead({
    titleTemplate: (title?: string) => (title ? `${title} | ${name.value}` : name.value),
    htmlAttrs: { 'data-brand': brand },
})
</script>

<template>
    <div class="flex min-h-screen flex-col">
        <header class="border-b border-default">
            <div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
                <!-- The brand's logo (public/img): the ttklia.com wordmark, or Teeko's on teeko.ai. -->
                <NuxtLink to="/" class="flex items-center" :aria-label="name">
                    <img :src="isTeeko ? '/img/logo-teeko.png' : '/img/logo-full.png'" :alt="name" :class="isTeeko ? 'h-10 w-auto' : 'h-6 w-auto'" />
                </NuxtLink>
                <nav class="hidden gap-4 text-sm md:flex">
                    <NuxtLink v-for="link in nav" :key="link.to" :to="link.to" class="hover:text-primary">{{ link.label }}</NuxtLink>
                </nav>
                <div class="flex-1" />
                <!-- TODO(doc 09): EN, BM, 中文 switcher with /ms and /zh URLs and hreflang once i18n is added. -->
                <ThemeToggle />
                <UButton to="/account" icon="i-bx-user" label="Sign in" variant="ghost" color="neutral" />
                <UButton v-if="isTeeko" to="/#get-the-app" label="Get the app" class="hidden sm:inline-flex" />
            </div>
        </header>
        <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            <slot />
        </main>
        <footer class="border-t border-default py-6 text-sm text-muted">
            <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4">
                <span>{{ name }}</span>
                <NuxtLink v-for="link in footer" :key="link.to" :to="link.to" class="hover:text-primary">{{ link.label }}</NuxtLink>
                <!-- TODO(pending: W1) the company that runs Teeko, named in the footer. -->
            </div>
        </footer>
    </div>
</template>
