<script setup lang="ts">
// Products: CSV import (doc 32, "Products and stock"). One row per product: SKU, name, category, price, SST rate,
// barcode, stock. The whole file is checked first; nothing is written until it is all valid.
// API: POST /vendor-portal/o/{outlet}/products/import (doc 32). Permission: vendor.products.write.
// TODO(api): upload once the generated client exists.
const file = ref<File | null>(null)
const saving = ref(false)

async function save() {
  // TODO(api): POST the file, show the row errors from the check.
}
</script>

<template>
  <OpsFormPage title="Import products" :saving="saving" @submit="save">
    <UFormField label="CSV file" name="file" help="SKU, name, category, price, SST rate, barcode, stock">
      <UFileUpload v-model="file" accept=".csv,text/csv" class="w-full" />
    </UFormField>
  </OpsFormPage>
</template>
