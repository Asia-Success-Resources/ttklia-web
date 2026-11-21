<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Kiosk ads (table `kiosk_ads`, doc 25 "Kiosk ads and kiosk settings"): full-screen images or MP4 videos on the
// kiosks' attract screen, on every kiosk, one workspace's kiosks or chosen locations, with plays and touches per day.
// Delete removes a draft that never played; an ad that has played is ended instead. Permission: global.settings_ads.read / write.
useHead({ title: 'Kiosk ads' })

interface Row extends Record<string, unknown> {
    id: number
    title: string
    media_type: string
    duration_s: number
    priority: number
    starts_at: string
    ends_at: string | null
    status: string
    workspace_code: string | null
    advertiser_name: string | null
    plays_total: number
}
interface Plays {
    plays: number
    touches: number
    touch_rate_bp: number
    days: { date: string; plays: number; touches: number; kiosks: number }[]
}

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/settings/ads' })
onMounted(() => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const workspaces = useApiAll<{ id: number; code: string; name: string }>({ path: '/admin/workspaces' })
onMounted(() => workspaces.load())
const workspaceItems = computed(() => [{ label: 'Every kiosk', value: undefined }, ...workspaces.rows.value.map((w) => ({ label: `${w.code} · ${w.name}`, value: w.id }))])

const editing = ref<Row | null>(null)
const media = ref<File | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    title: '',
    workspace_id: undefined as number | undefined,
    duration_s: '',
    priority: '5',
    starts_at: '',
    ends_at: '',
    status: 'draft',
}))
function open(row?: Row) {
    editing.value = row ?? null
    media.value = null
    show(
        row
            ? {
                  title: row.title,
                  duration_s: String(row.duration_s ?? ''),
                  priority: String(row.priority),
                  starts_at: row.starts_at?.slice(0, 10) ?? '',
                  ends_at: row.ends_at?.slice(0, 10) ?? '',
                  status: row.status,
              }
            : { starts_at: new Date().toISOString().slice(0, 10) },
    )
}
async function save() {
    const saved = await submit(async (d) => {
        // Multipart for the file; an update goes as POST with _method=PATCH, as PHP reads files only on POST.
        const body = new FormData()
        body.append('title', d.title)
        if (!editing.value && d.workspace_id) body.append('workspace_id', String(d.workspace_id))
        if (d.duration_s) body.append('duration_s', d.duration_s)
        body.append('priority', d.priority)
        body.append('starts_at', d.starts_at)
        if (d.ends_at) body.append('ends_at', d.ends_at)
        body.append('status', d.status)
        if (media.value) body.append('media', media.value)
        if (editing.value) {
            body.append('_method', 'PATCH')
            await api.post(`/admin/settings/ads/${editing.value.id}`, body)
        } else {
            await api.post('/admin/settings/ads', body)
        }
    })
    if (saved) {
        toast.add({ title: `${form.data.title} saved`, color: 'success' })
        await reload()
    }
}
async function remove(row: Row) {
    if (!confirm(`Remove ${row.title}?`)) return
    try {
        const res = await api.del<{ message: string }>(`/admin/settings/ads/${row.id}`)
        toast.add({ title: res?.message === 'ended' ? `${row.title} has played, so it was ended` : `${row.title} deleted`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to remove it', color: 'error' })
    }
}

const playsOf = ref<Row | null>(null)
const plays = ref<Plays | null>(null)
async function openPlays(row: Row) {
    playsOf.value = row
    plays.value = null
    try {
        plays.value = (await api.get<{ data: Plays }>(`/admin/settings/ads/${row.id}/plays`)).data
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to load plays', color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'media_type', header: 'Media', cell: ({ row }) => statusLabel(row.original.media_type) },
    { accessorKey: 'workspace_code', header: 'Shown on', cell: ({ row }) => row.original.workspace_code ?? 'Every kiosk' },
    { accessorKey: 'starts_at', header: 'From', cell: ({ row }) => formatDate(row.original.starts_at) },
    { accessorKey: 'ends_at', header: 'Until', cell: ({ row }) => (row.original.ends_at ? formatDate(row.original.ends_at) : '—') },
    { accessorKey: 'plays_total', header: 'Plays' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => [
        { label: 'Plays', icon: 'i-bx-bar-chart', onSelect: () => openPlays(row) },
        ...(can('global.settings_ads.write')
            ? [
                  { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
                  ...(row.status !== 'ended' ? [{ label: 'Remove', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) }] : []),
              ]
            : []),
    ]),
]
const dayColumns: TableColumn<Plays['days'][number]>[] = [
    { accessorKey: 'date', header: 'Day', cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: 'kiosks', header: 'Kiosks' },
    { accessorKey: 'plays', header: 'Plays' },
    { accessorKey: 'touches', header: 'Touches' },
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Kiosk ads"
        subject="kiosk ads"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.settings_ads.write')" label="Create" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Ad' : 'New Ad'" :saving="form.saving" :error="form.error" submit-label="Save Ad" @submit="save">
        <OpsFormField label="Title" required full :error="fieldError('title')"><UInput v-model="form.data.title" class="w-full" /></OpsFormField>
        <OpsFormField :label="editing ? 'Replace image or video' : 'Image or video'" :required="!editing" full :error="fieldError('media')">
            <UInput type="file" accept="image/jpeg,image/png,image/webp,video/mp4" class="w-full" @change="media = ($event.target as HTMLInputElement).files?.[0] ?? null" />
        </OpsFormField>
        <OpsFormField v-if="!editing" label="Shown on" :error="fieldError('workspace_id')">
            <USelectMenu v-model="form.data.workspace_id" :items="workspaceItems" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Seconds on screen" :error="fieldError('duration_s')"><UInput v-model="form.data.duration_s" type="number" min="3" max="120" placeholder="10" class="w-full" /></OpsFormField>
        <OpsFormField label="Priority (1–10)" :error="fieldError('priority')"><UInput v-model="form.data.priority" type="number" min="1" max="10" class="w-full" /></OpsFormField>
        <OpsFormField label="Status" :error="fieldError('status')">
            <USelect v-model="form.data.status" :items="[{ label: 'Draft', value: 'draft' }, { label: 'Active', value: 'active' }, { label: 'Paused', value: 'paused' }, { label: 'Ended', value: 'ended' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="From" required :error="fieldError('starts_at')"><UInput v-model="form.data.starts_at" type="date" class="w-full" /></OpsFormField>
        <OpsFormField label="Until" :error="fieldError('ends_at')"><UInput v-model="form.data.ends_at" type="date" class="w-full" /></OpsFormField>
    </OpsFormModal>

    <UModal :open="!!playsOf" :title="playsOf ? `${playsOf.title}: last 30 days` : ''" :ui="{ content: 'sm:max-w-2xl' }" @update:open="(v) => { if (!v) playsOf = null }">
        <template #body>
            <div v-if="plays" class="space-y-3">
                <p class="text-sm">
                    {{ plays.plays }} plays, {{ plays.touches }} touches ({{ (plays.touch_rate_bp / 100).toFixed(2) }}% touch rate)
                </p>
                <UTable :data="plays.days" :columns="dayColumns" empty="Not played yet" />
            </div>
        </template>
    </UModal>
</template>
