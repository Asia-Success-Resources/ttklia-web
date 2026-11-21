<script setup lang="ts">
// Scheduled ride: detail, history and Cancel with a reason (doc 35, Sitemap 4). Permission: ride.scheduled.read;
// cancelling needs ride.scheduled.write. GET /api/ops/w/{workspace}/ride/requests/{uuid},
// POST /api/ops/w/{workspace}/rides/{uuid}/cancel (ttklia-api). TODO(api): both are stubs.
useHead({ title: 'Scheduled ride' })

interface ScheduledRide {
    uuid: string
    scheduled_for: string
    matching_starts_at: string | null
    reminder_sent_at: string | null
    vehicle_class: string
    quoted_fare_sen: number
    payment_method: string
    channel: string
    status: string
    cancelled_by: string | null
    cancel_reason: string | null
}

const route = useRoute()
const api = useApi()
const toast = useToast()
const { slug } = useWorkspace()
const uuid = String(route.params.uuid)

const ride = ref<ScheduledRide | null>(null)
const loading = ref(false)
async function load() {
    if (!slug.value) return
    loading.value = true
    try {
        const res = await api.get<{ data?: ScheduledRide | null }>(api.workspacePath(slug.value, `/ride/requests/${uuid}`))
        ride.value = res?.data ?? null
    } finally {
        loading.value = false
    }
}
onMounted(load)

const reason = ref('')
const saving = ref(false)
const canCancel = computed(() => ride.value && ['scheduled', 'searching'].includes(ride.value.status))
async function cancel() {
    if (!slug.value || !reason.value.trim()) return
    saving.value = true
    try {
        await api.post(api.workspacePath(slug.value, `/rides/${uuid}/cancel`), { reason: reason.value.trim() })
        toast.add({ title: 'Scheduled ride cancelled', color: 'success' })
        reason.value = ''
        await load()
    } catch (err) {
        toast.add({ title: toProblem(err)?.detail ?? 'Could not cancel the ride', color: 'error' })
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <div>
        <OpsBreadcrumb title="Scheduled ride" />
        <div class="grid gap-4 lg:grid-cols-3">
            <UCard class="lg:col-span-2">
                <template #header>Ride {{ uuid }}</template>
                <p v-if="loading" class="text-sm text-gray-500">Loading…</p>
                <p v-else-if="!ride" class="text-sm text-gray-500">No details yet. The endpoint is still a stub.</p>
                <dl v-else class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <dt class="text-gray-500">Pickup at</dt><dd>{{ formatDateTime(ride.scheduled_for) }}</dd>
                    <dt class="text-gray-500">Matching from</dt><dd>{{ formatDateTime(ride.matching_starts_at) }}</dd>
                    <dt class="text-gray-500">Reminder sent</dt><dd>{{ formatDateTime(ride.reminder_sent_at) }}</dd>
                    <dt class="text-gray-500">Car</dt><dd>{{ ride.vehicle_class }}</dd>
                    <dt class="text-gray-500">Quoted fare</dt><dd>{{ formatSen(ride.quoted_fare_sen) }}</dd>
                    <dt class="text-gray-500">Payment</dt><dd>{{ ride.payment_method }}</dd>
                    <dt class="text-gray-500">Booked by</dt><dd>{{ ride.channel }}</dd>
                    <dt class="text-gray-500">Status</dt><dd>{{ ride.status }}</dd>
                    <template v-if="ride.cancelled_by">
                        <dt class="text-gray-500">Cancelled by</dt><dd>{{ ride.cancelled_by }}: {{ ride.cancel_reason }}</dd>
                    </template>
                </dl>
                <!-- TODO(api): history from the ride's events once the endpoint returns them. -->
            </UCard>
            <UCard v-if="canCancel">
                <template #header>Cancel</template>
                <p class="mb-3 text-sm text-gray-500">Free until a driver is assigned. The reason is recorded.</p>
                <UFormField label="Reason" name="reason" required>
                    <UInput v-model="reason" maxlength="190" class="w-full" />
                </UFormField>
                <UButton class="mt-4" label="Cancel ride" color="error" :loading="saving" :disabled="!reason.trim()" @click="cancel" />
            </UCard>
        </div>
    </div>
</template>
