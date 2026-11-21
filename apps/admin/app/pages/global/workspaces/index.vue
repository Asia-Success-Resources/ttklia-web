<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Workspaces: KL2, LLP, TAXI, FLEET, RIDE (table `workspaces`). Permission: global.workspaces.read (doc 27).
// GET /api/admin/workspaces (ttklia-api WorkspaceController::index). `slug` is the row key; the table has no uuid.
useHead({ title: 'Workspaces' })

interface Row extends Record<string, unknown> {
    code: string
    slug: string
    name: string
    type: string
    timezone: string
    is_active: boolean
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'timezone', header: 'Timezone' },
    { accessorKey: 'is_active', header: 'Active' },
    { id: 'open', header: '', cell: ({ row }) => h(resolveComponent('UButton'), { label: 'Open', variant: 'link', size: 'sm', to: `/global/workspaces/${row.original.code}` }) },
]

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/workspaces', workspaceScoped: false })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Workspaces"
        subject="workspaces"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
