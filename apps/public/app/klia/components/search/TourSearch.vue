<template>
    <form class="search-form" :action="toursUrl" method="GET" @submit.prevent="submit">
        <div class="seg seg--grow">
            <label class="seg__label" :for="uid + '-tour'">{{ $t('Tour or destination') }}</label>
            <multi-select
                :id="uid + '-tour'"
                v-model="tour"
                label="name"
                track-by="id"
                :options="tours"
                :placeholder="$t('Search tours and packages')"
                :show-labels="false"
                class="seg__multiselect"
            ></multi-select>
        </div>
        <button type="submit" class="search-btn" :aria-label="$t('Search')">
            <svg-icon name="search" />
            <span class="search-btn__text">{{ $t('Search') }}</span>
        </button>
    </form>
    <p class="search-panel__note">
        <a :href="toursUrl" class="text-link">{{ $t('Browse all tours') }} <svg-icon name="arrow-right" class="icon-sm" /></a>
    </p>
</template>

<script setup>
import { ref } from 'vue';
import SvgIcon from '../SvgIcon.vue';

const props = defineProps({
    uid: { type: String, default: 'tour' },
    tours: { type: Array, default: () => [] },
    toursUrl: { type: String, default: '/tours' },
});

const tour = ref(null);

const submit = () => {
    window.location.href = tour.value?.url ?? props.toursUrl;
};
</script>
