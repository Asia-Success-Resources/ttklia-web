<script setup lang="ts">
// New limo booking (the limo sheet's new row, doc 19): the booking form, saved with POST /fleet/bookings, then the
// booking opens to assign its car and driver. Bookings from WhatsApp are made from the Inbox instead.
// Permission: fleet.limo.write (doc 27).
useHead({ title: 'New limo booking' })

const api = useFleetApi()
const toast = useToast()
const options = useFleetOptions()
onMounted(() => {
    options.clients.load()
    options.zones.load()
    options.places.load()
})

const { form, fieldError, show, submit } = useFormModal(emptyBooking)
show()
async function save() {
    let uuid = ''
    const saved = await submit(async (d) => {
        uuid = (await api.post<{ data: { uuid: string; reference: string } }>('/fleet/bookings', draftToBody(d))).data.uuid
    })
    if (saved && uuid) {
        toast.add({ title: 'Booking saved', color: 'success' })
        await navigateTo(`/limo/${uuid}`)
    }
}
</script>

<template>
    <div>
        <OpsBreadcrumb title="New limo booking" />
        <form class="rounded-2xl border border-(--ops-border) bg-(--ops-card)" @submit.prevent="save">
            <div class="border-b border-(--ops-border) px-6 py-4">
                <h2 class="text-lg font-medium text-gray-800 dark:text-white">Booking</h2>
                <p class="text-sm text-gray-500">Times are Malaysia time. Assign the car and driver after saving.</p>
            </div>
            <div class="grid grid-cols-1 gap-4 p-6 text-sm sm:grid-cols-2">
                <FleetBookingFields :data="form.data" :field-error="fieldError" :options="options.items" />
            </div>
            <UAlert v-if="form.error" class="mx-6 mb-4" color="error" variant="soft" :title="form.error" />
            <div class="flex gap-3 border-t border-(--ops-border) px-6 py-4">
                <UButton type="submit" label="Save booking" icon="i-bx-save" :loading="form.saving" />
                <UButton label="Cancel" color="neutral" variant="outline" to="/limo" />
            </div>
        </form>
    </div>
</template>
