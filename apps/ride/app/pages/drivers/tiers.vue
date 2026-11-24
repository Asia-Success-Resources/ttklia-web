<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { DriverRow } from '~/utils/rideDrivers'

// Tiers (table `drivers`, doc 07): which tier each approved driver is in. TTKLIA taxi drivers get e-hailing offers
// first, then fleet, partner and independent drivers. Move a driver with the tier picker.
// GET /ops/w/{workspace}/drivers?status=approved, PATCH …/drivers/{id}/tier. Permission: ride.drivers_tiers.read,
// ride.drivers.write to move (doc 27).
useHead({ title: 'Driver tiers' })

const api = useRideApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('ride.drivers.write'))

const search = ref('')
const tier = ref<string | undefined>(undefined)
const list = useApiList<DriverRow>({ search, path: '/drivers', workspaceScoped: true, query: () => ({ status: 'approved', tier: tier.value }) })
onMounted(() => list.load())
watch(tier, () => list.load())

async function move(row: DriverRow, next: string) {
    if (next === row.tier) return
    try {
        await api.patch(`/drivers/${row.id}/tier`, { tier: next })
        toast.add({ title: `${row.name ?? 'Driver'} moved to ${tierLabel(next)}`, color: 'success' })
    } catch (e) {
        toast.add({ title: rideError(e), color: 'error' })
    }
    await list.load(list.pagination.value?.current_page ?? 1)
}

const columns: TableColumn<DriverRow>[] = [
    { accessorKey: 'name', header: 'Driver', cell: ({ row }) => h('div', [h('div', { class: 'font-medium' }, row.original.name && row.original.name !== '-' ? row.original.name : '—'), h('div', { class: 'text-xs text-gray-500' }, row.original.driver_no ?? '')]) },
    { accessorKey: 'organisation_name', header: 'Company', cell: ({ row }) => row.original.organisation_name ?? '—' },
    { accessorKey: 'rating_avg', header: 'Rating', cell: ({ row }) => (row.original.rating_avg ? `${Number(row.original.rating_avg).toFixed(1)} ★` : '—') },
    {
        accessorKey: 'tier',
        header: 'Tier',
        cell: ({ row }) => canWrite.value
            ? h(resolveComponent('USelect'), { modelValue: row.original.tier, items: DRIVER_TIERS, class: 'w-40', size: 'sm', 'onUpdate:modelValue': (v: string) => move(row.original, v) })
            : tierLabel(row.original.tier),
    },
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Driver tiers"
        subject="approved drivers"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        note="TTKLIA taxi drivers get e-hailing offers first, then fleet, partner and independent drivers."
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="tier" :items="[{ label: 'All tiers', value: undefined }, ...DRIVER_TIERS]" class="w-36" />
        </template>
    </OpsListPage>
</template>
