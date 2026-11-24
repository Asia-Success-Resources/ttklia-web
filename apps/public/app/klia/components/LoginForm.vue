<template>
    <div class="auth-switch" role="tablist" :aria-label="$t('Sign in with')">
        <button type="button" class="auth-switch__btn" role="tab" :aria-selected="tab === 1 ? 'true' : 'false'" @click="tab = 1">
            <svg-icon name="mail" /> {{ $t('Email') }}
        </button>
        <button type="button" class="auth-switch__btn" role="tab" :aria-selected="tab === 2 ? 'true' : 'false'" @click="tab = 2">
            <svg-icon name="phone" /> {{ $t('Phone') }}
        </button>
    </div>

    <div class="field-grid">
        <template v-if="tab === 1">
            <input type="hidden" name="form-type" value="email" />
            <div class="field" :class="{ 'is-invalid': localErrors.email }">
                <label for="emailaddress" class="field__label">{{ $t('Email address') }}</label>
                <input class="form-control" v-model="email" type="email" name="email" id="emailaddress" @input="clearError('email')" :placeholder="trans('you@example.com')" autocomplete="email" autofocus>
                <p class="field__error" v-for="error in localErrors.email" :key="error">{{ error }}</p>
            </div>
        </template>

        <template v-else>
            <input type="hidden" name="form-type" value="phone" />
            <input type="hidden" v-if="country" name="country_code" :value="'+' + country['calling_code']">
            <div class="field" :class="{ 'is-invalid': localErrors.phone_number }">
                <label for="phone_number" class="field__label">{{ $t('Phone Number') }}</label>
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
                    <input class="form-control" type="tel" name="phone_number" id="phone_number" placeholder="123456789" v-model="phone" @input="clearError('phone_number')" autocomplete="tel-national" required>
                </div>
                <p class="field__error" v-if="otpResponse">{{ otpResponse }}</p>
                <p class="field__error" v-for="error in localErrors.phone_number" :key="error">{{ error }}</p>
            </div>
        </template>

        <div class="field" :class="{ 'is-invalid': localErrors.password }">
            <div class="field__head">
                <label for="password" class="field__label">{{ $t('Password') }}</label>
                <a :href="props.passwordRequestUrl" class="field__link" tabindex="-1" v-if="props.passwordRequestUrl">{{ $t('Forgot your password?') }}</a>
            </div>
            <div class="password-field">
                <input :type="showPassword ? 'text' : 'password'" id="password" class="form-control" name="password" :placeholder="trans('Enter your password')" @input="clearError('password')" autocomplete="current-password">
                <button type="button" class="password-field__toggle" @click="showPassword = !showPassword" :aria-label="showPassword ? $t('Hide password') : $t('Show password')" :aria-pressed="showPassword">
                    <svg-icon :name="showPassword ? 'eye-off' : 'eye'" />
                </button>
            </div>
            <p class="field__error" v-for="error in localErrors.password" :key="error">{{ error }}</p>
        </div>
    </div>

    <input type="hidden" id="checkbox-signin" name="remember" value="1">
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { trans } from "laravel-vue-i18n";

let props = defineProps({
    errors: Object,
    countries: Array,
    passwordRequestUrl: String,
    email: String,
    phone: String,
    formType: String,
});

const country = ref({"name":"Malaysia","official_name":"Malaysia","native_name":"Malaysia","native_official_name":"Malaysia","iso_3166_1_alpha2":"MY","iso_3166_1_alpha3":"MYS","calling_code":"60","currency":"MYR","emoji":"🇲🇾","country_name_calling_code":"Malaysia (+60)"});
const countries = ref([]);
const phone = ref('');
const email = ref('');
const otp = ref('');
const otpResponse = ref('');
const tab = ref(1);
const showPassword = ref(false);
const localErrors = ref({ ...props.errors });


const clearError = (field) => {
    if (localErrors.value[field]) {
        delete localErrors.value[field];
    }
};

onMounted(() => {
    countries.value = (props.countries || []).filter(c => c.calling_code).map(c => ({
        ...c,
        country_name_calling_code: `${c.name} (+${c.calling_code})`,
    }));

    phone.value = props.phone;
    email.value = props.email;

    tab.value = props.formType === 'phone' ? 2 : 1;
})

const sendOtp = () => {
    axios.post('/otp/send', {
        country_code: country.value.calling_code,
        phone_number: phone.value,
    }).then((response) => {
        otpResponse.value = typeof response.data.message === 'string' ? response.data.message : 'OTP sent successfully. Please check your phone for the OTP.';
    }).catch((error) => {
        otpResponse.value = error.response.data.meta.message;
    });
}
</script>
