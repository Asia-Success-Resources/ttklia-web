<script setup lang="ts">
// Centred card over a 50% black backdrop with Cancel and Confirm (doc 09, "Modals").
const props = withDefaults(defineProps<{ title: string; confirmLabel?: string; danger?: boolean }>(), {
    confirmLabel: 'Confirm',
    danger: false,
})
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ confirm: [] }>()

function confirm() {
    emit('confirm')
    open.value = false
}
</script>

<template>
    <UModal v-model:open="open" :title="props.title" :ui="{ overlay: 'bg-black/50' }">
        <template #body>
            <slot />
        </template>
        <template #footer>
            <div class="flex w-full justify-end gap-2">
                <UButton label="Cancel" color="neutral" variant="outline" @click="open = false" />
                <UButton :label="props.confirmLabel" :color="props.danger ? 'error' : 'primary'" @click="confirm" />
            </div>
        </template>
    </UModal>
</template>
