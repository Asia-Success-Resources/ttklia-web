<script setup lang="ts">
// klia-bus frontend/seo/partials/hero.blade.php: breadcrumbs, the page's H1 and the search card, so the search is the
// first thing a visitor sees. The search props pass through to SeoSearch.
import type { Crumb } from '~/klia/seo'
defineOptions({ inheritAttrs: false })
defineProps<{ crumbs: Crumb[]; title: string; sub?: string; route?: [string, string]; searchSummary?: string }>()
</script>

<template>
    <section class="page-hero" aria-labelledby="page-title">
        <div class="container">
            <div class="page-hero__copy">
                <SeoBreadcrumbs :crumbs="crumbs" />
                <p v-if="route" class="page-hero__route">
                    <span>{{ route[0] }}</span>
                    <XIcon name="arrow-right" class="icon icon-sm" />
                    <span>{{ route[1] }}</span>
                </p>
                <h1 id="page-title" class="page-hero__title">{{ title }}</h1>
                <p v-if="sub" class="page-hero__sub">{{ sub }}</p>
            </div>
            <!-- Phones: the page already shows results, so the form folds into a summary. -->
            <button v-if="searchSummary" type="button" class="search-summary" data-search-toggle aria-expanded="false" aria-controls="hero-search">
                <XIcon name="search" />
                <span class="search-summary__text">{{ searchSummary }}</span>
                <span class="search-summary__edit">{{ $t('Change') }}</span>
            </button>
            <div id="hero-search" class="page-hero__search" :class="{ 'is-collapsible': !!searchSummary }">
                <SeoSearch v-bind="$attrs" />
            </div>
        </div>
    </section>
</template>
