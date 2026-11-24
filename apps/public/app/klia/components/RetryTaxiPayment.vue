<!--suppress EqualityComparisonWithCoercionJS -->
<template>
    <button class="btn btn-primary w-100 text-white mt-3 fs-4" @click="retryBooking()" type="button"><img v-if="loading" src="/images/loading.gif" /><span v-if="!loading">{{ $t('Retry Payment') }}</span></button>
</template>
<script setup>
import { defineComponent, reactive, ref, onBeforeMount, computed, watch } from 'vue';
import {trans} from "laravel-vue-i18n";

let props = defineProps({
    booking: Object,
    env: String,
});

const loading = ref(false);

const retryBooking = () => {
    if (loading.value) {
        return;
    }
    loading.value = true;
    axios.post('/taxi-bookings/' + props.booking.code + '/' + props.booking.web_session_id + '/payment').then((response) => {
        let booking = response.data.response;
        if (booking.payment_url) {
            window.location.href = booking.payment_url;
        } else {
            let req = booking.payment_params;
            Swal.fire({
                icon: "success",
                title: trans("Success") + '!',
                timer: 3000,
                text: trans('Successfully confirmed your booking. Please proceed to make payment.'),
            }).then(function () {
                const formData = {
                    TransactionType: 'SALE',
                    PymtMethod: 'ANY',
                    ServiceID: req.service_id,
                    PaymentID: req.payment_id,
                    OrderNumber: req.order_number,
                    PaymentDesc: req.payment_desc,
                    MerchantName: req.merchant_name,
                    MerchantReturnURL: req.return_url,
                    MerchantCallbackURL: req.callback_url,
                    Amount: req.amount,
                    CurrencyCode: req.currency_code,
                    CustName: req.customer_name,
                    CustPhone: req.customer_phone,
                    CustEmail: req.customer_email,
                    HashValue: req.signature,
                    MerchantTermsURL: 'https://ttklia.com/terms',
                    LanguageCode: document.documentElement.lang.toUpperCase(),
                    CustIP: req.ip,
                    PageTimeout: req.page_timeout,
                }
                const form = document.createElement('form')
                form.method = 'post'
                if (props.env === "production") {
                    form.action = 'https://securepay.e-ghl.com/IPG/Payment.aspx'
                } else {
                    form.action = 'https://pay.e-ghl.com/IPGSG/Payment.aspx'
                }
                for (const key in formData) {
                    const input = document.createElement('input')
                    input.type = 'hidden'
                    input.name = key
                    input.value = formData[key]
                    form.appendChild(input)
                }
                document.body.appendChild(form);
                form.submit()
                document.body.removeChild(form);
            });
        }
    }).catch(function (error) {
        loading.value = false;
        if (error.response && error.response.data) {
            Swal.fire({
                icon: "error",
                title: trans("Error") + '!',
                text: trans(error.response.data.meta.message),
            })
        } else if (error.request) {
            console.log(error.request);
        } else {
            console.log('Error', error.message);
        }
        console.log(error.config);
    });
};

</script>
