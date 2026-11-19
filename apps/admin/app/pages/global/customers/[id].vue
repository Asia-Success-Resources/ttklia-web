<script setup lang="ts">
// Customers: orders, wallet, cards, workspaces used (table `users`). Permission: global.customers.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

const route = useRoute()
const id = computed(() => String(route.params.id ?? route.params.uuid ?? ''))

// Empty until the API answers; never fake values.
const fields: { label: string; value: string | null }[] = [
  { label: 'Uuid', value: null },
  { label: 'Name', value: null },
  { label: 'Email', value: null },
  { label: 'Phone e164', value: null },
  { label: 'Locale', value: null },
  { label: 'Status', value: null },
  { label: 'Phone verified at', value: null },
  { label: 'Email verified at', value: null },
  { label: 'Last login at', value: null },
  { label: 'Created at', value: null }
]
</script>

<template>
  <OpsDetailPage :title="`Customers ${id}`" :fields="fields">
    <template #actions>
      <UButton label="Edit" icon="i-bx-edit" color="success" variant="soft" disabled />
    </template>
  </OpsDetailPage>
</template>
