<script setup lang="ts">
// A dashboard list card beside the chart cards (doc 09, "Dashboard").
const props = defineProps<{ title: string; items: { label: string; value: string }[] }>()
</script>

<template>
    <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5 sm:p-6">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ props.title }}</h3>
        <p v-if="props.items.length === 0" class="text-sm text-gray-500">No records yet</p>
        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <li v-for="item in props.items" :key="item.label" class="flex justify-between py-2 text-sm">
                <span>{{ item.label }}</span><span class="font-medium">{{ item.value }}</span>
            </li>
        </ul>
    </div>
</template>
