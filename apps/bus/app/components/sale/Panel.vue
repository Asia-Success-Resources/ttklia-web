<script setup lang="ts">
// White card with a ruled heading ("Booking Details", "Summary"), as in today's sale forms.
const props = defineProps<{ title: string }>()
</script>

<template>
    <div class="rounded-xl border border-(--ops-border) bg-(--ops-card) p-6 shadow-sm">
        <h2 class="mb-4 border-b border-(--ops-border) pb-2 text-xl font-semibold text-gray-800 dark:text-white">{{ props.title }}</h2>
        <slot />
    </div>
</template>
