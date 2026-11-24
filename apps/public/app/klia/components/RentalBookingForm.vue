<template>
    <div class="container-xl mt-2">
        <form id="rental-submit-form" method="POST" @submit.prevent>
            <div class="row">
                <div class="col-lg-8 ps-0">
                    <div class="card border-0 shadow-sm mt-3">
                        <div class="card-body">
                            <h4 class="fw-light mt-2">{{ $t('Passenger Details') }}</h4>
                            <small v-if="!user">{{ $t('Sign up for faster bookings!') }}</small>
                            <hr />

                            <div class="row g-3">
                                <div class="col-12 mt-3">
                                    <label for="billing-name">{{ $t('Full Name') }} <span class="text-danger">*</span></label>
                                    <input type="text" id="billing-name" class="form-control" name="customer_name"
                                        v-model="customerName" required :placeholder="trans('Full Name (as per IC/Passport)')">
                                </div>
                                <div class="col-md-6 mt-3">
                                    <label for="billing-phone">{{ $t('Phone Number') }} <span class="text-danger">*</span></label>
                                    <input type="tel" id="billing-phone" class="form-control" name="customer_phone"
                                        v-model="customerPhone" placeholder="+60123456789" required>
                                </div>
                                <div class="col-md-6 mt-3">
                                    <label for="billing-email">{{ $t('Email Address') }} <span class="text-danger">*</span></label>
                                    <input type="email" id="billing-email" name="customer_email" class="form-control"
                                        v-model="customerEmail" :placeholder="trans('Email')" required>
                                </div>
                                <div class="col-12 mt-3">
                                    <label for="customer_id_passport">{{ $t('NRIC / Passport') }} <span class="text-danger">*</span></label>
                                    <input type="text" id="customer_id_passport" class="form-control"
                                        name="customer_id_passport" v-model="customerIdPassport" required
                                        :placeholder="trans('Identification Number')">
                                </div>

                                <div class="col-md-6 mt-3">
                                    <label for="nric_passport_image">{{ $t('Upload NRIC / Passport') }} <span class="text-danger">*</span></label>
                                    <input type="file" id="nric_passport_image" name="nric_passport_image" class="form-control" accept="image/*" required>
                                    <small class="text-muted" style="font-size: 0.7rem;">{{ $t('Max 5MB (JPG, PNG)') }}</small>
                                </div>

                                <div class="col-md-6 mt-3">
                                    <label for="driving_license_image">{{ $t('Upload Driving License') }} <span class="text-danger">*</span></label>
                                    <input type="file" id="driving_license_image" name="driving_license_image" class="form-control" accept="image/*" required>
                                    <small class="text-muted" style="font-size: 0.7rem;">{{ $t('Max 5MB (JPG, PNG)') }}</small>
                                </div>

                                <input type="hidden" name="pickup_location_id" :value="pickupLocationId">
                                <input type="hidden" name="return_location_id" :value="returnLocationId">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 my-4 mt-lg-0">
                    <h4 class="fw-light mt-3">{{ $t('Summary') }}</h4>

                    <div class="row mt-2">
                        <div class="col-6">{{ $t('Vehicle Type') }}</div>
                        <div class="col-6 text-end fw-bold">{{ vehicle.name }}</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">{{ $t('Pickup') }}</div>
                        <div class="col-6 text-end fw-bold">{{ formatDisplayDate(datetimeFrom) }}</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">{{ $t('Return') }}</div>
                        <div class="col-6 text-end fw-bold">{{ formatDisplayDate(datetimeTo) }}</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">{{ $t('Pick Up Location') }}</div>
                        <div class="col-6 text-end fw-bold">{{ pickupLocationName }}</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">{{ $t('Return Location') }}</div>
                        <div class="col-6 text-end fw-bold">{{ returnLocationName }}</div>
                    </div>

                    <a class="text-decoration-underline text-black-50 mt-2 text-end d-block cursor-pointer" href="/bookings/rentals">{{ $t('Back') }}</a>
                    <hr />
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="input-group">
                                <input type="text" id="discount-code" class="form-control" name="discount_code" v-model="discountCode" :placeholder="trans('Discount Code')" @input="resetDiscount"/>
                                <button class="btn btn-primary" type="button" @click="applyDiscount" :disabled="!discountCode || isApplyingDiscount">
                                    {{ $t('Apply') }}
                                </button>
                            </div>
                            <small v-if="discountCode && showInvalidDiscount" class="text-primary mt-1">
                                {{ $t('This discount code is invalid or has reached its usage limit') }}.
                            </small>
                            <small v-else-if="appliedDiscount" class="text-dark mt-1">
                                {{ $t('Discount Applied') }}.
                            </small>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-6">
                            <span>{{ $t('Subtotal') }} (MYR)</span>
                        </div>
                        <div class="col-6 text-end">
                            <span v-if="priceDisplayType === priceDisplayContact" class="text-muted fst-italic">{{ $t('See contact') }}</span>
                            <span v-else>{{ subtotal.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                        </div>
                    </div>

                    <div class="row mt-2" v-if="appliedDiscount">
                        <div class="col-6">
                            <span>{{ $t('Discount') }} (MYR)</span>
                        </div>
                        <div class="col-6 text-end">
                            <span>- {{ discountPrice.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
                        </div>
                    </div>

                    <div class="row mt-2">
                        <div class="col-6">
                            <span class="fs-5 fw-bold">{{ $t('Total Price') }} (MYR)</span>
                        </div>
                        <div class="col-6 text-end">
                            <span v-if="priceDisplayType === priceDisplayContact" class="fs-5 fw-bold text-muted">
                                {{ $t('Contact') }}: {{ contactNumber || '-' }}
                            </span>
                            <span v-else class="fs-5 fw-bold text-primary">
                                {{ totalPrice.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                            </span>
                        </div>
                    </div>

                    <div class="row mt-2" v-if="user">
                        <div class="col-6">
                            <span class="fs-5">{{ $t('Points') }}</span>
                        </div>
                        <div class="col-6 text-end">
                            <span class="fs-5 fw-bold text-success">{{ user.points }}</span>
                        </div>
                    </div>

                    <input type="hidden" name="payment" value="1">
                    <input type="hidden" name="use_points" :value="usePoints ? 1 : 0">
                    <input type="hidden" name="vehicle_type_id" :value="vehicle.id">
                    <input type="hidden" name="datetime_from" :value="datetimeFrom">
                    <input type="hidden" name="datetime_to" :value="datetimeTo">
                    <input type="hidden" name="rental_booking_code_id" :value="appliedDiscount ? appliedDiscount.id : ''" />
                    <input type="hidden" name="discount_amount" :value="appliedDiscount ? appliedDiscount.amount : 0" />
                    <input type="hidden" name="discount_code" :value="appliedDiscount ? appliedDiscount.code : ''" />

                    <button class="btn btn-success w-100 text-white mt-3 fs-4" @click="createBookingWithPoints" v-if="user" type="button" :disabled="isSubmitting || user.points < totalPrice">
                        <img v-if="isSubmitting && usePoints" src="/images/loading.gif" />
                        <span v-else>{{ $t('Use Points') }}</span>
                    </button>

                    <button class="btn btn-primary w-100 text-white mt-3 fs-4" @click="createBooking" type="button" :disabled="isSubmitting">
                        <img v-if="isSubmitting && !usePoints" src="/images/loading.gif" />
                        <span v-else>{{ $t('Make Payment') }}</span>
                    </button>
                </div>
            </div>
        </form>
    </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import axios from 'axios';
    import { trans } from 'laravel-vue-i18n';

    const props = defineProps({
        vehicle: {
            type: Object,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        },
        datetimeFrom: {
            type: String,
            required: true
        },
        datetimeTo: {
            type: String,
            required: true
        },
        pickupLocationId: {
            type: [String, Number],
            default: ''
        },
        returnLocationId: {
            type: [String, Number],
            default: ''
        },
        pickupLocations: {
            type: Array,
            default: () => []
        },
        returnLocations: {
            type: Array,
            default: () => []
        },
        priceDisplayContact: {
            type: Number,
            default: 1
        },
        priceDisplayType: {
            type: Number,
            default: 0
        },
        contactNumber: {
            type: String,
            default: ''
        },
        user: {
            type: Object,
            default: null
        },
        env: {
            type: String,
            default: 'production'
        }
    });

    const isSubmitting = ref(false);

    // Form Details
    const customerName = ref(props.user ? props.user.name : '');
    const customerPhone = ref(props.user ? ((props.user.country_code || '') + props.user.phone_number) : '');
    const customerEmail = ref(props.user ? props.user.email : '');
    const customerIdPassport = ref('');
    const usePoints = ref(false);

    const discountCode = ref('');
    const appliedDiscount = ref(null);
    const isApplyingDiscount = ref(false);
    const showInvalidDiscount = ref(false);

    const discountPrice = computed(() => appliedDiscount.value ? appliedDiscount.value.amount : 0);

    const pickupLocationName = computed(() => {
        const loc = props.pickupLocations.find(l => l.id == props.pickupLocationId);
        return loc ? loc.name + (loc.address ? ' - ' + loc.address : '') : '-';
    });

    const returnLocationName = computed(() => {
        const loc = props.returnLocations.find(l => l.id == props.returnLocationId);
        return loc ? loc.name + (loc.address ? ' - ' + loc.address : '') : '-';
    });

    const totalPrice = computed(() => {
        return Math.max((props.subtotal || 0) - discountPrice.value, 0);
    });

    const resetDiscount = (event) => {
        discountCode.value = event.target.value.toUpperCase();
        appliedDiscount.value = null;
        showInvalidDiscount.value = false;
    };

    const applyDiscount = async () => {
        if (!discountCode.value) return;

        isApplyingDiscount.value = true;
        showInvalidDiscount.value = false;
        appliedDiscount.value = null;

        try {
            const response = await axios.get('/bookings/rentals/discount-code', {
                params: {
                    code: discountCode.value,
                    total_price: props.subtotal
                }
            });

            const data = response.data?.response || response.data;
            if (data && data.rental_booking_code_id) {
                appliedDiscount.value = {
                    id: data.rental_booking_code_id,
                    code: data.booking_code,
                    amount: Number(data.discount_amount)
                };
            } else {
                showInvalidDiscount.value = true;
            }
        } catch (err) {
            showInvalidDiscount.value = true;
        } finally {
            isApplyingDiscount.value = false;
        }
    };

    const formatDisplayDate = (val) => {
        if (!val) return '';
        const d = new Date(val);
        return d.toLocaleDateString('en-CA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    const createBookingWithPoints = () => {
        createBooking(true);
    };

    const createBooking = async (withPoints = false) => {
        if (isSubmitting.value) return;

        const form = document.getElementById('rental-submit-form');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        usePoints.value = withPoints;
        isSubmitting.value = true;
        let formData = new FormData(form);
        formData.set('use_points', withPoints ? 1 : 0);
        formData.append('total_price', totalPrice.value);

        try {
            const response = await axios.post('/bookings/rentals', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const booking = response.data.response || response.data;

            if (usePoints.value) {
                window.location.href = `/rentals/${booking.code}/${booking.web_session_id}`;
            } else if (booking.payment_url) {
                window.location.replace(booking.payment_url);
            } else if (booking.payment_params) {
                let req = booking.payment_params;
                if (!req || !req.service_id) {
                    throw new Error("Invalid payment params returned from the server.");
                }
                const f = document.createElement("form");
                f.setAttribute('method', "post");
                f.setAttribute('action', props.env === 'production' ? "https://securepay.e-ghl.com/IPG/Payment.aspx" : "https://test2pay.ghl.com/IPGSG/Payment.aspx");

                Object.keys(req).forEach(function (k) {
                    const i = document.createElement("input");
                    i.setAttribute('type', "hidden");
                    i.setAttribute('name', k);
                    i.setAttribute('value', req[k]);
                    f.appendChild(i);
                });

                document.body.appendChild(f);
                f.submit();
            } else {
                window.location.href = `/rentals/${booking.code}/${booking.web_session_id}`;
            }

        } catch (error) {
            if (error.response?.status === 401) {
                Swal.fire({
                    title: trans('Error'),
                    text: trans('Please proceed to login before payment.'),
                    icon: 'error',
                    timer: 2000,
                }).then(function () {
                    window.location.replace('/login');
                });
                return;
            }
            Swal.fire({
                title: trans('Error'),
                text: error.response?.data?.message || error.response?.data?.error || trans('Failed to create booking'),
                icon: 'error'
            });
            isSubmitting.value = false;
            usePoints.value = false;
        }
    };
</script>