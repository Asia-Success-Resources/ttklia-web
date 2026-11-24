<script setup lang="ts">
// klia-bus frontend/home/featured.blade.php: home advertisements, shown as a row of featured cards.
const { ads } = useKliaData()
const host = useRequestURL().host
const external = (link: string | null) => {
    try { return !!link && new URL(link).host !== host } catch { return false }
}
</script>

<template>
    <section v-if="ads.length" class="section featured" aria-labelledby="featured-title" data-reveal>
        <div class="container">
            <h2 id="featured-title" class="section-title">{{ $t('Featured') }}</h2>
            <ul class="featured__row">
                <li v-for="(ad, i) in ads" :key="ad.id">
                    <a v-if="ad.link" :href="ad.link" class="card-link featured__card" :target="external(ad.link) ? '_blank' : undefined" :rel="external(ad.link) ? 'noopener noreferrer' : undefined">
                        <img :src="ad.image" :alt="ad.title" width="800" height="350" :loading="i > 0 ? 'lazy' : undefined" decoding="async">
                    </a>
                    <div v-else class="featured__card">
                        <img :src="ad.image" :alt="ad.title" width="800" height="350" :loading="i > 0 ? 'lazy' : undefined" decoding="async">
                    </div>
                </li>
            </ul>
        </div>
    </section>
</template>
