<script setup lang="ts">
// klia-bus frontend/home/how.blade.php.
import { trans } from 'laravel-vue-i18n'
const steps = computed(() => [
    { icon: 'search', title: trans('Search and choose'), text: trans('Pick your destination and date, then compare departures and operators.') },
    { icon: 'credit-card', title: trans('Pay securely'), text: trans('Cards, online banking or e-wallets. Your booking is confirmed at once.') },
    { icon: 'qrcode', title: trans('Board with your e-pass'), text: trans('Show the boarding pass from your email at the gate. No queue, no printing.') },
])
</script>

<template>
    <section class="section how" aria-labelledby="how-title">
        <div class="container">
            <h2 id="how-title" class="section-title">{{ $t('How it works') }}</h2>
            <ol class="how__steps" data-reveal-group>
                <li v-for="(step, i) in steps" :key="step.icon" class="how__step" data-reveal>
                    <span class="how__num" aria-hidden="true">{{ i + 1 }}</span>
                    <span class="how__icon"><XIcon :name="step.icon" class="icon icon-lg" /></span>
                    <h3 class="how__title">{{ step.title }}</h3>
                    <p class="how__text">{{ step.text }}</p>
                </li>
            </ol>
        </div>
    </section>
</template>
