<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { DriverRow } from '~/utils/rideDrivers'

// Drivers (table `drivers`, doc 07): every driver Teeko can offer rides to, with code, phone, tier, languages, licence
// and PSV expiry, rating and status. Applications are approved or rejected (with a reason) here.
// Each driver has a driver source (doc 36): GM Driver, Public Driver or both; a GM Driver's accept beats a Public
// Driver's on the same booking.
// GET /ops/w/{workspace}/drivers, POST …/{id}/approve, …/{id}/reject, PATCH …/{id}/source. Permission: ride.drivers.read / write (doc 27).
useHead({ title: 'Drivers' })

const api = useRideApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('ride.drivers.write'))

const search = ref('')
const status = ref<string | undefined>(undefined)
const tier = ref<string | undefined>(undefined)
const source = ref<string | undefined>(undefined)
const list = useApiList<DriverRow>({ search, path: '/drivers', workspaceScoped: true, query: () => ({ status: status.value, tier: tier.value, source: source.value }) })
onMounted(() => list.load())
watch([status, tier, source], () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

async function approve(row: DriverRow) {
    try {
        await api.post(`/drivers/${row.id}/approve`)
        toast.add({ title: `${row.name ?? 'Driver'} approved`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: rideError(e), color: 'error' })
    }
}
const reasonAction = useReasonAction()
function reject(row: DriverRow) {
    reasonAction.ask({
        title: `Reject ${row.name ?? 'this application'}`,
        submitLabel: 'Reject',
        run: async (reason) => {
            await api.post(`/drivers/${row.id}/reject`, { reason })
            toast.add({ title: 'Application rejected', color: 'success' })
            await reload()
        },
    })
}

// Driver source: two switches, at least one on.
const sourceForm = useFormModal(() => ({ id: 0, name: '', is_gm_driver: false, is_public_driver: true }))
function editSource(row: DriverRow) {
    sourceForm.show({ id: row.id, name: row.name ?? 'Driver', is_gm_driver: row.is_gm_driver, is_public_driver: row.is_public_driver })
}
async function saveSource() {
    const ok = await sourceForm.submit((d) => api.patch(`/drivers/${d.id}/source`, { is_gm_driver: d.is_gm_driver, is_public_driver: d.is_public_driver }))
    if (ok) {
        toast.add({ title: 'Driver source saved', color: 'success' })
        await reload()
    }
}
const sourceBadges = (r: DriverRow) =>
    h('div', { class: 'flex gap-1' }, [
        r.is_gm_driver ? h(resolveComponent('UBadge'), { color: 'primary', variant: 'soft', size: 'sm' }, () => 'GM') : null,
        r.is_public_driver ? h(resolveComponent('UBadge'), { color: 'neutral', variant: 'soft', size: 'sm' }, () => 'Public') : null,
    ])

const today = todayYmd()
const expiry = (d: string | null) => (d ? h('span', { class: d < today ? 'font-medium text-error' : '' }, formatDate(d)) : '—')
const columns: TableColumn<DriverRow>[] = [
    { accessorKey: 'name', header: 'Driver', cell: ({ row }) => h('div', [h('div', { class: 'font-medium' }, row.original.name && row.original.name !== '-' ? row.original.name : '—'), h('div', { class: 'text-xs text-gray-500' }, row.original.driver_no ?? '')]) },
    { accessorKey: 'phone_e164', header: 'Phone', cell: ({ row }) => row.original.phone_e164 ?? '—' },
    { accessorKey: 'tier', header: 'Tier', cell: ({ row }) => tierLabel(row.original.tier) },
    { accessorKey: 'driver_source', header: 'Source', cell: ({ row }) => sourceBadges(row.original) },
    { accessorKey: 'languages', header: 'Languages', cell: ({ row }) => row.original.languages.map((l) => l.toUpperCase()).join(', ') || '—' },
    { accessorKey: 'licence_expires_on', header: 'Licence expiry', cell: ({ row }) => expiry(row.original.licence_expires_on) },
    { accessorKey: 'psv_expires_on', header: 'PSV expiry', cell: ({ row }) => expiry(row.original.psv_expires_on) },
    { accessorKey: 'rating_avg', header: 'Rating', cell: ({ row }) => (row.original.rating_avg ? `${Number(row.original.rating_avg).toFixed(1)} ★` : '—') },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<DriverRow>((row) => [
        ...(canWrite.value && ['applied', 'suspended'].includes(row.status) ? [{ label: 'Approve', icon: 'i-bx-check-circle', onSelect: () => approve(row) }] : []),
        ...(canWrite.value && row.status === 'applied' ? [{ label: 'Reject', icon: 'i-bx-x-circle', color: 'error' as const, onSelect: () => reject(row) }] : []),
        ...(canWrite.value ? [{ label: 'Driver source', icon: 'i-bx-user-check', onSelect: () => editSource(row) }] : []),
    ]),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Drivers"
        subject="drivers"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="tier" :items="[{ label: 'All tiers', value: undefined }, ...DRIVER_TIERS]" class="w-36" />
            <USelect v-model="source" :items="DRIVER_SOURCES" class="w-36" />
            <USelect v-model="status" :items="DRIVER_STATUSES" class="w-32" />
        </template>
    </OpsListPage>
    <OpsReasonModal :action="reasonAction" />
    <OpsFormModal v-model:open="sourceForm.form.open" :title="`Driver source: ${sourceForm.form.data.name}`" :saving="sourceForm.form.saving" :error="sourceForm.form.error" submit-label="Save" @submit="saveSource">
        <OpsFormField label="GM Driver" :error="sourceForm.fieldError('is_gm_driver')"><OpsStatusToggle v-model="sourceForm.form.data.is_gm_driver" active-label="Yes" inactive-label="No" /></OpsFormField>
        <OpsFormField label="Public Driver" :error="sourceForm.fieldError('is_public_driver')"><OpsStatusToggle v-model="sourceForm.form.data.is_public_driver" active-label="Yes" inactive-label="No" /></OpsFormField>
        <p class="col-span-full text-sm text-gray-500">A GM Driver gets a booking over a Public Driver who accepted the same booking, every time. A driver with both counts as GM. GM-only drivers get Genting trips only.</p>
    </OpsFormModal>
</template>
