<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Devices: till PC, printer, terminal (table `devices`). Permission: vendor.staff.manage (doc 32).
// GET /api/v1/vendor-portal/o/{outlet}/devices (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
// The till is a device of type `pos` bound to this outlet (devices.vendor_outlet_id, doc 32). TODO(api): doc 32 lists no endpoint yet.
useHead({ title: 'Devices' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    type: string
    status: string
    software_version: string | null
    last_seen_at: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'software_version', header: 'Software version' },
    { accessorKey: 'last_seen_at', header: 'Last seen at' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ path: '/devices', outletScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Devices"
        subject="devices"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
