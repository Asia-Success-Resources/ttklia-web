<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { TableColumn } from '@nuxt/ui'
import type { PageMeta } from '../../../base/app/types/api'

// One rounded-xl card: title, "Your most recent … list", Import / Export / Create on the right,
// full-width search row, then the table and numbered pagination as in ttklia-v2 (doc 09, "List page").
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
        canImport?: boolean
        canExport?: boolean
        note?: string
        /** Statuses a row can be switched to from its status cell; none = the cell only shows the status. */
        statusOptions?: string[]
    }>(),
    { loading: false, pagination: null, createTo: undefined, canImport: false, canExport: true, note: undefined, statusOptions: () => [] },
)
const emit = defineEmits<{ page: [page: number]; export: []; import: []; status: [row: T, status: string] }>()
const search = defineModel<string>('search', { default: '' })

// Date columns show DD/MM/YYYY (doc 09, "Dates and times"): a column with no cell of its own whose key
// ends in `_at` gets date and time, one ending in `_date` (or `date`) gets the date only.
const tableColumns = computed<TableColumn<T>[]>(() =>
    props.columns.map((column) => {
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
    }),
)
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
                <div class="flex items-center gap-2">
                    <slot name="actions" />
                    <UButton v-if="props.canImport" label="Import" icon="i-bx-arrow-in-down-square-half" color="neutral" variant="outline" @click="emit('import')" />
                    <slot name="export">
                        <UButton v-if="props.canExport" label="Export" icon="i-bx-arrow-out-up-square-half" color="neutral" variant="outline" @click="emit('export')" />
                    </slot>
                    <UButton v-if="props.createTo" label="Create" icon="i-bx-plus" :to="props.createTo" />
                </div>
            </div>
            <div class="border-t border-gray-100 px-5 py-3 dark:border-gray-800">
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
