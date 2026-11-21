<script setup lang="ts">
// The passenger's charge lines, the same on every channel before payment (doc 23, TBS structure):
// sale: Fare, Facility charge (APAD); collection: Facility charge (APAD), Boarding pass fee, SST 8% on it.
// The lines and amounts come from the API's quote or order (Pricing quote, doc 02); nothing is worked out here.
// The operator-side ticket and commercial charges are never shown to the passenger.
export interface ChargeLine {
    label: string
    /** e.g. "2 × RM35.00"; optional. */
    detail?: string | null
    amount_sen: number
}

defineProps<{ lines: ChargeLine[] }>()
</script>

<template>
    <div v-for="line in lines" :key="line.label" class="flex justify-between">
        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ line.label }}<span v-if="line.detail" class="ml-2 text-xs text-gray-400">{{ line.detail }}</span>
        </dt>
        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ formatSen(line.amount_sen) }}</dd>
    </div>
</template>
