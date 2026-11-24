<template>
    <form :action="updateUrl" method="POST" @submit="onSubmit">
        <input type="hidden" name="_token" :value="csrfToken">
        <input type="hidden" name="marketing_consent_status" ref="statusInput" :value="optedIn ? 1 : 0">

        <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" role="switch"
                   id="marketing_consent_status" v-model="optedIn">
            <label class="form-check-label" for="marketing_consent_status">
                {{ $t('Receive marketing deals and promotions on WhatsApp') }}
            </label>
        </div>

        <p class="text-muted small mb-3">
            {{ $t('Get exclusive offers and marketing news from TTKLIA sent straight to your WhatsApp. You can opt out anytime.') }}
        </p>

        <template v-if="optedIn">
            <label class="form-label small text-muted">{{ $t('WhatsApp number') }}</label>
            <div class="row g-2 align-items-start">
                <div class="col-12 col-sm-5">
                    <multi-select v-model="country"
                                  :placeholder="trans('Country code')"
                                  label="short_label"
                                  track-by="iso_3166_1_alpha2"
                                  :options="countryOptions"
                                  :allow-empty="false"
                                  :show-labels="false">
                    </multi-select>
                    <input type="hidden" name="marketing_country_code" :value="country ? '+' + country.calling_code : ''">
                </div>
                <div class="col-12 col-sm-7">
                    <!-- Not natively required: unsubscribing submits the same form and must
                         not be blocked by an empty number field. onSubmit validates instead. -->
                    <input type="tel" class="form-control h-100" name="marketing_mobile_number"
                           :class="{ 'is-invalid': numberError }"
                           :placeholder="trans('Enter phone number')" v-model="mobileNumber"
                           inputmode="numeric">
                    <div class="invalid-feedback" v-if="numberError">{{ numberError }}</div>
                </div>
            </div>

            <div class="d-flex gap-2 flex-wrap mt-3">
                <button type="submit" class="btn btn-primary px-4" :disabled="!hasChanges">
                    {{ currentlySubscribed ? $t('Update Number') : $t('Save') }}
                </button>
                <!-- Opting out is its own submit so the customer does not have to flip the
                     switch and lose the number they already gave us. -->
                <button type="submit" class="btn btn-outline-secondary" v-if="currentlySubscribed" @click="unsubscribe">
                    {{ $t('Unsubscribe') }}
                </button>
            </div>
        </template>

        <!-- Switched off: only offer to save when there is an active subscription to cancel. -->
        <button type="submit" class="btn btn-outline-secondary" v-else-if="currentlySubscribed">
            {{ $t('Unsubscribe') }}
        </button>
    </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { trans } from 'laravel-vue-i18n';

const props = defineProps({
    countries: { type: Array, default: () => [] },
    updateUrl: { type: String, required: true },
    // Null when the customer has never been asked, otherwise 0 or 1.
    consentStatus: { default: null },
    existingCountryCode: { type: String, default: '' },
    existingMobileNumber: { type: String, default: '' },
    csrfToken: { type: String, required: true },
});

const optedIn = ref(false);
const country = ref(null);
const mobileNumber = ref('');
const statusInput = ref(null);
const numberError = ref('');
let unsubscribing = false;

// Null status means the customer has never been asked; 0 means they opted out.
// Only a stored 1 means there is an existing subscription to cancel.
const currentlySubscribed = computed(() => Number(props.consentStatus) === 1);

const countryOptions = computed(() => (props.countries || [])
    .filter(c => c.calling_code)
    .map(c => ({ ...c, short_label: `${c.iso_3166_1_alpha2} +${c.calling_code}` })));

// Malaysian numbers are stored without the leading zero, so compare the same way the
// server will store them, otherwise typing "012..." always looks like a change.
const normalised = computed(() => {
    const code = country.value ? '+' + country.value.calling_code : '';
    let number = (mobileNumber.value || '').replace(/\D/g, '');

    if (code === '+60' && number.startsWith('0')) {
        number = number.slice(1);
    }

    return { code, number };
});

// Nothing to submit until they actually change something, unless this is a first sign-up.
const hasChanges = computed(() => {
    if (!currentlySubscribed.value) {
        return true;
    }

    return normalised.value.code !== props.existingCountryCode
        || normalised.value.number !== props.existingMobileNumber;
});

// Vue patches the DOM asynchronously, so flipping the switch in a click handler can race
// the form submit and post a stale value. Write the field directly instead.
const unsubscribe = () => {
    if (statusInput.value) {
        statusInput.value.value = 0;
    }
    unsubscribing = true;
};

const onSubmit = (event) => {
    // The unsubscribe button posts status 0, so the number fields do not matter there.
    if (unsubscribing) {
        unsubscribing = false;
        return;
    }

    numberError.value = '';

    if (optedIn.value && !normalised.value.number) {
        numberError.value = trans('Please enter a valid mobile number.');
        event.preventDefault();
    }
};

onMounted(() => {
    optedIn.value = Number(props.consentStatus) === 1;
    mobileNumber.value = props.existingMobileNumber || '';

    country.value = countryOptions.value.find(c => '+' + c.calling_code === props.existingCountryCode)
        || countryOptions.value.find(c => c.iso_3166_1_alpha2 === 'MY')
        || countryOptions.value[0];
});
</script>
