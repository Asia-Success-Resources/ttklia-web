<script setup lang="ts">
// klia-bus frontend/home/routes.blade.php.
import { popularBusRoutes } from '~/klia/explore'
const { route } = useKlia()
const routes = popularBusRoutes(8)
</script>

<template>
    <section v-if="routes.length" class="section routes" aria-labelledby="routes-title">
        <div class="container">
            <div class="section-head">
                <div>
                    <h2 id="routes-title" class="section-title">{{ $t('Popular bus routes from KLIA2') }}</h2>
                    <p class="section-lead">{{ $t('Where most travellers head after landing.') }}</p>
                </div>
                <a :href="route('seo.destinations')" class="text-link">{{ $t('All destinations') }} <XIcon name="arrow-right" class="icon icon-sm" /></a>
            </div>
            <ul class="routes__grid" data-reveal-group>
                <li v-for="r in routes" :key="r.url" data-reveal>
                    <a :href="r.url" class="card-link route-card">
                        <span class="route-card__line" aria-hidden="true">
                            <span class="route-card__dot"></span>
                            <span class="route-card__track"></span>
                            <span class="route-card__dot route-card__dot--end"></span>
                        </span>
                        <span class="route-card__stops">
                            <span class="route-card__from">{{ r.from }}</span>
                            <span class="route-card__to">{{ r.to }}</span>
                        </span>
                        <span class="route-card__meta">
                            {{ r.state }}
                            <XIcon name="arrow-right" class="icon route-card__arrow" />
                        </span>
                        <span class="visually-hidden">{{ $t('KLIA2 bus to :place', { place: r.to }) }}</span>
                    </a>
                </li>
            </ul>
        </div>
    </section>
</template>
