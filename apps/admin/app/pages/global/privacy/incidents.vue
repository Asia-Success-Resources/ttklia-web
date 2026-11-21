<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Breaches (table `privacy_incidents`, doc 26 "Breach runbook"). Opening one starts two clocks: the Commissioner
// within 72 hours of discovery, and the people affected within 7 days where harm is significant (assumed for IC or
// passport, payment and location data). Permission: global.privacy_incidents.read / write.
useHead({ title: 'Breaches' })

interface Row extends Record<string, unknown> {
    uuid: string
    discovered_at: string
    summary: string
    data_classes: string[]
    people_affected: number | null
    significant_harm: boolean
    commissioner_due_at: string | null
    commissioner_notified_at: string | null
    subjects_due_at: string | null
    subjects_notified_at: string | null
    status: string
    owner_name: string | null
}

const DATA_CLASSES = [
    { label: 'Names', value: 'name' },
    { label: 'Phone or email', value: 'contact' },
    { label: 'IC or passport', value: 'ic_passport' },
    { label: 'Payment', value: 'payment' },
    { label: 'Location', value: 'location' },
    { label: 'Account', value: 'account' },
    { label: 'Trip history', value: 'trip_history' },
    { label: 'Other', value: 'other' },
]

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/privacy/incidents' })
onMounted(() => list.load())

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    discovered_at: '',
    occurred_at: '',
    summary: '',
    data_classes: [] as string[],
    people_affected: '',
    status: 'investigating',
}))
function openCreate() {
    editing.value = null
    show({ discovered_at: new Date().toISOString().slice(0, 16) })
}
function openEdit(row: Row) {
    editing.value = row
    show({
        discovered_at: row.discovered_at.slice(0, 16),
        summary: row.summary,
        data_classes: row.data_classes ?? [],
        people_affected: row.people_affected === null ? '' : String(row.people_affected),
        status: row.status,
    })
}
async function save() {
    const saved = await submit(async (d) => {
        const body = { ...d, occurred_at: d.occurred_at || null, people_affected: d.people_affected === '' ? null : Number(d.people_affected) }
        if (editing.value) await api.patch(`/admin/privacy/incidents/${editing.value.uuid}`, body)
        else await api.post('/admin/privacy/incidents', body)
    })
    if (saved) {
        toast.add({ title: 'Breach saved', color: 'success' })
        await list.load()
    }
}
async function notify(row: Row, to: 'commissioner' | 'subjects') {
    try {
        await api.post(`/admin/privacy/incidents/${row.uuid}/notify`, { to })
        toast.add({ title: to === 'commissioner' ? 'Commissioner notification recorded' : 'Notification to the people affected recorded', color: 'success' })
        await list.load(list.pagination.value?.current_page ?? 1)
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to record it', color: 'error' })
    }
}

/** "Due in 5 h", "Overdue", or the date it was done. */
function clock(due: string | null, done: string | null): string {
    if (done) return `Done ${formatDateTime(done)}`
    if (!due) return '—'
    const hours = Math.round((new Date(due).getTime() - Date.now()) / 3600000)
    return hours < 0 ? `Overdue by ${-hours} h` : hours < 48 ? `Due in ${hours} h` : `Due ${formatDate(due)}`
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'discovered_at', header: 'Discovered' },
    { accessorKey: 'summary', header: 'What happened', cell: ({ row }) => (row.original.summary.length > 60 ? `${row.original.summary.slice(0, 60)}…` : row.original.summary) },
    { accessorKey: 'people_affected', header: 'People' },
    { id: 'commissioner', header: 'Commissioner (72 h)', cell: ({ row }) => clock(row.original.commissioner_due_at, row.original.commissioner_notified_at) },
    { id: 'subjects', header: 'People affected (7 days)', cell: ({ row }) => (row.original.significant_harm ? clock(row.original.subjects_due_at, row.original.subjects_notified_at) : 'Not needed') },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) =>
        can('global.privacy_incidents.write') && row.status !== 'closed'
            ? [
                  { label: 'Edit', icon: 'i-bx-edit', onSelect: () => openEdit(row) },
                  ...(!row.commissioner_notified_at ? [{ label: 'Commissioner notified', icon: 'i-bx-send', onSelect: () => notify(row, 'commissioner') }] : []),
                  ...(row.significant_harm && !row.subjects_notified_at ? [{ label: 'People affected notified', icon: 'i-bx-group', onSelect: () => notify(row, 'subjects') }] : []),
              ]
            : [],
    ),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Breaches"
        subject="breaches"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.privacy_incidents.write')" label="Report breach" icon="i-bx-plus" color="error" @click="openCreate" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Breach' : 'Report Breach'" :saving="form.saving" :error="form.error" submit-label="Save Breach" @submit="save">
        <OpsFormField label="Discovered at" required :error="fieldError('discovered_at')"><UInput v-model="form.data.discovered_at" type="datetime-local" class="w-full" /></OpsFormField>
        <OpsFormField label="Happened at (if known)" :error="fieldError('occurred_at')"><UInput v-model="form.data.occurred_at" type="datetime-local" class="w-full" /></OpsFormField>
        <OpsFormField label="What happened" required full :error="fieldError('summary')"><UTextarea v-model="form.data.summary" :rows="3" autoresize class="w-full" /></OpsFormField>
        <OpsFormField label="Data involved" required full :error="fieldError('data_classes')">
            <USelectMenu v-model="form.data.data_classes" :items="DATA_CLASSES" value-key="value" multiple class="w-full" />
        </OpsFormField>
        <OpsFormField label="People affected" :error="fieldError('people_affected')"><UInput v-model="form.data.people_affected" type="number" min="0" class="w-full" /></OpsFormField>
        <OpsFormField v-if="editing" label="Status" :error="fieldError('status')">
            <USelect
                v-model="form.data.status"
                :items="[{ label: 'Investigating', value: 'investigating' }, { label: 'Notified', value: 'notified' }, { label: 'Not notifiable', value: 'not_notifiable' }, { label: 'Closed', value: 'closed' }]"
                class="w-full"
            />
        </OpsFormField>
    </OpsFormModal>
</template>
