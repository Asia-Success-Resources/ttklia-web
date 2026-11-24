<script setup lang="ts">
// klia-bus frontend/home/services.blade.php.
import { trans } from 'laravel-vue-i18n'
const { route, carCharterEnabled } = useKlia()
const services = computed(() => [
    { icon: 'bus', title: trans('Express bus'), text: trans('Direct coaches from KLIA2 and Lalaport BBCC to 100+ towns in Malaysia and Singapore.'), href: '#bus', cta: trans('Search buses') },
    { icon: 'taxi', title: trans('Airport Taxi'), text: trans('Fixed-price private transfers to and from Kuala Lumpur International Airport, door to door.'), href: '#taxi', cta: trans('Book a taxi') },
    ...(carCharterEnabled ? [{ icon: 'car-charter', title: trans('Car charter'), text: trans('A car and driver for 8 or 10 hours, wherever the day takes you.'), href: '#car-charter', cta: trans('Plan a charter') }] : []),
    { icon: 'van', title: trans('Van to Genting'), text: trans('Shared and private vans from the airport straight up to Genting Highlands.'), href: route('genting.index'), cta: trans('Learn more') },
    { icon: 'car-rental', title: trans('Car rental'), text: trans('Self-drive cars collected at the airport.'), href: route('rentals.index'), cta: trans('Learn more') },
    { icon: 'tour', title: trans('Tours and packages'), text: trans('Day trips and attraction packages that start at the airport.'), href: route('tours.index'), cta: trans('Browse tours') },
])
</script>

<template>
    <section class="section services" aria-labelledby="services-title">
        <div class="container">
            <div class="section-head">
                <div>
                    <h2 id="services-title" class="section-title">{{ $t('Every way out of the airport') }}</h2>
                    <p class="section-lead">{{ $t('One booking platform for every leg of the trip.') }}</p>
                </div>
            </div>
            <ul class="services__grid" data-reveal-group>
                <li v-for="service in services" :key="service.icon" data-reveal>
                    <a :href="service.href" class="card-link service-card">
                        <span class="service-card__icon"><XIcon :name="'service/' + service.icon" class="icon" /></span>
                        <span class="service-card__body">
                            <span class="service-card__title">{{ service.title }}</span>
                            <span class="service-card__text">{{ service.text }}</span>
                            <span class="service-card__cta">{{ service.cta }} <XIcon name="arrow-right" class="icon icon-sm" /></span>
                        </span>
                    </a>
                </li>
            </ul>
        </div>
    </section>
</template>
