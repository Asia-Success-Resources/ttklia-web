<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { TableColumn } from '@nuxt/ui'

// One rounded-xl card: title, "Your most recent … list", Import / Export / Create on the right,
// full-width search row, then the table and pagination (doc 09, "List page").
// Slots: #actions, #search, #table, #export.
const props = withDefaults(
  defineProps<{
    title: string
    subject: string
    rows: T[]
    columns: TableColumn<T>[]
    loading?: boolean
    hasMore?: boolean
    createTo?: string
    canImport?: boolean
    canExport?: boolean
    note?: string
  }>(),
  { loading: false, hasMore: false, createTo: undefined, canImport: false, canExport: true, note: undefined },
)
const emit = defineEmits<{ more: []; export: []; import: [] }>()
const search = defineModel<string>('search', { default: '' })
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
          <UTable :data="props.rows" :columns="props.columns" :loading="props.loading" empty="No records yet" />
        </slot>
      </div>
      <div v-if="props.hasMore" class="flex justify-center border-t border-gray-100 p-4 dark:border-gray-800">
        <UButton label="Load more" color="neutral" variant="outline" @click="emit('more')" />
      </div>
    </div>
  </div>
</template>
