<template>
    <!-- Sends (or re-sends) the verification email after a security check,
         then lands on the "check your inbox" page. -->
    <button type="button" :class="buttonClass" :disabled="sending" @click="send">
        <slot>{{ $t('Verify Email') }}</slot>
    </button>
    <security-check ref="check" :site-key="siteKey" :text="$t('Confirm you are not a robot and we will email you a verification link.')" />
</template>

<script setup>
import { ref } from 'vue';
import { trans } from 'laravel-vue-i18n';

const props = defineProps({
    siteKey: { type: String, default: '' },
    resendUrl: { type: String, required: true },
    noticeUrl: { type: String, required: true },
    buttonClass: { type: String, default: 'btn btn-primary' },
});

const check = ref(null);
const sending = ref(false);

const send = async () => {
    const token = await check.value.challenge();
    if (token === null) {
        return;
    }

    sending.value = true;
    try {
        await axios.post(props.resendUrl, { recaptcha_token: token });
        window.location.assign(props.noticeUrl);
    } catch (error) {
        sending.value = false;
        window.Swal.fire({
            icon: 'error',
            title: trans('Error') + '!',
            text: error.response?.data?.message ?? trans('Failed to send the verification email. Please try again.'),
        });
    }
};
</script>
