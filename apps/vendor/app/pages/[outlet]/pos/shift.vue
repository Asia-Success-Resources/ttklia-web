<script setup lang="ts">
// Till: shift (POS 2, screens 1 and 7; doc 32). Open with the float counted by note, cash in and out, no-sale drawer
// opens with a reason, close with the count, expected against counted, card and QR totals, and the Z report.
// A variance over RM 5 needs a manager PIN and a reason. Permission: vendor.pos.sell (drawer: vendor.pos.drawer).
// API: POST …/cash-sessions, POST …/cash-sessions/{id}/movements, POST …/cash-sessions/{id}/close (doc 32).
// The drawer opens through the counter agent: POST /drawer/open (doc 08). TODO(api): generated client.
definePageMeta({ layout: 'counter' })

const state = reactive<Record<string, string>>({
  opening_float_sen: '',
  counted_sen: '',
  reason: '',
})
const saving = ref(false)

async function save() {
  // TODO(api): open or close the cash session.
}
</script>

<template>
  <OpsFormPage title="Shift" :saving="saving" @submit="save">
    <UFormField label="Opening float (sen)" name="opening_float_sen">
      <UInput v-model="state.opening_float_sen" class="w-full" />
    </UFormField>
    <UFormField label="Counted at close (sen)" name="counted_sen">
      <UInput v-model="state.counted_sen" class="w-full" />
    </UFormField>
    <UFormField label="Reason (variance over RM 5, or no-sale drawer open)" name="reason">
      <UInput v-model="state.reason" class="w-full" />
    </UFormField>
  </OpsFormPage>
</template>
