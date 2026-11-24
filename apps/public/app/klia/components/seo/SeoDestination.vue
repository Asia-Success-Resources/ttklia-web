<script setup lang="ts">
// klia-bus frontend/seo/destination.blade.php: the bus route landing page, shared by /bus/klia2-to-{slug} and
// /bus/lalaport-to-{slug} (SeoController::busDestination).
import { trans } from 'laravel-vue-i18n'
import { DESTINATIONS, LALAPORT_DESTINATIONS, busFromKlia2, busFromLalaport } from '~/klia/explore'
import { BUS_ORIGINS, breadcrumbsSchema, fmt, resolveDate, schemaProvider, ymd, mytToday, type BusOriginKey } from '~/klia/seo'
import { faqSchema } from '~/composables/useKliaSeo'

const props = defineProps<{ origin: BusOriginKey; slug: string }>()
const o = BUS_ORIGINS[props.origin]
const destination = (o.key === 'lalaport' ? LALAPORT_DESTINATIONS : DESTINATIONS).find((d) => d.slug === props.slug)
if (!destination) throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })

const { locale } = useKlia()
const route = useRoute()
const site = useRequestURL().origin
const place = destination.name
const state = destination.state ?? ''
const pageUrl = `${site}${o.prefix}${destination.slug}`
const otherLinks = o.key === 'lalaport' ? busFromLalaport(null, props.slug) : busFromKlia2(null, props.slug)
const date = computed(() => resolveDate(route.query.date))
// TODO(api): RouteDepartures::find(origin, actual_name, date) from a public ttklia-api trip search.
const departures = computed(() => ({ zone: null, trips: [], failed: true }))

const crumbs = [
    { label: 'Home', url: `${site}/` },
    { label: o.indexLabel, url: `${site}${o.index}` },
    { label: `${o.name} to ${place}`, url: pageUrl },
]
const faqs = [
    { q: `How do I book a bus from ${o.name} to ${place}?`, a: `Simply search for ${o.name} to ${place} on TTKLIA, select your preferred date and time, choose a bus operator, and complete your booking online. You will receive an e-ticket instantly.` },
    { q: `Where is the bus pickup point at ${o.long}?`, a: o.pickup },
    { q: `Can I cancel or reschedule my ${o.name} to ${place} bus ticket?`, a: 'Cancellation and rescheduling policies vary by bus operator. Please check the terms during booking or contact customer support via WhatsApp for assistance.' },
]
const reasons = [
    { title: 'Instant booking', text: 'Book and receive your e-ticket immediately' },
    { title: 'Compare operators', text: 'View prices from multiple bus operators' },
    { title: 'Secure payment', text: 'Safe online payment with multiple options' },
    { title: 'WhatsApp support', text: 'Customer support via WhatsApp, day and night' },
]
const searchSummary = computed(() => `${o.name} → ${place} · `
    + (ymd(date.value) === ymd(mytToday()) ? trans('Today') : fmt(date.value, locale.value, { weekday: 'short', day: 'numeric', month: 'short' }))
    + ' · ' + trans('1 passenger'))

useKliaSeo({
    title: `${o.name} Bus to ${place}, ${state} | Book Online - TTKLIA`,
    description: `Book ${o.long} bus to ${place}, ${state}. Direct express bus service from ${o.name} to ${place}. Compare prices, check schedules & book online instantly.`,
    canonical: pageUrl,
    ogTitle: `${o.name} Bus to ${place}, ${state} | TTKLIA`,
    schemas: [
        {
            '@context': 'https://schema.org',
            '@type': 'BusTrip',
            name: `${o.name} Bus to ${place}`,
            description: `Express bus service from ${o.hub} to ${place}, ${state}`,
            departureBusStop: { '@type': 'BusStation', name: o.station, address: o.address },
            arrivalBusStop: { '@type': 'BusStation', name: place, address: `${place}, ${state}` },
            provider: schemaProvider(site),
        },
        faqSchema(faqs),
        breadcrumbsSchema(crumbs, pageUrl),
    ],
})
</script>

<template>
    <SeoHero
        :crumbs="crumbs"
        :route="[o.long, place]"
        :title="`${o.name} Bus to ${place}`"
        :sub="`Express buses from ${o.hub} to ${place}, ${state}. Pick a departure below or search another date.`"
        :search-summary="searchSummary"
        :origin="o.key"
        :visible-tabs="['bus']"
        :preset-zone="destination!.actual_name ?? place"
        :date="ymd(date)"
    />

    <div class="container section">
        <SeoDepartures :bus-origin="o" :destination="destination!" :date="date" :departures="departures" />

        <div class="row g-4">
            <div class="col-lg-8">
                <section class="content-card">
                    <h2>Book your bus from {{ o.long }} to {{ place }}, {{ state }}</h2>
                    <p>
                        Looking for a bus from <strong>{{ o.long }} to {{ place }}</strong>? Book your express bus tickets online with TTKLIA.
                        We offer direct bus services from <strong>{{ o.hub }}</strong> to
                        <strong>{{ place }}, {{ state }}</strong> with multiple departure times throughout the day.
                    </p>
                    <p>
                        Travel comfortably from {{ o.long }} to {{ place }} with air-conditioned express buses.
                        Compare prices from different bus operators, check available schedules, and book your tickets instantly online.
                    </p>
                </section>

                <section class="content-card">
                    <h2>Why book {{ o.name }} to {{ place }} bus with TTKLIA?</h2>
                    <ul class="check-list">
                        <li v-for="reason in reasons" :key="reason.title">
                            <XIcon name="circle-check" />
                            <div><strong>{{ reason.title }}</strong><span>{{ reason.text }}</span></div>
                        </li>
                    </ul>
                </section>

                <section class="content-card">
                    <h2>{{ o.name }} to {{ place }} bus information</h2>
                    <table class="info-table">
                        <tbody>
                            <tr><th scope="row">Departure point</th><td>{{ o.departure }}</td></tr>
                            <tr><th scope="row">Arrival point</th><td>{{ place }}, {{ state }}</td></tr>
                            <tr><th scope="row">Bus type</th><td>Express / Standard</td></tr>
                            <tr><th scope="row">Booking method</th><td>Online via TTKLIA</td></tr>
                        </tbody>
                    </table>
                </section>

                <SeoFaq :faqs="faqs" />
            </div>

            <div class="col-lg-4">
                <SeoLinkList :title="`Other ${o.name} bus destinations`" :links="otherLinks" />
            </div>
        </div>
    </div>
</template>
