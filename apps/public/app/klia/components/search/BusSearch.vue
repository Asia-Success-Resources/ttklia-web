<template>
    <form class="search-form" method="GET" action="/trips" ref="form" autocomplete="off" @submit.prevent="submit">
        <div class="seg seg--narrow">
            <label class="seg__label" :for="uid + '-origin'">{{ $t('From') }}</label>
            <multi-select
                v-if="originOptions.length > 1"
                :id="uid + '-origin'"
                v-model="originOption"
                label="name"
                track-by="id"
                :options="originOptions"
                :searchable="false"
                :allow-empty="false"
                :show-labels="false"
                class="seg__multiselect"
            ></multi-select>
            <span v-else class="seg__static" :id="uid + '-origin'">{{ originOptions[0].name }}</span>
        </div>
        <div class="seg seg--grow">
            <label class="seg__label" :for="uid + '-destination'">{{ $t('To') }}</label>
            <multi-select
                :id="uid + '-destination'"
                :key="busOrigin"
                v-model="location"
                label="name"
                track-by="id"
                :options="destinationOptions"
                :placeholder="$t('Where are you going?')"
                :show-labels="false"
                class="seg__multiselect"
            ></multi-select>
        </div>
        <div class="seg">
            <label class="seg__label" :for="uid + '-date'">{{ $t('Date') }}</label>
            <date-field v-model="date" :id="uid + '-date'" :min="today" :max="maxDate" :placeholder="$t('Select date')"></date-field>
        </div>
        <div class="seg">
            <label class="seg__label" :for="uid + '-pax'">{{ $t('Passengers') }}</label>
            <passenger-stepper :id="uid + '-pax'" :counts="counts" :show-staff="!!user?.is_staff" @change="(key, value) => counts[key] = value"></passenger-stepper>
        </div>

        <input type="hidden" name="zone_id" :value="location ? location.id : ''" />
        <input type="hidden" name="date" :value="ymd" />
        <input type="hidden" name="origin" :value="busOrigin" />
        <input type="hidden" name="adult" :value="counts.adult" />
        <input type="hidden" name="child" :value="counts.child" />
        <input type="hidden" name="senior" :value="counts.senior" />
        <input type="hidden" name="staff" :value="counts.staff" v-if="user?.is_staff" />

        <button type="submit" class="search-btn" :aria-label="$t('Search')">
            <svg-icon name="search" />
            <span class="search-btn__text">{{ $t('Search') }}</span>
        </button>
    </form>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { trans } from 'laravel-vue-i18n';
import SvgIcon from '../SvgIcon.vue';
import PassengerStepper from './PassengerStepper.vue';
import DateField from './DateField.vue';
import { toYmd, fromYmd, localToday, maxBookingDate } from './dates';

const props = defineProps({
    uid: { type: String, default: 'bus' },
    locations: { type: Array, default: () => [] },
    llpLocations: { type: Array, default: () => [] },
    llpOriginEnabled: Boolean,
    origin: String,
    date: String,
    zone: [String, Number],
    presetZone: String,
    adult: { type: Number, default: 1 },
    child: { type: Number, default: 0 },
    senior: { type: Number, default: 0 },
    staff: { type: Number, default: 0 },
    user: Object,
});

const form = ref(null);

// Back from the results: restore the search submit() saved on this history entry.
// A fresh visit is a new entry with no state, so it starts from the props.
const saved = history.state?.busSearch ?? null;
const initial = {
    origin: saved?.origin ?? props.origin,
    zone: saved?.zone_id ?? props.zone,
    date: saved?.date ?? props.date,
    adult: saved ? Number(saved.adult ?? 0) : props.adult,
    child: saved ? Number(saved.child ?? 0) : props.child,
    senior: saved ? Number(saved.senior ?? 0) : props.senior,
    staff: saved ? Number(saved.staff ?? 0) : props.staff,
};

const originOptions = [
    { id: 'klia2', name: 'KLIA2' },
    ...(props.llpOriginEnabled ? [{ id: 'lalaport', name: 'Lalaport BBCC' }] : []),
];
const originOption = ref(originOptions.find(o => o.id === initial.origin) ?? originOptions[0]);
const busOrigin = computed(() => originOption.value?.id ?? 'klia2');

const destinationOptions = computed(() => busOrigin.value === 'lalaport' ? props.llpLocations : props.locations);

// The home page passes a zone id; the SEO pages pass the destination's name.
const findPreset = () => destinationOptions.value.find(z =>
    (initial.zone && String(z.id) === String(initial.zone)) ||
    (props.presetZone && String(z.name).trim().toUpperCase() === props.presetZone.trim().toUpperCase())
) ?? null;
const location = ref(findPreset());

watch(busOrigin, () => {
    location.value = null;
});

const today = localToday();
const maxDate = maxBookingDate();
const date = ref((initial.date && fromYmd(initial.date)) || today);
const ymd = computed(() => date.value ? toYmd(date.value) : '');

const counts = reactive({
    adult: initial.adult,
    child: initial.child,
    senior: initial.senior,
    staff: initial.staff,
});
const total = computed(() => counts.adult + counts.child + counts.senior + counts.staff);

const fail = (text) => Swal.fire({ icon: 'error', title: trans('Error') + '!', text });

const submit = () => {
    if (!location.value || !location.value.id) {
        fail(trans('You need to select a location first.'));
        return;
    }
    if (total.value <= 0) {
        fail(trans('You need to select the number of passengers'));
        return;
    }
    // Put the search on the home page's own history entry, so Back from the results
    // returns to /?zone_id=... with the form filled in rather than a bare /.
    if (window.location.pathname === '/') {
        const params = new URLSearchParams(new FormData(form.value));
        history.replaceState(history.state, '', '/?' + params.toString());
    }
    // Remember the search on this page's history entry (not in its URL), so Back
    // from the results comes back to the form as it was submitted.
    history.replaceState({ ...(history.state ?? {}), busSearch: Object.fromEntries(new FormData(form.value)) }, '');
    form.value.submit();
};
</script>
