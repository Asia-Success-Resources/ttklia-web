<template>
    <form class="search-form" method="GET" action="/car-charter" @submit="onSubmit">
        <div class="seg seg--grow">
            <label class="seg__label" :for="uid + '-pickup'">{{ $t('Pick-up location') }}</label>
            <input :id="uid + '-pickup'" type="text" v-model="pickup" class="seg__input" :placeholder="$t('Enter your pick-up location')" autocomplete="off" />
        </div>
        <div class="seg">
            <label class="seg__label" :for="uid + '-datetime'">{{ $t('Pick-up Date & Time') }}</label>
            <date-field v-model="dateTime" :id="uid + '-datetime'" with-time :min="minDateTime" :placeholder="$t('Select date and time')"></date-field>
        </div>
        <div class="seg seg--narrow">
            <span class="seg__label" :id="uid + '-hours'">{{ $t('Package') }}</span>
            <div class="segmented" role="radiogroup" :aria-labelledby="uid + '-hours'">
                <button v-for="option in [8, 10]" :key="option" type="button" role="radio" class="segmented__option"
                        :aria-checked="hours === option ? 'true' : 'false'" @click="hours = option">
                    {{ option }} {{ $t('Hours') }}
                </button>
            </div>
        </div>
        <div class="seg seg--narrow">
            <label class="seg__label" :for="uid + '-pax'">{{ $t('Pax') }}</label>
            <input :id="uid + '-pax'" type="number" v-model.number="pax" class="seg__input" min="1" max="20" inputmode="numeric" />
        </div>

        <input type="hidden" name="pickup_location" :value="pickup" />
        <input type="hidden" name="date" :value="dateTime ? toYmd(dateTime) : ''" />
        <input type="hidden" name="time" :value="dateTime ? toHm(dateTime) : ''" />
        <input type="hidden" name="hours" :value="hours" />
        <input type="hidden" name="pax" :value="pax" />

        <button type="submit" class="search-btn" :disabled="!valid" :aria-label="$t('Search')">
            <svg-icon name="search" />
            <span class="search-btn__text">{{ $t('Search') }}</span>
        </button>
    </form>
    <p class="search-panel__note" :class="{ 'text-danger': dateTime && !dateTimeValid }">
        {{ $t('Pick-up must be at least 24 hours from now.') }}
    </p>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import SvgIcon from '../SvgIcon.vue';
import { toYmd, toHm } from './dates';
import DateField from './DateField.vue';
import { loadGoogleMapsApi, createAutocomplete } from './google-maps';

const props = defineProps({
    uid: { type: String, default: 'cc' },
});

const query = new URLSearchParams(window.location.search);
const pickup = ref(query.get('pickup_location') || '');
const dateTime = ref(query.get('date') ? new Date(query.get('date') + 'T' + (query.get('time') || '00:00')) : null);
const hours = ref(Number(query.get('hours')) === 10 ? 10 : 8);
const pax = ref(Number(query.get('pax')) || 1);

const minDateTime = computed(() => new Date(Date.now() + 24 * 60 * 60 * 1000));
const dateTimeValid = computed(() => !!dateTime.value && dateTime.value.getTime() >= minDateTime.value.getTime());
const valid = computed(() => !!(pickup.value?.trim() && dateTimeValid.value));

const onSubmit = (event) => {
    if (!valid.value) {
        event.preventDefault();
    }
};

onMounted(async () => {
    try {
        const google = await loadGoogleMapsApi();
        const input = document.getElementById(props.uid + '-pickup');
        if (!input) {
            return;
        }
        const autocomplete = createAutocomplete(google, input, {
            componentRestrictions: { country: 'my' },
        });
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            pickup.value = place.formatted_address || place.name || input.value;
        });
    } catch (error) {
        // Without Google the pick-up stays a plain text field.
    }
});
</script>
