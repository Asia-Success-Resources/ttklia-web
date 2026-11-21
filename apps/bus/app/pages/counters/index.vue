<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Counters: list (table `locations`, type counter). Permission: bus.counters.read (doc 27).
// GET /api/ops/w/{workspace}/locations?type=counter (ttklia-api).
// Staff pick one of these on Start Session before selling (doc 09, "Counter sessions").
useHead({ title: 'Counters' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    name: string
    counter_kind: 'booking' | 'product' | null
    is_active: boolean
    open_session: { user_name: string; opened_at: string } | null
}

const kindLabels = { booking: 'Booking', product: 'Product' } as const

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'counter_kind', header: 'Sells', cell: ({ row }) => (row.original.counter_kind ? kindLabels[row.original.counter_kind] : '—') },
    { accessorKey: 'is_active', header: 'Status', cell: ({ row }) => (row.original.is_active ? 'Active' : 'Disabled') },
    { accessorKey: 'open_session', header: 'In use by', cell: ({ row }) => row.original.open_session?.user_name ?? '—' },
]

const { resolveTo } = useOpsShell()
const { me, can } = useMe()
const preview = computed(() => !useRuntimeConfig().public.apiBase && !me.value)
const canCreate = computed(() => preview.value || can('bus.counters.write'))

const search = ref('')
const list = useApiList<Row>({ search, path: '/locations', workspaceScoped: true, query: { type: 'counter' } })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Counters"
        subject="counters"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :create-to="canCreate ? resolveTo('/counters/create') : undefined"
        @page="list.load"
    />
</template>
