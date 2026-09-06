/* ==================================================
   T.T.KALAA — API CLIENT
   Frontend-safe API communication layer
================================================== */

(function () {
    "use strict";

    /* ==================================================
       CONFIGURATION
    ================================================== */

    const CONFIG = {
        baseURL: "https://api.ttkalaa.ir/api",
        timeout: 15000,
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    };


    /* ==================================================
       API ERROR
    ================================================== */

    class TTKALAAApiError extends Error {
        constructor(message, status = 0, code = "UNKNOWN_ERROR", data = null) {
            super(message);
            this.name = "TTKALAAApiError";
            this.status = status;
            this.code = code;
            this.data = data;
        }
    }


    /* ==================================================
       REQUEST HELPER
    ================================================== */

    async function request(endpoint, options = {}) {

        const controller = new AbortController();

        const timeoutId = setTimeout(function () {
            controller.abort();
        }, CONFIG.timeout);

        const method = options.method || "GET";

        const fetchOptions = {
            method,
            headers: {
                ...CONFIG.headers,
                ...(options.headers || {})
            },
            signal: controller.signal,
            credentials: "omit",
            cache: "no-store"
        };

        if (
            options.body !== undefined &&
            method !== "GET" &&
            method !== "HEAD"
        ) {
            fetchOptions.body = JSON.stringify(options.body);
        }

        let response;

        try {

            response = await fetch(
                CONFIG.baseURL + endpoint,
                fetchOptions
            );

        } catch (error) {

            clearTimeout(timeoutId);

            if (error.name === "AbortError") {
                throw new TTKALAAApiError(
                    "زمان پاسخ‌گویی سرور به پایان رسید.",
                    408,
                    "TIMEOUT"
                );
            }

            throw new TTKALAAApiError(
                "ارتباط با سرور برقرار نشد.",
                0,
                "NETWORK_ERROR"
            );

        } finally {

            clearTimeout(timeoutId);

        }


        let data = null;

        try {
            data = await response.json();
        } catch (_) {
            data = null;
        }


        if (!response.ok) {

            const serverMessage =
                data &&
                typeof data.message === "string"
                    ? data.message
                    : null;

            throw new TTKALAAApiError(
                serverMessage || getSafeHttpMessage(response.status),
                response.status,
                data && data.code ? data.code : "HTTP_ERROR",
                data
            );
        }


        if (
            data &&
            data.success === false
        ) {
            throw new TTKALAAApiError(
                typeof data.message === "string"
                    ? data.message
                    : "درخواست با موفقیت انجام نشد.",
                response.status,
                data.code || "API_ERROR",
                data
            );
        }


        return data;
    }


    /* ==================================================
       SAFE HTTP MESSAGES
    ================================================== */

    function getSafeHttpMessage(status) {

        switch (status) {

            case 400:
                return "اطلاعات ارسال‌شده صحیح نیست.";

            case 401:
                return "نیاز به احراز هویت وجود دارد.";

            case 403:
                return "دسترسی به این بخش مجاز نیست.";

            case 404:
                return "اطلاعات موردنظر پیدا نشد.";

            case 409:
                return "این درخواست با وضعیت فعلی قابل انجام نیست.";

            case 429:
                return "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.";

            case 500:
            case 502:
            case 503:
            case 504:
                return "سرور موقتاً در دسترس نیست.";

            default:
                return "خطایی در ارتباط با سرویس رخ داد.";
        }
    }


    /* ==================================================
       GET
    ================================================== */

    async function get(endpoint, query = {}) {

        const params = new URLSearchParams();

        Object.keys(query).forEach(function (key) {

            const value = query[key];

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                params.append(key, String(value));
            }

        });

        const queryString = params.toString();

        const finalEndpoint =
            queryString
                ? endpoint + "?" + queryString
                : endpoint;

        return request(finalEndpoint, {
            method: "GET"
        });
    }


    /* ==================================================
       POST
    ================================================== */

    async function post(endpoint, body = {}) {

        return request(endpoint, {
            method: "POST",
            body
        });
    }


    /* ==================================================
       MOBILE NORMALIZATION
    ================================================== */

    function normalizeMobile(value) {

        if (value === undefined || value === null) {
            return "";
        }

        let mobile = String(value).trim();

        const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
        const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

        mobile = mobile.replace(/[۰-۹]/g, function (digit) {
            return String(
                persianDigits.indexOf(digit)
            );
        });

        mobile = mobile.replace(/[٠-٩]/g, function (digit) {
            return String(
                arabicDigits.indexOf(digit)
            );
        });

        mobile = mobile.replace(/[\s\-().]/g, "");

        if (mobile.startsWith("+98")) {
            mobile = "0" + mobile.slice(3);
        }

        if (mobile.startsWith("0098")) {
            mobile = "0" + mobile.slice(4);
        }

        return mobile;
    }


    /* ==================================================
       MOBILE VALIDATION
    ================================================== */

    function isValidMobile(value) {

        const mobile = normalizeMobile(value);

        return /^09\d{9}$/.test(mobile);
    }


    /* ==================================================
       CURRENT CAMPAIGN
    ================================================== */

    async function getCurrentCampaign() {

        return get("/campaign/current");
    }


    /* ==================================================
       CAMPAIGN BY ID
    ================================================== */

    async function getCampaign(campaignId) {

        if (!campaignId) {
            throw new TTKALAAApiError(
                "شناسه کمپین مشخص نیست.",
                400,
                "INVALID_CAMPAIGN_ID"
            );
        }

        return get(
            "/campaign/" +
            encodeURIComponent(campaignId)
        );
    }


    /* ==================================================
       PRODUCTS
    ================================================== */

    async function getProducts() {

        return get("/products");
    }


    /* ==================================================
       SINGLE PRODUCT
    ================================================== */

    async function getProduct(productId) {

        if (!productId) {
            throw new TTKALAAApiError(
                "شناسه محصول مشخص نیست.",
                400,
                "INVALID_PRODUCT_ID"
            );
        }

        return get(
            "/products/" +
            encodeURIComponent(productId)
        );
    }


    /* ==================================================
       LIVE STATS
       Only real backend data
    ================================================== */

    async function getLiveStats(campaignId) {

        if (!campaignId) {
            throw new TTKALAAApiError(
                "شناسه کمپین مشخص نیست.",
                400,
                "INVALID_CAMPAIGN_ID"
            );
        }

        return get("/campaign/" +
            encodeURIComponent(campaignId) +
            "/stats"
        );
    }


    /* ==================================================
       CHANCE LOOKUP
    ================================================== */

    async function lookupChance(mobile, campaignId) {

        const normalizedMobile = normalizeMobile(mobile);

        if (!isValidMobile(normalizedMobile)) {
            throw new TTKALAAApiError(
                "لطفاً یک شماره موبایل معتبر وارد کنید.",
                400,
                "INVALID_MOBILE"
            );
        }

        if (!campaignId) {
            throw new TTKALAAApiError(
                "دوره قرعه‌کشی مشخص نیست.",
                400,
                "INVALID_CAMPAIGN_ID"
            );
        }

        return post("/chance/lookup", {
            mobile: normalizedMobile,
            campaignId
        });
    }


    /* ==================================================
       CREATE ORDER
       Never creates a chance
    ================================================== */

    async function createOrder(payload) {

        if (!payload || typeof payload !== "object") {
            throw new TTKALAAApiError(
                "اطلاعات سفارش ناقص است.",
                400,
                "INVALID_ORDER_PAYLOAD"
            );
        }

        const mobile = normalizeMobile(payload.mobile);

        if (!isValidMobile(mobile)) {
            throw new TTKALAAApiError(
                "لطفاً یک شماره موبایل معتبر وارد کنید.",
                400,
                "INVALID_MOBILE"
            );
        }

        if (!payload.productId) {
            throw new TTKALAAApiError(
                "محصول انتخاب نشده است.",
                400,
                "INVALID_PRODUCT_ID"
            );
        }

        if (!payload.campaignId) {
            throw new TTKALAAApiError(
                "دوره قرعه‌کشی مشخص نیست.",
                400,
                "INVALID_CAMPAIGN_ID"
            );
        }

        return post("/orders", {
            productId: payload.productId,
            campaignId: payload.campaignId,
            mobile
        });
    }


    /* ==================================================
       START PAYMENT
    ================================================== */

    async function startPayment(orderId) {

        if (!orderId) {
            throw new TTKALAAApiError(
                "شناسه سفارش مشخص نیست.",
                400,
                "INVALID_ORDER_ID"
            );
        }

        return post("/payments/start", {
            orderId
        });
    }


    /* ==================================================
       VERIFY / PAYMENT RESULT
       Frontend does NOT decide success
    ================================================== */

    async function getPaymentResult(orderId) {

        if (!orderId) {
            throw new TTKALAAApiError(
                "شناسه سفارش مشخص نیست.",
                400,
                "INVALID_ORDER_ID"
            );
        }

        return get("/payments/result", {
            orderId
        });
    }


    /* ==================================================
       ORDER STATUS
    ================================================== */

    async function getOrder(orderId) {

        if (!orderId) {
            throw new TTKALAAApiError(
                "شناسه سفارش مشخص نیست.",
                400,
                "INVALID_ORDER_ID"
            );
        }

        return get(
            "/orders/" +
            encodeURIComponent(orderId)
        );
    }


    /* ==================================================
       HEALTH CHECK
    ================================================== */

    async function healthCheck() {

        return get("/health");
    }


    /* ==================================================
       SAFE ERROR MESSAGE
    ================================================== */

    function getSafeErrorMessage(error) {

        if (!error) {
            return "خطای نامشخصی رخ داده است.";
        }

        if (
            error instanceof TTKALAAApiError &&
            error.message
        ) {
            return error.message;
        }

        if (
            typeof error.message === "string" &&
            error.message.length > 0
        ) {
            return error.message;
        }

        return "در ارتباط با سرویس مشکلی پیش آمد.";
    }


    /* ==================================================
       PUBLIC API
    ================================================== */

    window.TTKALAA_API = {

        config: Object.freeze({
            baseURL: CONFIG.baseURL,
            timeout: CONFIG.timeout
        }),

        request,
        get,
        post,

        getCurrentCampaign,
        getCampaign,

        getProducts,
        getProduct,

        getLiveStats,

        lookupChance,

        createOrder,
        startPayment,
        getPaymentResult,
        getOrder,

        healthCheck,

        normalizeMobile,
        isValidMobile,

        getSafeErrorMessage,

        ApiError: TTKALAAApiError
    };


    /* ==================================================
       DEVELOPMENT WARNING
    ================================================== */

    if (window.location.protocol === "file:") {

        console.warn(
            "T.T.KALAA: سایت را از طریق GitHub Pages یا یک وب‌سرور اجرا کنید."
        );

    }

})();
