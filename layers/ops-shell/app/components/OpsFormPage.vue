<script setup lang="ts">
// The generic form card with an optional block below it (doc 09, "Form page"). Slots: default, #after.
const props = withDefaults(defineProps<{ title: string; saving?: boolean; backTo?: string }>(), {
    saving: false,
    backTo: undefined,
})
const emit = defineEmits<{ submit: [] }>()
</script>

<template>
    <div>
        <OpsBreadcrumb :title="props.title" />
        <form
            class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5"
            @submit.prevent="emit('submit')"
        >
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                <slot />
            </div>
            <div class="mt-6 flex justify-end gap-2">
                <UButton v-if="props.backTo" label="Cancel" color="neutral" variant="outline" :to="props.backTo" />
                <UButton type="submit" label="Save" :loading="props.saving" />
            </div>
        </form>
        <div class="mt-6">
            <slot name="after" />
        </div>
    </div>
</template>
