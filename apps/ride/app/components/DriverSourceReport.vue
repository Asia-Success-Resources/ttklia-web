<script setup lang="ts">
// Driver Source Report (doc 36): who got the bookings, GM or Public Drivers, the contested ones, outranked accepts and
// how long Public accepts were held. GET /reports/driver-source?from&to&source&service&driver_id. Permission:
// ride.reports.driver_source (doc 27). Driver names are shown; phone numbers are not.
interface Summary {
    total_claimed: number; gm_bookings: number; gm_pct: number; public_bookings: number; public_pct: number; contested: number
    public_outranked_by_gm: number; outranked_same_source: number; average_hold_seconds: number; longest_hold_seconds: number
    gm_fares_sen: number; public_fares_sen: number
}
interface Contested {
    booking: string; at: string; service: string; winner: string | null; why: string; hold_seconds: number
    accepted: { driver: string; source: string; seconds: number }[]
}

const source = ref<string | undefined>(undefined)
const service = ref<string | undefined>(undefined)
const query = computed(() => ({ source: source.value, service: service.value }))

const cards = (s: Summary) => [
    { group: 'Overview', label: 'Total Bookings Claimed', value: s.total_claimed.toLocaleString('en-MY'), hint: 'Bookings a driver got in the period, every service.' },
    { group: 'Overview', label: 'GM Driver Bookings', value: `${s.gm_bookings.toLocaleString('en-MY')} (${s.gm_pct}%)`, hint: 'Bookings that went to a GM Driver, including drivers who are both.' },
    { group: 'Overview', label: 'Public Driver Bookings', value: `${s.public_bookings.toLocaleString('en-MY')} (${s.public_pct}%)`, hint: 'Bookings that went to a Public Driver.' },
    { group: 'Overview', label: 'Contested Bookings', value: s.contested.toLocaleString('en-MY'), hint: 'Bookings that more than one driver accepted.' },
    { group: 'Priority', label: 'Public Outranked by GM', value: s.public_outranked_by_gm.toLocaleString('en-MY'), hint: 'Times a Public Driver accepted first but a GM Driver got the booking.' },
    { group: 'Priority', label: 'Outranked, Same Source', value: s.outranked_same_source.toLocaleString('en-MY'), hint: 'Times a driver lost to a faster driver of the same source.' },
    { group: 'Priority', label: 'Average Hold', value: `${s.average_hold_seconds} s`, hint: "Average seconds a Public Driver's accept was held while a GM offer was open." },
    { group: 'Priority', label: 'Longest Hold', value: `${s.longest_hold_seconds} s`, hint: 'The longest single hold in the period.' },
    { group: 'Fares', label: 'GM Driver Fares', value: formatSen(s.gm_fares_sen), hint: 'RM value of completed rides by GM Drivers.' },
    { group: 'Fares', label: 'Public Driver Fares', value: formatSen(s.public_fares_sen), hint: 'RM value of completed rides by Public Drivers.' },
]
</script>

<template>
    <RideReport report="driver-source" title="Driver Source Report" note="Bookings claimed by GM and Public Drivers. A GM Driver beats a Public Driver who accepted the same booking." :query="query">
        <template #filters>
            <USelect v-model="source" :items="DRIVER_SOURCES" class="w-36" />
            <USelect v-model="service" :items="[{ label: 'All services', value: undefined }, { label: 'Ride now', value: 'now' }, { label: 'Scheduled', value: 'scheduled' }]" class="w-36" />
        </template>
        <template #summary="{ data }">
            <div class="grid gap-3 border-t border-gray-100 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-gray-800">
                <div v-for="c in cards(data.summary as Summary)" :key="c.label" class="rounded-lg border border-(--ops-border) p-3">
                    <div class="text-xs uppercase text-gray-500">{{ c.group }} · {{ c.label }}</div>
                    <div class="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">{{ c.value }}</div>
                    <div class="mt-1 text-xs text-gray-500">{{ c.hint }}</div>
                </div>
            </div>
        </template>
        <template #after="{ data }">
            <div class="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
                <h4 class="mb-3 font-medium text-gray-800 dark:text-white/90">Contested Bookings ({{ (data.contested as Contested[]).length }})</h4>
                <p v-if="!(data.contested as Contested[]).length" class="text-sm text-gray-500">No booking was accepted by more than one driver in these days.</p>
                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="text-left text-xs uppercase text-gray-500">
                            <tr><th class="py-2 pr-4">Booking</th><th class="py-2 pr-4">When</th><th class="py-2 pr-4">Service</th><th class="py-2 pr-4">Accepted, in order</th><th class="py-2 pr-4">Got it</th><th class="py-2 pr-4">Why</th><th class="py-2 pr-4 text-right">Hold</th></tr>
                        </thead>
                        <tbody>
                            <tr v-for="c in (data.contested as Contested[])" :key="c.booking" class="border-t border-gray-100 align-top dark:border-gray-800">
                                <td class="py-2 pr-4"><NuxtLink :to="`/requests/${c.booking}`" class="text-primary">{{ c.booking.slice(0, 8) }}</NuxtLink></td>
                                <td class="py-2 pr-4">{{ formatDateTime(c.at) }}</td>
                                <td class="py-2 pr-4">{{ c.service }}</td>
                                <td class="py-2 pr-4">
                                    <div v-for="(a, i) in c.accepted" :key="i">{{ a.driver }} <span class="text-gray-500">({{ a.source === 'gm' ? 'GM' : 'Public' }}, {{ a.seconds }} s)</span></div>
                                </td>
                                <td class="py-2 pr-4">{{ c.winner ?? '—' }}</td>
                                <td class="py-2 pr-4">{{ c.why }}</td>
                                <td class="py-2 pr-4 text-right tabular-nums">{{ c.hold_seconds }} s</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>
    </RideReport>
</template>
