<script setup lang="ts">
// The status switch from fleet-management (app/components/StatusToggle.vue): a pill in the primary colour when on,
// grey when off, with the white knob sliding across. `activeLabel` / `inactiveLabel` are shown beside it.
const model = defineModel<boolean>({ default: false })

interface Props {
    activeLabel?: string
    inactiveLabel?: string
    disabled?: boolean
}

const props = defineProps<Props>()
</script>

<template>
    <label class="group inline-flex items-center gap-3" :class="props.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'">
        <span class="relative inline-flex h-6 w-12 items-center">
            <input v-model="model" type="checkbox" class="hidden" :disabled="props.disabled" />
            <span
                class="flex h-full w-full items-center rounded-full px-1 transition-colors duration-300"
                :class="[model ? 'bg-primary' : 'bg-gray-300 dark:bg-zinc-600', props.disabled ? 'pointer-events-none' : '']"
            >
                <span
                    class="h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out will-change-transform"
                    :class="model ? 'translate-x-6' : 'translate-x-0'"
                />
            </span>
        </span>
        <span v-if="props.activeLabel || props.inactiveLabel" class="text-sm text-gray-700 dark:text-gray-300">
            {{ model ? props.activeLabel : props.inactiveLabel }}
        </span>
    </label>
</template>
