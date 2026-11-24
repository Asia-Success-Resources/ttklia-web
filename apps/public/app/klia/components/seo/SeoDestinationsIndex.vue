<script setup lang="ts">
// klia-bus frontend/seo/destinations-index.blade.php, shared by /bus/destinations and /bus/lalaport-destinations.
import { DESTINATIONS, LALAPORT_DESTINATIONS, slug } from '~/klia/explore'
import { BUS_ORIGINS, breadcrumbsSchema, collectionSchema, type BusOriginKey } from '~/klia/seo'

const props = defineProps<{ origin: BusOriginKey }>()
const o = BUS_ORIGINS[props.origin]
const isLalaport = o.key === 'lalaport'
const destinations = isLalaport ? LALAPORT_DESTINATIONS : DESTINATIONS
const site = useRequestURL().origin

const heading = isLalaport ? 'Lalaport BBCC Bus Destinations' : 'KLIA2 Bus Destinations'
const intro = isLalaport
    ? `Book express bus tickets from Lalaport Transportation Hub to destinations across ${o.regions}`
    : `Book express bus tickets from KLIA2 to destinations across ${o.regions}`
const description = isLalaport
    ? `Browse all bus destinations from Lalaport BBCC Transportation Hub. Book express bus tickets online from Lalaport to destinations across ${o.regions}.`
    : `Browse all bus destinations from KLIA2. Book express bus tickets online from KLIA2 to destinations across ${o.regions}.`
// groupBy('state')->sortKeys()
const grouped = Object.entries(
    destinations.reduce<Record<string, typeof destinations>>((acc, d) => ((acc[d.state ?? ''] ??= []).push(d), acc), {}),
).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
const links = destinations.map((d) => ({ label: `${o.name} Bus to ${d.name}`, url: `${site}${o.prefix}${d.slug}` }))
const crumbs = [
    { label: 'Home', url: `${site}/` },
    { label: o.indexLabel, url: `${site}${o.index}` },
]

useKliaSeo({
    title: isLalaport ? 'All Lalaport BBCC Bus Destinations | Book Online - TTKLIA' : 'All KLIA2 Bus Destinations | Book Online - TTKLIA',
    description,
    canonical: `${site}${o.index}`,
    schemas: [collectionSchema(heading, description, links, `${site}${o.index}`), breadcrumbsSchema(crumbs, `${site}${o.index}`)],
})
</script>

<template>
    <SeoHero :crumbs="crumbs" :title="heading" :sub="intro" :origin="o.key" :visible-tabs="['bus']" />
    <div class="container section">
        <section v-for="[state, dests] in grouped" :key="state" :aria-labelledby="slug(state)">
            <h2 :id="slug(state)" class="state-title">{{ state }}</h2>
            <ul class="link-grid">
                <li v-for="dest in dests" :key="dest.slug">
                    <a :href="o.prefix + dest.slug" class="card-link">
                        <strong>{{ o.name }} Bus to {{ dest.name }}</strong>
                        <small>{{ dest.state }}</small>
                    </a>
                </li>
            </ul>
        </section>
    </div>
</template>
