<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Refunds: requests and approvals (table `refunds`). Permission: vendor.refunds.request (doc 32).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
// API: POST …/refunds, POST …/refunds/{id}/approve (doc 32). Who approves is TODO(pending: M5) doc 30. TODO(api): list endpoint and columns.

interface Row extends Record<string, unknown> {
  uuid: string
  name: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ path: null })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Refunds"
    subject="refunds"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
