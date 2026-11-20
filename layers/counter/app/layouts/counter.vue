<script setup lang="ts">
// Counter screen: full screen, keyboard first, no sidebar (doc 09, "Counter screens").
const { slug } = useWorkspace()
const { me } = useMe()
</script>

<template>
    <UApp :toaster="{ position: 'top-right' }">
        <div class="flex min-h-screen flex-col bg-(--app-body)">
            <header class="flex h-14 items-center gap-3 border-b border-(--app-border) bg-(--app-surface) px-4">
                <UIcon name="i-bx-store" class="size-6 text-primary" />
                <span class="font-semibold">Counter</span>
                <UBadge v-if="slug" :label="slug" variant="soft" />
                <div class="flex-1" />
                <span class="text-sm text-gray-500">{{ me?.name }}</span>
                <ThemeToggle />
            </header>
            <main class="flex-1 p-4">
                <slot />
            </main>
        </div>
    </UApp>
</template>
