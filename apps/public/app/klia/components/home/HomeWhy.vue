<script setup lang="ts">
// klia-bus frontend/home/why.blade.php.
import { trans } from 'laravel-vue-i18n'
const reasons = computed(() => [
    { icon: 'shield-check', title: trans('Official KLIA2 platform'), text: trans('The official booking platform for land transport at Kuala Lumpur International Airport 2.') },
    { icon: 'qrcode', title: trans('e-Boarding pass'), text: trans('Your boarding pass arrives by email the moment you pay. No printing needed.') },
    { icon: 'lock', title: trans('Secure payment'), text: trans('Pay safely online with cards, online banking and e-wallets.') },
    { icon: 'brand-whatsapp', title: trans('WhatsApp support'), text: trans('Ask our team or Teeko on WhatsApp before, during and after your trip.') },
])
</script>

<template>
    <section class="why-band" aria-labelledby="why-title">
        <div class="container">
            <div class="why-band__head">
                <h2 id="why-title" class="why-band__title">{{ $t('Why travellers book with TTKLIA') }}</h2>
                <p class="why-band__lead">{{ $t("The airport's own booking platform, with support all the way.") }}</p>
            </div>
            <ul class="why-band__grid" data-reveal-group>
                <li v-for="reason in reasons" :key="reason.icon" class="why-band__item" data-reveal>
                    <XIcon :name="reason.icon" class="icon icon-xl" />
                    <h3>{{ reason.title }}</h3>
                    <p>{{ reason.text }}</p>
                </li>
            </ul>
        </div>
    </section>
</template>
