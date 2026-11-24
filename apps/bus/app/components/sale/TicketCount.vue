<script setup lang="ts">
// One ticket type, laid out as in ttklia-v2's sale forms: the label, the count across the full
// width, then − and + side by side underneath. Several sit in one row (`flex gap-3`), each `flex-1`.
const props = defineProps<{ label: string }>()
const count = defineModel<number>({ default: 0 })

function set(value: unknown) {
    const n = Math.floor(Number(value))
    count.value = Number.isFinite(n) && n > 0 ? n : 0
}
</script>

<template>
    <UFormField :label="props.label" class="min-w-0 flex-1">
        <UInput :model-value="count" type="number" min="0" size="lg" class="w-full" :ui="{ base: 'text-center' }" @update:model-value="set" />
        <div class="mt-1.5 flex gap-1">
            <UButton icon="i-bx-minus" color="neutral" variant="outline" size="sm" block class="flex-1" :disabled="count <= 0" @click="count = Math.max(0, (count || 0) - 1)" />
            <UButton icon="i-bx-plus" color="neutral" variant="outline" size="sm" block class="flex-1" @click="count = (count || 0) + 1" />
        </div>
    </UFormField>
</template>
