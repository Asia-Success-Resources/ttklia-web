<template>
    <div class="search-card" :class="{ 'search-card--compact': compact }">
        <service-switcher
            v-if="services.length > 1"
            v-model="tab"
            :services="services"
            :panel-id="panelId"
            :label="$t('Services')"
        ></service-switcher>

        <div class="search-card__body" ref="body" @transitionend.self="releaseHeight">
            <Transition name="panel" mode="out-in" @before-leave="lockHeight" @enter="growHeight">
                <div
                    :key="tab"
                    class="search-panel"
                    :id="panelId"
                    :role="services.length > 1 ? 'tabpanel' : null"
                    :aria-labelledby="services.length > 1 ? 'service-tab-' + tab : null"
                >
                    <bus-search
                        v-if="tab === 'bus'"
                        :uid="uid + '-bus'"
                        :locations="locations"
                        :llp-locations="llpLocations"
                        :llp-origin-enabled="llpOriginEnabled"
                        :origin="origin"
                        :date="date"
                        :zone="zone"
                        :preset-zone="presetZone"
                        :adult="adult"
                        :child="child"
                        :senior="senior"
                        :staff="staff"
                        :user="user"
                    ></bus-search>

                    <taxi-search
                        v-else-if="tab === 'taxi'"
                        :uid="uid + '-taxi'"
                        :taxi-locations="taxiLocations"
                        :taxi-locations-url="taxiLocationsUrl"
                        :preset-taxi-zone="presetTaxiZone"
                        :taxi-from-klia="taxiFromKlia"
                    ></taxi-search>

                    <car-charter-search v-else-if="tab === 'car-charter'" :uid="uid + '-cc'"></car-charter-search>

                    <tour-search v-else-if="tab === 'tours'" :uid="uid + '-tour'" :tours="tours" :tours-url="urls.tours || '/tours'"></tour-search>

                    <div v-else-if="tab === 'genting'" class="info-panel">
                        <div>
                            <h2 class="info-panel__title">{{ $t('Van to Genting Highlands') }}</h2>
                            <template v-if="gentingEnabled">
                                <p class="info-panel__text">{{ $t('Shared vans from KLIA2 and Kuala Lumpur straight to Genting Highlands. Pick a date and pick-up point and book your seat online.') }}</p>
                            </template>
                            <template v-else>
                                <p class="info-panel__status">{{ $t('Coming soon') }}</p>
                                <p class="info-panel__text">{{ $t('Shared and private vans from KLIA2 straight to Genting Highlands. Online booking opens shortly.') }}</p>
                            </template>
                        </div>
                        <div class="info-panel__actions">
                            <a :href="urls.genting || '/genting'" class="btn btn-primary">{{ gentingEnabled ? $t('Book Now') : $t('Learn more') }}</a>
                            <a v-if="!gentingEnabled" :href="urls.contact || '/contact-us'" class="text-link">{{ $t('Notify me') }}</a>
                        </div>
                    </div>

                    <div v-else-if="tab === 'rentals'" class="info-panel">
                        <div>
                            <h2 class="info-panel__title">{{ $t('Car rental at KLIA2') }}</h2>
                            <p v-if="!rentalsEnabled" class="info-panel__status">{{ $t('Coming soon') }}</p>
                            <p class="info-panel__text">{{ $t('Self-drive cars collected at the airport, booked in a few minutes.') }}</p>
                        </div>
                        <div class="info-panel__actions">
                            <a :href="urls.rentals || '/bookings/rentals'" class="btn btn-primary">{{ rentalsEnabled ? $t('Book Now') : $t('Learn more') }}</a>
                            <a v-if="!rentalsEnabled" :href="urls.contact || '/contact-us'" class="text-link">{{ $t('Notify me') }}</a>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup>
// The home page search card, also mounted on the SEO landing pages with a
// limited set of services. Props mirror the former SearchTrips component so
// every page that mounted it keeps passing the same data.
import { ref, computed, watch, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue';
import { trans } from 'laravel-vue-i18n';
import ServiceSwitcher from './ServiceSwitcher.vue';
import BusSearch from './search/BusSearch.vue';
import TaxiSearch from './search/TaxiSearch.vue';
import CarCharterSearch from './search/CarCharterSearch.vue';
import TourSearch from './search/TourSearch.vue';

const props = defineProps({
    adult: { type: Number, default: 1 },
    carCharterEnabled: Boolean,
    child: { type: Number, default: 0 },
    date: String,
    defaultTab: String,
    gentingEnabled: Boolean,
    isMobile: Boolean,
    minimal: { type: Boolean, default: false },
    llpLocations: { type: Array, default: () => [] },
    llpOriginEnabled: Boolean,
    locations: { type: Array, default: () => [] },
    origin: String,
    presetZone: String,
    presetTaxiZone: String,
    rentalsEnabled: Boolean,
    senior: { type: Number, default: 0 },
    staff: { type: Number, default: 0 },
    taxiFromKlia: { type: Boolean, default: true },
    taxiLocations: { type: Array, default: () => [] },
    taxiLocationsUrl: String,
    tours: { type: Array, default: () => [] },
    types: Array,
    urls: { type: Object, default: () => ({}) },
    user: Object,
    visibleTabs: Array,
    zone: [String, Number],
});

const uid = 'sc' + getCurrentInstance().uid;
const panelId = uid + '-panel';
const compact = computed(() => props.minimal);

const allServices = computed(() => [
    { key: 'bus', label: trans('Bus'), icon: 'bus' },
    { key: 'taxi', label: trans('Taxi'), icon: 'taxi' },
    ...(props.carCharterEnabled ? [{ key: 'car-charter', label: trans('Car Charter'), icon: 'car-charter' }] : []),
    { key: 'genting', label: trans('Van to Genting'), icon: 'van' },
    { key: 'rentals', label: trans('Car Rental'), icon: 'car-rental' },
    { key: 'tours', label: trans('Tours'), icon: 'tour' },
]);

const services = computed(() => allServices.value.filter(s =>
    !props.visibleTabs || props.visibleTabs.length === 0 || props.visibleTabs.includes(s.key)
));

const fromHash = () => {
    const key = window.location.hash.slice(1);
    return services.value.some(s => s.key === key) ? key : null;
};

const initialTab = () => {
    const wanted = fromHash() ?? props.defaultTab;
    return services.value.some(s => s.key === wanted) ? wanted : services.value[0]?.key ?? 'bus';
};

const tab = ref(initialTab());

// Height animation between panels of different size, so the content below
// the card moves smoothly instead of jumping.
const body = ref(null);
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const lockHeight = () => {
    if (reducedMotion() || !body.value) {
        return;
    }
    body.value.style.height = body.value.offsetHeight + 'px';
};

const growHeight = (el) => {
    if (reducedMotion() || !body.value || !body.value.style.height) {
        return;
    }
    const target = el.offsetHeight;
    if (Math.abs(target - body.value.offsetHeight) < 2) {
        body.value.style.height = '';
        return;
    }
    requestAnimationFrame(() => {
        body.value.classList.add('is-resizing');
        body.value.style.height = target + 'px';
    });
    // Fallback in case transitionend never arrives (tab hidden, interrupted).
    setTimeout(() => releaseHeight({ propertyName: 'height' }), 500);
};

const releaseHeight = (event) => {
    if (event.propertyName !== 'height' || !body.value) {
        return;
    }
    body.value.classList.remove('is-resizing');
    body.value.style.height = '';
};

// A link to /#car-charter (top bar, footer) picks that service.
const onHashChange = () => {
    const key = fromHash();
    if (key) {
        tab.value = key;
        body.value?.closest('.search-card')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
    }
};

onMounted(() => window.addEventListener('hashchange', onHashChange));
onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange));
</script>
