<!--suppress EqualityComparisonWithCoercionJS -->
<template>
    <div class="exchange">
        <section class="exchange__form" aria-labelledby="exchange-form-title">
            <div class="exchange__card">
                <div class="exchange__card-head">
                    <h2 id="exchange-form-title">{{ $t('Ticket details') }}</h2>
                    <p>{{ $t('Use the reference from your original booking confirmation.') }}</p>
                </div>

                <div v-if="terminals.length" class="exchange__terminals" role="group" :aria-label="$t('Departure terminal')">
                    <a v-for="t in terminals" :key="t.value" :href="t.href"
                       class="exchange__terminal" :class="{ 'is-active': t.value === terminal }"
                       :aria-current="t.value === terminal ? 'page' : null">
                        {{ t.label }}
                    </a>
                </div>

                <div class="exchange__fields">
                    <div class="exchange__field">
                        <label class="form-label" for="exchange-date">{{ $t('Travel date') }}</label>
                        <input id="exchange-date" type="date" name="date" v-model="date" :min="today" :max="max" class="form-control">
                    </div>
                    <div class="exchange__field">
                        <label class="form-label" for="exchange-operator">{{ $t('Operator') }}</label>
                        <multi-select id="exchange-operator" :placeholder="$t('Search operator')" v-model="operator" label="name" :options="operators.options"></multi-select>
                    </div>
                    <div class="exchange__field exchange__field--wide">
                        <label class="form-label" for="exchange-reference">{{ $t('Booking reference') }}</label>
                        <input id="exchange-reference" type="text" name="reference" :placeholder="$t('e.g. ABC123456')" v-model="reference" class="form-control" autocomplete="off" @keyup.enter="canFetch && fetchDetails()">
                    </div>
                </div>

                <div class="exchange__actions">
                    <button type="button" class="btn btn-primary btn-lg" :disabled="!canFetch" :aria-busy="fetchingDetails" @click="fetchDetails">
                        <span v-if="fetchingDetails" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                        <svg-icon v-else name="search" />
                        <span>{{ fetchingDetails ? $t('Looking up ticket') : $t('Find my ticket') }}</span>
                    </button>
                    <span class="exchange__hint">{{ $t('Tickets can be exchanged up to 2 months ahead.') }}</span>
                </div>
            </div>
        </section>

        <aside class="exchange__summary" aria-labelledby="exchange-summary-title">
            <div class="exchange__card exchange__card--summary">
                <h2 id="exchange-summary-title">{{ $t('Summary') }}</h2>

                <div v-if="!trip && !ticketDetails" class="exchange__empty">
                    <svg-icon name="ticket" class="icon-xl" />
                    <p>{{ $t('Your seat and trip details will appear here once we find your ticket.') }}</p>
                </div>

                <dl v-else class="exchange__list">
                    <div class="exchange__row"><dt>{{ $t('Destination') }}</dt><dd>{{ trip ? trip.zone_name : '-' }}</dd></div>
                    <div class="exchange__row"><dt>{{ $t('Date') }}</dt><dd>{{ date ?? '-' }}</dd></div>
                    <div class="exchange__row"><dt>{{ $t('Seat No') }}</dt><dd>{{ seat ? seat.seat_no : '-' }}</dd></div>
                    <template v-if="ticketDetails">
                        <div class="exchange__row"><dt>{{ $t('Name') }}</dt><dd>{{ ticketDetails.cust_name ?? '-' }}</dd></div>
                        <div class="exchange__row"><dt>{{ $t('Contact No') }}</dt><dd>{{ ticketDetails.contact ?? '-' }}</dd></div>
                        <div class="exchange__row"><dt>{{ $t('Ticket Type') }}</dt><dd>{{ ticketDetails.seat_type ?? '-' }}</dd></div>
                    </template>
                </dl>

                <div class="exchange__total">
                    <span class="exchange__total-label">{{ $t('Terminal & QR Fee') }}</span>
                    <span class="exchange__total-value">RM{{ collectionPrice.toFixed(2) }}</span>
                </div>

                <form id="create-collection" method="POST" @submit.prevent>
                    <input type="hidden" name="reference_no" :value="reference" />
                    <input type="hidden" name="date" :value="date" />
                    <input type="hidden" name="company_id" :value="operator ? operator.id : ''" />
                    <input type="hidden" name="terminal" :value="terminal" />

                    <button class="btn btn-primary btn-lg w-100" type="button" :disabled="!seat || !operator || creatingCollection" :aria-busy="creatingCollection" @click="createCollection">
                        <span v-if="creatingCollection" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                        <span>{{ $t('Make Payment') }}</span>
                    </button>
                </form>
                <p class="exchange__secure"><svg-icon name="lock" /> {{ $t('Secure payment') }}</p>
            </div>
        </aside>
    </div>
</template>
<script setup>
import { defineComponent, reactive, ref, onBeforeMount, computed, watch } from 'vue';
import {trans} from "laravel-vue-i18n";

let props = defineProps({
    operators: Array,
    env: String,
    collectTicketData: {
        type: Object,
        default: null
    },
    collectionPrice: { type: Number, default: 1 },
    terminal: { type: String, default: 'klia2' },
    terminals: { type: Array, default: () => [] },
});


const date = ref();
const today = ref();
const max = ref();

const reference = ref(props.collectTicketData ? props.collectTicketData.reference : '');
const operator = ref();
const ticketDetails = ref(null);
const operators = reactive({ options: [] });

const trip = ref();
const seat = ref(null);

const fetchingDetails = ref(false);
const canFetch = computed(() => (reference.value || '').trim().length > 0 && !!operator.value && !!date.value && !fetchingDetails.value);
const creatingCollection = ref(false);

onBeforeMount(() => {
    if (props.operators !== undefined) {
        operators.options = props.operators;
    }

    let temp = new Date();
    // This is needed because it toJSON converts it to UTC
    date.value = (new Date(temp.getTime() - (temp.getTimezoneOffset() * 60000))).toJSON().split('T')[0];
    today.value = date.value;
    // 2 months ahead, clamped to the last day of that month so e.g. 31 Dec -> 28/29 Feb
    // rather than overflowing into March.
    let lastDay = new Date(temp.getFullYear(), temp.getMonth() + 2, temp.getDate());
    if (lastDay.getDate() !== temp.getDate()) {
        lastDay = new Date(temp.getFullYear(), temp.getMonth() + 3, 0);
    }
    max.value = (new Date(lastDay.getTime() - (lastDay.getTimezoneOffset() * 60000))).toJSON().split('T')[0];

    if (props.collectTicketData) {
        date.value = props.collectTicketData.date;

        operator.value = operators.options.find(op => op.id == props.collectTicketData.company_id) || null;
    }
});


const createCollection = () => {
    if (creatingCollection.value) {
        return;
    }
    creatingCollection.value = true;
    axios({
        method: 'POST',
        url: '/bookings/collect',
        data: new FormData($('#create-collection')[0])
    }).then((response) => {
        let booking = response.data.response;
        if (booking.payment_url) {
            window.location.replace(booking.payment_url);
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
                    LanguageCode: 'en',
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
            creatingCollection.value = false;
        }
    }).catch(function (error) {
        creatingCollection.value = false;
        if (error.response && error.response.data && error.response.data.meta) {
            Swal.fire({
                icon: "error",
                title: trans("Error"),
                text: trans(error.response.data.meta.message),
            })
        } else {
            console.log(error);
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: error,
            })
        }
    });
}

const fetchDetails = () => {
    if (fetchingDetails.value) {
        return;
    }
    fetchingDetails.value = true;
    axios.get('/bookings/search', {
        params: {
            reference_no: reference.value,
            company_id: operator.value.id,
            date: date.value,
            terminal: props.terminal,
        }
    }).then((response) => {
        fetchingDetails.value = false;
        let data = response.data;

        if (data.meta.error) {
            Swal.fire({
                icon: "error",
                title: trans("Error"),
                text: data.meta.message,
            })
        } else {
            trip.value = data.response.trip;
            seat.value = data.response.seat;
            ticketDetails.value = data.response.ticket;
            Swal.fire({
                title: trans("Success"),
                text: trans('Successfully fetched ticket details.'),
                icon: "success"
            })
        }
    }).catch(function (error) {
        fetchingDetails.value = false;
        if (error.response && error.response.data) {
            if (error.response?.status == 401) {
                Swal.fire({
                    icon: "error",
                    title: trans("Error") + '!',
                    text: trans('Please proceed to login before collecting ticket.'),
                    timer: 2000,
                }).then(function () {
                    window.location.replace('/login');
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: trans("Error") + '!',
                    text: trans(error.response.data.meta.message),
                })
            }
        } else if (error.request) {
            console.log(error.request);
        } else {
            console.log('Error', error.message);
            Swal.fire({
                icon: "error",
                title: trans("Error"),
                text: error,
            })
        }
    });
}

</script>
