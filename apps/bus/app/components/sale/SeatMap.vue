<script setup lang="ts">
// The bus seat plan laid out as in ttklia-v2: seats on the layout's row × column grid (gaps are
// aisles), lower and upper deck side by side, with "Available" and "Remaining" above.
// `max` is how many seats may be picked (tickets in a booking, 1 in a collection).
export interface SaleSeat { uuid: string; seat_no: string; deck: 'lower' | 'upper'; row: number; column: number; available: boolean }

const props = defineProps<{ seats: SaleSeat[]; max: number; title?: string; loading?: boolean }>()
const selected = defineModel<string[]>({ default: () => [] })

function plan(deck: 'lower' | 'upper') {
    const list = props.seats.filter((s) => s.deck === deck)
    if (!list.length) return null
    const cols = Math.max(...list.map((s) => s.column)) + 1
    const rows = Math.max(...list.map((s) => s.row)) + 1
    const cells: (SaleSeat | null)[] = Array.from({ length: rows * cols }, () => null)
    for (const s of list) cells[s.row * cols + s.column] = s
    return { cols, cells }
}
const decks = computed(() => {
    const lower = plan('lower')
    const upper = plan('upper')
    return [
        lower && { name: upper ? 'Lower Deck' : '', ...lower },
        upper && { name: 'Upper Deck', ...upper },
    ].filter((d): d is NonNullable<typeof d> => !!d)
})
const available = computed(() => props.seats.filter((s) => s.available).length)
const remaining = computed(() => props.max - selected.value.length)

const isSelected = (seat: SaleSeat) => selected.value.includes(seat.seat_no)
const disabled = (seat: SaleSeat) => !isSelected(seat) && (!seat.available || remaining.value <= 0)

// Selected: filled; available: green border; taken: the plain border, faded by `disabled`.
function seatClass(seat: SaleSeat) {
    if (isSelected(seat)) return 'border-primary bg-primary text-white'
    if (seat.available) return 'border-success hover:bg-success/10'
    return 'border-(--ops-border)'
}

function toggle(seat: SaleSeat) {
    if (isSelected(seat)) selected.value = selected.value.filter((s) => s !== seat.seat_no)
    else if (!disabled(seat)) selected.value = [...selected.value, seat.seat_no]
}
</script>

<template>
    <div>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ props.title ?? 'Select Seats' }}<span class="ms-0.5 text-error">*</span></h3>
            <div v-if="!props.loading" class="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Available: <span class="font-semibold text-success">{{ available }}</span></span>
                <span>Remaining: <span class="font-semibold text-primary">{{ remaining }}</span></span>
            </div>
        </div>
        <div v-if="props.loading" class="flex justify-center py-6">
            <UIcon name="i-bx-loader-lines" class="size-6 animate-spin text-gray-400" />
        </div>
        <template v-else>
            <div class="grid max-h-[50vh] gap-4 overflow-y-auto" :class="decks.length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'">
                <div v-for="deck in decks" :key="deck.name">
                    <h5 v-if="deck.name" class="mb-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">{{ deck.name }}</h5>
                    <div class="flex justify-center">
                        <div class="inline-grid gap-2" :style="{ gridTemplateColumns: `repeat(${deck.cols}, minmax(0, 1fr))` }">
                            <template v-for="(seat, i) in deck.cells" :key="seat?.uuid ?? `gap-${i}`">
                                <button
                                    v-if="seat"
                                    type="button"
                                    :disabled="disabled(seat)"
                                    class="size-11 rounded-md border-2 text-center text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
                                    :class="seatClass(seat)"
                                    @click="toggle(seat)"
                                >
                                    {{ seat.seat_no }}
                                </button>
                                <div v-else class="size-11" />
                            </template>
                        </div>
                    </div>
                </div>
            </div>
            <p v-if="props.seats.length === 0" class="text-sm text-gray-500">No seat map for this trip yet.</p>
        </template>
    </div>
</template>
