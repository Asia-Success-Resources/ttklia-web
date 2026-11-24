<script setup lang="ts">
// klia-bus resources/views/frontend/profile/collect.blade.php (ProfileController@collect), set in the sign-in page's
// layout: the skyline backdrop, the red brand panel with the three steps, and the exchange form in the card.
// TODO(api): operators and the fee are the klia-bus snapshot (useKliaData); the lookup (/bookings/search) and the
// exchange (/bookings/collect) need ttklia-api endpoints.
import { trans } from 'laravel-vue-i18n'

const { route } = useKlia()
const { operators, collectionPrice } = useKliaData()
const config = useRuntimeConfig().public
const query = useRoute().query
const terminal = query.terminal === 'lalaport' && config.kliaLalaport ? 'lalaport' : 'klia2'
const terminals = config.kliaLalaport
    ? [
        { value: 'klia2', label: 'KLIA2', href: `${route('collect')}?terminal=klia2` },
        { value: 'lalaport', label: 'Lalaport', href: `${route('collect')}?terminal=lalaport` },
    ]
    : []

useKliaSeo({
    title: 'Exchange Your Ticket for a Boarding Pass - TTKLIA',
    description: 'Booked your KLIA2 bus on another platform? Exchange your ticket for a TTKLIA boarding pass online before you board.',
})

const steps = computed(() => [
    trans('Enter your travel date, operator and booking reference'),
    trans('We look up your seat and show the trip details'),
    trans('Pay the terminal and QR fee to get your boarding pass'),
])
</script>

<template>
    <div class="auth-page mobile-padding exchange-page--auth">
        <div class="container auth">
            <div class="auth-split auth-split--wide">
                <AuthBrand
                    numbered
                    :title="trans('Booked on another platform?')"
                    :text="trans('Swap the ticket you bought elsewhere for a TTKLIA boarding pass before you board.')"
                    :items="steps"
                />

                <div class="auth-card">
                    <h1 class="auth__title">{{ $t('Exchange ticket') }}</h1>
                    <p class="auth__lead">{{ $t('Swap the ticket you bought elsewhere for a TTKLIA boarding pass before you board.') }}</p>

                    <!-- The brand panel is hidden on small screens, so the steps show here instead. -->
                    <ol class="exchange-steps d-lg-none" :aria-label="$t('How it works')">
                        <li v-for="(step, i) in steps" :key="step" class="exchange-steps__item">
                            <span class="exchange-steps__num">{{ i + 1 }}</span>
                            <span>{{ step }}</span>
                        </li>
                    </ol>

                    <ClientOnly>
                        <CollectTicket
                            :operators="operators"
                            env="local"
                            :collect-ticket-data="null"
                            :collection-price="collectionPrice"
                            :terminal="terminal"
                            :terminals="terminals"
                        />
                    </ClientOnly>
                </div>
            </div>
        </div>
    </div>
</template>
