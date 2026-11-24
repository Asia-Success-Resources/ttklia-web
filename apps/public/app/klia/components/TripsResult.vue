<!--suppress EqualityComparisonWithCoercionJS -->
<template>
    <!-- Trip summary band, same dark treatment as the search hero -->
    <section class="tr-hero">
        <div class="container">
            <div class="tr-hero__inner">
                <div>
                    <p class="tr-hero__route">
                        <span>{{ origin === 'lalaport' ? 'Lalaport BBCC' : 'KLIA2' }}</span>
                        <svg-icon name="arrow-right" />
                        <span>{{ zone.name }} <small v-if="zone.code">({{ zone.code }})</small></span>
                    </p>
                    <h1 class="tr-hero__title">{{ step == 0 ? $t('Choose your departure') : $t('Passenger and payment details') }}</h1>
                    <ul class="tr-hero__meta">
                        <li><svg-icon name="calendar" /> {{ date }}</li>
                        <li><svg-icon name="users" /> {{ total }} {{ total > 1 ? $t('Passengers') : $t('Passenger') }}</li>
                        <li v-if="step == 1 && selectedTrip"><svg-icon name="clock" /> {{ selectedTrip.departure_time }}</li>
                    </ul>
                </div>
                <a :href="'/?' + 'zone_id=' + zone.id + '&date=' + actualDate + '&adult=' + adult + '&child=' + child + '&senior=' + senior + '&staff=' + staff + '&origin=' + origin" class="tr-hero__change"><svg-icon name="pencil" /> {{ $t('Change search') }}</a>
            </div>
        </div>
    </section>

    <div class="container page tr-page" v-if="step == 0">
        <div class="tr-layout">
            <aside class="tr-filters">
                <div class="tr-filters__head">
                    <h2>{{ $t('Filter') }}</h2>
                    <button type="button" class="text-link" v-if="selectedCompanies.options.length < companies.options.length" @click="selectedCompanies.options = [...companies.options]">{{ $t('Reset') }}</button>
                </div>
                <p class="tr-filters__label">{{ $t('Bus company') }}</p>
                <div class="tr-filters__list">
                    <label class="tr-filter" v-for="(company, index) in companies.options" :key="company" :for="'company-' + index">
                        <input class="form-check-input" type="checkbox" v-model="selectedCompanies.options" :value="company" :id="'company-' + index">
                        <span class="tr-filter__name">{{ company }}</span>
                        <span class="tr-filter__count">{{ trips.filter(t => t.company_name === company).length }}</span>
                    </label>
                </div>
            </aside>

            <div class="tr-results" ref="resultsEl">
                <div class="tr-results__bar">
                    <h2>{{ tripsArray.options.length }} {{ tripsArray.options.length === 1 ? $t('departure') : $t('departures') }}</h2>
                    <span>{{ $t('Earliest first') }}</span>
                </div>

                <article class="tr-trip" :class="{ 'is-open': trip.show_seats }" v-for="trip in tripsArray.options" :key="trip.id">
                    <div class="tr-trip__row">
                        <div class="tr-trip__operator">
                            <img v-if="trip.company.logo" :src="trip.company.logo" :alt="trip.company_name" />
                            <span class="tr-trip__operator-name">{{ trip.company_name }}</span>
                        </div>
                        <div class="tr-trip__route">
                            <span class="tr-trip__time">{{ trip.departure_time }}</span>
                            <span class="tr-trip__line"><svg-icon name="bus" /></span>
                            <span class="tr-trip__dest">{{ zone.code ?? zone.name }}</span>
                        </div>
                        <div class="tr-trip__price">
                            <small v-if="tripPriceIsFrom(trip)">{{ $t('from') }}</small>
                            <strong>MYR {{ tripPriceLabel(trip) }}</strong>
                            <small>/ {{ $t('passenger') }}</small>
                        </div>
                        <button type="button" class="btn tr-trip__cta" :class="trip.show_seats ? 'btn-outline-dark' : 'btn-primary'" @click="searchSeats(trip)" :disabled="trip.loading">
                            <span v-if="trip.loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span v-else>{{ $t('Check Seats') }}</span>
                        </button>
                    </div>
                        <div v-if="trip.show_seats" class="tr-seats">
                            <div v-if="seatsFitHorizontally(trip)">
                                <div class="tr-seats__legend" aria-hidden="true">
                                    <span><img src="/images/seat.svg" alt="" /> {{ $t('Available') }}</span>
                                    <span><img src="/images/seat-taken.svg" alt="" /> {{ $t('Selected') }}</span>
                                    <span><img src="/images/seat-unavailable.svg" alt="" /> {{ $t('Unavailable') }}</span>
                                </div>
                                <h4 class="tr-seats__deck">{{ $t('Lower Deck') }}</h4>
                                <div class="w-100 position-relative" style="background: var(--surface-2); border-radius: 12px; border: 1px solid var(--line); height: 286px;">
                                    <img src="/images/bus.svg" style="position: absolute; left: 10px; top: 10px" />
                                    <div class="tr-seat-deck tr-seat-deck--sideways" style="padding-left: 90px;">
                                        <template v-for="col of Array.from({length: trip.max_height}, (_, i) => trip.max_height - 1 - i)"><div class="tr-seat-row">
                                            <template v-for="(number, row) in trip.max_length">
                                                <div class="tr-seat" v-if="trip.map.get(row + '-' + col + '-0') && !trip.map.get(row + '-' + col + '-0').is_upper_deck">
                                                    <template v-if="trip.map.get(row + '-' + col + '-0')?.status != 0">
                                                        <img src="/images/seat-unavailable.svg" />
                                                    </template>
                                                    <template v-else>
                                                        <div @click="toggleSeat(trip.map.get(row + '-' + col + '-0')?.seat_no)" class="cursor-pointer">
                                                            <span class="tr-seat__no">{{ trip.map.get(row + '-' + col + '-0').seat_no }}</span>
                                                            <template v-if="takenSeats.includes(trip.map.get(row + '-' + col + '-0')?.seat_no)">
                                                                <img src="/images/seat-taken.svg" />
                                                            </template>
                                                            <template v-else>
                                                                <img src="/images/seat.svg" />
                                                            </template>
                                                        </div>
                                                    </template>
                                                </div>
                                                <div v-else class="tr-seat"></div>
                                            </template>
                                        </div><div v-if="((trip.two_space_gap && col == 2) || (!trip.two_space_gap && col == 1)) && !trip.no_gap" class="tr-seat-aisle"></div></template>
                                    </div>
                                </div>
                                <template v-if="trip.has_upper_deck">
                                    <h4 class="tr-seats__deck mt-4">{{ $t('Upper Deck') }}</h4>
                                    <div class="w-100 position-relative" style="background: var(--surface-2); border-radius: 12px; border: 1px solid var(--line); height: 286px;">
                                        <div class="tr-seat-deck tr-seat-deck--sideways" style="padding-left: 20px;">
                                            <template v-for="col of Array.from({length: trip.upper_max_height}, (_, i) => trip.upper_max_height - 1 - i)"><div class="tr-seat-row">
                                                <template v-for="(number, row) in trip.upper_max_length">
                                                    <div class="tr-seat" v-if="trip.map.get(row + '-' + col + '-1') && trip.map.get(row + '-' + col + '-1').is_upper_deck">
                                                        <template v-if="trip.map.get(row + '-' + col + '-1')?.status != 0">
                                                            <img src="/images/seat-unavailable.svg" />
                                                        </template>
                                                        <template v-else>
                                                            <div @click="toggleSeat(trip.map.get(row + '-' + col + '-1')?.seat_no)" class="cursor-pointer">
                                                                <span class="tr-seat__no">{{ trip.map.get(row + '-' + col + '-1').seat_no }}</span>
                                                                <template v-if="takenSeats.includes(trip.map.get(row + '-' + col + '-1')?.seat_no)">
                                                                    <img src="/images/seat-taken.svg" />
                                                                </template>
                                                                <template v-else>
                                                                    <img src="/images/seat.svg" />
                                                                </template>
                                                            </div>
                                                        </template>
                                                    </div>
                                                    <div v-else class="tr-seat"></div>
                                                </template>
                                            </div><div v-if="((trip.two_space_gap && col == 2) || (!trip.two_space_gap && col == 1)) && !trip.no_gap" class="tr-seat-aisle"></div></template>
                                        </div>
                                    </div>
                                </template>
                                <div class="tr-seats__foot">
                                    <dl class="tr-seats__stats">
                                        <div><dt>{{ $t('Remaining Seats') }}</dt><dd :class="{ 'is-good': (total - takenSeats.length) > 0 }">{{ total - takenSeats.length }}</dd></div>
                                        <div><dt>{{ $t('Selected Seats') }}</dt><dd class="is-good">{{ takenSeats.length ? takenSeats.join(', ') : '-' }}</dd></div>
                                        <div><dt>{{ $t('Total Price') }} (MYR)</dt><dd class="is-price">{{ trip.total_price ? trip.total_price.toFixed(2) : '-' }}</dd></div>
                                    </dl>
                                    <button class="btn btn-primary btn-lg tr-seats__next" :disabled="(total - takenSeats.length) || (trip.unavailable_ticket_types && trip.unavailable_ticket_types.length)" type="button" @click="selectTrip(trip)">{{ $t('Continue') }} <svg-icon name="arrow-right" /></button>
                                </div>
                            </div>
                            <div v-else>
                                <div class="tr-seats__legend" aria-hidden="true">
                                    <span><img src="/images/seat.svg" alt="" /> {{ $t('Available') }}</span>
                                    <span><img src="/images/seat-taken.svg" alt="" /> {{ $t('Selected') }}</span>
                                    <span><img src="/images/seat-unavailable.svg" alt="" /> {{ $t('Unavailable') }}</span>
                                </div>
                                <h4 class="tr-seats__deck">{{ $t('Lower Deck') }}</h4>
                                <div class="w-100 position-relative mx-auto" style="background: var(--surface-2); border-radius: 12px; border: 1px solid var(--line); padding-top: 30px; padding-bottom: 30px; max-width: 450px;">
                                    <div class="tr-seat-deck tr-seat-deck--upright">
                                        <div class="tr-seat-row" v-for="(number, row) in trip.max_length">
                                            <template v-for="(number, col) in trip.max_height">
                                                <div class="tr-seat" v-if="trip.map.get(row + '-' + col + '-0') && !trip.map.get(row + '-' + col + '-0').is_upper_deck">
                                                    <template v-if="trip.map.get(row + '-' + col + '-0')?.status != 0">
                                                        <img src="/images/seat-unavailable.svg" class="rotate-seat" />
                                                    </template>
                                                    <template v-else>
                                                        <div @click="toggleSeat(trip.map.get(row + '-' + col + '-0')?.seat_no)" class="cursor-pointer">
                                                            <span class="tr-seat__no">{{ trip.map.get(row + '-' + col + '-0').seat_no }}</span>
                                                            <template v-if="takenSeats.includes(trip.map.get(row + '-' + col + '-0')?.seat_no)">
                                                                <img src="/images/seat-taken.svg" class="rotate-seat" />
                                                            </template>
                                                            <template v-else>
                                                                <img src="/images/seat.svg" class="rotate-seat" />
                                                            </template>
                                                        </div>
                                                    </template>
                                                </div>
                                                <div v-else class="tr-seat"></div>
                                            </template>
                                        </div>
                                    </div>
                                </div>
                                <template v-if="trip.has_upper_deck">
                                    <h4 class="tr-seats__deck mt-4">{{ $t('Upper Deck') }}</h4>
                                    <div class="w-100 position-relative mx-auto" style="background: var(--surface-2); border-radius: 12px; border: 1px solid var(--line); padding-top: 30px; padding-bottom: 30px; max-width: 450px;">
                                        <div class="tr-seat-deck tr-seat-deck--upright">
                                            <div class="tr-seat-row" v-for="(number, row) in trip.upper_max_length">
                                                <template v-for="(number, col) in trip.upper_max_height">
                                                    <div class="tr-seat" v-if="trip.map.get(row + '-' + col + '-1') && trip.map.get(row + '-' + col + '-1').is_upper_deck">
                                                        <template v-if="trip.map.get(row + '-' + col + '-1')?.status != 0">
                                                            <img src="/images/seat-unavailable.svg" class="rotate-seat" />
                                                        </template>
                                                        <template v-else>
                                                            <div @click="toggleSeat(trip.map.get(row + '-' + col + '-1')?.seat_no)" class="cursor-pointer">
                                                                <span class="tr-seat__no">{{ trip.map.get(row + '-' + col + '-1').seat_no }}</span>
                                                                <template v-if="takenSeats.includes(trip.map.get(row + '-' + col + '-1')?.seat_no)">
                                                                    <img src="/images/seat-taken.svg" class="rotate-seat" />
                                                                </template>
                                                                <template v-else>
                                                                    <img src="/images/seat.svg" class="rotate-seat" />
                                                                </template>
                                                            </div>
                                                        </template>
                                                    </div>
                                                    <div v-else class="tr-seat"></div>
                                                </template>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <div class="tr-seats__foot">
                                    <dl class="tr-seats__stats">
                                        <div><dt>{{ $t('Remaining Seats') }}</dt><dd :class="{ 'is-good': (total - takenSeats.length) > 0 }">{{ total - takenSeats.length }}</dd></div>
                                        <div><dt>{{ $t('Selected Seats') }}</dt><dd class="is-good">{{ takenSeats.length ? takenSeats.join(', ') : '-' }}</dd></div>
                                        <div><dt>{{ $t('Total Price') }} (MYR)</dt><dd class="is-price">{{ trip.total_price ? trip.total_price.toFixed(2) : '-' }}</dd></div>
                                    </dl>
                                    <button class="btn btn-primary btn-lg tr-seats__next" :disabled="(total - takenSeats.length) || (trip.unavailable_ticket_types && trip.unavailable_ticket_types.length)" type="button" @click="selectTrip(trip)">{{ $t('Continue') }} <svg-icon name="arrow-right" /></button>
                                </div>
                            </div>
                        </div>
                </article>

                <div class="empty-state" v-if="tripsArray.options.length <= 0">
                    <svg-icon name="bus" class="icon icon-xl" />
                    <h2>{{ $t('There are no trips matching your criteria.') }}</h2>
                    <p v-if="selectedCompanies.options.length < companies.options.length">{{ $t('Try selecting more bus companies in the filter.') }}</p>
                </div>
            </div>
        </div>
    </div>
    <div class="container page tr-page" v-if="step == 1">
        <form id="submit-form" method="POST">
            <div class="tr-checkout">
                <div class="tr-checkout__main">
                    <button type="button" class="back-link" @click="step = 0"><svg-icon name="arrow-left" /> {{ $t('Back to seats') }}</button>

                    <section class="panel">
                        <div class="panel__head">
                            <h2 class="panel__title mb-0">{{ $t('Passengers Details') }}</h2>
                            <span class="tr-count">{{ total }} {{ total > 1 ? $t('Passengers') : $t('Passenger') }}</span>
                        </div>
                        <div class="tr-passenger" v-for="(n, i) in total" :key="i">
                            <div class="tr-passenger__head">
                                <span class="tr-passenger__seat"><svg-icon name="ticket" /> {{ $t('Seat') }} {{ takenSeats[i] }}</span>
                                <strong>{{ $t('Passenger') }} {{ n }}</strong>
                                <span class="tr-passenger__type">{{ ticketTypes[i]?.name }}</span>
                            </div>
                            <div class="field">
                                <label :for="'passenger-' + i" class="field__label">{{ $t('Full Name') }} *</label>
                                <input type="hidden" :name="'seats[' + i + '][seat_no]'" :value="takenSeats[i]" />
                                <input type="hidden" :name="'seats[' + i + '][ticket_type_id]'" :value="ticketTypes[i]?.ticket_type_id" />
                                <input :id="'passenger-' + i" type="text" :name="'seats[' + i + '][name]'" v-model="seatInputs[i].name" class="form-control" :placeholder="trans('Name as on ID or passport')" required />
                            </div>
                        </div>
                    </section>

                    <section class="panel">
                        <div class="panel__head">
                            <h2 class="panel__title mb-0">{{ $t('Billing Details') }}</h2>
                            <a v-if="!user" href="/login" class="text-link">{{ $t('Sign in for faster checkout') }}</a>
                        </div>
                        <div class="field-grid field-grid--2">
                            <div class="field">
                                <label for="billing-name" class="field__label">{{ $t('Full Name') }} *</label>
                                <input type="text" id="billing-name" class="form-control" name="billing_name" v-model="billingName" required :placeholder="trans('Full Name')" />
                            </div>
                            <div class="field">
                                <label for="billing-id-passport" class="field__label">{{ $t('ID / Passport No.') }}</label>
                                <input type="text" id="billing-id-passport" name="billing_id_passport" class="form-control" v-model="billingIdPassport" :placeholder="trans('ID / Passport No.')" />
                            </div>
                            <div class="field">
                                <label for="billing-email" class="field__label">{{ $t('Email Address') }} *</label>
                                <input type="email" id="billing-email" name="billing_email" class="form-control" v-model="billingEmail" :placeholder="trans('Email')" required />
                                <p class="field__hint">{{ $t('Your e-boarding pass is sent here.') }}</p>
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
                </div>

                <aside class="tr-checkout__aside">
                    <div class="panel tr-summary">
                        <h2 class="panel__title">{{ $t('Summary') }}</h2>

                        <div class="tr-summary__trip">
                            <p class="tr-summary__route">
                                <span>{{ origin === 'lalaport' ? 'Lalaport BBCC' : 'KLIA2' }}</span>
                                <svg-icon name="arrow-right" />
                                <span>{{ selectedTrip.zone_name }}</span>
                            </p>
                            <dl class="tr-summary__meta">
                                <div><dt>{{ $t('Date') }}</dt><dd>{{ selectedTrip.date }}</dd></div>
                                <div><dt>{{ $t('Time') }}</dt><dd>{{ selectedTrip.departure_time }}</dd></div>
                                <div><dt>{{ $t('Selected Seats') }}</dt><dd>{{ takenSeats.join(', ') }}</dd></div>
                                <div><dt>{{ $t('Company') }}</dt><dd>{{ selectedTrip.company_name }}</dd></div>
                            </dl>
                            <button type="button" class="text-link" @click="step = 0"><svg-icon name="pencil" class="icon-sm" /> {{ $t('Change') }}</button>
                        </div>

                        <dl class="price-list">
                            <div v-if="adult"><dt>{{ $t('Adult') }} × {{ adult }}</dt><dd>{{ formatPricing('Adult') }}</dd></div>
                            <div v-if="child > 0"><dt>{{ $t('Child') }} × {{ child }}</dt><dd>{{ formatPricing('Child') }}</dd></div>
                            <div v-if="senior > 0"><dt>{{ $t('Senior') }} × {{ senior }}</dt><dd>{{ formatPricing('Senior') }}</dd></div>
                            <div v-if="staff > 0"><dt>{{ $t('Staff') }} × {{ staff }}</dt><dd>{{ formatPricing('Staff') }}</dd></div>
                        </dl>
                        <dl class="price-list">
                            <div><dt>{{ $t('Subtotal') }}</dt><dd>{{ selectedTrip.total_price === null || selectedTrip.total_price === undefined ? $t('Not available') : selectedTrip.total_price.toFixed(2) }}</dd></div>
                            <div class="is-discount" v-if="discount?.prize_id || (bookingCode?.id && bookingCode?.code)">
                                <dt>{{ $t('Discount') }}</dt>
                                <dd v-if="discount?.prize_id">- {{ (discount.amount).toFixed(2) }}</dd>
                                <dd v-else-if="bookingCode.id && bookingCode?.code">- {{ (bookingCode.amount).toFixed(2) }}</dd>
                            </div>
                        </dl>

                        <button type="button" class="btn btn-outline-dark w-100 tr-summary__discount" data-bs-toggle="modal" data-bs-target="#offersModal" @click.prevent.stop>
                            <svg-icon name="tag" /> {{ $t('Apply Discount') }}
                        </button>

                        <div class="price-total">
                            <span>{{ $t('Total Price') }} (MYR)</span>
                            <span>{{ (totalPrice).toFixed(2) }}</span>
                        </div>

                        <input type="hidden" name="trip_id" :value="selectedTrip.id" />
                        <input type="hidden" name="payment" value="1" />
                        <input type="hidden" name="prize_id" :value="discount?.prize_id" />
                        <input type="hidden" name="wheel_winner_id" :value="discount?.wheel_winner_id" />
                        <input type="hidden" name="booking_code_id" :value="bookingCode?.id" />
                        <input type="hidden" name="discount_amount" :value="discount?.amount" />

                        <div class="tr-summary__actions">
                            <button class="btn btn-primary btn-lg w-100" @click="createBooking(false)" type="button" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                <span v-else>{{ $t('Make Payment') }}</span>
                            </button>
                            <button class="btn btn-outline-dark w-100" @click="createBooking(true)" v-if="user" type="button" :disabled="loading || user.points < totalPrice">
                                <svg-icon name="gift" /> {{ $t('Use Points') }} <small>({{ user.points }} {{ $t('available') }})</small>
                            </button>
                        </div>
                        <p class="tr-summary__secure"><svg-icon name="lock" /> {{ $t('Secure payment. Your e-boarding pass is emailed right after.') }}</p>
                    </div>
                </aside>
            </div>

            <div class="modal fade" id="offersModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">

                        <div class="modal-header">
                            <h5 class="modal-title">{{ $t('Available Offers') }}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>

                        <div class="modal-body">
                            <div class="otp-field mb-3">
                                <input type="text" class="form-control" v-model="bookingCodeInput" :placeholder="$t('Enter discount code')"
                                    @keyup.enter="applyBookingCode">
                                <button class="btn btn-primary" type="button" :disabled="isApplyingBookingCode || !bookingCodeInput"
                                    @click="applyBookingCode">
                                    {{ isApplyingBookingCode ? $t('Applying...') : $t('Apply') }}
                                </button>
                            </div>
                            <div v-if="bookingCode?.id && bookingCode.amount" class="p-2 alert alert-success">
                                RM {{ bookingCode.amount }} {{ $t('Discount applied!') }}
                            </div>

                            <div v-for="(reward, index) in unusedRewards"
                                :key="'reward-' + index"
                                class="border rounded p-2 mb-2 d-flex justify-content-between align-items-center">

                                <div>
                                    <strong>{{ reward.prize_name }}</strong><br>
                                    <small class="text-muted">
                                        {{ $t('Discount Up to RM') }} {{ reward.prize_amount }}
                                    </small><br>
                                    <small class="text-muted">
                                        {{ $t('Valid until') }} {{ new Date(reward.expires_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur'}) }}
                                    </small>
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
    </div>
</template>
<script setup>
import { defineComponent, reactive, ref, onBeforeMount, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import {trans} from "laravel-vue-i18n";
import moment from "moment";

let props = defineProps({
    trips: Array,
    zone: Object,
    date: String,
    adult: Number,
    child: Number,
    senior: Number,
    staff: Number,
    total: Number,
    locations: Array,
    user: Object,
    session: String,
    env: String,
    unusedRewards: Array,
    countries: Array,
    errors: Object,
    origin: { type: String, default: 'klia2' },
});

const localErrors = ref({ ...props.errors });
const country = ref({"name":"Malaysia","official_name":"Malaysia","native_name":"Malaysia","native_official_name":"Malaysia","iso_3166_1_alpha2":"MY","iso_3166_1_alpha3":"MYS","calling_code":"60","currency":"MYR","emoji":"🇲🇾","country_name_calling_code":"Malaysia (+60)"});
const countries = ref([]);

const tripsArray = reactive({options: []});
const location = ref();

const step = ref(0);

const date = moment(props.date).format('D MMMM YYYY');
const actualDate = props.date;

const companies = reactive({options: []});
const selectedCompanies = reactive({options: []});

const takenSeats = ref([]);

const selectedTrip = ref(null);
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

const loading = ref(false);

const billingName = ref(props.user ? props.user.name : '');
const billingIdPassport = ref('');
const phoneNum = ref(props.user ? props.user.phone_number : '');
const billingEmail = ref(props.user ? props.user.email : '');

onBeforeMount(() => {
    tripsArray.options = props.trips;
    props.trips.forEach((trip) => {
        if (!companies.options.includes(trip.company_name)) {
            companies.options.push(trip.company_name);
            selectedCompanies.options.push(trip.company_name);
        }
    });
});

const clearError = (field) => {
    if (localErrors.value[field]) {
        delete localErrors.value[field];
    }
};

// Seat map orientation: the bus is drawn sideways only when every seat column
// fits on one line of the results column; longer buses are drawn top-down.
const resultsEl = ref(null);
const resultsWidth = ref(0);
let resizeObserver = null;
const SEAT_SLOT = 48;      // 32px seat + 16px horizontal margin
const SIDEWAYS_CHROME = 170; // card padding, bus nose image and map padding

const seatsFitHorizontally = (trip) => {
    const columns = Math.max(trip.max_length ?? 0, trip.upper_max_length ?? 0);
    if (!columns || !resultsWidth.value) {
        return false;
    }
    return resultsWidth.value >= SIDEWAYS_CHROME + columns * SEAT_SLOT;
};

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
});

// The results column sits under v-if="step == 0", so "Back to seats" renders a new
// element: follow it, or the observer keeps measuring the removed one (width 0).
watch(resultsEl, (el) => {
    resizeObserver?.disconnect();
    if (!el) {
        return;
    }
    resultsWidth.value = el.clientWidth;
    if ('ResizeObserver' in window) {
        resizeObserver ??= new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect?.width;
            if (width) {
                resultsWidth.value = width;
            }
        });
        resizeObserver.observe(el);
    }
}, { flush: 'post', immediate: true });

onMounted(() => {

    countries.value = (props.countries || []).filter(c => c.calling_code).map(c => ({
        ...c,
        country_name_calling_code: `${c.name} (+${c.calling_code})`,
    }));

    if (props?.user?.country_code) {
        country.value = countries.value.find(c => '+' + c.calling_code === props.user.country_code);
    }
})

const billingPhone = computed(() => {
    if (country.value) {
        return country.value.calling_code + '' + phoneNum.value;
    }
    return phoneNum.value;
})

watch(selectedCompanies, async (newCompanies, oldCompanies) => {
    filter();
})

// Ticket type IDs differ between databases (klia2 vs lalaport), so they are always
// resolved from the pricings payload by name instead of being hardcoded.
const PAX_TYPES = [
    {prop: 'adult', name: 'Adult'},
    {prop: 'child', name: 'Child'},
    {prop: 'senior', name: 'Senior'},
    {prop: 'staff', name: 'Staff'},
];

const pricingsSource = (trip) => trip?.pricings ?? selectedTrip.value?.pricings ?? [];

const ticketTypeId = (name, trip = null) => {
    const match = pricingsSource(trip).find((type) => String(type.name).toLowerCase() === name.toLowerCase());
    return match ? match.ticket_type_id : null;
}

const getPricing = (id) => {
    let price = null;
    selectedTrip.value.pricings.forEach((type) => {
        if (type.ticket_type_id == id) {
            price = type.price;
        }
    })
    return price;
}

const getPricingByName = (name) => {
    const id = ticketTypeId(name);
    return id === null ? null : getPricing(id);
}

// Price is null when the ticket type has no price configured for this trip.
const formatPricing = (name) => {
    const price = getPricingByName(name);
    if (price === null || price === undefined) {
        return trans('Not available');
    }
    return Number(price).toFixed(2);
}

// The searched ticket types, so the card price reflects the pax actually being booked
// instead of always falling back to the first (Adult) pricing entry.
const searchedTypeNames = computed(() => {
    const names = PAX_TYPES.filter((paxType) => (props[paxType.prop] ?? 0) > 0).map((paxType) => paxType.name);
    return names.length ? names : ['Adult'];
});

const tripPrices = (trip) => {
    const wanted = searchedTypeNames.value.map((name) => name.toLowerCase());
    return (trip.pricings ?? [])
        .filter((type) => wanted.includes(String(type.name).toLowerCase()) && type.price !== null && type.price !== undefined)
        .map((type) => Number(type.price));
}

// Mixed pax have several different prices, so the card shows the lowest as a "from" price.
const tripPriceLabel = (trip) => {
    const prices = tripPrices(trip);
    if (!prices.length) {
        return trans('Not available');
    }
    return Math.min(...prices).toFixed(2);
}

const tripPriceIsFrom = (trip) => {
    const prices = tripPrices(trip);
    return prices.length > 1 && Math.min(...prices) !== Math.max(...prices);
}

const totalPrice = computed(() => {
    if (discount.value.wheel_winner_id) {
        return selectedTrip.value.total_price - discount.value?.amount;
    }
    return selectedTrip.value.total_price - bookingCode.value?.amount;
})

const ticketTypes = computed(() => {
    let total = [];
    PAX_TYPES.forEach((paxType) => {
        const id = ticketTypeId(paxType.name);
        for (let i = 0; i < (props[paxType.prop] ?? 0); i++) {
            total.push({'ticket_type_id': id, 'name': trans(paxType.name)});
        }
    });
    return total;
});

// A ticket type the current database does not expose resolves to a null id, which
// the booking endpoint cannot accept. Block checkout instead of submitting it.
const unresolvedTypes = computed(() => {
    if (!selectedTrip.value?.pricings) {
        return [];
    }
    return PAX_TYPES
        .filter((paxType) => (props[paxType.prop] ?? 0) > 0 && ticketTypeId(paxType.name) === null)
        .map((paxType) => trans(paxType.name));
});

const seatInputs = computed(() => {
    let seats = [];
    for (let i = 0; i < props.total; i++) {
        if (i == 0 && props.user) {
            seats.push({'name': props.user.name});
        } else {
            seats.push({'name': ''});
        }
    }
    return seats;
});

const filter = () => {
    tripsArray.options = [];
    props.trips.forEach((trip) => {
        if (selectedCompanies.options.includes(trip.company_name)) {
            tripsArray.options.push(trip);
        }
    });
}

const searchSeats = (trip) => {
    if (trip.loading) {
        return;
    }
    tripsArray.options.forEach((trip) => {
        trip.show_seats = 0;
    });
    takenSeats.value = [];
    trip.loading = 1;
    trip.show_seats = 0;
    axios.get('/trips/' + trip.id  + '?adult=' + props.adult + '&child=' + props.child + '&senior=' + props.senior + '&staff=' + props.staff + '&origin=' + props.origin).then((response) => {
        // querySeats() returns null when the operator lookup fails, so default to an
        // empty list instead of letting the seat-map loop below throw.
        trip.seatings = response.data.response.seatings ?? [];
        trip.loading = 0;
        trip.show_seats = 1;
        if (!response.data.response.seatings) {
            Swal.fire({
                icon: "error",
                title: trans("Error") + '!',
                text: trans('Seats are temporarily unavailable for this trip. Please try again.'),
            })
        }
        // Null total means a selected ticket type has no price; keep it null rather than
        // coercing to 0, which would read as a free booking.
        trip.total_price = response.data.response.total_price;
        trip.pricings = response.data.response.pricings;
        trip.unavailable_ticket_types = response.data.response.unavailable_ticket_types ?? [];
        if (trip.unavailable_ticket_types.length) {
            Swal.fire({
                icon: "error",
                title: trans("Error") + '!',
                text: trans('Not available') + ': ' + trip.unavailable_ticket_types.join(', '),
            })
        }
        if (trip.available_seats < props.total) {
            Swal.fire({
                icon: "error",
                title: trans("Error") + '!',
                text: trans('There are not enough seats for this trip.'),
            })
        }
        let maxLength = 0;
        let maxHeight = 0;
        let twoSpaceGap = 1;
        let hasCol1 = false;
        let hasCol2 = false;
        let seatMap = new Map();
        let hasUpperDeck = false;
        let upperMaxLength = 0;
        let upperMaxHeight = 0;
        trip.seatings.forEach((seat) => {
            if (seat.is_upper_deck) {
                hasUpperDeck = true;
                if (seat.row > upperMaxLength) {
                    upperMaxLength = seat.row;
                }
                if (seat.column > upperMaxHeight) {
                    upperMaxHeight = seat.column;
                }
            } else {
                if (seat.row > maxLength) {
                    maxLength = seat.row;
                }
                if (seat.column > maxHeight) {
                    maxHeight = seat.column;
                }
            }

            if (seat.column == 1) {
                twoSpaceGap = 0;
                hasCol1 = true;
            } else if (seat.column == 2) {
                hasCol2 = true;
            }
            seatMap.set(seat.row + '-' + seat.column + '-' + (seat.is_upper_deck ? '1' : '0'), seat);

        });
        if (hasCol1 && hasCol2) {
            trip.no_gap = true;
        }
        trip.max_length = maxLength + 1;
        trip.max_height = maxHeight + 1;
        trip.upper_max_height = upperMaxHeight + 1;
        trip.upper_max_length = upperMaxLength + 1;
        trip.two_space_gap = twoSpaceGap;
        trip.map = seatMap;
        trip.has_upper_deck = hasUpperDeck;
    }).catch(function (error) {
        // Clear the spinner, but leave show_seats alone so a failed lookup does not
        // collapse the panel the user just opened.
        trip.loading = 0;
        if (error.response) {
            Swal.fire({
                icon: "error",
                title: trans("Error") + '!',
                text: trans(error.response.data?.meta?.message ?? 'Something went wrong.'),
            })
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
    trip.show_seats = 1;
};

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

async function applyBookingCode() {
    if (!bookingCodeInput.value) {
        return;
    }

    isApplyingBookingCode.value = true;

    axios.get('/bookings/discount-code', {
        params: {
            code: bookingCodeInput.value,
            total_price: selectedTrip.value.total_price,
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
    if (!reward?.id || !selectedTrip.value) {
        return;
    }

    axios.get('/bookings/discount', {
        params: {
            prize_id: reward.prize_id,
            wheel_winner_id: reward.id,
            trip_id: selectedTrip.value.id,
            total_price: selectedTrip.value.total_price,
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

const createBooking = (usePoints) => {
    if (loading.value) {
        return;
    }
    if (unresolvedTypes.value.length) {
        Swal.fire({
            icon: "error",
            title: trans("Error") + '!',
            text: trans('Not available') + ': ' + unresolvedTypes.value.join(', '),
        })
        return;
    }
    if (!$("#submit-form")[0].checkValidity()) {
        $("#submit-form")[0].reportValidity();
        return;
    }
    loading.value = true;

    let formData = new FormData($('#submit-form')[0]);
    formData.append('use_points', usePoints ? 1 : 0);
    axios.post('/bookings', formData).then((response) => {
        let booking = response.data.response;
        if (usePoints) {
            window.location.href= '/bookings/' + booking.code;
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

            if (error.response.data.meta.message == 'Seat has already been taken.') {
                step.value = 0;
                searchSeats(selectedTrip.value);
            }
        } else if (error.request) {
            console.log(error.request);
        } else {
            console.log('Error', error.message);
        }
        console.log(error.config);
    });
};

const toggleSeat = (seat) => {
    const index = takenSeats.value.indexOf(seat);
    if (index >= 0) {
        takenSeats.value.splice(index, 1);
    } else {
        if (takenSeats.value.length < props.total) {
            takenSeats.value.push(seat);
        } else {
            Swal.fire({
                icon: "error",
                title: trans("Error") + '!',
                text: trans('You have already selected enough seats.'),
            })
        }
    }
}

const selectTrip = (trip) => {
    selectedTrip.value = trip;
    step.value = 1;
    resetDiscount();
}

</script>

<style scoped>
/* Hero band */
.tr-hero {
    padding: var(--space-6) 0;
    color: rgba(255,255,255,.78);
    background:
        radial-gradient(120% 140% at 100% 0%, rgba(217,0,4,.45) 0%, rgba(217,0,4,0) 55%),
        var(--ink);
}
.tr-hero__inner { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--space-4); }
.tr-hero__route { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin: 0 0 var(--space-1); color: #FF8A8C; font-size: var(--fs-14); font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.tr-hero__route small { font-weight: 500; opacity: .8; text-transform: none; letter-spacing: 0; }
.tr-hero__title { margin: 0 0 var(--space-3); color: #fff; font-size: var(--fs-28); line-height: 1.15; }
.tr-hero__meta { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-5); margin: 0; padding: 0; list-style: none; }
.tr-hero__meta li { display: inline-flex; align-items: center; gap: var(--space-2); color: #fff; font-size: var(--fs-14); font-weight: 500; }
.tr-hero__meta .svg-icon { color: #FF8A8C; }
.tr-hero__change { display: inline-flex; align-items: center; gap: var(--space-2); min-height: 44px; padding: 0 var(--space-5); border: 1px solid rgba(255,255,255,.35); border-radius: 999px; color: #fff; font-size: var(--fs-14); font-weight: 500; text-decoration: none; transition: background .15s, border-color .15s; }
.tr-hero__change:hover { color: #fff; background: rgba(255,255,255,.12); border-color: #fff; }
@media (min-width: 992px) {
    .tr-hero { padding: var(--space-8) 0; }
    .tr-hero__title { font-size: var(--fs-36); }
}

.tr-page { padding-top: var(--space-6); }

/* Layout: filters + results */
.tr-layout { display: grid; gap: var(--space-5); align-items: start; }
@media (min-width: 992px) {
    .tr-layout { grid-template-columns: 260px minmax(0, 1fr); gap: var(--space-8); }
    .tr-filters { position: sticky; top: calc(var(--header-h) + var(--space-4)); }
}

.tr-filters { padding: var(--space-5); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-card); }
.tr-filters__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-4); }
.tr-filters__head h2 { margin: 0; font-size: var(--fs-18); }
.tr-filters__head .text-link { font-size: var(--fs-14); }
.tr-filters__label { margin: 0 0 var(--space-2); color: var(--ink-3); font-size: var(--fs-12); font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.tr-filters__list { display: grid; gap: var(--space-1); }
.tr-filter { display: flex; align-items: center; gap: var(--space-3); min-height: 40px; margin: 0 calc(var(--space-2) * -1); padding: 0 var(--space-2); border-radius: var(--radius-input); cursor: pointer; transition: background .15s; }
.tr-filter:hover { background: var(--surface-2); }
.tr-filter .form-check-input { flex-shrink: 0; width: 20px; height: 20px; margin: 0; border-color: #D1D5DB; border-radius: 6px; }
.tr-filter .form-check-input:checked { background-color: var(--brand-600); border-color: var(--brand-600); }
.tr-filter__name { flex: 1; min-width: 0; color: var(--ink); font-size: var(--fs-14); font-weight: 500; }
.tr-filter__count { color: var(--ink-3); font-size: var(--fs-12); }
@media (max-width: 991.98px) {
    .tr-filters__list { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .tr-filter { margin: 0; padding: 0 var(--space-3); border: 1px solid var(--line); border-radius: 999px; min-height: 36px; }
    .tr-filter:has(.form-check-input:checked) { border-color: var(--ink); background: var(--ink); }
    .tr-filter:has(.form-check-input:checked) .tr-filter__name,
    .tr-filter:has(.form-check-input:checked) .tr-filter__count { color: #fff; }
    .tr-filter .form-check-input { display: none; }
}

.tr-results__bar { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--space-2); margin-bottom: var(--space-4); }
.tr-results__bar h2 { margin: 0; font-size: var(--fs-18); }
.tr-results__bar span { color: var(--ink-3); font-size: var(--fs-14); }

/* Trip rows */
.tr-trip { margin-bottom: var(--space-3); background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-card); transition: border-color .15s, box-shadow .2s; }
.tr-trip:hover { border-color: #D1D5DB; box-shadow: var(--shadow-1); }
.tr-trip.is-open { border-color: var(--brand-600); box-shadow: 0 0 0 3px var(--brand-50); }
.tr-trip__row { display: grid; grid-template-columns: 1fr auto; grid-template-areas: "operator price" "route route" "cta cta"; align-items: center; gap: var(--space-3) var(--space-4); padding: var(--space-4); }
.tr-trip__operator { grid-area: operator; display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
.tr-trip__operator img { width: 120px; height: 36px; object-fit: contain; object-position: left; }
.tr-trip__operator-name { color: var(--ink-3); font-size: var(--fs-12); font-weight: 500; }
.tr-trip__route { grid-area: route; display: flex; align-items: center; gap: var(--space-3); }
.tr-trip__time { color: var(--ink); font-size: var(--fs-22); font-weight: 700; letter-spacing: -0.01em; }
.tr-trip__line { position: relative; flex: 1; max-width: 140px; height: 2px; background: repeating-linear-gradient(90deg, #D1D5DB 0 4px, transparent 4px 8px); }
.tr-trip__line .svg-icon { position: absolute; left: 50%; top: 50%; padding: 0 4px; background: var(--surface); color: var(--ink-3); transform: translate(-50%, -50%); }
.tr-trip__dest { color: var(--ink); font-size: var(--fs-16); font-weight: 700; }
.tr-trip__price { grid-area: price; display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2; }
.tr-trip__price small { color: var(--ink-3); font-size: var(--fs-12); }
.tr-trip__price strong { color: var(--brand-700); font-size: var(--fs-18); font-weight: 700; }
.tr-trip__cta { grid-area: cta; min-width: 140px; }
@media (min-width: 768px) {
    .tr-trip__row { grid-template-columns: 180px minmax(0, 1fr) auto auto; grid-template-areas: "operator route price cta"; gap: var(--space-5); padding: var(--space-4) var(--space-5); }
    .tr-trip__route { justify-content: center; }
}

/* Seat map: fixed 32px cells, one flex row per bus row, never wrapping */
.tr-seat-deck { display: flex; flex-direction: column; justify-content: center; height: 100%; }
.tr-seat-deck--sideways { align-items: flex-start; }
.tr-seat-deck--upright { align-items: center; }
.tr-seat-row { display: flex; flex-wrap: nowrap; gap: 16px; }
.tr-seat-row + .tr-seat-row { margin-top: 8px; }
.tr-seat { position: relative; flex: 0 0 32px; width: 32px; height: 32px; }
.tr-seat img { display: block; width: 32px; height: 32px; }
.tr-seat-aisle { height: 20px; }
/* Top-down decks turn the seat graphic to face the front, at every width. */
.tr-seat-deck--upright .rotate-seat { transform: rotate(90deg); }
.tr-seat__no { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: .85rem; font-weight: 500; line-height: 1; color: var(--ink); pointer-events: none; }
/* Nudge the number onto the cushion: the backrest sits at the bottom when the seat is rotated upright, and on the right when it is drawn sideways. */
.tr-seat-deck--upright .tr-seat__no { padding-top: 3px; }
.tr-seat-deck--sideways .tr-seat__no { padding-right: 2px; }

.tr-seats { padding: var(--space-5); border-top: 1px solid var(--line); }
.tr-seats__legend { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-4); margin-bottom: var(--space-3); color: var(--ink-3); font-size: var(--fs-12); }
.tr-seats__legend span { display: inline-flex; align-items: center; gap: var(--space-1); }
.tr-seats__legend img { width: 18px; height: 18px; }
.tr-seats__deck { margin: 0 0 var(--space-2); color: var(--ink); font-size: var(--fs-14); font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.tr-seats__foot { display: grid; gap: var(--space-4); margin-top: var(--space-5); padding: var(--space-4); background: var(--surface-2); border-radius: var(--radius-card); }
.tr-seats__stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-3); margin: 0; }
.tr-seats__stats dt { color: var(--ink-3); font-size: var(--fs-12); font-weight: 500; }
.tr-seats__stats dd { margin: 0; color: var(--ink); font-size: var(--fs-18); font-weight: 700; overflow-wrap: anywhere; }
.tr-seats__stats dd.is-good { color: #047857; }
.tr-seats__stats dd.is-price { color: var(--brand-700); }
.tr-seats__next { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); }
@media (min-width: 768px) {
    .tr-seats__foot { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
}

/* Checkout */
.tr-checkout { display: grid; gap: var(--space-5); align-items: start; }
@media (min-width: 992px) {
    .tr-checkout { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: var(--space-8); }
    .tr-checkout__aside { position: sticky; top: calc(var(--header-h) + var(--space-4)); }
}
.tr-checkout .back-link { background: none; border: 0; padding: 0; }
.tr-checkout .panel + .panel { margin-top: var(--space-4); }
.tr-count { color: var(--ink-3); font-size: var(--fs-14); }
.tr-passenger { padding: var(--space-4); border: 1px solid var(--line); border-radius: var(--radius-card); }
.tr-passenger + .tr-passenger { margin-top: var(--space-3); }
.tr-passenger__head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); margin-bottom: var(--space-3); }
.tr-passenger__head strong { color: var(--ink); font-size: var(--fs-16); }
.tr-passenger__seat { display: inline-flex; align-items: center; gap: var(--space-1); padding: 4px 10px; border-radius: 999px; background: var(--brand-50); color: var(--brand-700); font-size: var(--fs-12); font-weight: 700; }
.tr-passenger__type { color: var(--ink-3); font-size: var(--fs-14); }

.tr-summary__trip { padding: var(--space-4); margin-bottom: var(--space-4); background: var(--surface-2); border-radius: var(--radius-card); }
.tr-summary__route { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin: 0 0 var(--space-3); color: var(--ink); font-size: var(--fs-16); font-weight: 700; }
.tr-summary__route .svg-icon { color: var(--brand-600); }
.tr-summary__meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); margin: 0 0 var(--space-3); }
.tr-summary__meta dt { color: var(--ink-3); font-size: var(--fs-12); font-weight: 500; }
.tr-summary__meta dd { margin: 0; color: var(--ink); font-size: var(--fs-14); font-weight: 700; overflow-wrap: anywhere; }
.tr-summary__trip .text-link { background: none; border: 0; padding: 0; font-size: var(--fs-14); }
.tr-summary__discount { margin-top: var(--space-4); display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); }
.tr-summary__actions { display: grid; gap: var(--space-3); margin-top: var(--space-5); }
.tr-summary__actions .btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); }
.tr-summary__actions small { color: var(--ink-3); font-weight: 400; }
.tr-summary__secure { display: flex; align-items: center; justify-content: center; gap: var(--space-2); margin: var(--space-4) 0 0; color: var(--ink-3); font-size: var(--fs-12); text-align: center; }
</style>
