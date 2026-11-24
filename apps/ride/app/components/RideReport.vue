<script setup lang="ts">
// A Teeko report (ReportController RIDE): pick the days (default this month), see the table with a total row, export it as CSV.
// GET /reports/{report}?from&to and …/export (ttklia-api ReportController). Money columns come in sen.
// `query`: extra filters for the report (e.g. the Driver Source Report's source, service, driver_id).
const props = defineProps<{ report: string; title: string; note?: string; byDay?: boolean; query?: Record<string, string | undefined> }>()

interface Column { key: string; label: string; kind: 'text' | 'number' | 'money' }
interface Result { title: string; from: string; to: string; columns: Column[]; rows: Record<string, string | number>[]; totals: Record<string, number>; [extra: string]: unknown }

const api = useRideApi()
const today = todayYmd()
const from = ref(`${today.slice(0, 7)}-01`)
const to = ref(today)
const data = ref<Result | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)

async function load() {
    loading.value = true
    try {
        data.value = (await api.get<{ data: Result }>(`/reports/${props.report}`, { from: from.value, to: to.value, ...(props.query ?? {}) })).data
        error.value = null
    } catch (e) {
        error.value = rideError(e, 'Unable to run the report.')
    } finally {
        loading.value = false
    }
}
onMounted(load)
watch([from, to, () => JSON.stringify(props.query ?? {})], load)

const cell = (c: Column, v: string | number | undefined) => (c.kind === 'money' ? formatSen(Number(v ?? 0)) : c.kind === 'number' ? Number(v ?? 0).toLocaleString('en-MY') : (v ?? '—'))
const { token } = useAuth()
async function exportCsv() {
    const config = useRuntimeConfig().public
    const res = await fetch(`${config.apiBase}${api.path(`/reports/${props.report}/export`)}?from=${from.value}&to=${to.value}`, {
        headers: { Authorization: `Bearer ${token.value}` }, credentials: 'include',
    })
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${props.report}-${from.value}-${to.value}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
}
</script>

<template>
    <div>
        <OpsBreadcrumb :title="props.title" />
        <div class="rounded-xl border border-(--ops-border) bg-(--ops-card)">
            <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                    <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ props.title }}</h3>
                    <p class="text-sm text-gray-500">{{ props.note }}</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <UInput v-model="from" type="date" class="w-40" />
                    <span class="text-gray-500">to</span>
                    <UInput v-model="to" type="date" class="w-40" />
                    <slot name="filters" />
                    <UButton label="Export" icon="i-bx-arrow-out-up-square-half" color="neutral" variant="outline" :disabled="!data?.rows.length" @click="exportCsv" />
                </div>
            </div>
            <UAlert v-if="error" class="mx-5 mb-3" color="error" variant="soft" :title="error" />
            <slot v-if="data" name="summary" :data="data" />
            <div class="overflow-x-auto border-t border-gray-100 dark:border-gray-800">
                <table v-if="data" class="w-full text-sm">
                    <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-white/[0.03]">
                        <tr><th v-for="c in data.columns" :key="c.key" class="px-4 py-3" :class="c.kind !== 'text' ? 'text-right' : ''">{{ c.label }}</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="(r, i) in data.rows" :key="i" class="border-t border-gray-100 dark:border-gray-800">
                            <td v-for="c in data.columns" :key="c.key" class="px-4 py-2" :class="c.kind !== 'text' ? 'text-right tabular-nums' : ''">
                                {{ c.key === 'label' && props.byDay ? formatDate(String(r[c.key])) : cell(c, r[c.key]) }}
                            </td>
                        </tr>
                        <tr v-if="!data.rows.length"><td :colspan="data.columns.length" class="px-4 py-8 text-center text-gray-500">Nothing in these days.</td></tr>
                    </tbody>
                    <tfoot v-if="data.rows.length" class="border-t-2 border-gray-200 font-semibold dark:border-gray-700">
                        <tr>
                            <td v-for="(c, i) in data.columns" :key="c.key" class="px-4 py-2" :class="c.kind !== 'text' ? 'text-right tabular-nums' : ''">
                                {{ i === 0 ? 'Total' : c.kind === 'text' ? '' : cell(c, data.totals[c.key]) }}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                <p v-else-if="loading" class="px-5 py-8 text-center text-sm text-gray-500">Loading…</p>
            </div>
            <slot v-if="data" name="after" :data="data" />
        </div>
    </div>
</template>
