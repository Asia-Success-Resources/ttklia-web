<script setup lang="ts">
// klia-bus frontend/home/promotions.blade.php. TODO(api): offers that are running now (start_at <= now <= end_at).
import moment from 'moment'
const { route } = useKlia()
const { offers } = useKliaData()
</script>

<template>
    <section v-if="offers.length" class="section promos" aria-labelledby="promos-title" data-reveal>
        <div class="container">
            <div class="section-head">
                <h2 id="promos-title" class="section-title">{{ $t('Promotions') }}</h2>
                <a :href="route('offers.index')" class="text-link">{{ $t('View all promotions') }} <XIcon name="arrow-right" class="icon icon-sm" /></a>
            </div>
            <ul class="promos__row">
                <li v-for="offer in offers" :key="offer.id">
                    <a :href="route('offers.show', { offer: offer.slug })" class="card-link promo-card">
                        <img :src="offer.image || '/images/promo.jpg'" alt="" class="promo-card__img" width="320" height="180" loading="lazy" decoding="async">
                        <span class="promo-card__body">
                            <span class="promo-card__title">{{ offer.title }}</span>
                            <span class="promo-card__meta">
                                <template v-if="offer.end_at">{{ $t('Valid until :date', { date: moment(offer.end_at).format('D MMM YYYY') }) }}</template>
                                <template v-else>{{ $t('Ongoing') }}</template>
                            </span>
                        </span>
                    </a>
                </li>
            </ul>
        </div>
    </section>
</template>
