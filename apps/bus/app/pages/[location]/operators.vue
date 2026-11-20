<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Operators: companies (table `bus_companies`). Permission: bus.operators.read (doc 27).
// GET /api/v1/ops/w/{workspace}/bus/companies (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Operators' })

interface Row extends Record<string, unknown> {
    uuid: string
    operator_code: string
    trip_source: string
    seat_authority: string
    sell_online: boolean
    show_in_kiosk: boolean
    status: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'operator_code', header: 'Operator code' },
    { accessorKey: 'trip_source', header: 'Trip source' },
    { accessorKey: 'seat_authority', header: 'Seat authority' },
    { accessorKey: 'sell_online', header: 'Sell online' },
    { accessorKey: 'show_in_kiosk', header: 'Show in kiosk' },
    { accessorKey: 'status', header: 'Status' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/bus/companies', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Operators"
        subject="operators"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
