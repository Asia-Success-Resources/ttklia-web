<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vehicle types: list (table `taxi_line_classes`). Permission: taxi.vehicle_types.read (doc 27).
// GET /api/v1/ops/w/{workspace}/taxi/line-classes (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Vehicle types' })

interface Row extends Record<string, unknown> {
    uuid: string
    vehicle_class: string
    capacity: number
    call_margin: number
    share_group: string | null
    group_preference: number | null
    preferred_while_entered_below: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'vehicle_class', header: 'Vehicle class' },
    { accessorKey: 'capacity', header: 'Capacity' },
    { accessorKey: 'call_margin', header: 'Call margin' },
    { accessorKey: 'share_group', header: 'Share group' },
    { accessorKey: 'group_preference', header: 'Group preference' },
    { accessorKey: 'preferred_while_entered_below', header: 'Preferred while entered below' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/taxi/line-classes', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Vehicle types"
        subject="vehicle types"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
    
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
