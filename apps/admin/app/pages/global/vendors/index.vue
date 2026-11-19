<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vendors: onboarding, agreement, documents (table `organisations`). Permission: vendors.manage (doc 32).
// API: GET/POST /admin/vendors (doc 04, doc 32). TODO(api): generated client.
// Vendors are organisations with type = vendor.

interface Row extends Record<string, unknown> {
  uuid: string
  name: string
  ssm_no: string | null
  sst_no: string | null
  status: string
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'ssm_no', header: 'Ssm no' },
  { accessorKey: 'sst_no', header: 'Sst no' },
  { accessorKey: 'status', header: 'Status' },
]

const search = ref('')
const list = useApiList<Row>({ path: null })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Vendors"
    subject="vendors"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
