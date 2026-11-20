<script setup lang="ts">
// Counter: open or close cash session (table `cash_sessions`). Permission: taxi.counter.write (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
useHead({ title: 'Counter' })

definePageMeta({ layout: 'counter' })

const state = reactive<Record<string, string>>({
    opened_at: '',
    closed_at: '',
    opening_float_sen: '',
    expected_sen: '',
    counted_sen: '',
    variance_sen: '',
    approved_by: ''
})
const saving = ref(false)

async function save() {
    // TODO(api): no write endpoint for this form in doc 04 yet.
}
</script>

<template>
    <OpsFormPage title="Counter" :saving="saving" @submit="save">
            <UFormField label="Opened at" name="opened_at">
                <UInput v-model="state.opened_at" class="w-full" />
            </UFormField>
            <UFormField label="Closed at" name="closed_at">
                <UInput v-model="state.closed_at" class="w-full" />
            </UFormField>
            <UFormField label="Opening float sen" name="opening_float_sen">
                <UInput v-model="state.opening_float_sen" class="w-full" />
            </UFormField>
            <UFormField label="Expected sen" name="expected_sen">
                <UInput v-model="state.expected_sen" class="w-full" />
            </UFormField>
            <UFormField label="Counted sen" name="counted_sen">
                <UInput v-model="state.counted_sen" class="w-full" />
            </UFormField>
            <UFormField label="Variance sen" name="variance_sen">
                <UInput v-model="state.variance_sen" class="w-full" />
            </UFormField>
            <UFormField label="Approved by" name="approved_by">
                <UInput v-model="state.approved_by" class="w-full" />
            </UFormField>
    </OpsFormPage>
</template>
