<script setup lang="ts">
// One labelled field in OpsFormModal, as in fleet-management: the label (a red * when required), the input (slot),
// then the field's own error in red. `full` spans both columns; a `section` heading is OpsFormSection.
const props = withDefaults(defineProps<{ label: string; required?: boolean; error?: string | null; full?: boolean }>(), {
    required: false,
    error: null,
    full: false,
})
</script>

<template>
    <label class="flex flex-col gap-1" :class="props.full ? 'sm:col-span-2' : ''">
        <span class="text-gray-600 dark:text-gray-300">{{ props.label }}<span v-if="props.required" class="text-error"> *</span></span>
        <slot />
        <span v-if="props.error" class="text-xs text-error">{{ props.error }}</span>
    </label>
</template>
