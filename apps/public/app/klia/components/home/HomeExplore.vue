<script setup lang="ts">
// klia-bus frontend/home/explore.blade.php: every panel is in the HTML so crawlers see all links; explore-tabs.js
// only switches which panel is visible.
import { hub } from '~/klia/explore'
const { cashbacksEnabled } = useKlia()
const { tours } = useKliaData()
// TODO(api): app.llp_origin_enabled (Lalaport origin); off in klia-bus by default.
const explore = computed(() => hub({ lalaport: Boolean(useRuntimeConfig().public.kliaLalaport), cashbacks: cashbacksEnabled, tours }))
</script>

<template>
    <section v-if="explore.length" class="section explore" aria-labelledby="explore-title" data-reveal>
        <div class="container">
            <h2 id="explore-title" class="section-title">{{ $t('Explore TTKLIA') }}</h2>

            <div class="tabs explore__tabs" role="tablist" :aria-label="$t('Explore TTKLIA')" data-tabs>
                <button v-for="(tab, i) in explore" :id="`explore-tab-${tab.key}`" :key="tab.key" type="button" class="tabs__tab" role="tab"
                        :aria-controls="`explore-panel-${tab.key}`" :aria-selected="i === 0 ? 'true' : 'false'" :tabindex="i === 0 ? 0 : -1">{{ tab.label }}</button>
                <span class="tabs__underline" aria-hidden="true"></span>
            </div>

            <div class="explore__panels">
                <div v-for="(tab, i) in explore" :id="`explore-panel-${tab.key}`" :key="tab.key" class="explore__panel" :class="{ 'is-active': i === 0 }"
                     role="tabpanel" tabindex="0" :aria-labelledby="`explore-tab-${tab.key}`">
                    <h3 class="explore__panel-title">{{ tab.label }}</h3>
                    <ul class="explore__links">
                        <li v-for="link in tab.links" :key="link.url"><a :href="link.url">{{ link.label }}</a></li>
                    </ul>
                    <a v-if="tab.all" :href="tab.all.url" class="text-link">{{ tab.all.label }} <XIcon name="arrow-right" class="icon icon-sm" /></a>
                </div>
            </div>
        </div>
    </section>
</template>
