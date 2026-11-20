<script setup lang="ts">
// One passenger type with − and + around the count (today's "Tickets" rows).
const props = defineProps<{ label: string }>()
const count = defineModel<number>({ default: 0 })
</script>

<template>
    <div class="flex items-center justify-between gap-3 rounded-lg border border-(--ops-border) p-3">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ props.label }}</span>
        <div class="flex items-center gap-2">
            <UButton icon="i-bx-minus" color="neutral" variant="outline" size="sm" :disabled="count <= 0" @click="count = Math.max(0, count - 1)" />
            <UInput v-model.number="count" type="number" min="0" size="sm" class="w-14" :ui="{ base: 'text-center' }" />
            <UButton icon="i-bx-plus" color="neutral" variant="outline" size="sm" @click="count++" />
        </div>
    </div>
</template>
