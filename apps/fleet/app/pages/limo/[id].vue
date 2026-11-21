<script setup lang="ts">
// One limo booking (doc 19): its details and charges, the cars and drivers on it (assign: only free drivers and
// vehicles with no issue keeping them off the road; take off), the client's changes and the WhatsApp message it came
// from. Actions: edit, move between the open statuses, cancel (with or without a charge), cannot provide, transfer
// to a third party. GET/PATCH /fleet/bookings/{uuid}, POST …/cancel, …/cannot-provide, …/transfer,
// POST /fleet/assignments, …/{id}/release. Permission: fleet.limo.read / write (doc 27).
import { LIMO_STATUSES, limoStatus, statusTextColor } from '~/utils/limoBoard'

interface Assignment {
    id: number
    status: string
    plate_no: string | null
    vehicle_class: string | null
    driver_name: string | null
    driver_phone: string | null
    driver_no: string | null
    substituted: boolean
    substitution_reason: string | null
    moved_at: string | null
    arrived_at: string | null
    started_at: string | null
    completed_at: string | null
    driver_pay_sen: number | null
}
interface Booking extends Record<string, unknown> {
    uuid: string
    reference: string
    status: string
    client_name: string | null
    client_reference: string | null
    pickup_at: string
    return_at: string | null
    from_text: string
    to_text: string | null
    from_zone_name: string | null
    to_zone_name: string | null
    guest_name: string | null
    guest_phone: string | null
    pax_count: number
    vehicle_class: string
    vehicles_needed: number
    flight_no: string | null
    requirements: string[]
    remarks: string | null
    source: string
    price_sen: number
    toll_sen: number
    waiting_minutes: number | null
    waiting_charge_sen: number
    extra_charge_sen: number
    discount_sen: number
    sst_sen: number
    total_sen: number
    cancellation: string | null
    cancellation_charge_sen: number | null
    cancel_reason: string | null
    transferred_to_name: string | null
    third_party_cost_sen: number | null
    created_by_name: string | null
    assignments: Assignment[]
    changes: { id: number; status: string; created_at: string; reviewed_by_name: string | null; old_values: Record<string, unknown>; new_values: Record<string, unknown> }[]
    message: { sender_name: string | null; body: string; received_at: string } | null
}

const route = useRoute()
const uuid = computed(() => String(route.params.id ?? ''))
const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.limo.write'))
const options = useFleetOptions()

const booking = ref<Booking | null>(null)
const error = ref<string | null>(null)
useHead({ title: () => booking.value?.reference ?? 'Booking' })

async function load() {
    try {
        booking.value = (await api.get<{ data: Booking }>(`/fleet/bookings/${uuid.value}`)).data
        error.value = null
    } catch (e) {
        error.value = fleetError(e, 'Unable to load the booking.')
    }
}
onMounted(async () => {
    await load()
    if (route.query.action === 'transfer') openTransfer()
})

const closed = computed(() => ['completed', 'cancelled', 'cannot_provide', 'transferred'].includes(booking.value?.status ?? ''))
const activeAssignments = computed(() => (booking.value?.assignments ?? []).filter((a) => !['released', 'declined'].includes(a.status)))
const chip = (status: string) => {
    const bg = limoStatus(status)?.color ?? '#797e93'
    return { backgroundColor: bg, color: statusTextColor(bg) }
}

const fields = computed(() => {
    const b = booking.value
    if (!b) return []
    return [
        { label: 'Booking no.', value: b.reference },
        { label: 'Client / RSVN', value: [b.client_name, b.client_reference].filter(Boolean).join(' · ') || null },
        { label: 'Pickup', value: formatDateTime(b.pickup_at) },
        { label: 'Return', value: b.return_at ? formatDateTime(b.return_at) : null },
        { label: 'From', value: [b.from_text, b.from_zone_name && `(${b.from_zone_name})`].filter(Boolean).join(' ') || null },
        { label: 'To', value: [b.to_text, b.to_zone_name && `(${b.to_zone_name})`].filter(Boolean).join(' ') || null },
        { label: 'Guest', value: [b.guest_name, b.guest_phone].filter(Boolean).join(' · ') || null },
        { label: 'Pax', value: String(b.pax_count) },
        { label: 'Vehicle', value: `${b.vehicle_class}${b.vehicles_needed > 1 ? ` × ${b.vehicles_needed}` : ''}` },
        { label: 'Flight', value: b.flight_no },
        { label: 'Requests', value: b.requirements.map((r) => REQUIREMENTS.find((x) => x.value === r)?.label ?? r).join(', ') || null },
        { label: 'Remarks', value: b.remarks },
        { label: 'Source', value: statusLabel(b.source) },
        { label: 'Keyed by', value: b.created_by_name },
    ]
})
const charges = computed(() => {
    const b = booking.value
    if (!b) return []
    return [
        ['Price', b.price_sen], ['Toll', b.toll_sen], [`Waiting${b.waiting_minutes ? ` (${b.waiting_minutes} min)` : ''}`, b.waiting_charge_sen],
        ['Extra', b.extra_charge_sen], ['Discount', -b.discount_sen], ['SST', b.sst_sen],
    ].filter(([, v]) => v) as [string, number][]
})

// ---------------------------------------------------------------- status and edits
async function setStatus(status: string) {
    try {
        await api.patch(`/fleet/bookings/${uuid.value}`, { status })
        toast.add({ title: `Status: ${limoStatus(status)?.label ?? status}`, color: 'success' })
        await load()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}
const statusItems = computed(() => LIMO_STATUSES.filter((s) => ['pending_reservation', 'on_hold', 'confirmed', 'standby', 'in_progress', 'completed'].includes(s.value) && s.value !== booking.value?.status)
    .map((s) => ({ label: s.label, onSelect: () => setStatus(s.value) })))

const { form: edit, fieldError: editError, show: showEdit, submit: submitEdit } = useFormModal(emptyBooking)
function openEdit() {
    options.clients.load()
    options.zones.load()
    options.places.load()
    if (booking.value) showEdit(bookingToDraft(booking.value))
}
async function saveEdit() {
    if (await submitEdit((d) => api.patch(`/fleet/bookings/${uuid.value}`, draftToBody(d)))) {
        toast.add({ title: 'Booking saved', color: 'success' })
        await load()
    }
}

// Charges after the job (waiting, extra) are the only edit a closed booking takes.
const { form: extra, fieldError: extraError, show: showExtra, submit: submitExtra } = useFormModal(() => ({ waiting_minutes: '', waiting_rm: '', extra_rm: '', toll_rm: '', remarks: '' }))
function openExtra() {
    const b = booking.value!
    showExtra({ waiting_minutes: b.waiting_minutes ? String(b.waiting_minutes) : '', waiting_rm: toRm(b.waiting_charge_sen), extra_rm: toRm(b.extra_charge_sen), toll_rm: toRm(b.toll_sen), remarks: b.remarks ?? '' })
}
async function saveExtra() {
    if (await submitExtra((d) => api.patch(`/fleet/bookings/${uuid.value}`, {
        waiting_minutes: d.waiting_minutes ? Number(d.waiting_minutes) : null, waiting_charge_sen: toSen(d.waiting_rm) ?? 0,
        extra_charge_sen: toSen(d.extra_rm) ?? 0, toll_sen: toSen(d.toll_rm) ?? 0, remarks: d.remarks || null,
    }))) {
        toast.add({ title: 'Charges saved', color: 'success' })
        await load()
    }
}

// ---------------------------------------------------------------- closing
const { form: cancel, fieldError: cancelError, show: showCancel, submit: submitCancel } = useFormModal(() => ({ reason: '', cancellation: 'no_charge', charge_rm: '' }))
async function saveCancel() {
    if (await submitCancel((d) => api.post(`/fleet/bookings/${uuid.value}/cancel`, {
        reason: d.reason, cancellation: d.cancellation, cancellation_charge_sen: d.cancellation === 'with_charge' ? toSen(d.charge_rm) : null,
    }))) {
        toast.add({ title: 'Booking cancelled', color: 'success' })
        await load()
    }
}
const reasonAction = useReasonAction()
function cannotProvide() {
    reasonAction.ask({
        title: 'Cannot provide',
        label: 'Why (no car, no driver…)?',
        submitLabel: 'Mark cannot provide',
        run: async (reason) => {
            await api.post(`/fleet/bookings/${uuid.value}/cannot-provide`, { reason })
            toast.add({ title: 'Marked cannot provide', color: 'success' })
            await load()
        },
    })
}
const { form: transfer, fieldError: transferError, show: showTransfer, submit: submitTransfer } = useFormModal(() => ({
    transferred_to_organisation_id: undefined as number | undefined, cost_rm: '', reason: '',
}))
function openTransfer() {
    options.loadThirdParties()
    showTransfer()
}
async function saveTransfer() {
    if (await submitTransfer((d) => api.post(`/fleet/bookings/${uuid.value}/transfer`, {
        transferred_to_organisation_id: d.transferred_to_organisation_id, third_party_cost_sen: toSen(d.cost_rm), reason: d.reason || null,
    }))) {
        toast.add({ title: 'Booking transferred', color: 'success' })
        await load()
    }
}

// ---------------------------------------------------------------- assignment
const { form: assign, fieldError: assignError, show: showAssign, submit: submitAssign } = useFormModal(() => ({
    driver_id: undefined as number | undefined, vehicle_id: undefined as number | undefined, substitution_reason: '', pay_rm: '',
}))
function openAssign() {
    options.driverDate.value = pickupDate(booking.value!.pickup_at)
    options.drivers.load()
    options.vehicles.load()
    showAssign()
}
// The driver's usual vehicle comes with them unless another is chosen.
watch(() => assign.data.driver_id, (id) => {
    const usual = options.drivers.rows.value.find((d) => d.id === id)?.usual_vehicle_id
    if (usual) assign.data.vehicle_id = usual
})
const substituted = computed(() => {
    const v = options.vehicles.rows.value.find((x) => x.id === assign.data.vehicle_id)
    return !!v && !!booking.value && v.vehicle_class.toLowerCase() !== booking.value.vehicle_class.toLowerCase()
})
async function saveAssign() {
    if (await submitAssign((d) => api.post('/fleet/assignments', {
        fleet_booking_uuid: uuid.value, driver_id: d.driver_id, vehicle_id: d.vehicle_id,
        substitution_reason: d.substitution_reason || null, driver_pay_sen: toSen(d.pay_rm),
    }))) {
        toast.add({ title: 'Assigned', color: 'success' })
        await load()
    }
}
async function release(a: Assignment) {
    if (!confirm(`Take ${a.plate_no} · ${a.driver_name} off this booking?`)) return
    try {
        await api.post(`/fleet/assignments/${a.id}/release`)
        toast.add({ title: 'Taken off the job', color: 'success' })
        await load()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}
const changeLabel = (k: string) => k.replace(/_/g, ' ')
</script>

<template>
    <OpsDetailPage :title="booking ? `Booking ${booking.reference}` : 'Booking'" :fields="fields">
        <template #actions>
            <UAlert v-if="error" class="w-full" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />
            <template v-if="booking">
                <span class="rounded-md px-3 py-1.5 text-sm font-medium" :style="chip(booking.status)">{{ limoStatus(booking.status)?.label ?? booking.status }}</span>
                <template v-if="canWrite && !closed">
                    <UButton label="Edit" icon="i-bx-edit" color="success" variant="soft" @click="openEdit" />
                    <UButton label="Assign" icon="i-bx-user-plus" color="primary" variant="soft" @click="openAssign" />
                    <UDropdownMenu :items="statusItems"><UButton label="Status" icon="i-bx-arrow-left-right" color="neutral" variant="outline" trailing-icon="i-bx-chevron-down" /></UDropdownMenu>
                    <UButton label="Transfer" icon="i-bx-share" color="neutral" variant="outline" @click="openTransfer" />
                    <UButton label="Cannot provide" icon="i-bx-block" color="warning" variant="soft" @click="cannotProvide" />
                    <UButton label="Cancel" icon="i-bx-x" color="error" variant="soft" @click="showCancel()" />
                </template>
                <UButton v-if="canWrite && closed" label="Charges" icon="i-bx-receipt" color="neutral" variant="outline" @click="openExtra" />
                <UButton label="Back to the board" icon="i-bx-arrow-left-stroke" color="neutral" variant="ghost" to="/limo" />
            </template>
        </template>

        <template #body>
            <!-- Cars and drivers -->
            <div v-if="booking" class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                <div class="mb-3 flex items-center justify-between">
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">Cars and drivers</h4>
                    <span class="text-sm text-gray-500">{{ activeAssignments.length }} of {{ booking.vehicles_needed }} needed</span>
                </div>
                <p v-if="!booking.assignments.length" class="text-sm text-gray-500">No car or driver yet.</p>
                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="text-left text-xs uppercase text-gray-500">
                            <tr><th class="py-2 pr-3">Vehicle</th><th class="pr-3">Driver</th><th class="pr-3">Status</th><th class="pr-3">Moved</th><th class="pr-3">Picked up</th><th class="pr-3">Done</th><th /></tr>
                        </thead>
                        <tbody>
                            <tr v-for="a in booking.assignments" :key="a.id" class="border-t border-(--ops-border)" :class="['released', 'declined'].includes(a.status) ? 'opacity-50' : ''">
                                <td class="py-2 pr-3">
                                    {{ a.plate_no }} <span class="text-gray-500">{{ a.vehicle_class }}</span>
                                    <UBadge v-if="a.substituted" color="warning" variant="subtle" size="sm" class="ml-1" :title="a.substitution_reason ?? ''">substituted</UBadge>
                                </td>
                                <td class="pr-3">{{ a.driver_name }} <span class="text-gray-500">{{ a.driver_phone }}</span></td>
                                <td class="pr-3">{{ statusLabel(a.status) }}</td>
                                <td class="pr-3">{{ formatTime(a.moved_at) || '-' }}</td>
                                <td class="pr-3">{{ formatTime(a.started_at) || '-' }}</td>
                                <td class="pr-3">{{ formatTime(a.completed_at) || '-' }}</td>
                                <td class="text-right">
                                    <UButton v-if="canWrite && !closed && !['released', 'declined', 'completed'].includes(a.status)" label="Take off" size="xs" color="error" variant="ghost" @click="release(a)" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Client changes -->
            <div v-if="booking?.changes.length" class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
                <div class="mb-3 flex items-center justify-between">
                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">Client changes</h4>
                    <UButton label="Review changes" size="sm" variant="link" :to="`/limo/changes?booking=${booking.uuid}`" />
                </div>
                <div v-for="c in booking.changes" :key="c.id" class="border-t border-(--ops-border) py-2 text-sm first:border-t-0">
                    <div class="flex justify-between text-xs text-gray-500"><span>{{ formatDateTime(c.created_at) }}</span><span>{{ statusLabel(c.status) }}{{ c.reviewed_by_name ? ` by ${c.reviewed_by_name}` : '' }}</span></div>
                    <template v-for="(value, key) in c.new_values" :key="key">
                        <div v-if="!String(key).startsWith('_') && c.old_values?.[key] !== value" class="flex gap-2">
                            <span class="w-32 text-gray-500">{{ changeLabel(String(key)) }}</span>
                            <span class="text-gray-400 line-through">{{ c.old_values?.[key] ?? '—' }}</span>
                            <span>→ {{ value ?? '—' }}</span>
                        </div>
                    </template>
                </div>
            </div>
        </template>

        <template #aside>
            <div v-if="booking" class="flex flex-col gap-6">
                <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5 text-sm">
                    <h4 class="mb-3 text-lg font-semibold text-gray-800 dark:text-white/90">Charges</h4>
                    <div v-for="[label, sen] in charges" :key="label" class="flex justify-between py-1"><span class="text-gray-500">{{ label }}</span><span>{{ formatSen(sen) }}</span></div>
                    <div class="mt-2 flex justify-between border-t border-(--ops-border) pt-2 font-semibold"><span>Total</span><span>{{ formatSen(booking.total_sen) }}</span></div>
                    <template v-if="booking.status === 'cancelled'">
                        <div class="mt-3 flex justify-between"><span class="text-gray-500">Cancellation</span><span>{{ booking.cancellation === 'with_charge' ? formatSen(booking.cancellation_charge_sen ?? 0) : 'No charge' }}</span></div>
                    </template>
                    <div v-if="booking.transferred_to_name" class="mt-3 flex justify-between"><span class="text-gray-500">Transferred to</span><span>{{ booking.transferred_to_name }}{{ booking.third_party_cost_sen ? ` · ${formatSen(booking.third_party_cost_sen)}` : '' }}</span></div>
                    <p v-if="booking.cancel_reason" class="mt-3 text-gray-500">Reason: {{ booking.cancel_reason }}</p>
                </div>
                <div v-if="booking.message" class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5 text-sm">
                    <h4 class="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">WhatsApp message</h4>
                    <p class="mb-2 text-xs text-gray-500">{{ booking.message.sender_name }} · {{ formatDateTime(booking.message.received_at) }}</p>
                    <pre class="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">{{ booking.message.body }}</pre>
                </div>
            </div>
        </template>
    </OpsDetailPage>

    <OpsFormModal v-model:open="edit.open" title="Edit Booking" wide :saving="edit.saving" :error="edit.error" submit-label="Save Booking" @submit="saveEdit">
        <FleetBookingFields :data="edit.data" :field-error="editError" :options="options.items" />
    </OpsFormModal>

    <OpsFormModal v-model:open="assign.open" title="Assign Car and Driver" :saving="assign.saving" :error="assign.error" submit-label="Assign" @submit="saveAssign">
        <OpsFormField label="Driver (free that day first)" required full :error="assignError('driver_id')">
            <USelectMenu v-model="assign.data.driver_id" :items="options.items.drivers.value" value-key="value" :loading="options.drivers.pending.value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Vehicle" required full :error="assignError('vehicle_id')">
            <USelectMenu v-model="assign.data.vehicle_id" :items="options.items.vehicles.value" value-key="value" :loading="options.vehicles.pending.value" class="w-full" />
        </OpsFormField>
        <OpsFormField v-if="substituted" label="Why a different vehicle?" full :error="assignError('substitution_reason')">
            <UInput v-model="assign.data.substitution_reason" placeholder="Few passengers, no Alphard free…" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Pay to the driver for this trip (RM)" :error="assignError('driver_pay_sen')"><UInput v-model="assign.data.pay_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
    </OpsFormModal>

    <OpsFormModal v-model:open="cancel.open" title="Cancel Booking" :saving="cancel.saving" :error="cancel.error" submit-label="Cancel Booking" @submit="saveCancel">
        <OpsFormField label="Charge" required full :error="cancelError('cancellation')">
            <URadioGroup v-model="cancel.data.cancellation" :items="[{ label: 'No charge', value: 'no_charge' }, { label: 'With charge', value: 'with_charge' }]" orientation="horizontal" />
        </OpsFormField>
        <OpsFormField v-if="cancel.data.cancellation === 'with_charge'" label="Cancellation charge (RM)" required :error="cancelError('cancellation_charge_sen')">
            <UInput v-model="cancel.data.charge_rm" type="number" min="0" step="0.01" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Reason" required full :error="cancelError('reason')"><UTextarea v-model="cancel.data.reason" :rows="2" class="w-full" /></OpsFormField>
    </OpsFormModal>

    <OpsFormModal v-model:open="transfer.open" title="Transfer to a Third Party" :saving="transfer.saving" :error="transfer.error" submit-label="Transfer" @submit="saveTransfer">
        <OpsFormField label="Taken by" required full :error="transferError('transferred_to_organisation_id')">
            <USelectMenu v-model="transfer.data.transferred_to_organisation_id" :items="options.items.thirdParties.value" value-key="value" class="w-full" />
            <p v-if="!options.items.thirdParties.value.length" class="mt-1 text-xs text-gray-500">Add the partner under Clients first.</p>
        </OpsFormField>
        <OpsFormField label="What they charge us (RM)" :error="transferError('third_party_cost_sen')"><UInput v-model="transfer.data.cost_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Note" full :error="transferError('reason')"><UInput v-model="transfer.data.reason" class="w-full" /></OpsFormField>
    </OpsFormModal>

    <OpsFormModal v-model:open="extra.open" title="Charges After the Job" :saving="extra.saving" :error="extra.error" submit-label="Save Charges" @submit="saveExtra">
        <OpsFormField label="Waiting (minutes)" :error="extraError('waiting_minutes')"><UInput v-model="extra.data.waiting_minutes" type="number" min="0" class="w-full" /></OpsFormField>
        <OpsFormField label="Waiting charge (RM)" :error="extraError('waiting_charge_sen')"><UInput v-model="extra.data.waiting_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Extra charge (RM)" :error="extraError('extra_charge_sen')"><UInput v-model="extra.data.extra_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Toll (RM)" :error="extraError('toll_sen')"><UInput v-model="extra.data.toll_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Remarks" full :error="extraError('remarks')"><UInput v-model="extra.data.remarks" class="w-full" /></OpsFormField>
    </OpsFormModal>

    <OpsReasonModal :action="reasonAction" />
</template>
