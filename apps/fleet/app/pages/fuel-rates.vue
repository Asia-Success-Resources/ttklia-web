<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Fuel rates: diesel price, litres per km (table `fuel_rates`). Permission: fleet.fuel_rates.read (doc 27).
// GET /api/v1/ops/w/{workspace}/fleet/fuel-rates (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Fuel rates' })

interface Row extends Record<string, unknown> {
    uuid: string
    valid_from: string
    diesel_sen_per_litre: number
    flat_litres_per_km: number
    uphill_litres_per_km: number
    downhill_litres_per_km: number
    hill_km: number
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'valid_from', header: 'Valid from' },
    { accessorKey: 'diesel_sen_per_litre', header: 'Diesel sen per litre' },
    { accessorKey: 'flat_litres_per_km', header: 'Flat litres per km' },
    { accessorKey: 'uphill_litres_per_km', header: 'Uphill litres per km' },
    { accessorKey: 'downhill_litres_per_km', header: 'Downhill litres per km' },
    { accessorKey: 'hill_km', header: 'Hill km' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/fleet/fuel-rates', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Fuel rates"
        subject="fuel rates"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
