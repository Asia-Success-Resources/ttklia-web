<script setup lang="ts">
// The limo booking's fields (doc 19, "How the sheet maps"), inside an OpsFormModal or a form page: client and RSVN,
// pickup (Malaysia time), from and to (as keyed, with the known place and the fare zone), guest, vehicles and requests,
// flight and remarks, then the money in RM. With no price and both zones set, the API prices it from the limo fare.
export type BookingDraft = {
    client_organisation_id: number | undefined
    client_reference: string
    pickup_at: string
    return_at: string
    hours: string
    from_text: string
    from_poi_id: number | undefined
    from_zone_id: number | undefined
    to_text: string
    to_poi_id: number | undefined
    to_zone_id: number | undefined
    guest_name: string
    guest_phone: string
    pax_count: string
    vehicle_class: string
    vehicles_needed: string
    flight_no: string
    requirements: string[]
    remarks: string
    price_rm: string
    toll_rm: string
    discount_rm: string
    sst_rm: string
}

const props = defineProps<{
    data: BookingDraft
    fieldError: (key: string) => string | null | undefined
    options: ReturnType<typeof useFleetOptions>['items']
}>()
const d = props.data
</script>

<template>
    <OpsFormField label="Client" :error="props.fieldError('client_organisation_id')">
        <USelectMenu v-model="d.client_organisation_id" :items="[{ label: 'No client (walk-in)', value: undefined }, ...props.options.clients.value]" value-key="value" class="w-full" />
    </OpsFormField>
    <OpsFormField label="RSVN (client reservation no.)" :error="props.fieldError('client_reference')"><UInput v-model="d.client_reference" class="w-full" /></OpsFormField>
    <OpsFormField label="Pickup" required :error="props.fieldError('pickup_at')"><UInput v-model="d.pickup_at" type="datetime-local" class="w-full" /></OpsFormField>
    <OpsFormField label="Return (or by the hour)" :error="props.fieldError('return_at') ?? props.fieldError('hours')">
        <div class="flex gap-2">
            <UInput v-model="d.return_at" type="datetime-local" class="flex-1" />
            <UInput v-model="d.hours" type="number" min="0" step="0.5" placeholder="Hours" class="w-24" />
        </div>
    </OpsFormField>

    <p class="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2">From and to</p>
    <OpsFormField label="From (as keyed)" :error="props.fieldError('from_text')"><UInput v-model="d.from_text" placeholder="KLIA2, GHR, an address…" class="w-full" /></OpsFormField>
    <OpsFormField label="To (as keyed)" :error="props.fieldError('to_text')"><UInput v-model="d.to_text" class="w-full" /></OpsFormField>
    <OpsFormField label="From place" :error="props.fieldError('from_poi_id')">
        <USelectMenu v-model="d.from_poi_id" :items="[{ label: '—', value: undefined }, ...props.options.places.value]" value-key="value" class="w-full" />
    </OpsFormField>
    <OpsFormField label="To place" :error="props.fieldError('to_poi_id')">
        <USelectMenu v-model="d.to_poi_id" :items="[{ label: '—', value: undefined }, ...props.options.places.value]" value-key="value" class="w-full" />
    </OpsFormField>
    <OpsFormField label="Pickup zone" :error="props.fieldError('from_zone_id')">
        <USelectMenu v-model="d.from_zone_id" :items="[{ label: '—', value: undefined }, ...props.options.zones.value]" value-key="value" class="w-full" />
    </OpsFormField>
    <OpsFormField label="Dropoff zone" :error="props.fieldError('to_zone_id')">
        <USelectMenu v-model="d.to_zone_id" :items="[{ label: '—', value: undefined }, ...props.options.zones.value]" value-key="value" class="w-full" />
    </OpsFormField>

    <p class="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2">Guest and vehicle</p>
    <OpsFormField label="Guest name" :error="props.fieldError('guest_name')"><UInput v-model="d.guest_name" class="w-full" /></OpsFormField>
    <OpsFormField label="Guest phone" :error="props.fieldError('guest_phone')"><UInput v-model="d.guest_phone" class="w-full" /></OpsFormField>
    <OpsFormField label="Pax" :error="props.fieldError('pax_count')"><UInput v-model="d.pax_count" type="number" min="1" class="w-full" /></OpsFormField>
    <OpsFormField label="Flight no." :error="props.fieldError('flight_no')"><UInput v-model="d.flight_no" class="w-full uppercase" /></OpsFormField>
    <OpsFormField label="Vehicle" required :error="props.fieldError('vehicle_class')"><USelect v-model="d.vehicle_class" :items="VEHICLE_CLASSES" class="w-full" /></OpsFormField>
    <OpsFormField label="Cars needed" :error="props.fieldError('vehicles_needed')"><UInput v-model="d.vehicles_needed" type="number" min="1" max="10" class="w-full" /></OpsFormField>
    <OpsFormField label="Requests" full :error="props.fieldError('requirements')">
        <UCheckboxGroup v-model="d.requirements" :items="REQUIREMENTS" orientation="horizontal" />
    </OpsFormField>
    <OpsFormField label="Remarks" full :error="props.fieldError('remarks')"><UTextarea v-model="d.remarks" :rows="2" class="w-full" /></OpsFormField>

    <p class="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2">Charges (RM)</p>
    <OpsFormField label="Price (empty: from the limo fare)" :error="props.fieldError('price_sen')"><UInput v-model="d.price_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
    <OpsFormField label="Toll" :error="props.fieldError('toll_sen')"><UInput v-model="d.toll_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
    <OpsFormField label="Discount" :error="props.fieldError('discount_sen')"><UInput v-model="d.discount_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
    <OpsFormField label="SST" :error="props.fieldError('sst_sen')"><UInput v-model="d.sst_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
</template>
