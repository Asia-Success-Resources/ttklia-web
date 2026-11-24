<script setup lang="ts">
// klia-bus frontend/home/exchange.blade.php.
// TODO(api): services.app_links.ios / android (the TTKLIA app store links); empty, the "Need a hand?" card shows.
const { route, teekoWhatsapp } = useKlia()
const iosUrl = ''
const androidUrl = ''
</script>

<template>
    <section class="section" :aria-label="$t('More ways to travel')">
        <div class="container">
            <div class="cta-pair" data-reveal-group>
                <div class="cta-card cta-card--brand" data-reveal>
                    <XIcon name="ticket" class="icon icon-xl" />
                    <h2 class="cta-card__title">{{ $t('Booked on another platform?') }}</h2>
                    <p class="cta-card__text">{{ $t('Exchange the ticket you bought elsewhere for your TTKLIA boarding pass before you board.') }}</p>
                    <a :href="route('collect')" class="btn btn-light btn-lg">{{ $t('Exchange ticket') }}</a>
                </div>

                <div v-if="iosUrl || androidUrl" class="cta-card" data-reveal>
                    <XIcon name="device-mobile" class="icon icon-xl" />
                    <h2 class="cta-card__title">{{ $t('Get the TTKLIA app') }}</h2>
                    <p class="cta-card__text">{{ $t('Book faster and keep every boarding pass on your phone.') }}</p>
                    <div class="cta-card__actions">
                        <a v-if="iosUrl" :href="iosUrl" class="btn btn-outline-dark" target="_blank" rel="noopener"><XIcon name="brand-apple" /> App Store</a>
                        <a v-if="androidUrl" :href="androidUrl" class="btn btn-outline-dark" target="_blank" rel="noopener"><XIcon name="brand-google-play" /> Google Play</a>
                    </div>
                </div>
                <div v-else class="cta-card" data-reveal>
                    <XIcon name="headset" class="icon icon-xl" />
                    <h2 class="cta-card__title">{{ $t('Need a hand?') }}</h2>
                    <p class="cta-card__text">{{ $t('Our team and Teeko answer on WhatsApp, before, during and after your trip.') }}</p>
                    <div class="cta-card__actions">
                        <a v-if="teekoWhatsapp" :href="`https://wa.me/${teekoWhatsapp}`" class="btn btn-outline-dark" target="_blank" rel="noopener"><XIcon name="brand-whatsapp" /> {{ $t('Chat on WhatsApp') }}</a>
                        <a :href="route('contact-us')" class="btn btn-outline-dark">{{ $t('Contact us') }}</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
