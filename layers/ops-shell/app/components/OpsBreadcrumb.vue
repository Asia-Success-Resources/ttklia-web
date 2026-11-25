<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

// Page title with breadcrumb (today's `page-breadcrumb`, doc 09). `parent` adds the list a detail page belongs to
// (v2's parentName / parentUrl, e.g. Home › Companies › 707INC).
const props = defineProps<{ title: string; parent?: { label: string; to: string } }>()
const { resolveTo } = useOpsShell()

const items = computed<BreadcrumbItem[]>(() => [
    { label: 'Home', icon: 'i-bx-home', to: resolveTo('/') },
    ...(props.parent ? [{ label: props.parent.label, to: props.parent.to }] : []),
    { label: props.title },
])
</script>

<template>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">{{ title }}</h2>
        <UBreadcrumb :items="items" />
    </div>
</template>
