<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Customers: one record per person, all businesses (table `users`). Permission: global.customers.read (doc 27).
// GET /api/admin/customers (ttklia-api).
useHead({ title: 'Customers' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    email: string | null
    phone_e164: string | null
    locale: string
    status: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone_e164', header: 'Phone' },
    { accessorKey: 'locale', header: 'Locale' },
    { accessorKey: 'status', header: 'Status' },
    { id: 'open', header: '', cell: ({ row }) => h(resolveComponent('UButton'), { label: 'Open', variant: 'link', size: 'sm', to: `/global/customers/${row.original.uuid}` }) },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/customers' })
onMounted(() => list.load())

// Status picker (fleet-management style): active ↔ suspended (blocked), with the reason the API asks for.
const { can } = useMe()
const api = useApi()
const toast = useToast()
async function changeStatus(row: Row, status: string) {
    const reason = prompt(status === 'suspended' ? `Why block ${row.name}?` : `Why unblock ${row.name}?`)
    if (!reason) return
    const previous = row.status
    row.status = status
    try {
        await api.post(`/admin/customers/${row.uuid}/block`, { blocked: status === 'suspended', reason })
        toast.add({ title: `${row.name} ${status === 'suspended' ? 'blocked' : 'unblocked'}`, color: 'success' })
    } catch (e) {
        row.status = previous
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to update status', color: 'error' })
    }
}
</script>

<template>
    <OpsListPage
        :status-options="can('global.customers.write') ? ['active', 'suspended'] : []"
        @status="changeStatus"
        v-model:search="search"
        title="Customers"
        subject="customers"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
