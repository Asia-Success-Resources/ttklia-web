<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Data subject requests (table `data_subject_requests`, doc 26 "People's rights"): answered within 21 days.
// received → identity check → in progress (identity checked) → done, or refused with a reason. Completing a delete
// request masks the account; stop marketing turns marketing off. Permission: global.privacy_requests.read / write.
useHead({ title: 'Privacy requests' })

interface Row extends Record<string, unknown> {
    uuid: string
    requester_name: string
    requester_contact: string
    kind: string
    status: string
    due_at: string
    closed_at: string | null
    overdue: boolean
}

const KINDS = [
    { label: 'See my data (access)', value: 'access' },
    { label: 'Correct my data', value: 'correction' },
    { label: 'Copy of my data (portability)', value: 'portability' },
    { label: 'Withdraw consent', value: 'withdraw_consent' },
    { label: 'Stop marketing', value: 'prevent_marketing' },
    { label: 'Delete my account', value: 'delete' },
]

const { can } = useMe()
const api = useApi()
const toast = useToast()
const reason = useReasonAction()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/privacy/requests' })
onMounted(() => list.load())

const { form, fieldError, show, submit } = useFormModal(() => ({ kind: 'access', requester_name: '', requester_contact: '' }))
async function save() {
    if (await submit((d) => api.post('/admin/privacy/requests', d))) {
        toast.add({ title: 'Request recorded, due in 21 days', color: 'success' })
        await list.load()
    }
}

const reload = () => list.load(list.pagination.value?.current_page ?? 1)
async function move(row: Row, status: string) {
    try {
        await api.patch(`/admin/privacy/requests/${row.uuid}`, { status })
        toast.add({ title: `Moved to ${statusLabel(status).toLowerCase()}`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to move it', color: 'error' })
    }
}
function refuse(row: Row) {
    reason.ask({
        title: 'Refuse Request',
        submitLabel: 'Refuse',
        run: async (text) => {
            await api.patch(`/admin/privacy/requests/${row.uuid}`, { status: 'refused', refusal_reason: text })
            toast.add({ title: 'Request refused', color: 'success' })
            await reload()
        },
    })
}
function complete(row: Row) {
    reason.ask({
        title: row.kind === 'delete' ? 'Complete: Delete Account' : 'Complete Request',
        label: row.kind === 'delete' ? 'Note (the account is masked and signed out)' : 'Note (what was sent or changed)',
        required: false,
        submitLabel: 'Complete',
        run: async (text) => {
            await api.post(`/admin/privacy/requests/${row.uuid}/complete`, { note: text || null })
            toast.add({ title: 'Request completed', color: 'success' })
            await reload()
        },
    })
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'created_at', header: 'Received' },
    { accessorKey: 'requester_name', header: 'Name' },
    { accessorKey: 'requester_contact', header: 'Contact' },
    { accessorKey: 'kind', header: 'Asks for', cell: ({ row }) => KINDS.find((k) => k.value === row.original.kind)?.label ?? row.original.kind },
    { accessorKey: 'due_at', header: 'Due', cell: ({ row }) => (row.original.closed_at ? '—' : `${formatDate(row.original.due_at)}${row.original.overdue ? ' (overdue)' : ''}`) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => {
        if (!can('global.privacy_requests.write') || ['done', 'refused'].includes(row.status)) return []
        return [
            ...(row.status === 'received' ? [{ label: 'Check identity', icon: 'i-bx-user-id-card', onSelect: () => move(row, 'identity_check') }] : []),
            ...(row.status === 'identity_check' ? [{ label: 'Identity checked', icon: 'i-bx-check', onSelect: () => move(row, 'in_progress') }] : []),
            ...(row.status === 'in_progress' ? [{ label: 'Complete', icon: 'i-bx-check-circle', onSelect: () => complete(row) }] : []),
            { label: 'Refuse', icon: 'i-bx-x', color: 'error' as const, onSelect: () => refuse(row) },
        ]
    }),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Privacy requests"
        subject="privacy requests"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.privacy_requests.write')" label="Create" icon="i-bx-plus" @click="show()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" title="Record Request" :saving="form.saving" :error="form.error" submit-label="Save Request" @submit="save">
        <OpsFormField label="Asks for" required full :error="fieldError('kind')"><USelect v-model="form.data.kind" :items="KINDS" class="w-full" /></OpsFormField>
        <OpsFormField label="Name" required :error="fieldError('requester_name')"><UInput v-model="form.data.requester_name" class="w-full" /></OpsFormField>
        <OpsFormField label="Email or phone" required :error="fieldError('requester_contact')"><UInput v-model="form.data.requester_contact" class="w-full" /></OpsFormField>
    </OpsFormModal>
    <OpsReasonModal :action="reason" />
</template>
