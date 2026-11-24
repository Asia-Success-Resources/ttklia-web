<template>
    <div class="modal fade" ref="modalEl" id="marketingConsentModal" tabindex="-1"
         aria-labelledby="marketingConsentModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered marketing-consent-dialog">
            <div class="modal-content border-0 overflow-hidden marketing-consent-content">
                <button type="button" class="btn-close marketing-consent-close" aria-label="Close" @click="dismiss"></button>

                <div class="modal-body p-4 text-center">
                    <div class="marketing-consent-badge mx-auto mb-3">
                        <svg-icon name="brand-whatsapp" />
                    </div>

                    <img src="/images/logo.png" alt="ttklia" class="marketing-consent-logo mb-3">

                    <h5 class="fw-bold mb-2 marketing-consent-title" id="marketingConsentModalLabel">
                        {{ $t('Get the latest deals in WhatsApp') }}
                    </h5>
                    <p class="text-muted mb-4">
                        {{ $t('Add your WhatsApp number to receive marketing deals and promotions.') }}
                    </p>

                    <form @submit.prevent="submit">
                        <div class="row g-2 mb-3 text-start">
                            <div class="col-5">
                                <multi-select v-model="country"
                                              :placeholder="trans('Country code')"
                                              label="short_label"
                                              track-by="iso_3166_1_alpha2"
                                              :options="countryOptions"
                                              :allow-empty="false"
                                              :show-labels="false">
                                </multi-select>
                            </div>
                            <div class="col-7">
                                <input type="tel"
                                       class="form-control h-100"
                                       :class="{ 'is-invalid': errorMessage }"
                                       :placeholder="trans('Enter phone number')"
                                       v-model="mobileNumber"
                                       inputmode="numeric"
                                       required>
                            </div>
                        </div>

                        <div class="alert alert-danger py-2" v-if="errorMessage">{{ errorMessage }}</div>

                        <button type="submit" class="btn marketing-consent-submit w-75 py-2 fw-bold" :disabled="submitting">
                            {{ submitting ? $t('Please wait...') : $t('SIGN UP') }}
                        </button>
                    </form>

                    <p class="text-muted small mt-4 mb-0 marketing-consent-terms">
                        {{ $t('I agree to receive marketing deals and promotions from TTKLIA via various channels, including WhatsApp. Opt out anytime. Read more on the') }}
                        <a :href="privacyUrl" target="_blank">{{ $t('Privacy Policy') }}</a>.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { trans } from 'laravel-vue-i18n';

const props = defineProps({
    countries: { type: Array, default: () => [] },
    storeUrl: { type: String, required: true },
    dismissUrl: { type: String, required: true },
    privacyUrl: { type: String, default: '/privacy' },
    // Milliseconds to wait after page load before showing the modal.
    delay: { type: Number, default: 1500 },
});

const modalEl = ref(null);
const country = ref(null);
const mobileNumber = ref('');
const errorMessage = ref('');
const submitting = ref(false);

let modal = null;

const countryOptions = computed(() => (props.countries || [])
    .filter(c => c.calling_code)
    .map(c => ({
        ...c,
        // "MY +60" in the trigger, full name in the dropdown list.
        short_label: `${c.iso_3166_1_alpha2} +${c.calling_code}`,
    })));

onMounted(() => {
    country.value = countryOptions.value.find(c => c.iso_3166_1_alpha2 === 'MY') || countryOptions.value[0];

    modal = new window.bootstrap.Modal(modalEl.value, { backdrop: 'static', keyboard: false });

    // Another modal (e.g. the lucky wheel on the home page) may be open when we are ready to
    // show. Stacking two Bootstrap modals breaks the backdrop, so wait for a clear screen --
    // but never wait forever, or a modal that closes without firing its event strands us.
    let shown = false;

    const show = () => {
        if (shown) {
            return;
        }

        shown = true;
        modal.show();
    };

    const anyModalOpen = () => Array.from(document.querySelectorAll('.modal.show'))
        .some(el => el !== modalEl.value);

    const showWhenFree = (attempt = 0) => {
        // Give up waiting after ~10s and show anyway, so we always appear.
        if (!anyModalOpen() || attempt >= 20) {
            show();
            return;
        }

        setTimeout(() => showWhenFree(attempt + 1), 500);
    };

    setTimeout(() => showWhenFree(), props.delay);
});

const submit = () => {
    if (submitting.value) {
        return;
    }

    errorMessage.value = '';
    submitting.value = true;

    axios.post(props.storeUrl, {
        marketing_country_code: '+' + country.value.calling_code,
        marketing_mobile_number: mobileNumber.value.replace(/\D/g, ''),
    }).then((response) => {
        modal.hide();
        if (window.Swal) {
            window.Swal.fire({ icon: 'success', text: response.data.message, timer: 3000, showConfirmButton: false });
        }
    }).catch((error) => {
        errorMessage.value = error.response?.data?.message || trans('Something went wrong. Please try again.');
    }).finally(() => {
        submitting.value = false;
    });
}

const dismiss = () => {
    modal.hide();
    // Remember the dismissal so the modal does not reappear on every confirmation page.
    axios.post(props.dismissUrl).catch(() => {});
}
</script>

<style scoped>
/* TTKLIA palette: $primary #FF0004, $warning #FF7100 (resources/sass/frontend.scss). */
.marketing-consent-dialog {
    max-width: 400px;
}

.marketing-consent-content {
    border-radius: 1rem;
    box-shadow: 0 12px 40px rgba(0, 0, 0, .18);
}

.marketing-consent-close {
    position: absolute;
    top: .85rem;
    right: .85rem;
    z-index: 2;
    opacity: .45;
}

.marketing-consent-close:hover {
    opacity: .8;
}

/* WhatsApp green badge: the channel is the point, so it leads. */
.marketing-consent-badge {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: #25d366;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 16px rgba(37, 211, 102, .3);
}

.marketing-consent-badge .svg-icon {
    font-size: 2.1rem;
    color: white;
}

.marketing-consent-logo {
    height: 22px;
    width: auto;
}

.marketing-consent-title {
    color: #1a1a1a;
    font-size: 1.2rem;
}

/* The sign-up button is the one action here, so give it the full brand red. */
.marketing-consent-submit {
    background-color: #FF0004;
    border-color: #FF0004;
    color: white;
    letter-spacing: .04em;
    border-radius: .5rem;
}

.marketing-consent-submit:hover:not(:disabled),
.marketing-consent-submit:focus:not(:disabled) {
    background-color: #d90003;
    border-color: #d90003;
    color: white;
}

.marketing-consent-submit:disabled {
    background-color: #cb6a6a;
    border-color: #cb6a6a;
    color: white;
}

.marketing-consent-terms {
    font-size: .72rem;
    line-height: 1.5;
}

.marketing-consent-terms a {
    color: #FF0004;
}
</style>
