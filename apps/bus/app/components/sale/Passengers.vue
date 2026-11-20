<script setup lang="ts">
// "Passenger Details": one block per seat or ticket, with "Copy from" the first one.
import type { SalePassenger } from '~/types/sale'

const props = defineProps<{ slots: { key: string; label: string }[] }>()
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
    <div v-if="props.slots.length" class="mt-6 rounded-xl border border-(--ops-border) bg-(--ops-card) p-6 shadow-sm">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Passenger Details</h3>
        <div class="space-y-4">
            <div v-for="(slot, idx) in props.slots" :key="slot.key" class="rounded-lg border border-(--ops-border) p-4">
                <div class="mb-3 flex items-center justify-between">
                    <span class="text-sm font-semibold text-gray-800 dark:text-white">{{ slot.label }}</span>
                    <UButton
                        v-if="idx > 0"
                        :label="`Copy from ${props.slots[0]!.label}`"
                        size="xs"
                        variant="link"
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
