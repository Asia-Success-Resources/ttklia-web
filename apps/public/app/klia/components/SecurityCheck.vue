<template>
    <!-- Security check dialog: a reCAPTCHA checkbox shown only when an action
         that costs something (an SMS, an email) is requested. -->
    <Teleport to="body">
        <div class="modal fade captcha-modal" ref="modalEl" tabindex="-1" aria-labelledby="captcha-title" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body">
                        <span class="captcha-modal__icon"><svg-icon name="shield-check" /></span>
                        <h2 id="captcha-title">{{ $t('Security check') }}</h2>
                        <p>{{ text || $t('Confirm you are not a robot to continue.') }}</p>
                        <div class="captcha-modal__widget" ref="widgetEl"></div>
                        <p v-if="error" class="captcha-modal__error">{{ error }}</p>
                        <button type="button" class="btn btn-link" data-bs-dismiss="modal">{{ $t('Cancel') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { trans } from 'laravel-vue-i18n';

const props = defineProps({
    siteKey: { type: String, default: '' },
    text: { type: String, default: '' },
});

const modalEl = ref(null);
const widgetEl = ref(null);
const error = ref('');
let modal = null;
let widgetId = null;
let pending = null; // { resolve } for the challenge in progress

const settle = (token) => {
    if (pending) {
        const { resolve } = pending;
        pending = null;
        resolve(token);
    }
};

const renderWidget = () => new Promise((resolve, reject) => {
    if (widgetId !== null) {
        window.grecaptcha.reset(widgetId);
        resolve();
        return;
    }
    if (!window.grecaptcha) {
        reject(new Error('reCAPTCHA not loaded'));
        return;
    }
    window.grecaptcha.ready(() => {
        widgetId = window.grecaptcha.render(widgetEl.value, {
            sitekey: props.siteKey,
            callback: (token) => {
                modal?.hide();
                settle(token);
            },
            'expired-callback': () => {
                error.value = trans('Please complete the security check and try again.');
            },
        });
        resolve();
    });
});

/**
 * Open the dialog and resolve with the reCAPTCHA token, '' when no site key is
 * configured (local development), or null when the user cancels.
 */
const challenge = () => new Promise(async (resolve) => {
    if (!props.siteKey) {
        resolve('');
        return;
    }

    error.value = '';
    pending = { resolve };

    if (!modal) {
        modal = new window.bootstrap.Modal(modalEl.value);
        // Closing without solving counts as cancel.
        modalEl.value.addEventListener('hidden.bs.modal', () => settle(null));
    }
    modal.show();

    try {
        await renderWidget();
    } catch (e) {
        error.value = trans('The security check could not be loaded. Please refresh the page.');
    }
});

onBeforeUnmount(() => {
    modal?.dispose();
});

defineExpose({ challenge });
</script>
