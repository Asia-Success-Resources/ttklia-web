<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Staff: cashiers, PINs, roles (table `vendor_staff`). Permission: vendor.staff.manage (doc 32).
// GET /api/v1/vendor-portal/o/{outlet}/staff (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
// TODO(api): doc 32 lists no staff endpoint yet.
useHead({ title: 'Staff' })

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
const list = useApiList<Row>({ search, path: '/staff', outletScoped: true })
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
        :pagination="list.pagination.value"
        @page="list.load"
    />
</template>
