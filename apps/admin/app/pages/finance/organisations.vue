<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Organisations: operators, companies, clients (table `organisations`). Permission: finance.organisations.read (doc 27).
// GET /api/v1/admin/finance/organisations (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Organisations' })

interface Row extends Record<string, unknown> {
    uuid: string
    type: string
    name: string
    ssm_no: string | null
    tin: string | null
    sst_no: string | null
    contact_email: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'ssm_no', header: 'Ssm no' },
    { accessorKey: 'tin', header: 'Tin' },
    { accessorKey: 'sst_no', header: 'Sst no' },
    { accessorKey: 'contact_email', header: 'Contact email' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/finance/organisations' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Organisations"
        subject="organisations"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
