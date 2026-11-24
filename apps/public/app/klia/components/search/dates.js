const pad = (n) => n.toString().padStart(2, '0');

export const toYmd = (date) => date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());

export const toHm = (date) => pad(date.getHours()) + ':' + pad(date.getMinutes());

export const localToday = () => new Date();

export const fromYmd = (value) => {
    const [y, m, d] = String(value).split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d) : null;
};

// Bookings open two months ahead.
export const maxBookingDate = () => {
    const max = new Date();
    max.setMonth(max.getMonth() + 2);
    return max;
};
