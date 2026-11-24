<!--suppress EqualityComparisonWithCoercionJS -->
<template>
    <div class="container py-4">
        <!-- Trip details bar -->
        <div class="tx-trip-bar mb-4">
            <div class="tx-trip-route">
                <div class="tx-trip-point">
                    <span class="tx-trip-label">{{ $t('Origin') }}</span>
                    <span class="tx-trip-value">{{ originName }}</span>
                </div>
                <svg-icon name="arrow-right" class="tx-trip-arrow" />
                <div class="tx-trip-point">
                    <span class="tx-trip-label">{{ $t('Destination') }}</span>
                    <span class="tx-trip-value">{{ destinationName }}</span>
                </div>
            </div>
            <div class="tx-trip-meta">
                <span class="tx-trip-chip"><svg-icon name="calendar" /> {{ date }} {{ time }}</span>
                <a href="/" class="tx-trip-edit ms-auto"><svg-icon name="pencil" class="me-1" />{{ $t('Change') }}</a>
            </div>
        </div>

        <!-- Stepper -->
        <div class="tx-steps my-4">
            <div v-for="s in steps" :key="s.n"
                 :class="['tx-step', step === s.n ? 'active' : '', step > s.n ? 'done' : '']"
                 @click="step > s.n && (step = s.n)">
                <span class="tx-step-num">
                    <svg-icon name="check" v-if="step > s.n" />
                    <template v-else>{{ s.n }}</template>
                </span>
                <span class="tx-step-label">{{ s.label }}</span>
            </div>
        </div>

        <!-- STEP 1: Select Vehicle -->
        <template v-if="step === 1">
            <h4 class="mb-3">{{ $t('Select Your Vehicle') }}</h4>
            <div class="row g-4">
                <div class="col-sm-6 col-lg-4" v-for="v in types" :key="v.id">
                    <div :class="['tx-car-card', selectedType && selectedType.id === v.id ? 'selected' : '']">
                        <div class="tx-car-media">
                            <template v-if="vImages(v).length > 0">
                                <img :src="vImages(v)[imgIndex[v.id] || 0]" :alt="v.name" />
                                <template v-if="vImages(v).length > 1">
                                    <button type="button" class="tx-car-nav prev" @click.stop="stepImg(v, -1)">&lsaquo;</button>
                                    <button type="button" class="tx-car-nav next" @click.stop="stepImg(v, 1)">&rsaquo;</button>
                                    <div class="tx-car-dots">
                                        <span v-for="(img, i) in vImages(v)" :key="i"
                                              :class="['tx-car-dot', (imgIndex[v.id] || 0) === i ? 'active' : '']"
                                              @click.stop="setImg(v, i)"></span>
                                    </div>
                                </template>
                            </template>
                            <template v-else>
                                <svg-icon name="car" style="transform: scaleX(-1);" />
                            </template>
                        </div>
                        <div class="tx-car-head">
                            <h5 class="tx-car-title mb-0">{{ v.name }}</h5>
                            <div class="tx-car-caps">
                                <span class="tx-cap"><svg-icon name="users" /> {{ v.maximum_capacity }}</span>
                                <span class="tx-cap"><svg-icon name="luggage" /> {{ v.maximum_luggage ?? '-' }}</span>
                            </div>
                        </div>
                        <div class="tx-car-price">
                            RM {{ Number(v.price).toFixed(2) }}
                        </div>
                        <button type="button" class="tx-car-book" @click="selectType(v)">
                            {{ selectedType && selectedType.id === v.id ? $t('Continue') : $t('Book Now') }}
                        </button>
                    </div>
                </div>
                <div class="col-12" v-if="!types || !types.length">
                    <div class="alert alert-info">{{ $t('No vehicles available.') }}</div>
                </div>
            </div>
        </template>

        <!-- STEP 2: Details & Payment -->
        <template v-if="step === 2">
            <form id="submit-form" method="POST">
                <div class="row">
                    <div class="col-lg-7 mb-4">
                        <section class="panel">
                            <div class="panel__head">
                                <h2 class="panel__title mb-0">{{ $t('Passenger Details') }}</h2>
                                <a v-if="!user" href="/register" class="text-link">{{ $t('Sign up for faster bookings!') }}</a>
                            </div>
                            <div class="field-grid field-grid--2">
                                <div class="field">
                                    <label for="billing-name" class="field__label">{{ $t('Full Name') }} *</label>
                                    <input type="text" id="billing-name" class="form-control" name="billing_name" v-model="billingName" required :placeholder="trans('Full Name')" />
                                </div>
                                <div class="field">
                                    <label for="flight-number" class="field__label">{{ $t('Flight Number') }} *</label>
                                    <input type="text" id="flight-number" class="form-control" name="flight_number" v-model="flightNumber" :placeholder="trans('Flight Number')" />
                                </div>
                                <div class="field">
                                    <label for="billing-email" class="field__label">{{ $t('Email Address') }} *</label>
                                    <input type="email" id="billing-email" name="billing_email" class="form-control" v-model="billingEmail" :placeholder="trans('Email')" required />
                                </div>
                                <div class="field" :class="{ 'is-invalid': localErrors.phone_num }">
                                    <label for="phone-num" class="field__label">{{ $t('Phone Number') }} *</label>
                                    <input type="hidden" name="billing_phone" :value="billingPhone">
                                    <div class="phone-field">
                                        <div class="phone-field__code">
                                            <multi-select :placeholder="trans('Code')"
                                                          v-model="country"
                                                          label="country_name_calling_code"
                                                          track-by="calling_code"
                                                          :options="countries"
                                                          :show-labels="false"
                                                          :allow-empty="false">
                                                <template #singleLabel="{ option }"><span>+{{ option.calling_code }}</span></template>
                                                <template #option="{ option }">
                                                    <span class="phone-field__option">
                                                        <span class="phone-field__option-name">{{ option.name }}</span>
                                                        <span class="phone-field__option-code">+{{ option.calling_code }}</span>
                                                    </span>
                                                </template>
                                            </multi-select>
                                        </div>
                                        <input type="tel" id="phone-num" class="form-control" name="phone_num" v-model="phoneNum" placeholder="123456789" @input="clearError('phone_num')" required />
                                    </div>
                                    <template v-if="localErrors.phone_num">
                                        <p class="field__error" v-for="error in localErrors.phone_num">{{ error }}</p>
                                    </template>
                                </div>
                            </div>
                        </section>

                        <div :class="latitude && longitude ? 'mt-3' : 'd-none'">
                            <div id="map" style="height: 300px; width: 100%; border-radius: 12px;"></div>
                        </div>

                        <!-- How it works -->
                        <section class="panel mt-3" aria-labelledby="tx-how-title">
                            <h2 class="panel__title" id="tx-how-title">{{ $t('How it works') }}</h2>
                            <ol class="tx-how">
                                <li><span class="tx-how-num">1</span><span class="tx-how-text">{{ $t('Book and pay') }}</span></li>
                                <li><span class="tx-how-num">2</span><span class="tx-how-text">{{ $t('Our support team confirms your pick-up details') }}</span></li>
                                <li><span class="tx-how-num">3</span><span class="tx-how-text">{{ $t('Your driver is arranged before your trip') }}</span></li>
                                <li><span class="tx-how-num">4</span><span class="tx-how-text">{{ $t('On the day, your driver picks you up on time at the agreed point') }}</span></li>
                            </ol>
                            <ul class="tx-perks">
                                <li><svg-icon name="user-shield" /><span>{{ $t('Professional local drivers') }}</span></li>
                                <li><svg-icon name="clock" /><span>{{ $t('On-time airport transfers') }}</span></li>
                                <li><svg-icon name="headset" /><span>{{ $t('24/7 customer support') }}</span></li>
                            </ul>
                        </section>
                    </div>

                    <div class="col-lg-5">
                        <div class="card tx-summary-card">
                            <div class="card-body">
                                <h6 class="text-uppercase text-muted mb-3">{{ $t('Booking Summary') }}</h6>

                                <!-- selected vehicle -->
                                <div class="tx-sum-vehicle" v-if="selectedType">
                                    <div class="tx-sum-vehicle-img">
                                        <svg-icon name="car" />
                                    </div>
                                    <div>
                                        <div class="fw-semibold">{{ selectedType.name }}</div>
                                        <div class="small text-muted">
                                            <svg-icon name="users" class="me-1" />{{ selectedType.maximum_capacity }}
                                            <svg-icon name="luggage" class="ms-2 me-1" />{{ selectedType.maximum_luggage ?? '-' }}
                                        </div>
                                    </div>
                                    <button type="button" class="tx-sum-change ms-auto" @click="step = 1"><svg-icon name="pencil" class="me-1" />{{ $t('Change') }}</button>
                                </div>

                                <!-- trip rows -->
                                <div class="tx-sum-trip">
                                    <div class="tx-sum-row">
                                        <svg-icon name="map-pin" />
                                        <div>
                                            <span class="tx-sum-label">{{ $t('Origin') }}</span>
                                            <span class="tx-sum-val">{{ originName }}</span>
                                        </div>
                                    </div>
                                    <div class="tx-sum-row">
                                        <svg-icon name="flag" />
                                        <div>
                                            <span class="tx-sum-label">{{ $t('Destination') }}</span>
                                            <span class="tx-sum-val">{{ destinationName }}</span>
                                        </div>
                                    </div>
                                    <div class="tx-sum-row">
                                        <svg-icon name="calendar" />
                                        <div>
                                            <span class="tx-sum-label">{{ $t('Date & Time') }}</span>
                                            <span class="tx-sum-val">{{ date }} {{ time }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- price breakdown -->
                                <div class="tx-sum-prices">
                                    <div class="d-flex justify-content-between">
                                        <span class="text-muted">{{ $t('Subtotal') }}</span>
                                        <span>RM {{ price.toFixed(2) }}</span>
                                    </div>
                                    <div class="d-flex justify-content-between mt-1" v-if="appliedDiscount > 0">
                                        <span class="text-muted">{{ $t('Discount') }}</span>
                                        <span class="text-success">- RM {{ appliedDiscount.toFixed(2) }}</span>
                                    </div>
                                </div>

                                <div class="tx-sum-total">
                                    <span>{{ $t('Total') }} (MYR)</span>
                                    <span>RM {{ totalPrice.toFixed(2) }}</span>
                                </div>

                                <button type="button" class="btn btn-outline-primary w-100 mt-3"
                                    data-bs-toggle="modal" data-bs-target="#offersModal" @click.prevent.stop>
                                    <svg-icon name="tag" class="me-1" />{{ $t('Apply Discount') }}
                                </button>

                                <div class="tx-sum-points" v-if="user">
                                    <span>{{ $t('Your Points') }}</span>
                                    <span class="fw-bold" style="color:#1b5e20;">{{ user.points }}</span>
                                </div>

                                <!-- hidden fields -->
                                <input type="hidden" name="payment" value="1" />
                                <input type="hidden" name="location_id" :value="location.id" v-if="location" />
                                <input type="hidden" name="location_type" :value="location.type" v-if="location" />
                                <input type="hidden" name="location_type" :value="zone.type" v-if="!location && zone" />
                                <input type="hidden" name="location_id" :value="zone.id" v-if="!location && zone" />
                                <input type="hidden" name="zone_id" :value="zone.id" />
                                <input type="hidden" name="date" :value="date" />
                                <input type="hidden" name="is_from_klia" :value="klia" />
                                <input type="hidden" name="time" :value="time" />
                                <input type="hidden" name="vehicle_type_id" :value="selectedType?.id" />
                                <input type="hidden" name="latitude" :value="latitude ?? ''" v-if="!location && zone" />
                                <input type="hidden" name="longitude" :value="longitude ?? ''" v-if="!location && zone" />
                                <input type="hidden" name="google_place_id" :value="googlePlaceId ?? ''" v-if="!location && zone" />
                                <input type="hidden" name="google_description" :value="googleDescription ?? ''" v-if="!location && zone" />
                                <input type="hidden" name="prize_id" :value="discount?.prize_id" />
                                <input type="hidden" name="wheel_winner_id" :value="discount?.wheel_winner_id" />
                                <input type="hidden" name="booking_code_id" :value="bookingCode?.id" />
                                <input type="hidden" name="discount_amount" :value="discount?.amount" />

                                <button class="btn btn-success text-white w-100 mt-3" @click="createBooking(true)" v-if="user" type="button" :disabled="loading || user.points < totalPrice">
                                    <img v-if="loading && usePoints" src="/images/loading.gif" /><span v-else>{{ $t('Use Points') }}</span>
                                </button>
                                <button class="btn btn-primary text-white w-100 mt-2" @click="createBooking(false)" type="button" :disabled="loading">
                                    <img v-if="loading && !usePoints" src="/images/loading.gif" /><span v-else>{{ $t('Make Payment') }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Offers modal -->
                <div class="modal fade" id="offersModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">{{ $t('Available Offers') }}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-2">
                                    <div class="input-group">
                                        <input type="text" class="form-control" v-model="bookingCodeInput" :placeholder="$t('Enter discount code')"
                                            @keyup.enter="applyBookingCode">
                                        <button class="btn btn-primary btn-sm" type="button" :disabled="isApplyingBookingCode || !bookingCodeInput"
                                            @click="applyBookingCode">
                                            {{ isApplyingBookingCode ? $t('Applying...') : $t('Apply') }}
                                        </button>
                                    </div>
                                </div>
                                <div v-if="bookingCode?.id && bookingCode.amount" class="p-2 alert alert-success">
                                    RM {{ bookingCode.amount }} {{ $t('Discount applied!') }}
                                </div>
                                <div v-for="(reward, index) in unusedRewards"
                                    :key="'reward-' + index"
                                    class="border rounded p-2 mb-2 d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{{ reward.prize_name }}</strong><br>
                                        <small class="text-muted">{{ $t('Discount Up to RM') }} {{ reward.prize_amount }}</small><br>
                                        <small class="text-muted">{{ $t('Valid until') }} {{ new Date(reward.expires_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur'}) }}</small>
                                    </div>
                                    <button type="button" class="btn btn-sm btn-primary" :disabled="discount && (discount.wheel_winner_id == reward.id)" @click.prevent="applyDiscount(reward)">
                                        {{ discount && (discount.wheel_winner_id == reward.id) ? $t('Applied') : $t('Apply') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </template>
    </div>
</template>
<script setup>
import { defineComponent, reactive, ref, onBeforeMount, computed, watch, onMounted } from 'vue';
import {trans} from "laravel-vue-i18n";
import moment from "moment";

let props = defineProps({
    zone: Object,
    total: Number,
    date: String,
    time: String,
    types: Array,
    location: Object,
    user: Object,
    session: String,
    klia: String,
    env: String,
    isMobile: Boolean,
    latitude: Number,
    longitude: Number,
    googlePlaceId: String,
    googleDescription: String,
    unusedRewards: Array,
    countries: Array,
    errors: Object,
    preselectVehicleTypeId: [Number, String],
});

const loading = ref(false);
const usePoints = ref(false);
const imgIndex = ref({});

const step = ref(1);
const selectedType = ref(null);
const price = computed(() => Number(selectedType.value?.price ?? 0));

const vImages = (vehicle) => {
    if (!vehicle) return [];
    if (Array.isArray(vehicle.images)) return vehicle.images;
    if (vehicle.image) return [vehicle.image];
    return [];
};

const stepImg = (vehicle, direction) => {
    if (!vehicle.id) return;
    const images = vImages(vehicle);
    if (images.length <= 1) return;
    const current = imgIndex.value[vehicle.id] || 0;
    let next = current + direction;
    if (next < 0) next = images.length - 1;
    if (next >= images.length) next = 0;
    imgIndex.value[vehicle.id] = next;
};

const setImg = (vehicle, index) => {
    if (!vehicle.id) return;
    imgIndex.value[vehicle.id] = index;
};

const KLIA = 'Kuala Lumpur International Airport';
const isFromKlia = computed(() => props.klia == 1 || props.klia === '1' || props.klia === true);
const zoneName = computed(() => props.location?.name ?? props.zone?.name ?? '');
const address = computed(() => props.googleDescription || zoneName.value);
const originName = computed(() => isFromKlia.value ? KLIA : address.value);
const destinationName = computed(() => isFromKlia.value ? address.value : KLIA);

const steps = computed(() => [
    { n: 1, label: trans('Select Vehicle') },
    { n: 2, label: trans('Details & Payment') },
]);

const selectType = (t) => {
    selectedType.value = t;
    step.value = 2;
};

const localErrors = ref({ ...props.errors });
const country = ref({"name":"Malaysia","official_name":"Malaysia","native_name":"Malaysia","native_official_name":"Malaysia","iso_3166_1_alpha2":"MY","iso_3166_1_alpha3":"MYS","calling_code":"60","currency":"MYR","emoji":"🇲🇾","country_name_calling_code":"Malaysia (+60)"});
const countries = ref([]);

const billingName = ref(props.user ? props.user.name : '');
const phoneNum = ref(props.user ? props.user.phone_number : '');
const billingEmail = ref(props.user ? props.user.email : '');
const flightNumber = ref('');

const discount = ref({
    prize_id: null,
    wheel_winner_id: null,
    amount: 0
});

const isApplyingBookingCode = ref(false);
const bookingCodeInput = ref(null);
const bookingCode = ref({ // from api
    id: null,
    code: null,
    amount: 0
});

const appliedDiscount = computed(() => {
    if (discount.value.wheel_winner_id) {
        return Number(discount.value?.amount ?? 0);
    }
    return Number(bookingCode.value?.amount ?? 0);
});

const totalPrice = computed(() => {
    return price.value - appliedDiscount.value;
})

const billingPhone = computed(() => {
    if (country.value) {
        return country.value.calling_code + '' + phoneNum.value;
    }
    return phoneNum.value;
})

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

    if (props?.user?.country_code) {
        country.value = countries.value.find(c => '+' + c.calling_code === props.user.country_code);
    }

    // Auto-jump to Step 2 when a valid vehicle_type_id is deep-linked (e.g. from WhatsApp).
    if (props.preselectVehicleTypeId != null) {
        const match = (props.types || []).find(v => v.id == props.preselectVehicleTypeId);
        if (match) {
            selectType(match);
        }
    }
})

const resetBookingCode = () => {
    bookingCode.value.id = null;
    bookingCode.value.code = null;
    bookingCode.value.amount = 0;
}

const resetDiscount = () => {
    discount.value.prize_id = null;
    discount.value.wheel_winner_id = null;
    discount.value.amount = 0;
}

function waitForGoogleMaps() {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            return resolve(window.google.maps);
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_API_KEY}&libraries=places,marker`;
        script.async = true;
        script.defer = true;

        script.onload = () => resolve(window.google.maps);
        script.onerror = () => reject(new Error('Google Maps API failed to load.'));

        document.head.appendChild(script);
    });
}

// re-init the map whenever the details step becomes visible (map div only exists then)
watch(step, async (s) => {
    if (s === 2 && props.latitude && props.longitude) {
        await initMap();
    }
});

const initMap = async () => {
    await waitForGoogleMaps();
    const lat = Number(props.latitude);
    const lng = Number(props.longitude);
    if (isNaN(lat) || isNaN(lng)) {
        return;
    }
    // wait for the element to be rendered
    const el = document.getElementById('map');
    if (!el) {
        return;
    }
    const map = new google.maps.Map(el, {
        center: { lat, lng },
        zoom: 15,
        disableDefaultUI: true,
        draggable: true,
        disableDoubleClickZoom: true
    });
    new google.maps.Marker({ position: { lat, lng }, map });
}

async function applyBookingCode() {
    if (!bookingCodeInput.value) {
        return;
    }

    isApplyingBookingCode.value = true;
    axios.get('/taxi-bookings/discount-code', {
        params: {
            code: bookingCodeInput.value,
            total_price: price.value,
        }
    }).then((response) => {
        let data = response.data;

        if (data.meta.error) {
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: data.meta.message,
            })
            resetBookingCode();
        } else {
            bookingCode.value.id = data.response.booking_code_id;
            bookingCode.value.code = data.response.booking_code;
            bookingCode.value.amount = data.response.discount_amount ?? 0;
            resetDiscount();
        }
    }).catch(function (error) {
        if (error.response && error.response.data && error.response.data.meta) {
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: error.response.data.meta.message,
            })
        } else {
            console.log(error);
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: error,
            })
        }
        resetBookingCode();
    }).finally(() => {
        isApplyingBookingCode.value = false;
    });
}

async function applyDiscount(reward) {
    if (!reward?.id) {
        return;
    }
    axios.get('/taxi-bookings/discount', {
        params: {
            prize_id: reward.prize_id,
            wheel_winner_id: reward.id,
            total_price: price.value,
            is_from_klia: props.klia
        }
    }).then((response) => {
        let data = response.data;

        if (data.meta.error) {
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: data.meta.message,
            })
            resetDiscount();
        } else {
            discount.value.wheel_winner_id = data.response.wheel_winner_id;
            discount.value.prize_id = data.response.prize_id;
            discount.value.amount = data.response.amount ?? 0;
            Swal.fire({
                title: "Successful",
                text: 'Successfully applied discount.',
                icon: "success"
            })
            resetBookingCode();
        }
    }).catch(function (error) {
        if (error.response && error.response.data && error.response.data.meta) {
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: error.response.data.meta.message,
            })
        } else {
            console.log(error);
            Swal.fire({
                icon: "error",
                title: "Error!",
                text: error,
            })
        }
        resetDiscount();
    });
}

const createBooking = (points) => {
    if (loading.value) {
        return;
    }
    if (!$("#submit-form")[0].checkValidity()) {
        $("#submit-form")[0].reportValidity();
        return;
    }
    usePoints.value = points;
    loading.value = true;

    let formData = new FormData($('#submit-form')[0]);
    formData.append('use_points', points ? 1 : 0);
    axios.post('/bookings/taxi', formData).then((response) => {
        let booking = response.data.response;
        if (points) {
            window.location.href= '/taxi-bookings/' + booking.code + '/' + booking.web_session_id;
            return;
        }
        if (booking.payment_url) {
            window.location.replace(booking.payment_url);
        } else {
            let req = booking.payment_params;
            if (!req || !req.service_id) {
                Swal.fire({
                    icon: "error",
                    title: trans("Error") + '!',
                    text: "Unable to create booking. Please try again later.",
                });
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

<style scoped>
/* Trip bar: dark banner matching the site's page headers */
.tx-trip-bar {
    position: relative;
    overflow: hidden;
    padding: 1.25rem 1.5rem;
    border-radius: 16px;
    color: rgba(255,255,255,.78);
    background:
        radial-gradient(120% 140% at 100% 0%, rgba(217,0,4,.5) 0%, rgba(217,0,4,0) 55%),
        #111827;
}
.tx-trip-route { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.tx-trip-point { display: flex; flex-direction: column; min-width: 0; }
.tx-trip-label { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: rgba(255,255,255,.6); }
.tx-trip-value { font-weight: 700; font-size: 1.1rem; color: #fff; }
.tx-trip-arrow { color: #FF8A8C; font-size: 1.2rem; }
.tx-trip-meta { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; margin-top: .9rem; padding-top: .9rem; border-top: 1px solid rgba(255,255,255,.14); }
.tx-trip-chip { display: inline-flex; align-items: center; gap: .4rem; font-size: .85rem; color: #fff; }
.tx-trip-chip .svg-icon { color: #FF8A8C; }
.tx-trip-edit { display: inline-flex; align-items: center; min-height: 36px; padding: 0 .9rem; border: 1px solid rgba(255,255,255,.35); border-radius: 999px; color: #fff; font-size: .85rem; font-weight: 500; text-decoration: none; transition: background .15s, border-color .15s; }
.tx-trip-edit:hover { color: #fff; background: rgba(255,255,255,.12); border-color: #fff; }

/* Stepper */
.tx-steps { display: flex; align-items: center; justify-content: center; gap: 0; max-width: 520px; margin-left: auto; margin-right: auto; }
.tx-step { display: flex; flex-direction: column; align-items: center; gap: .4rem; flex: 1; position: relative; color: var(--bs-primary, #c1121f); font-size: .82rem; }
.tx-step:not(:first-child)::before { content: ''; position: absolute; top: 16px; left: -50%; width: 100%; height: 2px; background: color-mix(in srgb, var(--bs-primary, #c1121f) 30%, #fff); z-index: 0; }
.tx-step.active:not(:first-child)::before,
.tx-step.done:not(:first-child)::before { background: var(--bs-primary, #c1121f); }
.tx-step-num { width: 34px; height: 34px; border-radius: 50%; background: color-mix(in srgb, var(--bs-primary, #c1121f) 15%, #fff); color: var(--bs-primary, #c1121f); display: flex; align-items: center; justify-content: center; font-weight: 600; z-index: 1; transition: .15s; }
.tx-step.active .tx-step-num { background: var(--bs-primary, #c1121f); color: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--bs-primary, #c1121f) 20%, transparent); }
.tx-step.done .tx-step-num { background: var(--bs-primary, #c1121f); color: #fff; cursor: pointer; }
.tx-step-label { color: var(--bs-primary, #c1121f); }
.tx-step.active .tx-step-label, .tx-step.done .tx-step-label { font-weight: 700; }
.tx-step.done { cursor: pointer; }

/* Vehicle card */
.tx-car-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 12px; height: 100%; display: flex; flex-direction: column; transition: border-color .15s, box-shadow .15s, transform .2s; }
.tx-car-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(17,24,39,.10), 0 2px 6px rgba(17,24,39,.06); }
.tx-car-card.selected { border-color: var(--bs-primary, #c1121f); box-shadow: 0 0 0 3px color-mix(in srgb, var(--bs-primary, #c1121f) 15%, transparent); }

.tx-car-media { position: relative; background: #F5F6F8; border-radius: 12px; overflow: hidden; aspect-ratio: 16 / 10; display: flex; align-items: center; justify-content: center; }
.tx-car-media img { width: 100%; height: 100%; object-fit: contain; padding: 8px 30px; }
.tx-car-media .svg-icon { font-size: 3.5rem; color: var(--bs-primary, #c1121f); opacity: .85; }
.tx-car-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border: none; border-radius: 50%; background: rgba(120,120,120,.55); color: #fff; font-size: 1.4rem; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; }
.tx-car-nav:hover { background: rgba(80,80,80,.8); }
.tx-car-nav.prev { left: 8px; }
.tx-car-nav.next { right: 8px; }
.tx-car-dots { position: absolute; bottom: 10px; left: 0; right: 0; display: flex; justify-content: center; gap: 6px; }
.tx-car-dot { width: 8px; height: 8px; border-radius: 50%; background: #ccc; cursor: pointer; transition: background .15s; }
.tx-car-dot.active { background: var(--bs-primary, #c1121f); }
.tx-car-head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-top: 14px; }
.tx-car-title { font-size: 1.1rem; font-weight: 700; color: #111827; }
.tx-car-caps { display: flex; gap: .4rem; flex: 0 0 auto; }
.tx-cap { display: inline-flex; align-items: center; gap: .3rem; font-size: .85rem; font-weight: 500; color: #374151; }
.tx-cap .svg-icon { color: var(--bs-primary, #c1121f); }
.tx-car-price { margin-top: 8px; font-size: 1.25rem; font-weight: 700; color: var(--bs-primary, #c1121f); }
.tx-car-book { margin-top: 12px; width: 100%; border: none; border-radius: 8px; background: var(--bs-primary, #c1121f); color: #fff; font-weight: 700; letter-spacing: .03em; padding: .7rem 1rem; cursor: pointer; transition: filter .15s; }
.tx-car-book:hover:not(:disabled) { filter: brightness(.92); }
.tx-car-book:disabled { background: #bbb; cursor: not-allowed; }

/* Details card */

/* Phone country-code group - always on one line */

/* Summary card */
.tx-summary-card { border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,.06); position: sticky; top: 1rem; }
.tx-sum-vehicle { display: flex; align-items: center; gap: .8rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
.tx-sum-vehicle-img { flex: 0 0 72px; width: 72px; height: 50px; border-radius: 8px; overflow: hidden; background: #f4f4f4; display: flex; align-items: center; justify-content: center; }
.tx-sum-change { display: inline-flex; align-items: center; flex: 0 0 auto; align-self: flex-start; padding: .3rem .75rem; border: 1px solid #E5E7EB; border-radius: 999px; background: #fff; color: #374151; font-size: .8rem; font-weight: 500; transition: border-color .15s, color .15s; }
.tx-sum-change:hover { border-color: var(--bs-primary, #c1121f); color: var(--bs-primary, #c1121f); }
.tx-sum-vehicle-img .svg-icon { font-size: 1.6rem; color: var(--bs-primary, #c1121f); opacity: .85; }
.tx-sum-trip { padding: 1rem 0; display: flex; flex-direction: column; gap: .85rem; }
.tx-sum-row { display: flex; gap: .7rem; }
.tx-sum-row > .svg-icon { flex: 0 0 18px; margin-top: .15rem; color: var(--bs-primary, #c1121f); font-size: .95rem; text-align: center; }
.tx-sum-label { display: block; font-size: .72rem; text-transform: uppercase; letter-spacing: .03em; color: #aaa; }
.tx-sum-val { display: block; font-weight: 500; color: #2a2a2a; word-break: break-word; }
.tx-sum-prices { padding: 1rem 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
.tx-sum-total { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0 .5rem; font-weight: 700; font-size: 1.35rem; color: var(--bs-primary, #c1121f); }
.tx-sum-points { display: flex; justify-content: space-between; align-items: center; padding: .6rem .85rem; margin-top: 1rem; background: #d9f0e3; border-radius: 10px; font-size: .9rem; }
.btn-success:disabled { background-color: #8b8b8b !important; color: black !important; }

/* How-it-works: numbered steps as a vertical timeline, perks as a centred footer strip */
.tx-how { display: grid; gap: 1.1rem; margin: 0; padding: 0; list-style: none; }
.tx-how li { position: relative; display: flex; align-items: flex-start; gap: .85rem; font-size: .9rem; color: #374151; line-height: 1.45; }
.tx-how li:not(:last-child)::before { content: ''; position: absolute; left: 15px; top: 34px; bottom: calc(-1.1rem + 2px); width: 2px; border-radius: 2px; background: #F5D0D0; }
.tx-how-num { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 32px; width: 32px; height: 32px; border: 2px solid #B30003; border-radius: 50%; background: #fff; color: #B30003; font-size: .85rem; font-weight: 700; }
.tx-how-text { padding-top: .35rem; }
.tx-perks { display: flex; flex-wrap: wrap; justify-content: center; gap: .6rem 1.75rem; margin: 1.5rem 0 0; padding: 1.1rem 0 0; border-top: 1px solid #EEF0F3; list-style: none; }
.tx-perks li { display: inline-flex; align-items: center; gap: .45rem; font-size: .85rem; color: #4B5563; }
.tx-perks .svg-icon { color: var(--bs-primary, #c1121f); }

@media (max-width: 575px) {
    .tx-step-label { font-size: .72rem; }
}
</style>
