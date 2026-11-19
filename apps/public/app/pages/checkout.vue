<script setup lang="ts">
// Checkout: travel protection pre-selected, voucher, pay (Sitemap 1, doc 29, doc 31).
// TODO(pending: L4) protection pre-selected by default needs written confirmation (doc 30).
// TODO(pending: P8) Allianz product details (doc 30).
// TODO(api): POST /orders then POST /orders/{uuid}/pay with an Idempotency-Key (doc 04).
const protection = ref(true)
const voucher = ref('')
</script>

<template>
  <PublicSection title="Checkout">
    <div class="flex flex-col gap-4 rounded-2xl border border-default p-6">
      <UCheckbox v-model="protection" label="Travel protection (Allianz)" />
      <UFormField label="Voucher code" name="voucher"><UInput v-model="voucher" /></UFormField>
      <UButton label="Pay" icon="i-bx-credit-card" disabled />
    </div>
  </PublicSection>
</template>
