<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Master codes: list (table `access_codes`). Permission: taxi.codes_master.read (doc 27).
// GET /api/ops/w/{workspace}/access-codes (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Master codes' })

interface Row extends Record<string, unknown> {
    uuid: string
    code: string
    type: string
    pax_count: number | null
    entered_pax: number
    exited_pax: number
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'pax_count', header: 'Pax count' },
    { accessorKey: 'entered_pax', header: 'Entered pax' },
    { accessorKey: 'exited_pax', header: 'Exited pax' },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/access-codes', workspaceScoped: true, query: { type: 'master' } })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Master codes"
        subject="master codes"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
