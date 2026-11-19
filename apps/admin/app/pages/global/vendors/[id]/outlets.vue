<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vendor outlets: unit, commission, collection mode, payout cycle (table `vendor_outlets`). Permission: vendors.manage (doc 32).
// API: GET/POST /admin/vendor-outlets (doc 04, doc 32). TODO(api): generated client.
// Commission and fees are TODO(pending: M1); payout cycle TODO(pending: M3) doc 30.

interface Row extends Record<string, unknown> {
  uuid: string
  code: string
  name: string
  unit_no: string | null
  commission_bp: number
  collection_mode: string
  payout_cycle: string
  status: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'unit_no', header: 'Unit no' },
  { accessorKey: 'commission_bp', header: 'Commission bp' },
  { accessorKey: 'collection_mode', header: 'Collection mode' },
  { accessorKey: 'payout_cycle', header: 'Payout cycle' },
  { accessorKey: 'status', header: 'Status' },
]

const search = ref('')
const list = useApiList<Row>({ path: null })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Vendor outlets"
    subject="vendor outlets"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
