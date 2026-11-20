<script setup lang="ts">
// Settings: receipt header, opening hours (table `vendor_outlets`). Permission: vendor.staff.manage (doc 32).
// TODO(api): doc 32 lists no outlet settings endpoint yet.
useHead({ title: 'Settings' })

const state = reactive<Record<string, string>>({
    name: '',
    receipt_header: '',
    receipt_footer: '',
    opening_hours: ''
})
const saving = ref(false)

async function save() {
    // TODO(api): call the doc 04 endpoint above once the generated client exists.
}
</script>

<template>
    <OpsFormPage title="Settings" :saving="saving" @submit="save">
        <UFormField label="Name" name="name">
            <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Receipt header" name="receipt_header">
            <UInput v-model="state.receipt_header" class="w-full" />
        </UFormField>
        <UFormField label="Receipt footer" name="receipt_footer">
            <UInput v-model="state.receipt_footer" class="w-full" />
        </UFormField>
        <UFormField label="Opening hours" name="opening_hours">
            <UInput v-model="state.opening_hours" class="w-full" />
        </UFormField>
    </OpsFormPage>
</template>
