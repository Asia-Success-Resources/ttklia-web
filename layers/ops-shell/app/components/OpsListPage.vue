<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { TableColumn } from '@nuxt/ui'
import type { PageMeta } from '../../../base/app/types/api'
import type { OpsListFilter } from '../types/ops'

// One rounded-xl card: title, "Your most recent … list", Import / Export / Create on the right,
// full-width search row, then the table and numbered pagination as in ttklia-v2 (doc 09, "List page").
// With `ops.v2ListHeader` (bus) the search box, Filter, Export, Import and "Create {item}" all sit on the title row,
// as ttklia-v2's generic index (vebase) does; a page with its own #search slot keeps that on a row below.
// `filters` adds v2's Filter button: a panel of dropdowns with Apply and Reset (v-model:filter-values; `filter` on apply).
// `showTo` / `editTo` add v2's Actions column (show and edit icons, "show_and_edit").
// Slots: #actions, #search, #table, #export.
const props = withDefaults(
    defineProps<{
        title: string
        subject: string
        rows: T[]
        columns: TableColumn<T>[]
        loading?: boolean
        /** The page's place in the list (`useApiList().pagination`); no bar while it is null. */
        pagination?: PageMeta | null
        createTo?: string
        /** v2's button reads "Create {Model}"; defaults to "Create". */
        createLabel?: string
        canImport?: boolean
        canExport?: boolean
        note?: string
        /** Statuses a row can be switched to from its status cell; none = the cell only shows the status. */
        statusOptions?: string[]
        filters?: OpsListFilter[]
        showTo?: (row: T) => string | undefined
        editTo?: (row: T) => string | undefined
    }>(),
    {
        loading: false, pagination: null, createTo: undefined, createLabel: 'Create', canImport: false, canExport: true,
        note: undefined, statusOptions: () => [], filters: () => [], showTo: undefined, editTo: undefined,
    },
)
const emit = defineEmits<{ page: [page: number]; export: []; import: []; status: [row: T, status: string]; filter: [] }>()
const search = defineModel<string>('search', { default: '' })
const filterValues = defineModel<Record<string, string | undefined>>('filterValues', { default: () => ({}) })
const slots = useSlots()
const v2Header = computed(() => !!(useAppConfig().ops as { v2ListHeader?: boolean } | undefined)?.v2ListHeader && !slots.search)

// The Filter panel edits a draft; Apply copies it to the page's values, Reset clears them (v2 index-filter).
const filterOpen = ref(false)
const draft = ref<Record<string, string | undefined>>({})
watch(filterOpen, (open) => {
    if (open) draft.value = { ...filterValues.value }
})
const ALL = '__all__'
const itemsFor = (f: OpsListFilter) => [{ label: f.emptyLabel ?? 'All', value: ALL }, ...(f.items ?? [])]
function applyFilters() {
    filterValues.value = Object.fromEntries(Object.entries(draft.value).map(([k, v]) => [k, v === ALL || v === '' ? undefined : v]))
    filterOpen.value = false
    emit('filter')
}
function resetFilters() {
    filterValues.value = {}
    filterOpen.value = false
    emit('filter')
}
const activeFilters = computed(() => Object.values(filterValues.value).filter((v) => v !== undefined && v !== '').length)

// Date columns show DD/MM/YYYY (doc 09, "Dates and times"): a column with no cell of its own whose key
// ends in `_at` gets date and time, one ending in `_date` (or `date`) gets the date only.
const tableColumns = computed<TableColumn<T>[]>(() => {
    const columns = props.columns.map((column) => {
        const key = 'accessorKey' in column ? String(column.accessorKey) : ''
        if (column.cell || !key) return column
        // Status columns as on fleet-management's boards: a coloured block, with the picker when the page allows it.
        if (key === 'status' || key.endsWith('_status')) {
            return {
                ...column,
                cell: ({ row }) => h(resolveComponent('OpsStatusCell'), {
                    status: row.original[key] as string | null,
                    options: key === 'status' ? props.statusOptions : [],
                    onChange: (status: string) => emit('status', row.original, status),
                }),
            }
        }
        if (key.endsWith('_at')) return { ...column, cell: ({ row }) => formatDateTime(row.original[key] as string | null) }
        if (key === 'date' || key.endsWith('_date')) return { ...column, cell: ({ row }) => formatDate(row.original[key] as string | null) }
        return column
    }) as TableColumn<T>[]
    if (props.showTo || props.editTo) {
        const link = (to: string | undefined, icon: string, label: string) =>
            to ? h(resolveComponent('NuxtLink'), { to, 'aria-label': label, class: 'text-gray-500 hover:text-primary' }, () => h(resolveComponent('UIcon'), { name: icon, class: 'size-5' })) : null
        columns.push({
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
                link(props.showTo?.(row.original), 'i-bx-show', 'View'),
                link(props.editTo?.(row.original), 'i-bx-edit', 'Edit'),
            ]),
        })
    }
    return columns
})
</script>

<template>
    <div>
        <OpsBreadcrumb :title="props.title" />
        <div class="rounded-xl border border-(--ops-border) bg-(--ops-card)">
            <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                    <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ props.title }}</h3>
                    <p class="text-sm text-gray-500">Your most recent {{ props.subject }} list</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <UInput v-if="v2Header" v-model="search" icon="i-bx-search" placeholder="Search..." class="w-full sm:w-64" />
                    <UPopover v-if="props.filters.length" v-model:open="filterOpen" :content="{ align: 'end' }">
                        <UButton label="Filter" icon="i-bx-filter" color="neutral" variant="outline">
                            <template v-if="activeFilters" #trailing>
                                <UBadge :label="String(activeFilters)" size="sm" variant="soft" />
                            </template>
                        </UButton>
                        <template #content>
                            <div class="w-72 space-y-4 p-4">
                                <UFormField v-for="f in props.filters" :key="f.key" :label="f.label">
                                    <AppDateInput v-if="f.type === 'date'" v-model="draft[f.key] as string" />
                                    <USelect
                                        v-else
                                        :model-value="draft[f.key] ?? ALL"
                                        :items="itemsFor(f)"
                                        class="w-full"
                                        @update:model-value="draft[f.key] = $event as string"
                                    />
                                </UFormField>
                                <UButton label="Apply" block @click="applyFilters" />
                                <div class="text-center">
                                    <UButton label="Reset" variant="link" color="neutral" size="sm" @click="resetFilters" />
                                </div>
                            </div>
                        </template>
                    </UPopover>
                    <slot name="actions" />
                    <slot name="export">
                        <UButton v-if="props.canExport" label="Export" icon="i-bx-arrow-out-up-square-half" color="neutral" variant="outline" @click="emit('export')" />
                    </slot>
                    <UButton v-if="props.canImport" label="Import" icon="i-bx-arrow-in-down-square-half" color="neutral" variant="outline" @click="emit('import')" />
                    <UButton v-if="props.createTo" :label="props.createLabel" icon="i-bx-plus" :to="props.createTo" />
                </div>
            </div>
            <div v-if="!v2Header" class="border-t border-gray-100 px-5 py-3 dark:border-gray-800">
                <slot name="search">
                    <UInput v-model="search" icon="i-bx-search" placeholder="Search…" class="w-full" />
                </slot>
            </div>
            <UAlert v-if="props.note" :description="props.note" color="warning" variant="subtle" class="mx-5 mb-3" />
            <div class="border-t border-gray-100 dark:border-gray-800">
                <slot name="table">
                    <UTable :data="props.rows" :columns="tableColumns" :loading="props.loading" empty="No records yet" />
                </slot>
            </div>
            <OpsPagination v-if="props.pagination && props.pagination.total > 0" :meta="props.pagination" :loading="props.loading" @page="emit('page', $event)" />
        </div>
    </div>
</template>
