<template>
    <div class="col-12">
        <label for="">{{ $t('Phone Number') }} *</label>
        <div class="container-fluid p-0">
            <div class="row">
                <div class="col-md-3 mb-2 mb-md-0 pe-md-0">
                    <input type="hidden" v-if="country" name="country_code" :value="'+' + country['calling_code']">
                    <multi-select :placeholder="trans('Search Country Code')"
                                  v-model="country"
                                  label="country_name_calling_code"
                                  track-by="calling_code"
                                  :options="countries">
                    </multi-select>
                </div>
                <div class="col-md-9 ps-md-0">
                    <div class="input-group">
                        <input class="form-control" type="tel" name="phone_number" id="phone_number" placeholder="123456789" v-model="phoneNumber" required>
                        <input class="form-control" type="hidden" name="otp_sent" :value="otpSent ? 1 : 0">
                        <!--disable if email is already verified-->
                        <button class="btn btn-primary send-otp-btn" type="button" @click="requestOtp" :disabled="sending || (props.user.email_verified_at || (props.user.phone_verified_at && (props.existingCountryCode === '+' + country.calling_code && props.phoneNumber === phoneNumber)))">{{ $t('Send OTP') }}</button>
                    </div>
                </div>

                <template v-if="otpResponse">
                    <span class="invalid-feedback" style="display: block">
                        <strong>{{ $t(otpResponse) }}</strong>
                    </span>
                </template>
            </div>
        </div>
    </div>
    <div class="col-12 mt-2" v-if="otpSent">
        <label for="otp" class="form-label">OTP</label>
        <div class="input-group mb-3">
            <input type="text" class="form-control" placeholder="XXXXXX" v-model="otp" name="code">
        </div>
    </div>

    <security-check ref="check" :site-key="recaptchaSiteKey" :text="$t('Confirm you are not a robot and we will send the code to your phone.')" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { trans } from "laravel-vue-i18n";

let props = defineProps({
    countries: Array,
    user: Object,
    errors: Object,
    existingCountryCode: String,
    phoneNumber: String,
    recaptchaSiteKey: String,
});

const country = ref({"name":"Malaysia","official_name":"Malaysia","native_name":"Malaysia","native_official_name":"Malaysia","iso_3166_1_alpha2":"MY","iso_3166_1_alpha3":"MYS","calling_code":"60","currency":"MYR","emoji":"🇲🇾","country_name_calling_code":"Malaysia (+60)"});
const countries = ref([]);
const phoneNumber = ref('');
const otpResponse = ref('');
const otpSent = ref(false);
const sending = ref(false);
const check = ref(null);

const requestOtp = async () => {
    otpResponse.value = '';
    const token = await check.value.challenge();
    if (token === null) {
        return;
    }
    sendOtp(token);
};

onMounted(() => {
    countries.value = (props.countries || []).filter(c => c.calling_code).map(c => ({
        ...c,
        country_name_calling_code: `${c.name} (+${c.calling_code})`,
    }));

    if (props.existingCountryCode) {
        country.value = countries.value.find(c => '+' + c.calling_code === props.existingCountryCode);
    }
    if (props.phoneNumber) {
        phoneNumber.value = props.phoneNumber;
    }
})


const sendOtp = (recaptchaToken) => {
    sending.value = true;

    axios.post('/otp/send', {
        country_code: country.value.calling_code,
        phone_number: phoneNumber.value,
        recaptcha_token: recaptchaToken,
    }).then((response) => {
        if (response.data.status === 'success') {
            otpSent.value = true;
            otpResponse.value = typeof response.data.message === 'string' ? response.data.message : 'OTP sent successfully. Please check your phone for the OTP.';
        } else {
            otpSent.value = false;
            otpResponse.value = typeof response.data.message === 'string' ? response.data.message : 'Failed to send OTP. Please try again.';
        }
    }).catch((error) => {
        otpSent.value = false;
        otpResponse.value = error.response?.data?.meta?.message
            ?? error.response?.data?.message
            ?? 'Failed to send OTP. Please try again.';
    }).finally(() => {
        sending.value = false;
    });
}
</script>
