// Loads the Google Maps JavaScript API (places + marker) once per page.
let pending = null;

export const loadGoogleMapsApi = () => {
    if (window.google?.maps?.places) {
        return Promise.resolve(window.google);
    }
    if (pending) {
        return pending;
    }

    pending = new Promise((resolve, reject) => {
        // The key is read from the page first so the server's configured key
        // wins over whatever (if anything) was baked in at build time.
        const key = document.querySelector('meta[name="google-maps-key"]')?.content
            || import.meta.env?.VITE_GOOGLE_API_KEY;
        if (!key) {
            reject(new Error('API Key is missing'));
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,marker`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = () => reject(new Error('Google Maps API failed to load.'));
        document.head.appendChild(script);
    });

    pending.catch(() => { pending = null; });

    return pending;
};

// Creates a Places Autocomplete and tags its dropdown (.pac-container, which
// Google appends to <body>) with a class so it can be styled per context.
export const createAutocomplete = (google, input, options, className = 'pac-container--seg') => {
    const existing = new Set(document.querySelectorAll('.pac-container'));
    const autocomplete = new google.maps.places.Autocomplete(input, options);

    const tag = () => {
        const container = [...document.querySelectorAll('.pac-container')].find(el => !existing.has(el));
        container?.classList.add(className);
        return !!container;
    };
    // The container is usually created right away, but not always.
    if (!tag()) {
        const observer = new MutationObserver(() => tag() && observer.disconnect());
        observer.observe(document.body, { childList: true });
    }

    return autocomplete;
};
