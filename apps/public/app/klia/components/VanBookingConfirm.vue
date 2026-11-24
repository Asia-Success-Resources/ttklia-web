<template>
    <div class="container-xl" :class="isMobile ? '' : 'mt-5'">
        <form id="submit-form" method="POST">
            <div class="row">
                <div class="col-lg-8">
                    <div class="card border-0 shadow-sm mt-3">
                        <div class="card-body">
                            <h4 class="fw-light mt-2">Passenger Details</h4>
                            <small v-if="!user" class="text-muted">Sign up for faster bookings!</small>
                            <hr />
                            <div class="mb-3">
                                <label class="form-label">Full Name *</label>
                                <input type="text" class="form-control" name="customer_name" v-model="customerName" placeholder="Full Name"
                                    required />
                            </div>
                            <div class="row">
                                <div class="col-lg-6 mt-1">
                                    <label class="form-label">Email Address *</label>
                                    <input type="email" class="form-control" name="customer_email" v-model="customerEmail" placeholder="Email"
                                        required />
                                </div>
                                <div class="col-lg-6 mt-1">
                                    <label class="form-label">Phone Number *</label>
                                    <input type="text" class="form-control" name="customer_phone" v-model="customerPhone" placeholder="123456789"
                                        required />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4 px-4 my-4 mt-lg-0">
                    <h4 class="fw-light mt-2">Summary</h4>
                    <div class="row mt-2">
                        <div class="col-6">Date</div>
                        <div class="col-6 text-end fw-bold">{{ formattedDate }}</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">Departure</div>
                        <div class="col-6 text-end fw-bold">{{ departureTime }}</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">Pickup</div>
                        <div class="col-6 text-end fw-bold">{{ locationName }}</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">Destination</div>
                        <div class="col-6 text-end fw-bold">Genting Highlands</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">Pax</div>
                        <div class="col-6 text-end fw-bold">{{ pax }}</div>
                    </div>
                    <a class="text-decoration-underline text-black-50 mt-2 text-end d-block" :href="backUrl">Back</a>
                    <hr />
                    <div class="row mt-2">
                        <div class="col-6"><span class="fs-5">Subtotal</span></div>
                        <div class="col-6 text-end"><span class="fs-5">{{ basePrice.toFixed(2) }}</span></div>
                    </div>
                    <button type="button" class="btn btn-outline-primary w-100 my-2" data-bs-toggle="modal"
                        data-bs-target="#discountModal">
                        Apply Discount
                    </button>
                    <div class="row mt-2" v-if="discountAmount > 0">
                        <div class="col-6"><span class="fs-5">Discount</span></div>
                        <div class="col-6 text-end"><span class="fs-5">{{ discountAmount.toFixed(2) }}</span></div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6"><span class="fs-5 fw-bold">Total Price (MYR)</span></div>
                        <div class="col-6 text-end"><span class="fs-5 fw-bold text-primary">{{ totalPrice.toFixed(2)
                                }}</span></div>
                    </div>
                    <div class="row mt-2" v-if="user">
                        <div class="col-6"><span class="fs-5">Points</span></div>
                        <div class="col-6 text-end"><span class="fs-5 fw-bold text-success">{{ user.points }}</span></div>
                    </div>
                    <button v-if="user" type="button" class="btn btn-success w-100 text-white mt-3 fs-5"
                        @click="submitBooking(true)" :disabled="totalPrice > 0 && user.points < totalPrice">
                        <img v-if="loadingPoints" src="/images/loading.gif" style="height:24px" />
                        <span v-else>{{ totalPrice <= 0 ? 'Confirm Booking' : 'Use Points' }}</span>
                    </button>
                    <button v-if="totalPrice > 0" type="button" class="btn btn-primary w-100 text-white mt-3 fs-5"
                        @click="submitBooking(false)" :disabled="loading">
                        <img v-if="loading" src="/images/loading.gif" style="height:24px" />
                        <span v-else>Make Payment</span>
                        <input type="hidden" name="payment" value="1" />
                    </button>

                    <input type="hidden" name="van_trip_id" :value="props.tripId" />
                    <input type="hidden" name="van_location_id" :value="props.locationId" />
                    <input type="hidden" name="pax" :value="props.pax" />
                    <input type="hidden" name="booking_code_id" :value="bookingCode.value?.id" />
                    <input type="hidden" name="discount_amount" :value="discountAmount.value" />
                </div>
            </div>
            <div class="modal fade" id="discountModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Available Offers</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-2">
                                <div class="input-group">
                                    <input type="text" class="form-control" v-model="codeInput"
                                        placeholder="Enter discount code" @keyup.enter="applyCode">
                                    <button class="btn btn-primary btn-sm" type="button"
                                        :disabled="isApplyingCode || !codeInput" @click="applyCode">
                                        {{ isApplyingCode ? 'Applying...' : 'Apply' }}
                                    </button>
                                </div>
                            </div>
                            <div v-if="bookingCode.id" class="p-2 alert alert-success">
                                RM {{ bookingCode.amount.toFixed(2) }} Discount applied!
                            </div>
                            <div v-if="codeError" class="p-2 alert alert-danger">{{ codeError }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import moment from 'moment';

    const props = defineProps({
        tripId: Number,
        locationId: Number,
        pax: Number,
        date: String,
        departureTime: String,
        locationName: String,
        basePrice: Number,
        user: Object,
        env: String,
        indexUrl: String,
        backUrl: String,
        bookRoute: String,
        discountRoute: String,
        csrf: String,
    });

    const customerName = ref(props.user?.name ?? '');
    const customerEmail = ref(props.user?.email ?? '');
    const customerPhone = ref(props.user?.phone_number ?? '');

    const codeInput = ref('');
    const codeError = ref('');
    const isApplyingCode = ref(false);
    const loadingPoints = ref(false);
    const loading = ref(false);

    const bookingCode = ref({ id: null, code: null, amount: 0 });
    const discountAmount = computed(() => bookingCode.value.amount ?? 0);
    const totalPrice = computed(() => Math.max(0, props.basePrice - discountAmount.value));

    const formattedDate = computed(() => moment(props.date).format('DD MMM YYYY'));

    async function applyCode() {
        if (!codeInput.value) return;
        isApplyingCode.value = true;
        codeError.value = '';

        try {
            const res = await axios.get(props.discountRoute, {
                params: { code: codeInput.value, total_price: props.basePrice },
            });
            const data = res.data;
            if (data.meta.error) {
                codeError.value = data.meta.message;
                bookingCode.value = { id: null, code: null, amount: 0 };
            } else {
                bookingCode.value.id = data.response.booking_code_id;
                bookingCode.value.code = data.response.booking_code;
                bookingCode.value.amount = data.response.discount_amount ?? 0;
                codeError.value = '';
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error!', text: 'Failed to apply code.' });
        } finally {
            isApplyingCode.value = false;
        }
    }

    async function submitBooking(usePoints) {
        if (!customerName.value || !customerPhone.value) {
            Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Please fill in all required fields.' });
            return;
        }

        if (loading.value) {
            return;
        }
        if (!$("#submit-form")[0].checkValidity()) {
            $("#submit-form")[0].reportValidity();
            return;
        }

        let formData = new FormData($('#submit-form')[0]);
        formData.append('use_points', usePoints ? 1 : 0);

        if (usePoints) loadingPoints.value = true;
        else loading.value = true;

        //const res = await axios.post(props.bookRoute, {
        //    _token: props.csrf,
       
        //});

        axios.post(props.bookRoute, formData).then((response) => {
            let booking = response.data.response;

            if (usePoints || totalPrice.value <= 0) {
                window.location.href= '/van-bookings/' + booking.code;
                return;
            }

            if (booking.payment_url) {
                window.location.replace(booking.payment_url);
            } else {
                const req = booking.payment_params;
                if (!req || !req.service_id) {
                    Swal.fire({ icon: 'error', title: 'Error!', text: 'Unable to create booking. Please try again later.' });
                    loading.value = false;
                    return;
                }

                Swal.fire({
                    icon: "success",
                    title: trans("Success") + '!',
                    text: trans('Successfully confirmed your booking. Please proceed to make payment.'),
                    timer: 3000,
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
                    };

                    const form = document.createElement('form');
                    form.method = 'post';
                    form.action = props.env === 'production'
                        ? 'https://securepay.e-ghl.com/IPG/Payment.aspx'
                        : 'https://pay.e-ghl.com/IPGSG/Payment.aspx';

                    for (const key in formData) {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = formData[key];
                        form.appendChild(input);
                    }
                    document.body.appendChild(form);
                    form.submit();
                    document.body.removeChild(form);
                });
            }
        }).catch(function (error) {
            loadingPoints.value = false;
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
    }
</script>