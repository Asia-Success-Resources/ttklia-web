<script setup lang="ts">
// klia-bus resources/views/frontend/index.blade.php (WebController@index) on www.ttklia.com;
// the Teeko e-hailing home on teeko.ai (doc 09).
import { trans } from 'laravel-vue-i18n'
import { faqSchema } from '~/composables/useKliaSeo'

const { isTeeko } = useBrand()
const { route, user, carCharterEnabled, teekoWhatsapp } = useKlia()
const { locations, llpLocations, taxiTypes, tours } = useKliaData()
const config = useRuntimeConfig().public
const query = useRoute().query
const origin = useRequestURL().origin

const homeFaqs = computed(() => [
    { q: trans('Where do buses leave from at KLIA2?'), a: trans('Express buses leave from the KLIA2 Transportation Hub on Level 1. Follow the Bus signs after you exit the arrival hall.') },
    { q: trans('Do I need to print my ticket?'), a: trans('No. Your e-boarding pass is emailed the moment you pay. Show it on your phone when you board.') },
    { q: trans('Can I book a taxi to the airport, not just from it?'), a: trans('Yes. Choose Taxi, tap the swap button so the airport becomes your destination, then enter your pick-up address.') },
    { q: trans('I bought my bus ticket on another website. What now?'), a: trans('Exchange it for a TTKLIA boarding pass online before you board, using Exchange ticket.') },
])

// The search a visitor came back with (klia-bus rememberBusSearch): ?zone_id&date&origin&adult&child&senior&staff.
const q = (k: string) => (typeof query[k] === 'string' ? (query[k] as string) : '')
const pax = (k: string, d: number) => (q(k) !== '' && !Number.isNaN(Number(q(k))) ? Number(q(k)) : d)

if (!isTeeko.value) {
    useKliaSeo({
        title: 'KLIA2 Bus, Taxi & Airport Transfer Booking - TTKLIA',
        description: 'Official KLIA2 transport hub. Book express bus tickets, airport taxis and car charters from KLIA2 and Lalaport BBCC online, with e-boarding passes and secure payment.',
        canonical: `${origin}/`,
        schemas: [
            {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'TTKLIA',
                legalName: 'Asia Success Resources Sdn Bhd',
                url: `${origin}/`,
                logo: `${origin}/images/logo.png`,
                ...(teekoWhatsapp ? {
                    contactPoint: {
                        '@type': 'ContactPoint',
                        contactType: 'customer support',
                        telephone: '+' + teekoWhatsapp.replace(/^\+/, ''),
                        url: 'https://wa.me/' + teekoWhatsapp.replace(/^\+/, ''),
                        availableLanguage: ['English', 'Chinese', 'Malay'],
                    },
                } : {}),
            },
            { '@context': 'https://schema.org', '@type': 'WebSite', name: 'TTKLIA', url: `${origin}/`, inLanguage: ['en', 'zh', 'ms'] },
            faqSchema(homeFaqs.value),
        ],
    })
    useHead({ link: [{ rel: 'preload', as: 'image', href: '/images/klcc.jpg', fetchpriority: 'high' }] })
}

// TODO(api): klia-bus $eligibleReturnTaxiDiscount (a signed-in customer with a taxi from KLIA and no return yet).
const eligibleReturnTaxiDiscount = false
// TODO(api): the tours on sale now, from GET /tours.
const tourOptions = tours.map((t) => ({ id: t.id, name: t.name, url: route('tours.show', { tour: t.slug || t.id }) }))
const urls = { genting: route('genting.index'), rentals: route('rentals.index'), tours: route('tours.index'), contact: route('contact-us') }
</script>

<template>
    <TeekoHome v-if="isTeeko" />
    <template v-else>
        <a v-if="eligibleReturnTaxiDiscount" :href="route('profile.taxi-bookings.index')" class="notice-bar">
            <XIcon name="discount" />
            <span>{{ $t('Book your trip to Kuala Lumpur International Airport and get RM5 off with our e-hailing service.') }}</span>
            <XIcon name="arrow-right" class="icon notice-bar__arrow" />
        </a>

        <section class="home-hero" aria-labelledby="hero-title">
            <img src="/images/klcc.jpg" alt="" class="home-hero__bg" width="1800" height="1200" fetchpriority="high" decoding="async">
            <div class="container home-hero__inner">
                <div class="home-hero__copy">
                    <p class="home-hero__eyebrow d-lg-none"><XIcon name="shield-check" /> {{ $t('Official land transport platform of KLIA2') }}</p>
                    <h1 id="hero-title" class="home-hero__title">{{ $t('From KLIA2 to anywhere, booked in minutes') }}</h1>
                    <p class="home-hero__sub">{{ $t('Express buses, airport taxis, car charters and tours across Malaysia and Singapore, with your e-boarding pass on your phone.') }}</p>
                </div>

                <!-- The card reads window and history, so it renders in the browser; the placeholder keeps the hero from jumping.
                     TODO(api): taxi-locations-url lists the taxi fare zones when Google Maps fails; ttklia-api has no public endpoint for them yet. -->
                <ClientOnly>
                    <SearchCard
                        :locations="locations"
                        :llp-locations="llpLocations"
                        :llp-origin-enabled="Boolean(config.kliaLalaport)"
                        :date="q('date')"
                        :zone="q('zone_id')"
                        :origin="q('origin')"
                        :adult="pax('adult', 1)"
                        :child="pax('child', 0)"
                        :senior="pax('senior', 0)"
                        :staff="pax('staff', 0)"
                        :types="taxiTypes"
                        :taxi-locations-url="route('taxi.location-options')"
                        :tours="tourOptions"
                        :is-mobile="false"
                        :user="user ?? undefined"
                        :car-charter-enabled="carCharterEnabled"
                        :genting-enabled="false"
                        :rentals-enabled="false"
                        :urls="urls"
                    />
                    <template #fallback>
                        <div class="search-card search-card--placeholder" aria-hidden="true"></div>
                    </template>
                </ClientOnly>

                <ul class="home-hero__trust">
                    <li><XIcon name="qrcode" /> {{ $t('e-Boarding pass') }}</li>
                    <li><XIcon name="lock" /> {{ $t('Secure payment') }}</li>
                    <li><XIcon name="brand-whatsapp" /> {{ $t('WhatsApp support') }}</li>
                </ul>
            </div>
        </section>

        <HomeFeatured />
        <HomeExchange />
        <HomeServices />
        <HomeRoutes />
        <HomeHow />
        <HomeWhy />
        <HomePromotions />
        <HomeFaq :faqs="homeFaqs" />
        <HomeExplore />
    </template>
</template>
