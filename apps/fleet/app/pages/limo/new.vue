<script setup lang="ts">
// Limo new: key a booking (table `fleet_bookings`). Permission: fleet.limo_new.write (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

const state = reactive<Record<string, string>>({
  uuid: '',
  reference: '',
  service: '',
  source: '',
  client_reference: '',
  guest_name: '',
  guest_phone: '',
  pax_count: ''
})
const saving = ref(false)

async function save() {
  // TODO(api): no write endpoint for this form in doc 04 yet.
}
</script>

<template>
  <OpsFormPage title="Limo new" :saving="saving" @submit="save">
      <UFormField label="Uuid" name="uuid">
        <UInput v-model="state.uuid" class="w-full" />
      </UFormField>
      <UFormField label="Reference" name="reference">
        <UInput v-model="state.reference" class="w-full" />
      </UFormField>
      <UFormField label="Service" name="service">
        <UInput v-model="state.service" class="w-full" />
      </UFormField>
      <UFormField label="Source" name="source">
        <UInput v-model="state.source" class="w-full" />
      </UFormField>
      <UFormField label="Client reference" name="client_reference">
        <UInput v-model="state.client_reference" class="w-full" />
      </UFormField>
      <UFormField label="Guest name" name="guest_name">
        <UInput v-model="state.guest_name" class="w-full" />
      </UFormField>
      <UFormField label="Guest phone" name="guest_phone">
        <UInput v-model="state.guest_phone" class="w-full" />
      </UFormField>
      <UFormField label="Pax count" name="pax_count">
        <UInput v-model="state.pax_count" class="w-full" />
      </UFormField>
  </OpsFormPage>
</template>
