<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Refunds: requests and approvals (table `refunds`). Permission: vendor.refunds.request (doc 32).
// GET /api/v1/vendor-portal/o/{outlet}/refunds (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
// API: POST …/refunds, POST …/refunds/{id}/approve (doc 32). Who approves is TODO(pending: M5) doc 30. TODO(api): list endpoint and columns.
useHead({ title: 'Refunds' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
]

const vendorPath = useVendorPath()
const search = ref('')
const list = useApiList<Row>({ search, path: '/refunds', outletScoped: true })
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
        :pagination="list.pagination.value"
        @page="list.load"
    />
</template>
