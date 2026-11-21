<script setup lang="ts">
// Title, one-line description and the counter session buttons, as on today's Sale and
// Product Sale dashboards in ttklia-v2 (`admin/bus/bookings/dashboard`, `admin/bus/product-sales/dashboard`).
const props = defineProps<{ title: string; description: string }>()
const emit = defineEmits<{ info: []; end: [] }>()
</script>

<template>
    <div>
        <OpsBreadcrumb :title="props.title" />
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white">{{ props.title }}</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ props.description }}</p>
            </div>
            <div class="flex gap-3">
                <UButton label="Session Info" icon="i-bx-info-circle" color="neutral" variant="outline" size="lg" @click="emit('info')" />
                <UButton label="End Session" icon="i-bx-arrow-out-right-square-half" color="error" size="lg" @click="emit('end')" />
            </div>
        </div>
    </div>
</template>
