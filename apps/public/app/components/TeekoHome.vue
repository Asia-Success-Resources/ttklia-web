<script setup lang="ts">
// The Teeko e-hailing home on teeko.ai, top to bottom as doc 09 lists it (header and footer are in the layout).
// Prices come live from fare_rules through the API, never typed into the page.
// TODO(api): "from RM x" per car type from POST /quotes or a fares endpoint (doc 04 has none for a price list yet).
// TODO(pending: W3) App Store and Google Play links; TODO(pending: W4) driver requirements and earnings wording.

const route = reactive({ pickup: '', dropoff: '' })
const when = ref<'now' | 'schedule'>('now')
const scheduledFor = ref('')

async function seeFares() {
    await navigateTo({
        path: '/ride',
        query: { from: route.pickup || undefined, to: route.dropoff || undefined, at: when.value === 'schedule' ? scheduledFor.value || undefined : undefined },
    })
}

/** Teeko's car types (doc 09). Seats per type come from the API with the price. */
const carTypes = ['Teeko Economy', 'Teeko Premier', 'Teeko 6', 'Teeko Luxe', 'Teeko Exec (Alphard)']

/** Doc 09: show each point only if the service really does it at launch. */
const whyTeeko = [
    { icon: 'i-bx-receipt', title: 'Fare shown before you book', text: 'You see the price before you confirm.' },
    { icon: 'i-bx-badge-check', title: 'Verified drivers', text: 'Every driver is licensed and checked.' },
    { icon: 'i-bx-wallet', title: 'Pay your way', text: 'Card, e-wallet or cash.' },
    { icon: 'i-bx-calendar', title: 'Book ahead', text: 'Schedule a ride up to 30 days ahead.' },
]

const faqs = [
    { label: 'How are fares worked out?', content: 'You see the fare for each car type before you book, based on your pickup and drop-off.' },
    { label: 'Can I schedule a ride?', content: 'Yes. Choose Schedule and pick a time up to 30 days ahead. We start finding your driver before the pickup time.' },
    { label: 'Can I cancel?', content: 'A scheduled ride can be cancelled free until a driver is assigned.' },
    { label: 'How can I pay?', content: 'By card, e-wallet or cash.' },
    { label: 'I left something in the car', content: 'Open the ride in your account and contact help; we will reach the driver.' },
    { label: 'How do you keep me safe?', content: 'Drivers are verified, and every ride is tracked from pickup to drop-off.' },
    { label: 'Where do I meet my driver at KLIA2?', content: 'At the e-hailing pickup point, Level 1, Door 5.' },
]

useSeoMeta({
    title: 'Teeko: e-hailing in Malaysia, book now or schedule',
    description: 'Book a Teeko ride now or schedule one ahead, with airport pickups at KLIA and KLIA2. See the fare before you book.',
})
useHead({
    script: [
        {
            type: 'application/ld+json',
            // TODO(pending: W1, W3) logo, legal name and app store URLs for Organization and MobileApplication.
            innerHTML: JSON.stringify([
                { '@context': 'https://schema.org', '@type': 'Organization', name: 'Teeko' },
                { '@context': 'https://schema.org', '@type': 'MobileApplication', name: 'Teeko', applicationCategory: 'TravelApplication', operatingSystem: 'Android, iOS' },
                {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.label, acceptedAnswer: { '@type': 'Answer', text: f.content } })),
                },
            ]),
        },
    ],
})
</script>

<template>
    <div class="space-y-16">
        <!-- 2. Hero with booking box: on a phone the box comes first, the badges below -->
        <section class="grid items-center gap-8 md:grid-cols-2">
            <div>
                <h1 class="text-4xl font-bold">Ride with Teeko</h1>
                <p class="mt-2 text-muted">Book now or schedule ahead, anywhere in the Klang Valley and to the airports.</p>
                <div class="mt-6 hidden gap-3 md:flex">
                    <TeekoStoreBadges />
                </div>
            </div>
            <UCard>
                <form class="space-y-4" @submit.prevent="seeFares">
                    <UFormField label="Pickup" name="pickup"><UInput v-model="route.pickup" icon="i-bx-location-pin" class="w-full" /></UFormField>
                    <UFormField label="Drop-off" name="dropoff"><UInput v-model="route.dropoff" icon="i-bx-flag" class="w-full" /></UFormField>
                    <div class="flex gap-2">
                        <UButton label="Now" :variant="when === 'now' ? 'solid' : 'outline'" @click="when = 'now'" />
                        <UButton label="Schedule" :variant="when === 'schedule' ? 'solid' : 'outline'" @click="when = 'schedule'" />
                    </div>
                    <UFormField v-if="when === 'schedule'" label="Pickup time" name="scheduled_for">
                        <UInput v-model="scheduledFor" type="datetime-local" class="w-full" />
                    </UFormField>
                    <UButton type="submit" label="See fares" block />
                </form>
            </UCard>
            <div class="flex gap-3 md:hidden"><TeekoStoreBadges /></div>
        </section>

        <!-- 3. Car types -->
        <section>
            <h2 class="text-2xl font-semibold">Car types</h2>
            <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <UCard v-for="car in carTypes" :key="car">
                    <p class="font-medium">{{ car }}</p>
                    <p class="mt-1 text-sm text-muted">Seats and fares load from the API.</p>
                </UCard>
            </div>
        </section>

        <!-- 4. Airport rides -->
        <section class="grid gap-6 md:grid-cols-2">
            <div>
                <h2 class="text-2xl font-semibold">Airport rides</h2>
                <p class="mt-2 text-muted">Pickups at KLIA and KLIA2 (Level 1, Door 5). Schedule a pickup by your flight, and get dropped off at either terminal.</p>
                <UButton class="mt-4" to="/airport" label="Airport rides" variant="outline" />
            </div>
            <div class="flex flex-wrap items-start gap-3">
                <UButton :to="{ path: '/ride', query: { to: 'klia2' } }" label="Ride to KLIA2" />
                <UButton :to="{ path: '/ride', query: { from: 'klia2' } }" label="Ride from KLIA2" variant="outline" />
            </div>
        </section>

        <!-- 5. Why Teeko -->
        <section>
            <h2 class="text-2xl font-semibold">Why Teeko</h2>
            <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div v-for="point in whyTeeko" :key="point.title">
                    <UIcon :name="point.icon" class="size-6 text-primary" />
                    <p class="mt-2 font-medium">{{ point.title }}</p>
                    <p class="text-sm text-muted">{{ point.text }}</p>
                </div>
            </div>
        </section>

        <!-- 6. Drive with Teeko -->
        <section class="rounded-2xl border border-default p-6">
            <h2 class="text-2xl font-semibold">Drive with Teeko</h2>
            <p class="mt-2 text-muted">You need a driving licence, a PSV and e-hailing permit, and a car within the age limit.</p>
            <UButton class="mt-4" to="/drive" label="Apply" />
        </section>

        <!-- 7. Business -->
        <section class="rounded-2xl border border-default p-6">
            <h2 class="text-2xl font-semibold">Teeko for Business</h2>
            <p class="mt-2 text-muted">Company accounts with monthly billing, and booking agents with credit.</p>
            <UButton class="mt-4" to="/business" label="Talk to us" variant="outline" />
        </section>

        <!-- 8. Get the app -->
        <section id="get-the-app">
            <h2 class="text-2xl font-semibold">Get the app</h2>
            <div class="mt-4 flex flex-wrap items-center gap-3">
                <TeekoStoreBadges />
                <!-- TODO(pending: W3) QR code that opens the right store for the phone. -->
            </div>
        </section>

        <!-- 9. FAQ -->
        <section>
            <h2 class="text-2xl font-semibold">Questions</h2>
            <UAccordion class="mt-4" :items="faqs" />
        </section>
    </div>
</template>
