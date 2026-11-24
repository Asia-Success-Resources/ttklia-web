<template>
    <div class="d-flex flex-column flex-grow-1 position-relative">
        <div class="row mb-4 g-3">
            <div class="col-md-6">
                <label for="pickup_location_id" class="form-label fw-semibold fs-7 mb-1 text-uppercase">{{ $t('Pick Up Location') }}</label>
                <select id="pickup_location_id" name="pickup_location_id" class="form-select form-select-sm py-2 bg-light px-3 rounded-3" v-model="pickupLocationId" required>
                    <option value="">{{ $t('Select Pick Up Location') }}</option>
                    <option v-for="loc in pickupLocations" :key="loc.id" :value="loc.id">
                        {{ loc.name }}{{ loc.address ? ' - ' + loc.address : '' }}
                    </option>
                </select>
            </div>
            <div class="col-md-6">
                <label for="return_location_id" class="form-label fw-semibold fs-7 mb-1 text-uppercase">{{ $t('Return Location') }}</label>
                <select id="return_location_id" name="return_location_id" class="form-select form-select-sm py-2 bg-light px-3 rounded-3" v-model="returnLocationId" required>
                    <option value="">{{ $t('Select Return Location') }}</option>
                    <option v-for="loc in returnLocations" :key="loc.id" :value="loc.id">
                        {{ loc.name }}{{ loc.address ? ' - ' + loc.address : '' }}
                    </option>
                </select>
            </div>
        </div>
        <div class="row mb-3 g-3">
            <div class="col-md-6">
                <label for="datetime_from" class="form-label fw-semibold fs-7 mb-1 text-uppercase">{{ $t('Pickup') }}</label>
                <input type="datetime-local" class="form-control form-control-sm py-2 bg-light px-3 rounded-3"
                    id="datetime_from" name="datetime_from" v-model="datetimeFrom" @change="handleDateChange"
                    required>
            </div>
            <div class="col-md-6">
                <label for="datetime_to" class="form-label fw-semibold fs-7 mb-1 text-uppercase">{{ $t('Return') }}</label>
                <input type="datetime-local" class="form-control form-control-sm py-2 bg-light px-3 rounded-3"
                    id="datetime_to" name="datetime_to" v-model="datetimeTo" @change="handleDateChange" required>
            </div>
        </div>

        <div class="d-flex gap-2 mb-4">
            <button type="button" @click="applyPreset(1, 'day')"
                class="btn btn-xs btn-outline-dark rounded-pill border-light-subtle fs-xs py-1 px-3 transition-all hover-primary">
                +1 {{ $t('Day') }}
            </button>
            <button type="button" @click="applyPreset(1, 'month')"
                class="btn btn-xs btn-outline-dark rounded-pill border-light-subtle fs-xs py-1 px-3 transition-all hover-primary">
                +1 {{ $t('Month') }}
            </button>
            <button type="button" @click="applyPreset(1, 'year')"
                class="btn btn-xs btn-outline-dark rounded-pill border-light-subtle fs-xs py-1 px-3 transition-all hover-primary">
                +1 {{ $t('Year') }}
            </button>
        </div>

        <h6 class="fw-bold mb-3 text-dark text-uppercase fs-7 letter-spacing-1">{{ $t('Select Vehicle') }}</h6>

        <div class="vehicle-list d-flex flex-column gap-3 mb-5 position-relative overflow-y-auto"
            style="min-height: 200px;">
            <label v-for="type in vehicleTypes" :key="type.id"
                class="card border shadow-sm rounded-4 overflow-hidden vehicle-card transition-all position-relative cursor-pointer bg-white"
                :class="selectedVehicleId === type.id ? 'border-primary border-3 shadow-lg' : 'border-light'">

                <input type="radio" name="vehicle_type_id" :value="type.id" class="d-none vehicle-radio"
                    v-model="selectedVehicleId" @change="handleVehicleChange" required>

                <!--<div v-if="type.id === recommendedVehicleId"
                    class="position-absolute top-0 end-0 bg-primary text-white px-3 py-1 rounded-bottom-4 fs-extra-small fw-bold text-uppercase z-3 shadow-sm"
                    style="border-bottom-left-radius: 12px; border-bottom-right-radius: 0;">
                    {{ $t('Top Pick') }}
                </div>-->

                <div class="row g-0 align-items-stretch">
                    <div class="col-4 col-md-5 bg-light position-relative" style="min-height: 140px;">
                        <img :src="type.image" class="w-100 h-100 object-fit-cover position-absolute"
                            :alt="type.name" style="top: 0; left: 0;">
                        <div v-show="selectedVehicleId === type.id"
                            class="position-absolute top-0 start-0 w-100 h-100 opacity-10"></div>
                    </div>

                    <div class="col-8 col-md-7 position-relative d-flex flex-column">
                        <div class="card-body p-3 p-md-4">
                            <h5 class="card-title fw-bold mb-1 text-dark fs-6">{{ type.name }}</h5>
                            <p class="card-text text-muted small mb-2 d-flex align-items-center opacity-75">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor"
                                    class="bi bi-people-fill me-2" viewBox="0 0 16 16">
                                    <path
                                        d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                                </svg>
                                {{ type.maximum_capacity }} {{ $t('Pax') }}
                            </p>

                            <div class="pricing-container mt-2 pt-2 border-top border-2">
                                <div class="d-flex flex-row flex-wrap gap-2">
                                    <div v-if="type.pricing && type.pricing.daily_price_value"
                                        class="d-flex flex-column min-w-0 ps-2 border-start">
                                        <span class="fw-bold text-dark fs-7 d-flex align-items-center gap-1">
                                            <svg v-if="type.pricing.daily_price_display_type === props.priceDisplayContact" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="text-muted me-1" viewBox="0 0 16 16"><path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z"/></svg>
                                            {{ formatPriceValue(type.pricing.daily_price_value, type.pricing.daily_price_display_type) }}
                                        </span>
                                        <small class="text-muted text-uppercase">{{ $t('Daily') }}</small>
                                    </div>
                                    <div v-if="type.pricing && type.pricing.monthly_price_value"
                                        class="d-flex flex-column min-w-0 ms-auto ps-2 border-start">
                                        <span class="fw-bold text-dark fs-7 d-flex align-items-center gap-1">
                                            <svg v-if="type.pricing.monthly_price_display_type === props.priceDisplayContact" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="text-muted me-1" viewBox="0 0 16 16"><path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z"/></svg>
                                            {{ formatPriceValue(type.pricing.monthly_price_value, type.pricing.monthly_price_display_type) }}
                                        </span>
                                        <small class="text-muted text-uppercase">{{ $t('Monthly') }}</small>
                                    </div>
                                    <div v-if="type.pricing && type.pricing.yearly_price_value"
                                        class="d-flex flex-column min-w-0 ms-auto ps-2 border-start">
                                        <span class="fw-bold text-dark fs-7 d-flex align-items-center gap-1">
                                            <svg v-if="type.pricing.yearly_price_display_type === props.priceDisplayContact" xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="text-muted me-1" viewBox="0 0 16 16"><path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z"/></svg>
                                            {{ formatPriceValue(type.pricing.yearly_price_value, type.pricing.yearly_price_display_type) }}
                                        </span>
                                        <small class="text-muted text-uppercase">{{ $t('Yearly') }}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </label>
        </div>

        <div class="mt-auto py-3 border-top">
            <div class="d-flex justify-content-between align-items-end">
                <div class="d-flex flex-column gap-1">
                    <h6 class="text-muted mb-0 fw-bold text-uppercase fs-xs letter-spacing-1">{{ $t('Total Estimated') }}</h6>
                    <div class="d-flex align-items-center">
                        <div v-if="isLoading" class="spinner-border spinner-border-sm text-primary me-2"
                            role="status"></div>
                        <h3 class="fw-bold text-dark mb-0" :class="{'opacity-50': isLoading}">
                            <span class="fs-4">{{ priceDisplay }}</span>
                        </h3>
                    </div>
                    <div v-show="errorMessage" class="text-danger mt-1 fw-medium fs-xs">{{ errorMessage }}</div>
                </div>

                <button type="submit" :disabled="!isValid || isLoading || errorMessage.length > 0"
                    class="btn btn-primary px-4 py-2 rounded-pill fw-bold text-uppercase shadow-sm transition-all hover-primary"
                    style="font-size: 0.9rem;">
                    {{ $t('Next') }} <i class="bi bi-arrow-right ms-1"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import axios from 'axios';
    import { trans } from 'laravel-vue-i18n';

    const props = defineProps({
        vehicleTypes: {
            type: Array,
            required: true
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
        }
    });

    const datetimeFrom = ref('');
    const datetimeTo = ref('');
    const selectedVehicleId = ref(null);
    const pickupLocationId = ref('');
    const returnLocationId = ref('');
    const formattedPrice = ref(null);
    const subtotal = ref(0);
    const isLoading = ref(false);
    const errorMessage = ref('');
    const priceDisplayType = ref(0);
    const contactNumber = ref('');

    const recommendedVehicleId = computed(() => {
        if (!props.vehicleTypes || props.vehicleTypes.length === 0) return null;
        const sorted = [...props.vehicleTypes].sort((a, b) => {
            const priceA = (a.pricing && a.pricing.daily_price) || 0;
            const priceB = (b.pricing && b.pricing.daily_price) || 0;
            return priceB - priceA;
        });
        return sorted.length > 0 ? sorted[0].id : null;
    });

    const isValid = computed(() => {
        return datetimeFrom.value && datetimeTo.value && selectedVehicleId.value && pickupLocationId.value && returnLocationId.value && subtotal.value > 0;
    });

    const formatPriceValue = (value, displayType) => {
        if (!value) return '-';
        if (displayType === props.priceDisplayContact) return value;
        const num = Number(value);
        return isNaN(num) ? value : 'RM' + num.toLocaleString();
    };

    const priceDisplay = computed(() => {
        if (priceDisplayType.value === props.priceDisplayContact) {
            return contactNumber.value ? trans('Contact') + ': ' + contactNumber.value : trans('Contact for price');
        }
        if (formattedPrice.value) {
            const numericValue = Number(formattedPrice.value.replace(/RM\s?/, ''));
            if (isNaN(numericValue)) return 'RM ---';

            return 'RM ' + numericValue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return 'RM ---';
    });

    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const applyPreset = (amount, unit) => {
        const start = datetimeFrom.value ? new Date(datetimeFrom.value) : new Date();
        const end = new Date(start);

        if (!datetimeFrom.value) {
            datetimeFrom.value = formatDateForInput(start);
        }

        if (unit === 'day') {
            end.setDate(start.getDate() + amount);
        } else if (unit === 'month') {
            end.setMonth(start.getMonth() + amount);
        } else if (unit === 'year') {
            end.setFullYear(start.getFullYear() + amount);
        }

        datetimeTo.value = formatDateForInput(end);
        calculatePrice();
    };

    const handleDateChange = () => {
        calculatePrice();
    };

    const handleVehicleChange = () => {
        calculatePrice();
    };

    const calculatePrice = async () => {
        if (!datetimeFrom.value || !datetimeTo.value || !selectedVehicleId.value) {
            subtotal.value = 0;
            formattedPrice.value = null;
            return;
        }

        isLoading.value = true;
        errorMessage.value = '';

        try {
            const response = await axios.get('/bookings/rentals/price', {
                params: {
                    vehicle_type_id: selectedVehicleId.value,
                    datetime_from: datetimeFrom.value,
                    datetime_to: datetimeTo.value
                }
            });

            const data = response.data;

            if (data.error || isNaN(data.price)) {
                formattedPrice.value = null;
                subtotal.value = 0;
                priceDisplayType.value = 0;
                contactNumber.value = '';
                errorMessage.value = data.error || trans('Invalid duration.');
            } else {
                subtotal.value = data.price;
                formattedPrice.value = 'RM' + Number(data.price).toFixed(2);
                priceDisplayType.value = data.price_display_type ?? 0;
                contactNumber.value = data.contact_number ?? '';
            }
        } catch (error) {
            formattedPrice.value = null;
            subtotal.value = 0;
            errorMessage.value = error.response?.data?.error || trans('Error calculating price.');
        } finally {
            isLoading.value = false;
        }
    };
</script>

<style scoped>
.vehicle-card {
    transition: all 0.2s ease;
    cursor: pointer;
}
.vehicle-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}
</style>
