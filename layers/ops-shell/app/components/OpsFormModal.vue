<script setup lang="ts">
// The popup form, as in fleet-management (pages/[role]/vehicles/index.vue, "New vehicle form"): teleported over a
// dimmed page; header with the title and a close (×) button; a two-column grid of labelled fields (slot); a footer
// with Cancel and the submit button on the right, reading "Saving..." while it saves. Clicking outside or Esc closes
// it, except while saving. Field errors sit under each field (OpsFormField). Colours follow the ops theme.
const props = withDefaults(
    defineProps<{ title: string; saving?: boolean; submitLabel?: string; error?: string | null; wide?: boolean }>(),
    { saving: false, submitLabel: 'Save', error: null, wide: false },
)
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ submit: [] }>()

function close() {
    if (!props.saving) open.value = false
}
function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && open.value) close()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
    <Teleport to="body">
        <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" @mousedown.self="close">
            <form
                class="max-h-[90vh] w-full overflow-y-auto rounded-lg border border-(--ops-border) bg-(--ops-card) text-gray-700 shadow-2xl dark:text-gray-300"
                :class="props.wide ? 'max-w-4xl' : 'max-w-2xl'"
                @submit.prevent="emit('submit')"
            >
                <div class="flex items-center justify-between border-b border-(--ops-border) px-5 py-4">
                    <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ props.title }}</h2>
                    <button type="button" class="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white" aria-label="Close" @click="close">
                        <UIcon name="i-bx-x" class="size-5" />
                    </button>
                </div>

                <div class="grid grid-cols-1 gap-4 px-5 py-4 text-sm sm:grid-cols-2">
                    <slot />
                    <p v-if="props.error" class="text-sm text-error sm:col-span-2">{{ props.error }}</p>
                </div>

                <div class="flex justify-end gap-2 border-t border-(--ops-border) px-5 py-4">
                    <button type="button" class="h-9 rounded px-4 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-60 dark:text-gray-300 dark:hover:bg-white/5" :disabled="props.saving" @click="close">
                        Cancel
                    </button>
                    <button type="submit" class="h-9 rounded bg-primary px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60" :disabled="props.saving">
                        {{ props.saving ? 'Saving...' : props.submitLabel }}
                    </button>
                </div>
            </form>
        </div>
    </Teleport>
</template>
