<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// PDPA notices (table `privacy_notices`, doc 26 "Notice and Choice"): one row per version, language and channel.
// Write each language as a draft; publish the version once it has Bahasa Malaysia and English. A published notice
// is never edited: a change is a new version (orders record the version they showed).
// Permission: global.privacy_notices.read / write.
// TODO(pending: L1) see doc 30.
// TODO(pending: L2) see doc 30.
useHead({ title: 'Privacy notices' })

interface Row extends Record<string, unknown> {
    id: number
    version: string
    locale: string
    channel: string
    short_text: string
    effective_from: string | null
    status: string
}

const LOCALES = [
    { label: 'Bahasa Malaysia', value: 'ms' },
    { label: 'English', value: 'en' },
    { label: '中文', value: 'zh' },
    { label: 'தமிழ்', value: 'ta' },
    { label: 'العربية', value: 'ar' },
    { label: '日本語', value: 'ja' },
    { label: '한국어', value: 'ko' },
    { label: 'Indonesia', value: 'id' },
    { label: 'ไทย', value: 'th' },
]
const CHANNELS = [
    { label: 'Everywhere', value: 'all' },
    { label: 'Kiosk', value: 'kiosk' },
    { label: 'Counter', value: 'counter' },
    { label: 'Web', value: 'web' },
    { label: 'App', value: 'app' },
]

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/privacy/notices' })
onMounted(() => list.load())

const { form, fieldError, show, submit } = useFormModal(() => ({ version: '', locale: 'ms', channel: 'all', short_text: '', full_text: '' }))
async function save() {
    if (await submit((d) => api.post('/admin/privacy/notices', d))) {
        toast.add({ title: `Version ${form.data.version} (${form.data.locale}) saved as draft`, color: 'success' })
        await list.load()
    }
}

const { form: pub, fieldError: pubError, show: showPublish, submit: submitPublish } = useFormModal(() => ({ id: 0, version: '', effective_from: '' }))
async function publish() {
    if (await submitPublish((d) => api.post(`/admin/privacy/notices/${d.id}/publish`, { effective_from: d.effective_from || null }))) {
        toast.add({ title: `Version ${pub.data.version} published`, color: 'success' })
        await list.load(list.pagination.value?.current_page ?? 1)
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'version', header: 'Version' },
    { accessorKey: 'locale', header: 'Language', cell: ({ row }) => LOCALES.find((l) => l.value === row.original.locale)?.label ?? row.original.locale },
    { accessorKey: 'channel', header: 'Channel', cell: ({ row }) => CHANNELS.find((c) => c.value === row.original.channel)?.label ?? row.original.channel },
    { accessorKey: 'short_text', header: 'Short notice', cell: ({ row }) => (row.original.short_text.length > 60 ? `${row.original.short_text.slice(0, 60)}…` : row.original.short_text) },
    { accessorKey: 'effective_from', header: 'In effect from', cell: ({ row }) => (row.original.status === 'draft' ? '—' : formatDate(row.original.effective_from)) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) =>
        row.status === 'draft' && can('global.privacy_notices.write')
            ? [{ label: 'Publish version', icon: 'i-bx-check', onSelect: () => showPublish({ id: row.id, version: row.version }) }]
            : [],
    ),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Privacy notices"
        subject="privacy notice"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="Waiting on: L1, L2 (doc 30)."
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.privacy_notices.write')" label="Create" icon="i-bx-plus" @click="show()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" title="New Notice Text" wide :saving="form.saving" :error="form.error" submit-label="Save Draft" @submit="save">
        <OpsFormField label="Version" required :error="fieldError('version')"><UInput v-model="form.data.version" placeholder="2026-12-v1" class="w-full" /></OpsFormField>
        <OpsFormField label="Language" required :error="fieldError('locale')"><USelect v-model="form.data.locale" :items="LOCALES" class="w-full" /></OpsFormField>
        <OpsFormField label="Channel" :error="fieldError('channel')"><USelect v-model="form.data.channel" :items="CHANNELS" class="w-full" /></OpsFormField>
        <OpsFormField label="Short notice (shown on screen)" required full :error="fieldError('short_text')">
            <UTextarea v-model="form.data.short_text" :rows="3" autoresize class="w-full" />
        </OpsFormField>
        <OpsFormField label="Full notice" required full :error="fieldError('full_text')">
            <UTextarea v-model="form.data.full_text" :rows="10" class="w-full" />
        </OpsFormField>
    </OpsFormModal>

    <OpsFormModal v-model:open="pub.open" :title="`Publish Version ${pub.data.version}`" :saving="pub.saving" :error="pub.error" submit-label="Publish" @submit="publish">
        <OpsFormField label="In effect from (empty = now)" full :error="pubError('effective_from')"><UInput v-model="pub.data.effective_from" type="date" class="w-full" /></OpsFormField>
        <p class="text-xs text-gray-500 sm:col-span-2">Every language of this version is published together. It needs both Bahasa Malaysia and English.</p>
    </OpsFormModal>
</template>
