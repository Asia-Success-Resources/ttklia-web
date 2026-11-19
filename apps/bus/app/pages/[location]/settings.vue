<script setup lang="ts">
// Settings: form (table `bus_terminal_settings`). Permission: bus.settings.write (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

const state = reactive<Record<string, string>>({
  valid_from: '',
  alighting_minutes: '',
  platform_hold_before_departure_minutes: '',
  final_call_minutes: '',
  departed_after_minutes: '',
  departure_match_before_hours: '',
  departure_match_after_hours: '',
  arrival_match_before_hours: ''
})
const saving = ref(false)

async function save() {
  // TODO(api): no write endpoint for this form in doc 04 yet.
}
</script>

<template>
  <OpsFormPage title="Settings" :saving="saving" @submit="save">
      <UFormField label="Valid from" name="valid_from">
        <UInput v-model="state.valid_from" class="w-full" />
      </UFormField>
      <UFormField label="Alighting minutes" name="alighting_minutes">
        <UInput v-model="state.alighting_minutes" class="w-full" />
      </UFormField>
      <UFormField label="Platform hold before departure minutes" name="platform_hold_before_departure_minutes">
        <UInput v-model="state.platform_hold_before_departure_minutes" class="w-full" />
      </UFormField>
      <UFormField label="Final call minutes" name="final_call_minutes">
        <UInput v-model="state.final_call_minutes" class="w-full" />
      </UFormField>
      <UFormField label="Departed after minutes" name="departed_after_minutes">
        <UInput v-model="state.departed_after_minutes" class="w-full" />
      </UFormField>
      <UFormField label="Departure match before hours" name="departure_match_before_hours">
        <UInput v-model="state.departure_match_before_hours" class="w-full" />
      </UFormField>
      <UFormField label="Departure match after hours" name="departure_match_after_hours">
        <UInput v-model="state.departure_match_after_hours" class="w-full" />
      </UFormField>
      <UFormField label="Arrival match before hours" name="arrival_match_before_hours">
        <UInput v-model="state.arrival_match_before_hours" class="w-full" />
      </UFormField>
  </OpsFormPage>
</template>
