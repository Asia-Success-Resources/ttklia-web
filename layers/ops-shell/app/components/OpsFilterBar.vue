<script setup lang="ts">
import type { OpsListFilter } from '../types/ops'

// The search toolbar of a ttklia-v2 list page with its own index-search (e.g. bus bookings): a wrapping row of small
// labelled fields (Search first, then the filters), with Search and Reset at the end. Put it in OpsListPage's
// #search slot. Typing does nothing until Search is pressed (or Enter), as the v2 form submitted; Reset clears all.
// Filter types: select (default, "All" first), multi (several values, sent comma-joined), date, time.
const props = defineProps<{ filters: OpsListFilter[]; searchLabel?: string }>()
const search = defineModel<string>('search', { default: '' })
const values = defineModel<Record<string, string | undefined>>('values', { default: () => ({}) })
const emit = defineEmits<{ apply: [] }>()

const draftSearch = ref(search.value)
const draft = ref<Record<string, string | undefined>>({ ...values.value })
watch(search, (v) => (draftSearch.value = v))
watch(values, (v) => (draft.value = { ...v }), { deep: true })

const ALL = '__all__'
const itemsFor = (f: OpsListFilter) => [{ label: f.emptyLabel ?? 'All', value: ALL }, ...(f.items ?? [])]
const multi = (key: string) => computed({
    get: () => (draft.value[key] ? draft.value[key]!.split(',') : []),
    set: (v: string[]) => (draft.value[key] = v.length ? v.join(',') : undefined),
})
const multiModels = Object.fromEntries(props.filters.filter((f) => f.type === 'multi').map((f) => [f.key, multi(f.key)]))

function apply() {
    values.value = Object.fromEntries(Object.entries(draft.value).map(([k, v]) => [k, v === ALL || v === '' ? undefined : v]))
    search.value = draftSearch.value.trim()
    emit('apply')
}
function reset() {
    draft.value = {}
    draftSearch.value = ''
    apply()
}
const label = 'mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400'
</script>

<template>
    <form class="flex w-full flex-wrap items-end gap-3" @submit.prevent="apply">
        <div>
            <label :class="label">{{ props.searchLabel ?? 'Search' }}</label>
            <UInput v-model="draftSearch" placeholder="Search" enterkeyhint="search" class="w-44" />
        </div>
        <div v-for="f in props.filters" :key="f.key">
            <label :class="label">{{ f.label }}:</label>
            <AppDateInput v-if="f.type === 'date'" v-model="draft[f.key] as string" class="w-40" />
            <UInput v-else-if="f.type === 'time'" v-model="draft[f.key]" type="time" class="w-32" />
            <USelectMenu
                v-else-if="f.type === 'multi'"
                v-model="multiModels[f.key]!.value"
                :items="f.items ?? []"
                value-key="value"
                multiple
                placeholder="All"
                class="w-44"
            />
            <USelect
                v-else
                :model-value="draft[f.key] ?? ALL"
                :items="itemsFor(f)"
                class="w-40"
                @update:model-value="draft[f.key] = $event as string"
            />
        </div>
        <div class="flex items-end gap-2">
            <UButton type="submit" label="Search" icon="i-bx-search" />
            <UButton label="Reset" color="neutral" variant="outline" @click="reset" />
        </div>
    </form>
</template>
