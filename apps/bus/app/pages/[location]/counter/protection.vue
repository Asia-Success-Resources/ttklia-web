<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Counter: protection: look up a cover for a claim (table `insurance_covers`). Permission: bus.counter_protection.read (doc 27).
// TODO(pending: P8) see doc 30.
// TODO(pending: L4) see doc 30.
// GET /api/v1/ops/w/{workspace}/insurance-covers (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Counter: protection' })

definePageMeta({ layout: 'counter' })

interface Row extends Record<string, unknown> {
    uuid: string
    passenger_name: string
    passenger_id_last4: string | null
    age_confirmed: boolean
    premium_sen: number
    selection: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'passenger_name', header: 'Passenger name' },
    { accessorKey: 'passenger_id_last4', header: 'Passenger id last4' },
    { accessorKey: 'age_confirmed', header: 'Age confirmed' },
    { accessorKey: 'premium_sen', header: 'Premium (RM)', cell: ({ row }) => formatSen(row.original.premium_sen as number | null) },
    { accessorKey: 'selection', header: 'Selection' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/insurance-covers', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Counter: protection"
        subject="counter: protection"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        note="Waiting on: P8, L4 (doc 30)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
