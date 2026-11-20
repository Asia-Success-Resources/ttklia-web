<script setup lang="ts">
import type { SaleCounter, SaleSession } from '~/types/sale'

// "Start New Session", laid out like today's ttklia-v2 `admin/bus/sessions/start` and
// `product-sales/product-start`: pick a counter on the left, staff and opening cash on the right
// (doc 09, "Counter sessions"). Shown in place of a sale dashboard until a session is open.
const props = withDefaults(
    defineProps<{
        title: string
        counters: SaleCounter[]
        /** An open session of the other kind; starting is blocked until it ends. */
        other: SaleSession | null
        askOpeningCash?: boolean
        busy?: boolean
        error?: string | null
        preview?: boolean
    }>(),
    { askOpeningCash: true, busy: false, error: null, preview: false },
)
const emit = defineEmits<{ start: [counterUuid: string, openingFloatSen: number]; endOther: []; preview: [] }>()

const { me, can } = useMe()
const { resolveTo } = useOpsShell()
const canCreateCounter = computed(() => props.preview || can('bus.counters.write'))
const counterUuid = ref<string | null>(null)
const openingCash = ref<number | null>(null)

const blocked = computed(() => props.other !== null)
const canStart = computed(
    () => !blocked.value && !props.busy && counterUuid.value !== null && (!props.askOpeningCash || (openingCash.value !== null && openingCash.value >= 0)),
)

function submit() {
    if (!canStart.value || !counterUuid.value) return
    emit('start', counterUuid.value, props.askOpeningCash ? Math.round((openingCash.value ?? 0) * 100) : 0)
}
</script>

<template>
    <div>
        <OpsBreadcrumb :title="props.title" />
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Start New Session</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ props.askOpeningCash ? 'Please select a counter and provide your opening float cash to begin.' : 'Please select a counter to begin.' }}
            </p>
        </div>

        <UAlert
            v-if="props.other"
            class="mb-6"
            color="warning"
            variant="subtle"
            icon="i-bx-error"
            :title="`You have an active ${props.other.kind === 'product' ? 'product' : 'booking'} session`"
        >
            <template #description>
                <p>Counter: {{ props.other.counter_name ?? '—' }} · Started: {{ formatDateTime(props.other.opened_at) }}</p>
                <p class="mt-1">Please end your current session before starting a new one.</p>
                <UButton class="mt-3" label="End Current Session" color="warning" @click="emit('endOther')" />
            </template>
        </UAlert>
        <UAlert v-if="props.error" class="mb-6" color="error" variant="subtle" icon="i-bx-error-circle" :title="props.error" />
        <UAlert
            v-if="props.preview"
            class="mb-6"
            color="neutral"
            variant="subtle"
            icon="i-bx-info-circle"
            title="Preview: no API is configured, so there are no counters to choose."
        >
            <template #description>
                <UButton class="mt-2" label="Show the dashboard without a session" color="neutral" variant="outline" size="sm" @click="emit('preview')" />
            </template>
        </UAlert>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12" :class="blocked ? 'pointer-events-none opacity-50' : ''">
            <div class="lg:col-span-7">
                <SalePanel title="1. Select Counter">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <template v-for="counter in props.counters" :key="counter.uuid">
                            <div v-if="counter.open_session" class="rounded-lg border border-(--ops-border) bg-gray-50 p-4 opacity-75 dark:bg-white/[0.02]">
                                <div class="flex items-center justify-between">
                                    <span class="text-base font-semibold text-gray-500 dark:text-gray-400">{{ counter.name }}</span>
                                    <UBadge label="In Use" color="neutral" variant="soft" size="sm" />
                                </div>
                                <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">By: {{ counter.open_session.user_name }}</p>
                            </div>
                            <button
                                v-else
                                type="button"
                                class="flex items-center justify-between rounded-lg border p-4 text-left transition"
                                :class="counterUuid === counter.uuid
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-(--ops-border) text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'"
                                :aria-pressed="counterUuid === counter.uuid"
                                @click="counterUuid = counter.uuid"
                            >
                                <span class="text-base font-semibold">{{ counter.name }}</span>
                                <UIcon v-if="counterUuid === counter.uuid" name="i-bx-check-circle" class="size-5" />
                            </button>
                        </template>
                    </div>
                    <div v-if="props.counters.length === 0" class="flex flex-wrap items-center gap-3">
                        <p class="text-sm text-gray-500">No counters available.</p>
                        <UButton
                            v-if="canCreateCounter"
                            label="Create counter"
                            icon="i-bx-plus"
                            size="sm"
                            variant="outline"
                            :to="resolveTo('/counters/create')"
                        />
                    </div>
                </SalePanel>
            </div>

            <div class="lg:col-span-5">
                <SalePanel title="2. Session Details">
                    <div class="space-y-5">
                        <UFormField label="Staff Name">
                            <UInput :model-value="me?.name ?? ''" disabled size="lg" class="w-full" />
                        </UFormField>
                        <UFormField v-if="props.askOpeningCash" label="Opening Cash (RM)" required>
                            <UInput
                                v-model="openingCash"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                size="lg"
                                class="w-full"
                                :ui="{ base: 'text-lg font-bold' }"
                            />
                        </UFormField>
                        <div class="border-t border-(--ops-border) pt-4">
                            <UButton
                                block
                                size="xl"
                                color="success"
                                label="Open Register & Start"
                                :loading="props.busy"
                                :disabled="!canStart"
                                @click="submit"
                            />
                        </div>
                    </div>
                </SalePanel>
            </div>
        </div>
    </div>
</template>
