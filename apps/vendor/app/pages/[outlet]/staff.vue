<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Staff: cashiers, PINs, roles (table `vendor_staff`). Permission: vendor.staff.manage (doc 32).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
// TODO(api): doc 32 lists no staff endpoint yet.

interface Row extends Record<string, unknown> {
  uuid: string
  display_name: string
  status: string
  failed_pin_count: number
  locked_until: string | null
}

const columns: TableColumn<Row>[] = [
  { accessorKey: 'display_name', header: 'Display name' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'failed_pin_count', header: 'Failed pin count' },
  { accessorKey: 'locked_until', header: 'Locked until' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ path: null })
onMounted(() => list.load())
</script>

<template>
  <OpsListPage
    v-model:search="search"
    title="Staff"
    subject="staff"
    :rows="list.rows.value"
    :columns="columns"
    :loading="list.pending.value"
    :has-more="list.nextCursor.value !== null"
    @more="list.load(list.nextCursor.value ?? undefined)"
  />
</template>
