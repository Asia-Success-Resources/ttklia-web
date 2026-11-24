<template>
    <div class="field-grid field-grid--2">
        <div class="field" :class="{ 'is-invalid': localErrors.name }">
            <label for="name" class="field__label">{{ $t('Full Name') }}</label>
            <input class="form-control" type="text" name="name" id="name" :placeholder="trans('Enter your full name')" v-model="name" @input="clearError('name')" autocomplete="name" autofocus required>
            <p class="field__error" v-for="error in localErrors.name" :key="error">{{ error }}</p>
        </div>

        <div class="field" :class="{ 'is-invalid': localErrors.phone_number }">
            <label for="phone_number" class="field__label">{{ $t('Phone Number') }}</label>
            <input type="hidden" v-if="country" name="country_code" :value="'+' + country['calling_code']">
            <div class="phone-field">
                <div class="phone-field__code">
                    <multi-select :placeholder="trans('Code')"
                                  v-model="country"
                                  label="country_name_calling_code"
                                  track-by="calling_code"
                                  :options="countries"
                                  :show-labels="false"
                                  :allow-empty="false">
                        <template #singleLabel="{ option }"><span>{{ option.emoji }} +{{ option.calling_code }}</span></template>
                    </multi-select>
                </div>
                <input class="form-control" type="tel" name="phone_number" id="phone_number" placeholder="123456789" v-model="phoneNumber" @input="clearError('phone_number')" :readonly="isVerified" autocomplete="tel-national">
            </div>
            <p class="field__error" v-if="otpResponse">{{ otpResponse }}</p>
            <p class="field__error" v-for="error in localErrors.phone_number" :key="error">{{ error }}</p>
        </div>

        <div v-if="otpSent" class="field field-grid__full">
            <label for="otp" class="field__label">{{ $t('OTP') }}</label>
            <div class="otp-field">
                <input type="text" id="otp" class="form-control" placeholder="XXXXXX" inputmode="numeric" :disabled="isVerified" v-model="otp" @input="verifyOtpResponse = null">
                <button class="btn btn-outline-dark" type="button" :disabled="isVerified" @click="verifyOtp">{{ $t('Verify') }}</button>
            </div>
            <p :class="isVerified ? 'field__note' : 'field__error'" v-if="verifyOtpResponse">{{ verifyOtpResponse }}</p>
        </div>

        <div class="field field-grid__full" :class="{ 'is-invalid': localErrors.email }">
            <label for="emailaddress" class="field__label">{{ $t('Email Address') }}</label>
            <input class="form-control" type="email" name="email" id="emailaddress" :placeholder="trans('you@example.com')" v-model="email" @input="clearError('email')" autocomplete="email" required>
            <p class="field__error" v-for="error in localErrors.email" :key="error">{{ error }}</p>
        </div>

        <div class="field" :class="{ 'is-invalid': localErrors.password }">
            <label for="password" class="field__label">{{ $t('Password') }}</label>
            <div class="password-field">
                <input :type="showPassword ? 'text' : 'password'" id="password" class="form-control" name="password" minlength="8" :placeholder="trans('At least 8 characters')" @input="clearError('password')" autocomplete="new-password" required>
                <button type="button" class="password-field__toggle" @click="showPassword = !showPassword" :aria-label="showPassword ? $t('Hide password') : $t('Show password')" :aria-pressed="showPassword">
                    <svg-icon :name="showPassword ? 'eye-off' : 'eye'" />
                </button>
            </div>
            <p class="field__error" v-for="error in localErrors.password" :key="error">{{ error }}</p>
        </div>

        <div class="field" :class="{ 'is-invalid': localErrors.password_confirmation }">
            <label for="password_confirmation" class="field__label">{{ $t('Confirm Password') }}</label>
            <div class="password-field">
                <input :type="showConfirmPassword ? 'text' : 'password'" id="password_confirmation" class="form-control" minlength="8" name="password_confirmation" :placeholder="trans('Repeat your password')" @input="clearError('password_confirmation')" autocomplete="new-password" required>
                <button type="button" class="password-field__toggle" @click="showConfirmPassword = !showConfirmPassword" :aria-label="showConfirmPassword ? $t('Hide password') : $t('Show password')" :aria-pressed="showConfirmPassword">
                    <svg-icon :name="showConfirmPassword ? 'eye-off' : 'eye'" />
                </button>
            </div>
            <p class="field__error" v-for="error in localErrors.password_confirmation" :key="error">{{ error }}</p>
        </div>

        <div class="field field-grid__full" :class="{ 'is-invalid': localErrors.terms_and_conditions }">
            <div class="check-field">
                <input class="form-check-input" type="checkbox" value="1" id="terms_check" name="terms_and_conditions" @change="clearError('terms_and_conditions')">
                <label for="terms_check">
                    {{ $t('I accept TTKLIA’s') }} <a :href="props.termsUrl" target="_blank" rel="noopener">{{ $t('Terms & Conditions') }}</a>, <a :href="props.termsUrl" target="_blank" rel="noopener">{{ $t('Terms of Use') }}</a> {{ $t('and') }} <a :href="props.privacyUrl" target="_blank" rel="noopener">{{ $t('Privacy Policy') }}</a>.
                </label>
            </div>
            <p class="field__error" v-for="error in localErrors.terms_and_conditions" :key="error">{{ error }}</p>
            <div class="check-field">
                <input class="form-check-input" type="checkbox" value="1" id="marketing_check" name="marketing_and_promotions">
                <label for="marketing_check">{{ $t('I agree to receive marketing and promotional messages from TTKLIA (optional).') }}</label>
            </div>
        </div>

        <div class="field-grid__full recaptcha-slot">
            <div ref="recaptchaContainer" class="g-recaptcha" :data-sitekey="recaptcha.siteKey"></div>
        </div>

        <div class="field-grid__full">
            <button class="btn btn-primary btn-lg auth-submit" type="submit" :disabled="!recaptchaVerified">{{ $t('Create account') }}</button>
            <p class="field__error text-center mt-2" v-if="recaptchaError">{{ recaptchaError }}</p>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { trans } from "laravel-vue-i18n";

let props = defineProps({
    mobile: Boolean,
    countries: Array,
    name: String,
    email: String,
    phone: String,
    termsUrl: String,
    privacyUrl: String,
    errors: Object,
});
let recaptchaWidgetId = null;

const country = ref({"name":"Malaysia","official_name":"Malaysia","native_name":"Malaysia","native_official_name":"Malaysia","iso_3166_1_alpha2":"MY","iso_3166_1_alpha3":"MYS","calling_code":"60","currency":"MYR","emoji":"🇲🇾","country_name_calling_code":"Malaysia (+60)"});
const countries = ref([]);
const isVerified = ref(false);
const otp = ref('');
const phoneNumber = ref('');
const email = ref('');
const name = ref('');
const otpResponse = ref('');
const verifyOtpResponse = ref('');
const otpSent = ref(false);
const localErrors = ref({ ...props.errors });
const showPassword = ref(false);
const showConfirmPassword = ref(false);


// Define the reCAPTCHA site key
const recaptcha = ref({
    siteKey: import.meta.env?.VITE_RECAPTCHA_API_KEY ?? '',
    token: '',
    isScriptLoaded: false
});
// No site key (local dev, or before the API side exists): nothing to verify, so the button is not held back.
const recaptchaVerified = ref(!recaptcha.value.siteKey);
const recaptchaError = ref('');
const recaptchaContainer = ref(null);

const clearError = (field) => {
    if (localErrors.value[field]) {
        delete localErrors.value[field];
    }
};

onBeforeUnmount(() => {
    if (recaptchaContainer.value) {
        recaptchaWidgetId = null;
    }
});

onMounted(async () => {
    countries.value = (props.countries || []).filter(c => c.calling_code).map(c => ({
        ...c,
        country_name_calling_code: `${c.name} (+${c.calling_code})`,
    }));

    name.value = props.name;
    phoneNumber.value = props.phone;
    email.value = props.email;

    try {
        await loadRecaptchaScript();
        renderRecaptcha();
    } catch (err) {
        console.error(err);
    }
})

const loadRecaptchaScript = () => {
    return new Promise((resolve, reject) => {
        if (!import.meta.env?.VITE_GOOGLE_API_KEY) {
            return reject(new Error('API Key is missing'));
        }

        if (window.grecaptcha && window.grecaptcha.render) return resolve();

        window.vueRecaptchaOnloadCallback = () => resolve();

        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?onload=vueRecaptchaOnloadCallback&render=explicit';
        script.async = true;
        script.defer = true;
        script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
        document.head.appendChild(script);
    });
};

const renderRecaptcha = () => {
    if (!window.grecaptcha || !recaptchaContainer.value) return;
    if (recaptchaWidgetId !== null) {
        window.grecaptcha.reset(recaptchaWidgetId);
        return;
    }

    recaptchaWidgetId = window.grecaptcha.render(recaptchaContainer.value, {
        sitekey: recaptcha.value.siteKey,
        callback: onRecaptchaVerified,
        'expired-callback': onRecaptchaExpired,
    });
};

const onRecaptchaVerified = (token) => {
    recaptcha.value.token = token;
    recaptchaVerified.value = true;
};

const onRecaptchaExpired = () => {
    recaptcha.value.token = '';
    recaptchaVerified.value = false;
};

const sendOtp = () => {
    // Ensure reCAPTCHA is loaded
    if (typeof window.grecaptcha === 'undefined') {
        recaptchaError.value = "reCAPTCHA script is not loaded correctly.";
        return;
    }
    const recaptchaResponse = window.grecaptcha.getResponse();
    if (!recaptchaResponse.length) {
        recaptchaError.value = "Please complete reCAPTCHA verification.";
        return;
    }

    recaptcha.value.token = recaptchaResponse;

    axios.post('/otp/send', {
        country_code: country.value.calling_code,
        phone_number: phoneNumber.value,
    }).then((response) => {
        otpSent.value = true;
        otpResponse.value = typeof response.data.message === 'string' ? response.data.message : 'OTP sent successfully. Please check your phone for the OTP.';
    }).catch((error) => {
        otpSent.value = false;
        otpResponse.value = error.response.data.meta.message;
    });
}

const verifyOtp = () => {
    axios.post('/otp/verify', {
        country_code: country.value.calling_code,
        phone_number: phoneNumber.value,
        otp: otp.value,
    }).then((response) => {
        if (response.data.status === 'success') {
            isVerified.value = true;
            verifyOtpResponse.value = 'Phone number verified successfully.';
            otpResponse.value = '';
        } else {
            verifyOtpResponse.value = 'Failed to verify phone number. Please try again.';
            otpResponse.value = '';
        }
    }).catch((error) => {
        verifyOtpResponse.value = error.response.data.meta.message;
    });
}
</script>
