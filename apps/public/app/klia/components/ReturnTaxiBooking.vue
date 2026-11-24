<!--suppress EqualityComparisonWithCoercionJS -->
<template>
    <button :ref="'returnTripBtn-' + currentBooking.code" type="button" class="btn btn-outline-dark mt-2" @click="handleReturnTripClick(currentBooking.code)" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
        {{ trans('Buy Return Trip') }}
    </button>

    <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5" id="staticBackdropLabel">{{ trans('Buy Return Trip') }}</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="submit-form" class="text-start">
                        <div class="mb-3" v-if="taxiPrice > 0">
                            <label for="price" class="col-form-label">{{ trans('Total Price') }}</label>
                            <div class="form-control d-flex align-items-center">
                                <span class="text-muted text-decoration-line-through">{{ priceDisplay.original }}</span>
                                <span class="ms-2">{{ priceDisplay.discounted }}</span>
                            </div>
                            <div class="mt-2" v-if="user.points >= discountedPrice">
                                {{ trans('Available Points') }}: <span class="text-success">{{ user.points }}</span>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="date_and_time" class="col-form-label">{{ trans('Pickup Date & Time') }}</label>
                            <VueDatePicker @update:model-value="handleDateChange" v-model="taxiDate" auto-apply :is-24="false" :enable-time-picker="true" :time-picker-inline="true" :format="formatDatetime" :min-date="today" name="date_and_time"></VueDatePicker>
                        </div>

                        <div class="mb-3 text-start">
                            <label for="location" class="col-form-label">{{ trans('Pickup Location') }}</label>
                            <div class="d-flex align-items-center" >
                                <input type="text" :id="'search-box-' + currentBooking.code" class="form-control" placeholder="Search Address" />
                            </div>
                            <div class="mt-3" v-if="googleZone">Zone Selected: {{ googleZone.name }}</div>
                            <div class="mt-3" :id="'map-' + currentBooking.code" style="height: calc(100vh/2); width: 100%"></div>
                        </div>

                        <input type="hidden" name="date" :value="formattedYmd" />
                        <input type="hidden" name="time" :value="formattedTime" />
                        <input type="hidden" name="latitude" :value="googleZone?.id ? googleLatitude : ''" />
                        <input type="hidden" name="longitude" :value="googleZone?.id ? googleLongitude : ''" />
                        <input type="hidden" name="payment" value="1" />
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-dark" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-success text-white" @click="createReturnBooking(true)" v-if="user" :disabled="user.points < discountedPrice"><img v-if="loading" src="/images/loading.gif" /><span v-if="!loading">{{ $t('Use Points') }}</span></button>
                    <button type="button" class="btn btn-primary" @click="createReturnBooking(false)" :disabled="!validPickup && (!taxiPrice > 0)"><img v-if="loading" src="/images/loading.gif" /><span v-if="!loading">{{ $t('Make Payment') }}</span></button>
                </div>
            </div>
        </div>
    </div>


</template>
<script setup>
import { defineComponent, reactive, ref, onMounted, computed, watch, nextTick } from 'vue';
import { trans } from "laravel-vue-i18n";

let props = defineProps({
    currentBooking: Object,
    user: Object,
});

const loading = ref(false);
const location = ref();
const taxiDate = ref();
const taxiPrice = ref(0);
const today = ref(new Date());
const validPickup = ref(false);

const returnTripBtn = ref(null);
const map = ref(null);
const clickMarker = ref(null);
const autocomplete = ref(null);
const infoWindow = ref(null);
const googleLatitude = ref(null);
const googleLongitude = ref(null);
const googleZone = ref(null);

const formattedYmd = computed(() => {
    if (taxiDate.value) {
        let date = taxiDate.value;
        return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, "0") + '-' + date.getDate().toString().padStart(2, "0");
    }
    return '';
});

const formattedTime = computed(() => {
    if (taxiDate.value) {
        let date = taxiDate.value;
        return date.getHours().toString().padStart(2, "0") + ':' + date.getMinutes().toString().padStart(2, "0");
    }
    return '';
});

const formatDatetime = (date) => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const day = date.getDate();
    const month = date.getMonth();
    let hr = date.getHours();
    let min = date.getMinutes();
    if (min < 10) {
        min = "0" + min;
    }
    let ampm = "am";
    if (hr > 12) {
        hr -= 12;
        ampm = "pm";
    }
    const time = hr + ":" + min + ampm;
    const year = date.getFullYear();
    return `${time} ${day} ${monthNames[month]} ${year}`;
}

const getFormattedDate = (date) => {
    return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, "0") + '-' + date.getDate().toString().padStart(2, "0");
}

const getFormattedTime = (date) => {
    return date.getHours().toString().padStart(2, "0") + ':' + date.getMinutes().toString().padStart(2, "0");
}

const discountedPrice = computed(() => {
    if (!taxiPrice.value || taxiPrice.value <= 0) {
        return 0;
    }
    return Math.max(0, taxiPrice.value - 5);
});

const priceDisplay = computed(() => {
    const original = `RM ${parseFloat(taxiPrice.value).toFixed(2)}`;
    const discounted = `RM ${parseFloat(discountedPrice.value).toFixed(2)}`;
    return { original, discounted };
});

onMounted(() => {
    const modalEl = document.getElementById('staticBackdrop');
    if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', () => {
            nextTick(() => {
                taxiDate.value = null;
                googleLatitude.value = null;
                googleLongitude.value = null;
                googleZone.value = null;
                validPickup.value = false;
                location.value = null;
                clickMarker.value = null;
                autocomplete.value = null;
                infoWindow.value = null;
                taxiPrice.value = 0;
                loading.value = false;

                const input = document.getElementById(`search-box-${props.currentBooking.code}`);
                if (input) {
                    input.value = '';
                }
            });
        });
    }
});

const handleDateChange = () => {
    taxiPrice.value = 0;
    window.setTimeout(() => {
        searchTaxi();
    }, 2000);
};

const searchTaxi = (event) => {
    if (!googleZone.value ) {
        return;
    } else if (!taxiDate.value) {
        return;
    } else if (!validPickup.value) {
        return;
    }
    if (loading.value) {
        return;
    }
    loading.value = true;
    axios.get('/bookings/taxi', {
        params: {
            location_id: googleZone.value?.id,
            location_type: 'ZONE',
            date: getFormattedDate(taxiDate.value),
            time: getFormattedTime(taxiDate.value),
            from_klia: props.currentBooking.is_from_klia ? '0' : '1',
            vehicle_type_id: props.currentBooking.vehicle_type_id,
        }
    }).then((response) => {
        loading.value = false;
        taxiPrice.value = Number(response?.data?.response ?? 0).toFixed(2);
    }).catch((error) => {
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
            console.log('Error', error);
        }
    });
}

const createReturnBooking = (usePoints) => {
    if (!validPickup.value) {
        alert('Please select a valid pickup location.')
        return;
    }

    if (loading.value) {
        return;
    }

    if (!props.currentBooking.code) {
        return;
    }

    if (!$("#submit-form")[0].checkValidity()) {
        $("#submit-form")[0].reportValidity();
        return;
    }
    loading.value = true;

    let formData = new FormData($('#submit-form')[0]);
    formData.append('use_points', usePoints ? 1 : 0);
    axios.post(`/taxi-bookings/${props.currentBooking.code}/return`, formData).then((response) => {
        let booking = response.data.response;
        if (usePoints) {
            window.location.href= '/taxi-bookings/' + booking.code;
            return;
        }
        let req = booking.payment_params;
        if (booking.payment_url) {
            window.location.replace(booking.payment_url);
        } else {
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
            if (error.response?.status == 401) {
                Swal.fire({
                    icon: "error",
                    title: trans("Error") + '!',
                    text: trans('Please proceed to login before booking.'),
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
        }
        console.log(error.config);
    });
};

const handleReturnTripClick = async (bookingCode) => {
    await nextTick();

    setTimeout(async () => {
        await initializeMap(bookingCode);
    }, 400);
};

function waitForGoogleMaps() {
    return new Promise((resolve) => {
        if (window.google && window.google.maps) {
            resolve(window.google.maps);
        } else {
            const interval = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(interval);
                    resolve(window.google.maps);
                }
            }, 50);
        }
    });
}

const initializeMap = async (bookingCode) => {
  try {
    const googleMaps = await waitForGoogleMaps();
    await nextTick();

    const mapEl = document.getElementById('map-' + bookingCode);
    if (!mapEl) {
      console.error('Map element not found');
      return;
    }

    const mapCenter = { lat: 3.1499, lng: 101.6945 };

    map.value = new google.maps.Map(mapEl, {
        zoom: 12,
        center: mapCenter,
        mapId: 'f4ec124b8d2306ed',
        draggableCursor: 'crosshair',
        draggingCursor: 'grabbing'
    });

    let clickMarker = null;
    let infoWindow = null;
    let autocomplete = null;
    let callCheckLatLonZone = false;
    let searchBoxUsed = false;

    const geocoder = new google.maps.Geocoder();
    google.maps.event.addListener(map.value, 'click', (event) => {
        if (!searchBoxUsed) {
            alert('Please enter your address first.');
            return;
        }

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        googleLatitude.value = lat;
        googleLongitude.value = lng;

        const myLatlng = new google.maps.LatLng(lat, lng);

        if (clickMarker) {
            clickMarker.setPosition(myLatlng);
        } else {
            clickMarker = new google.maps.Marker({
                position: myLatlng,
                map: map.value,
                title: 'Selected Location'
            });
        }

        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const address = results[0].formatted_address;
                const input = document.getElementById('search-box-' + bookingCode);
                if (input) {
                    input.value = address;
                }
            } else {
                console.warn('Geocoder failed due to:', status);
            }
        });

        callCheckLatLonZone = true;
        checkLatLonZone();
    });

    infoWindow = new google.maps.InfoWindow();

    const input = document.getElementById('search-box-' + bookingCode);
    autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'my' },
    });
    autocomplete.bindTo('bounds', map.value);

    google.maps.event.addListenerOnce(autocomplete, 'place_changed', () => {
    const pacContainer = document.querySelector('.pac-container');
    if (pacContainer) {
        const modal = document.getElementById('staticBackdrop');
        modal.appendChild(pacContainer);
    }
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        searchBoxUsed = true;

        mapEl.style.display = 'block';
        requestAnimationFrame(() => {
            mapEl.style.opacity = '1';
        });

        map.value.setCenter(place.geometry.location);
        map.value.setZoom(15);

        googleLatitude.value = place.geometry.location.lat();
        googleLongitude.value = place.geometry.location.lng();

        if (clickMarker) {
            clickMarker.setPosition(place.geometry.location);
        } else {
            clickMarker = new google.maps.Marker({
                position: place.geometry.location,
                map: map.value,
                title: 'Selected Location'
            });
        }

        if (!callCheckLatLonZone) {
            checkLatLonZone();
        }
    });
  } catch (error) {
    console.error('Map init error:', error);
  }
};

const checkLatLonZone = async () => {
    googleZone.value = null;
    await axios.get(`/bookings/zone?latitude=` + googleLatitude.value + '&longitude=' + googleLongitude.value).then((response) => {
        let zone = response.data.response;
        if (zone?.name) {
            googleZone.value = zone;
        }

        if (zone?.id) {
            validPickup.value = zone.id == props.currentBooking.zone_id;
        }

        if (!validPickup.value) {
            alert(`Pickup location selected is in ${zone.name}. Please select another location in zone ${props.currentBooking.zone_name}.`);
        } else {
            searchTaxi();
        }
    }).catch(function (error) {
        if (error.response) {
            alert(error.response.data.meta.message);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
        }
        console.log(error.config);
    });
}
</script>

<style>
    .pac-container {
        z-index: 3000 !important;
    }

    .dp__input_icon_pad {
        padding-left: 15px !important;
    }
</style>
