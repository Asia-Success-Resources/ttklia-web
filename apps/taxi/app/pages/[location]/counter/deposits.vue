<script setup lang="ts">
// Counter: deposits: driver deposit top-up (table `wallets`). Permission: taxi.counter_deposits.write (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

definePageMeta({ layout: 'counter' })

const state = reactive<Record<string, string>>({
  owner_type: '',
  balance_sen: '',
  min_balance_sen: '',
  status: '',
  version: ''
})
const saving = ref(false)

async function save() {
  // TODO(api): no write endpoint for this form in doc 04 yet.
}
</script>

<template>
  <OpsFormPage title="Counter: deposits" :saving="saving" @submit="save">
      <UFormField label="Owner type" name="owner_type">
        <UInput v-model="state.owner_type" class="w-full" />
      </UFormField>
      <UFormField label="Balance sen" name="balance_sen">
        <UInput v-model="state.balance_sen" class="w-full" />
      </UFormField>
      <UFormField label="Min balance sen" name="min_balance_sen">
        <UInput v-model="state.min_balance_sen" class="w-full" />
      </UFormField>
      <UFormField label="Status" name="status">
        <UInput v-model="state.status" class="w-full" />
      </UFormField>
      <UFormField label="Version" name="version">
        <UInput v-model="state.version" class="w-full" />
      </UFormField>
  </OpsFormPage>
</template>
