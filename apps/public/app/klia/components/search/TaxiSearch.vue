<template>
    <div>
        <form class="search-form" method="GET" action="/bookings/taxi/confirm" ref="form" @submit.prevent="submit">
            <div class="seg seg--grow">
                <label class="seg__label" :for="fromKlia ? null : addressId">{{ $t('From') }}</label>
                <span v-if="fromKlia" class="seg__static">{{ airportName }}</span>
                <template v-else>
                    <multi-select
                        v-if="googleReady === false"
                        :id="addressId"
                        v-model="taxiLocation"
                        :options="taxiOptions"
                        label="name"
                        track-by="key"
                        :show-labels="false"
                        :placeholder="$t('Search location')"
                        class="seg__multiselect"
                    ></multi-select>
                    <input v-else :id="addressId" type="text" class="seg__input" :placeholder="$t('Enter an address or place')" autocomplete="off" @input="taxiLocation = null" />
                </template>
            </div>
            <div class="seg seg--swap">
                <button type="button" class="swap-btn" :class="{ 'is-swapped': !fromKlia }" @click="swap" :aria-label="$t('Swap origin and destination')">
                    <svg-icon name="arrows-exchange" />
                </button>
            </div>
            <div class="seg seg--grow">
                <label class="seg__label" :for="fromKlia ? addressId : null">{{ $t('To') }}</label>
                <span v-if="!fromKlia" class="seg__static">{{ airportName }}</span>
                <template v-else>
                    <multi-select
                        v-if="googleReady === false"
                        :id="addressId"
                        v-model="taxiLocation"
                        :options="taxiOptions"
                        label="name"
                        track-by="key"
                        :show-labels="false"
                        :placeholder="$t('Search location')"
                        class="seg__multiselect"
                    ></multi-select>
                    <input v-else :id="addressId" type="text" class="seg__input" :placeholder="$t('Enter an address or place')" autocomplete="off" @input="taxiLocation = null" />
                </template>
            </div>
            <div class="seg">
                <label class="seg__label" :for="uid + '-datetime'">{{ $t('Date & Time') }}</label>
                <date-field v-model="taxiDate" :id="uid + '-datetime'" with-time :min="minDateTime" :max="maxDate" :placeholder="$t('Select date and time')"></date-field>
            </div>

            <input type="hidden" name="location_id" :value="googleZone?.id ?? taxiLocation?.id ?? ''" />
            <input type="hidden" name="location_type" :value="googleZone?.id ? 'ZONE' : (taxiLocation?.type ?? 'ZONE')" />
            <input type="hidden" name="latitude" :value="googleZone?.id ? googleLatitude : ''" />
            <input type="hidden" name="longitude" :value="googleZone?.id ? googleLongitude : ''" />
            <input type="hidden" name="google_place_id" :value="googleZone?.id ? googlePlaceId : ''" />
            <input type="hidden" name="google_description" :value="googleZone?.id ? googleDescription : ''" />
            <input type="hidden" name="date" :value="taxiDate ? toYmd(taxiDate) : ''" />
            <input type="hidden" name="time" :value="taxiDate ? toHm(taxiDate) : ''" />
            <input type="hidden" name="is_from_klia" :value="fromKlia ? '1' : '0'" />

            <button type="submit" class="search-btn" :disabled="loading" :aria-label="$t('Search')">
                <svg-icon name="search" />
                <span class="search-btn__text">{{ $t('Search') }}</span>
            </button>
        </form>

        <p v-if="googleZone" class="search-panel__note">
            <svg-icon name="map-pin" class="icon-sm" /> {{ $t('Zone') }}: {{ googleZone.name }}
        </p>
        <div v-show="mapVisible" class="taxi-map" ref="mapEl"></div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { trans } from 'laravel-vue-i18n';
import SvgIcon from '../SvgIcon.vue';
import { toYmd, toHm, maxBookingDate } from './dates';
import DateField from './DateField.vue';
import { loadGoogleMapsApi, createAutocomplete } from './google-maps';

const props = defineProps({
    uid: { type: String, default: 'taxi' },
    taxiLocations: { type: Array, default: () => [] },
    // When set (homepage), the list is fetched from here only if Google Maps fails,
    // instead of being embedded in the page.
    taxiLocationsUrl: String,
    presetTaxiZone: String,
    taxiFromKlia: { type: Boolean, default: true },
});

const airportName = 'Kuala Lumpur International Airport';

const form = ref(null);
const mapEl = ref(null);
const fromKlia = ref(props.taxiFromKlia);
const loading = ref(false);
// Earliest pick-up is the next quarter hour.
const minDateTime = new Date(Math.ceil(Date.now() / 900000) * 900000);
const maxDate = maxBookingDate();
const taxiDate = ref(null);

// Place picked from Google, resolved to one of our taxi zones.
const googleZone = ref(null);
const googleLatitude = ref(null);
const googleLongitude = ref(null);
const googlePlaceId = ref(null);
const googleDescription = ref(null);

// Known location picked from our own list (SEO page preset, or the fallback
// selector when Google Maps is unavailable).
// Zones and locations share id ranges, so options are keyed by type and id.
const toOptions = (list) => list.map(l => ({ ...l, key: (l.type ?? 'ZONE') + '-' + l.id }));
const taxiOptions = ref(toOptions(props.taxiLocations));
const loadTaxiOptions = async () => {
    if (taxiOptions.value.length || !props.taxiLocationsUrl) {
        return;
    }
    const response = await axios.get(props.taxiLocationsUrl);
    taxiOptions.value = toOptions(response.data);
};
const presetMatch = (type) => taxiOptions.value.find(l => l.type === type && String(l.name).toUpperCase() === props.presetTaxiZone.toUpperCase());
const taxiLocation = ref(
    props.presetTaxiZone ? (presetMatch('ZONE') ?? presetMatch('LOCATION') ?? null) : null
);

const googleReady = ref(null); // null while loading, then true or false
const mapVisible = ref(false);

let map = null;
let marker = null;
let autocomplete = null;

const addressId = computed(() => props.uid + '-address');

const resetPlace = () => {
    googleZone.value = null;
    googleLatitude.value = null;
    googleLongitude.value = null;
    googlePlaceId.value = null;
    googleDescription.value = null;
    mapVisible.value = false;
};

const swap = async () => {
    fromKlia.value = !fromKlia.value;
    taxiLocation.value = null;
    resetPlace();
    await nextTick();
    bindAutocomplete();
};

const placeMarker = (google, position) => {
    if (marker) {
        marker.setPosition(position);
    } else {
        marker = new google.maps.Marker({ position, map, title: 'Selected Location' });
    }
};

const checkLatLonZone = async () => {
    googleZone.value = null;
    try {
        const response = await axios.get('/bookings/zone', {
            params: { latitude: googleLatitude.value, longitude: googleLongitude.value },
        });
        const zone = response.data.response;
        if (zone?.name) {
            googleZone.value = zone;
        }
    } catch (error) {
        if (error.response) {
            Swal.fire({ icon: 'error', title: trans('Error') + '!', text: error.response.data.meta.message });
        } else {
            console.error(error);
        }
    }
};

const bindAutocomplete = () => {
    if (!googleReady.value) {
        return;
    }
    const google = window.google;
    const input = document.getElementById(addressId.value);
    if (!input) {
        return;
    }
    input.value = taxiLocation.value?.name ?? '';

    if (!map) {
        map = new google.maps.Map(mapEl.value, {
            zoom: 12,
            center: { lat: 3.1499, lng: 101.6945 },
            mapId: 'f4ec124b8d2306ed',
            draggableCursor: 'crosshair',
            draggingCursor: 'grabbing',
        });
        // Clicking the map fine-tunes the pick-up or drop-off point.
        map.addListener('click', (event) => {
            if (!googlePlaceId.value) {
                return;
            }
            googleLatitude.value = event.latLng.lat();
            googleLongitude.value = event.latLng.lng();
            placeMarker(google, event.latLng);
            checkLatLonZone();
        });
    }

    autocomplete = createAutocomplete(google, input, {
        componentRestrictions: { country: 'my' },
    });
    autocomplete.bindTo('bounds', map);
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            return;
        }
        taxiLocation.value = null;
        mapVisible.value = true;
        nextTick(() => google.maps.event.trigger(map, 'resize'));
        map.setCenter(place.geometry.location);
        map.setZoom(15);

        googleLatitude.value = place.geometry.location.lat();
        googleLongitude.value = place.geometry.location.lng();
        googlePlaceId.value = place.place_id;
        googleDescription.value = place.name + ', ' + (place.vicinity || place.formatted_address);
        placeMarker(google, place.geometry.location);
        checkLatLonZone();
    });
};

const fail = (text) => Swal.fire({ icon: 'error', title: trans('Error') + '!', text });

const submit = () => {
    if (!googleZone.value && (!taxiLocation.value || !taxiLocation.value.id)) {
        fail(trans('Please select a location.'));
        return;
    }
    if (!taxiDate.value) {
        fail(trans('Please select date and time.'));
        return;
    }
    loading.value = true;
    form.value.submit();
};

onMounted(async () => {
    try {
        await loadGoogleMapsApi();
        googleReady.value = true;
        await nextTick();
        bindAutocomplete();
    } catch (error) {
        googleReady.value = false;
        loadTaxiOptions();
    }
});
</script>
