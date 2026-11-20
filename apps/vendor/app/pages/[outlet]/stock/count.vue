<script setup lang="ts">
// Stock take: count and correct stock (table `stock_movements`). Permission: vendor.stock.write (doc 32).
// API: POST /vendor-portal/o/{outlet}/stock-movements with reason `count` (doc 32).
useHead({ title: 'Stock take' })

const state = reactive<Record<string, string>>({
    delta: '',
    note: ''
})
const saving = ref(false)

async function save() {
    // TODO(api): call the doc 04 endpoint above once the generated client exists.
}
</script>

<template>
    <OpsFormPage title="Stock take" :saving="saving" @submit="save">
        <UFormField label="Delta" name="delta">
            <UInput v-model="state.delta" class="w-full" />
        </UFormField>
        <UFormField label="Note" name="note">
            <UInput v-model="state.note" class="w-full" />
        </UFormField>
    </OpsFormPage>
</template>
