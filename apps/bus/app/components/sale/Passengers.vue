<script setup lang="ts">
// "Passenger Details" laid out as in ttklia-v2: one numbered block per seat or ticket
// ("Passenger 1 - Seat 3"), each with "Copy from" the first one. `boxed` puts it in its own card
// (Create Booking, below the seats); without it the section sits inside the details card under a rule (Tour Booking).
import type { SalePassenger } from '~/types/sale'

const props = defineProps<{ slots: { key: string; label: string; short?: string }[]; boxed?: boolean }>()
const passengers = defineModel<Record<string, SalePassenger>>({ default: () => ({}) })

watchEffect(() => {
    for (const slot of props.slots) {
        if (!passengers.value[slot.key]) passengers.value[slot.key] = { name: '', phone: '', id_no: '', email: '' }
    }
})

function copyFromFirst(key: string) {
    const first = props.slots[0]
    if (first && passengers.value[first.key]) passengers.value[key] = { ...passengers.value[first.key]! }
}
</script>

<template>
    <div
        v-if="props.slots.length"
        :class="props.boxed
            ? 'rounded-xl border border-(--ops-border) bg-(--ops-card) p-6 shadow-sm'
            : 'mt-6 border-t border-(--ops-border) pt-6'"
    >
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Passenger Details</h3>
        <div class="space-y-4">
            <div v-for="(slot, idx) in props.slots" :key="slot.key" class="rounded-lg border border-(--ops-border) p-4">
                <div class="mb-3 flex items-center gap-2">
                    <UBadge :label="String(idx + 1)" variant="soft" size="lg" />
                    <span class="text-sm font-semibold text-gray-800 dark:text-white">{{ slot.label }}</span>
                    <UButton
                        v-if="idx > 0"
                        :label="`Copy from ${props.slots[0]!.short ?? props.slots[0]!.label}`"
                        size="xs"
                        variant="link"
                        class="ml-auto"
                        @click="copyFromFirst(slot.key)"
                    />
                </div>
                <div v-if="passengers[slot.key]" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <UFormField label="Name" required>
                        <UInput v-model="passengers[slot.key]!.name" class="w-full" />
                    </UFormField>
                    <UFormField label="Phone Number" required>
                        <UInput v-model="passengers[slot.key]!.phone" class="w-full" />
                    </UFormField>
                    <UFormField label="ID / Passport">
                        <UInput v-model="passengers[slot.key]!.id_no" class="w-full" />
                    </UFormField>
                    <UFormField label="Email">
                        <UInput v-model="passengers[slot.key]!.email" type="email" class="w-full" />
                    </UFormField>
                </div>
            </div>
        </div>
    </div>
</template>
