<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Languages: the texts shown to passengers in each language (table `translations`). Edit a text and it becomes a
// human, reviewed one; an empty text removes that language (English shows instead). Add a language to an item
// that has none. Permission: global.settings_languages.read / write.
useHead({ title: 'Languages' })

interface Row extends Record<string, unknown> {
    id: number
    translatable_type: string
    translatable_id: number
    field: string
    locale: string
    text: string
    source: string
    updated_at: string
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
const localeName = (code: string) => LOCALES.find((l) => l.value === code)?.label ?? code

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const locale = ref<string | undefined>(undefined)
const source = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/admin/settings/translations', query: () => ({ locale: locale.value, source: source.value }) })
onMounted(() => list.load())
watch([locale, source], () => list.load())

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({ translatable_type: '', translatable_id: '', field: '', locale: 'ms', text: '' }))
function open(row?: Row, asLocale?: string) {
    editing.value = asLocale ? null : row ?? null
    show(
        row
            ? { translatable_type: row.translatable_type, translatable_id: String(row.translatable_id), field: row.field, locale: asLocale ?? row.locale, text: asLocale ? '' : row.text }
            : {},
    )
}
async function save() {
    const saved = await submit((d) =>
        api.put('/admin/settings/translations', {
            items: [{ translatable_type: d.translatable_type, translatable_id: Number(d.translatable_id), field: d.field, locale: d.locale, text: d.text }],
        }),
    )
    if (saved) {
        toast.add({ title: form.data.text ? 'Text saved' : 'Text removed', color: 'success' })
        await list.load(list.pagination.value?.current_page ?? 1)
    }
}
/** Field errors come back as items.0.text and so on. */
const err = (key: string) => fieldError(`items.0.${key}`) ?? fieldError('items')

const columns: TableColumn<Row>[] = [
    { accessorKey: 'translatable_type', header: 'Item', cell: ({ row }) => `${statusLabel(row.original.translatable_type)} #${row.original.translatable_id}` },
    { accessorKey: 'field', header: 'Field', cell: ({ row }) => statusLabel(row.original.field) },
    { accessorKey: 'locale', header: 'Language', cell: ({ row }) => localeName(row.original.locale) },
    { accessorKey: 'text', header: 'Text', cell: ({ row }) => (row.original.text.length > 70 ? `${row.original.text.slice(0, 70)}…` : row.original.text) },
    { accessorKey: 'source', header: 'Source', cell: ({ row }) => (row.original.source === 'human' ? 'Reviewed' : 'Machine') },
    actionsColumn<Row>((row) =>
        can('global.settings_languages.write')
            ? [
                  { label: row.source === 'machine' ? 'Review' : 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
                  { label: 'Add another language', icon: 'i-bx-plus', onSelect: () => open(row, row.locale === 'ms' ? 'en' : 'ms') },
              ]
            : [],
    ),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Languages"
        subject="translations"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="locale" :items="[{ label: 'All languages', value: undefined }, ...LOCALES]" class="w-40" />
            <USelect v-model="source" :items="[{ label: 'All', value: undefined }, { label: 'Needs review', value: 'machine' }, { label: 'Reviewed', value: 'human' }]" class="w-36" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Text' : 'Add Language'" :saving="form.saving" :error="form.error" submit-label="Save Text" @submit="save">
        <OpsFormField label="Item" :error="err('translatable_type')">
            <UInput :model-value="`${statusLabel(form.data.translatable_type)} #${form.data.translatable_id} · ${statusLabel(form.data.field)}`" disabled class="w-full" />
        </OpsFormField>
        <OpsFormField label="Language" required :error="err('locale')">
            <USelect v-model="form.data.locale" :items="LOCALES" :disabled="!!editing" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Text (empty removes it)" full :error="err('text')">
            <UTextarea v-model="form.data.text" :rows="4" autoresize class="w-full" />
        </OpsFormField>
    </OpsFormModal>
</template>
