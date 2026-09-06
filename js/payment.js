/* ==================================================
   T.T.KALAA — PAYMENT & ORDER FLOW
   Secure ZarinPal Integration
   ================================================== */

(function () {
    "use strict";

    /* ==================================================
       CONFIGURATION
       ================================================== */

    const CONFIG = {
        PURCHASE_MODAL: "#purchaseModal",
        RESULT_MODAL: "#paymentResultModal",

        MOBILE_INPUT: "#purchaseMobile",
        PRODUCT_ID_INPUT: "#purchaseProductId",

        SUBMIT_BUTTON: "#purchaseSubmit",

        RESULT_TITLE: "#paymentResultTitle",
        RESULT_MESSAGE: "#paymentResultMessage",
        RESULT_REFERENCE: "#paymentReference",

        SUCCESS_CLASS: "is-success",
        ERROR_CLASS: "is-error",
        LOADING_CLASS: "is-loading",

        PAYMENT_WINDOW_TARGET: "_self"
    };

    let selectedProduct = null;
    let paymentInProgress = false;

    /* ==================================================
       DOM HELPERS
       ================================================== */

    function getElement(selector) {
        return document.querySelector(selector);
    }

    function setText(selector, value) {
        const element = getElement(selector);

        if (element) {
            element.textContent = value;
        }
    }

    function show(element) {
        if (!element) return;

        element.hidden = false;
        element.removeAttribute("hidden");
    }

    function hide(element) {
        if (!element) return;

        element.hidden = true;
        element.setAttribute("hidden", "");
    }

    /* ==================================================
       DIGIT / MOBILE UTILITIES
       ================================================== */

    function normalizeMobile(value) {
        if (
            window.TTKALAA_CHANCE &&
            typeof window.TTKALAA_CHANCE.normalizeMobile ===
                "function"
        ) {
            return window.TTKALAA_CHANCE.normalizeMobile(
                value
            );
        }

        return String(value || "")
            .replace(/[۰-۹]/g, function (digit) {
                return String(
                    "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
                );
            })
            .replace(/[٠-٩]/g, function (digit) {
                return String(
                    "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
                );
            })
            .replace(/\D/g, "")
            .replace(/^98/, "0")
            .replace(/^0098/, "0");
    }

    function isValidMobile(value) {
        return /^09\d{9}$/.test(
            normalizeMobile(value)
        );
    }

    function formatPrice(value) {
        if (
            window.TTKALAA_PRODUCT_CLIENT &&
            typeof window.TTKALAA_PRODUCT_CLIENT.formatPrice ===
                "function"
        ) {
            return window.TTKALAA_PRODUCT_CLIENT.formatPrice(
                value
            );
        }

        return Number(value || 0).toLocaleString(
            "fa-IR"
        );
    }

    /* ==================================================
       SECURITY HELPERS
       ================================================== */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getCampaignId() {
        if (
            window.TTKALAA_COUNTDOWN &&
            typeof window.TTKALAA_COUNTDOWN.getCampaignId ===
                "function"
        ) {
            return window.TTKALAA_COUNTDOWN.getCampaignId();
        }

        return null;
    }

    /* ==================================================
       PRODUCT RESOLUTION
       ================================================== */

    function getProductById(productId) {
        if (
            window.ttkalaaGetProductById &&
            typeof window.ttkalaaGetProductById ===
                "function"
        ) {
            return window.ttkalaaGetProductById(
                productId
            );
        }

        if (
            window.TTKALAA_PRODUCT_CLIENT &&
            typeof window.TTKALAA_PRODUCT_CLIENT.getProduct ===
                "function"
        ) {
            return window.TTKALAA_PRODUCT_CLIENT.getProduct(
                productId
            );
        }

        return null;
    }

    function setSelectedProduct(productId) {
        const product =
            getProductById(
                productId
            );

        if (!product) {
            selectedProduct = null;
            return null;
        }

        selectedProduct = product;

        const hiddenInput =
            getElement(
                CONFIG.PRODUCT_ID_INPUT
            );

        if (hiddenInput) {
            hiddenInput.value =
                product.id;
        }

        updatePurchaseModal(
            product
        );

        return product;
    }

    /* ==================================================
       PURCHASE MODAL UI
       ================================================== */

    function updatePurchaseModal(
        product
    ) {
        if (!product) return;

        const selectors = {
            name: [
                "#purchaseProductName",
                "[data-purchase-product-name]"
            ],
            price: [
                "#purchaseProductPrice",
                "[data-purchase-product-price]"
            ],
            chance: [
                "#purchaseProductChance",
                "[data-purchase-product-chance]"
            ]
        };

        selectors.name.forEach(
            function (selector) {
                setText(
                    selector,
                    product.name || ""
                );
            }
        );

        selectors.price.forEach(
            function (selector) {
                setText(
                    selector,
                    formatPrice(
                        product.price
                    ) + " تومان"
                );
            }
        );

        selectors.chance.forEach(
            function (selector) {
                setText(
                    selector,
                    "۱ شانس"
                );
            }
        );

        document
            .querySelectorAll(
                "[data-selected-product]"
            )
            .forEach(
                function (element) {
                    element.textContent =
                        product.name || "";
                }
            );
    }

    /* ==================================================
       MODAL CONTROL
       ================================================== */

    function openPurchaseModal(
        productId
    ) {
        const product =
            setSelectedProduct(
                productId
            );

        if (!product) {
            showPaymentError(
                "محصول موردنظر پیدا نشد."
            );

            return;
        }

        const modal =
            getElement(
                CONFIG.PURCHASE_MODAL
            );

        if (!modal) {
            return;
        }

        modal.classList.add(
            "is-open"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

        const input =
            getElement(
                CONFIG.MOBILE_INPUT
            );

        if (input) {
            setTimeout(
                function () {
                    input.focus();
                },
                100
            );
        }
    }

    function closePurchaseModal() {
        const modal =
            getElement(
                CONFIG.PURCHASE_MODAL
            );

        if (!modal) return;

        modal.classList.remove(
            "is-open"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );

        resetPurchaseState();
    }

    function resetPurchaseState() {
        paymentInProgress = false;

        const button =
            getElement(
                CONFIG.SUBMIT_BUTTON
            );

        if (button) {
            button.disabled = false;
            button.classList.remove(
                CONFIG.LOADING_CLASS
            );

            if (
                button.dataset.originalText
            ) {
                button.textContent =
                    button.dataset.originalText;
            }
        }
    }

    /* ==================================================
       ORDER CREATION
       ================================================== */

    async function createOrder() {
        if (
            !selectedProduct
        ) {
            throw new Error(
                "محصول انتخاب نشده است."
            );
        }

        if (
            !window.TTKALAA_API ||
            typeof window.TTKALAA_API.createOrder !==
                "function"
        ) {
            throw new Error(
                "سرویس سفارش در دسترس نیست."
            );
        }

        const mobileInput =
            getElement(
                CONFIG.MOBILE_INPUT
            );

        const mobile =
            normalizeMobile(
                mobileInput
                    ? mobileInput.value
                    : ""
            );

        if (!isValidMobile(mobile)) {
            throw new Error(
                "لطفاً شماره موبایل معتبر وارد کنید."
            );
        }

        const campaignId =
            getCampaignId();

        if (!campaignId) {
            throw new Error(
                "دوره قرعه‌کشی فعال شناسایی نشد."
            );
        }

        /*
         * IMPORTANT:
         * The backend MUST calculate and validate the
         * actual price and product information.
         *
         * Frontend values are only identifiers.
         */
        return window.TTKALAA_API.createOrder(
            {
                productId:
                    selectedProduct.id,

                mobile:
                    mobile,

                campaignId:
                    campaignId
            }
        );
    }

    /* ==================================================
       PAYMENT START
       ================================================== */

    async function startPayment(
        order
    ) {
        if (
            !order
        ) {
            throw new Error(
                "اطلاعات سفارش معتبر نیست."
            );
        }

        if (
            !window.TTKALAA_API ||
            typeof window.TTKALAA_API.startPayment !==
                "function"
        ) {
            throw new Error(
                "سرویس پرداخت در دسترس نیست."
            );
        }

        const orderId =
            order.orderId ||
            order.id;

        if (!orderId) {
            throw new Error(
                "شناسه سفارش دریافت نشد."
            );
        }

        return window.TTKALAA_API.startPayment(
            orderId
        );
    }

    /* ==================================================
       PAYMENT URL EXTRACTION
       ================================================== */

    function getPaymentURL(
        response
    ) {
        if (!response) {
            return null;
        }

        return (
            response.paymentUrl ||
            response.paymentURL ||
            response.url ||
            response.redirectUrl ||
            response.data?.paymentUrl ||
            response.data?.url ||
            null
        );
    }

    /* ==================================================
       PURCHASE SUBMISSION
       ================================================== */

    async function handlePurchaseSubmit(
        event
    ) {
        event.preventDefault();

        if (
            paymentInProgress
        ) {
            return;
        }

        paymentInProgress = true;

        setPaymentButtonLoading(
            true
        );

        try {
            const order =
                await createOrder();

            const payment =
                await startPayment(
                    order
                );

            const paymentURL =
                getPaymentURL(
                    payment
                );

            if (!paymentURL) {
                throw new Error(
                    "لینک پرداخت از سامانه دریافت نشد."
                );
            }

            /*
             * Never trust frontend payment success.
             *
             * ZarinPal callback must be verified by backend.
             * Only backend verification can create the chance.
             */
            window.location.assign(
                paymentURL
            );
        } catch (error) {
            console.error(
                "TTKALAA payment error:",
                error
            );

            paymentInProgress = false;

            setPaymentButtonLoading(
                false
            );

            showPaymentError(
                getSafeErrorMessage(
                    error
                )
            );
        }
    }

    /* ==================================================
       PAYMENT BUTTON
       ================================================== */

    function setPaymentButtonLoading(
        loading
    ) {
        const button =
            getElement(
                CONFIG.SUBMIT_BUTTON
            );

        if (!button) return;

        if (loading) {
            button.disabled = true;

            if (
                !button.dataset.originalText
            ) {
                button.dataset.originalText =
                    button.textContent;
            }

            button.classList.add(
                CONFIG.LOADING_CLASS
            );

            button.innerHTML = `
                <span
                    class="btn-spinner"
                    aria-hidden="true"
                ></span>
                انتقال به درگاه...
            `;
        } else {
            button.disabled = false;

            button.classList.remove(
                CONFIG.LOADING_CLASS
            );

            if (
                button.dataset.originalText
            ) {
                button.textContent =
                    button.dataset.originalText;
            }
        }
    }

    /* ==================================================
       PAYMENT RESULT
       ================================================== */

    function openResultModal(
        type,
        title,
        message,
        reference
    ) {
        const modal =
            getElement(
                CONFIG.RESULT_MODAL
            );

        if (!modal) {
            return;
        }

        modal.classList.remove(
            CONFIG.SUCCESS_CLASS,
            CONFIG.ERROR_CLASS
        );

        modal.classList.add(
            type === "success"
                ? CONFIG.SUCCESS_CLASS
                : CONFIG.ERROR_CLASS
        );

        setText(
            CONFIG.RESULT_TITLE,
            title
        );

        setText(
            CONFIG.RESULT_MESSAGE,
            message
        );

        const referenceElement =
            getElement(
                CONFIG.RESULT_REFERENCE
            );

        if (
            referenceElement
        ) {
            if (reference) {
                referenceElement.textContent =
                    "کد پیگیری: " +
                    reference;

                show(
                    referenceElement
                );
            } else {
                hide(
                    referenceElement
                );
            }
        }

        modal.classList.add(
            "is-open"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );
    }

    function closeResultModal() {
        const modal =
            getElement(
                CONFIG.RESULT_MODAL
            );

        if (!modal) return;

        modal.classList.remove(
            "is-open"
        );

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "modal-open"
        );
    }

    function showPaymentError(
        message
    ) {
        openResultModal(
            "error",
            "پرداخت انجام نشد",
            message,
            null
        );
    }

    function showPaymentSuccess(
        message,
        reference
    ) {
        openResultModal(
            "success",
            "پرداخت با موفقیت ثبت شد",
            message,
            reference
        );
    }

    /* ==================================================
       PAYMENT CALLBACK
       ================================================== */

    function getURLParams() {
        const params =
            new URLSearchParams(
                window.location.search
            );

        const result = {};

        params.forEach(
            function (
                value,
                key
            ) {
                result[key] =
                    value;
            }
        );

        return result;
    }

    function isPaymentCallback() {
        const params =
            getURLParams();

        return Boolean(
            params.order_id ||
            params.orderId ||
            params.authority ||
            params.Authority ||
            params.payment_status ||
            params.paymentStatus ||
            params.Status
        );
    }

    async function verifyPaymentResult() {
        if (
            !isPaymentCallback()
        ) {
            return;
        }

        const params =
            getURLParams();

        const orderId =
            params.order_id ||
            params.orderId ||
            params.order;

        if (!orderId) {
            showPaymentError(
                "شناسه سفارش برای بررسی پرداخت پیدا نشد."
            );

            return;
        }

        try {
            if (
                !window.TTKALAA_API ||
                typeof window.TTKALAA_API.getPaymentResult !==
                    "function"
            ) {
                throw new Error(
                    "سرویس بررسی پرداخت در دسترس نیست."
                );
            }

            const result =
                await window.TTKALAA_API.getPaymentResult(
                    orderId
                );

            const success =
                result?.success === true ||
                result?.paid === true ||
                result?.verified === true ||
                result?.status === "paid" ||
                result?.status === "success" ||
                result?.data?.success === true ||
                result?.data?.verified === true;

            const reference =
                result?.reference ||
                result?.refId ||
                result?.refID ||
                result?.data?.reference ||
                result?.data?.refId ||
                null;

            if (success) {
                /*
                 * Chance creation must happen server-side
                 * after verified payment.
                 */
                const chanceCount =
                    result?.chanceCount ??
                    result?.data?.chanceCount ??
                    1;

                showPaymentSuccess(
                    "سفارش شما ثبت شد و شانس شما برای دوره جاری ایجاد شده است.",
                    reference
                );

                updateChanceAfterPayment(
                    chanceCount
                );
            } else {
                showPaymentError(
                    getPaymentFailureMessage(
                        result
                    )
                );
            }
        } catch (error) {
            console.error(
                "TTKALAA payment verification error:",
                error
            );

            showPaymentError(
                getSafeErrorMessage(
                    error
                )
            );
        }
    }

    /* ==================================================
       PAYMENT FAILURE MESSAGE
       ================================================== */

    function getPaymentFailureMessage(
        result
    ) {
        const status =
            result?.status ||
            result?.data?.status ||
            "";

        if (
            status === "cancelled" ||
            status === "canceled"
        ) {
            return "پرداخت توسط شما لغو شد.";
        }

        if (
            status === "failed"
        ) {
            return "پرداخت با موفقیت تکمیل نشد.";
        }

        if (
            status === "pending"
        ) {
            return "وضعیت پرداخت هنوز نهایی نشده است. لطفاً کمی بعد دوباره بررسی کنید.";
        }

        return (
            result?.message ||
            result?.data?.message ||
            "پرداخت تأیید نشد."
        );
    }

    /* ==================================================
       CHANCE UPDATE
       ================================================== */

    function updateChanceAfterPayment(
        chanceCount
    ) {
        document
            .querySelectorAll(
                "[data-payment-chance]"
            )
            .forEach(
                function (element) {
                    element.textContent =
                        Number(
                            chanceCount
                        ).toLocaleString(
                            "fa-IR"
                        );
                }
            );

        window.dispatchEvent(
            new CustomEvent(
                "ttkalaa:payment-success",
                {
                    detail: {
                        chanceCount:
                            chanceCount
                    }
                }
            )
        );
    }

    /* ==================================================
       SAFE ERROR MESSAGE
       ================================================== */

    function getSafeErrorMessage(
        error
    ) {
        const message =
            error &&
            typeof error.message ===
                "string"
                ? error.message
                : "";

        if (
            message.includes(
                "timeout"
            ) ||
            message.includes(
                "Timeout"
            )
        ) {
            return "زمان پاسخ‌گویی سامانه به پایان رسید. لطفاً دوباره تلاش کنید.";
        }

        if (
            message.includes(
                "429"
            )
        ) {
            return "تعداد درخواست‌ها زیاد است. لطفاً چند لحظه بعد دوباره تلاش کنید.";
        }

        if (
            message.includes(
                "404"
            )
        ) {
            return "سفارش موردنظر پیدا نشد.";
        }

        if (
            message.includes(
                "409"
            )
        ) {
            return "این سفارش قبلاً پردازش شده است.";
        }

        if (
            message.includes(
                "500"
            )
        ) {
            return "سامانه موقتاً با مشکل مواجه شده است. لطفاً بعداً دوباره تلاش کنید.";
        }

        return (
            message ||
            "در فرایند پرداخت مشکلی ایجاد شد. لطفاً دوباره تلاش کنید."
        );
    }

    /* ==================================================
       EVENT DELEGATION
       ================================================== */

    function handleClick(
        event
    ) {
        const buyButton =
            event.target.closest(
                "[data-buy-product]"
            );

        if (buyButton) {
            const productId =
                buyButton.getAttribute(
                    "data-buy-product"
                );

            if (productId) {
                event.preventDefault();

                openPurchaseModal(
                    productId
                );
            }

            return;
        }

        const closePurchase =
            event.target.closest(
                "[data-close-purchase]"
            );

        if (closePurchase) {
            event.preventDefault();

            closePurchaseModal();

            return;
        }

        const closeResult =
            event.target.closest(
                "[data-close-payment-result]"
            );

        if (closeResult) {
            event.preventDefault();

            closeResultModal();

            return;
        }

        const purchaseModal =
            event.target.closest(
                CONFIG.PURCHASE_MODAL
            );

        if (
            purchaseModal &&
            event.target ===
                purchaseModal
        ) {
            closePurchaseModal();

            return;
        }

        const resultModal =
            event.target.closest(
                CONFIG.RESULT_MODAL
            );

        if (
            resultModal &&
            event.target ===
                resultModal
        ) {
            closeResultModal();
        }
    }

    function handleKeyDown(
        event
    ) {
        if (
            event.key !== "Escape"
        ) {
            return;
        }

        closePurchaseModal();
        closeResultModal();
    }

    /* ==================================================
       INPUT HANDLING
       ================================================== */

    function handleMobileInput(
        event
    ) {
        let value =
            normalizeMobile(
                event.target.value
            );

        value =
            value.slice(
                0,
                11
            );

        event.target.value =
            value;

        event.target.setCustomValidity("");
    }

    /* ==================================================
       PUBLIC PAYMENT CLIENT
       ================================================== */

    window.TTKALAA_PAYMENT = {
        openPurchase:
            openPurchaseModal,

        closePurchase:
            closePurchaseModal,

        closeResult:
            closeResultModal,

        getSelectedProduct:
            function () {
                return selectedProduct;
            },

        start:
            handlePurchaseSubmit,

        verify:
            verifyPaymentResult
    };

    /* ==================================================
       INITIALIZATION
       ================================================== */

    function initialize() {
        document.addEventListener(
            "click",
            handleClick
        );

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        const form =
            document.querySelector(
                "#purchaseForm"
            );

        if (form) {
            form.addEventListener(
                "submit",
                handlePurchaseSubmit
            );
        }

        const mobileInput =
            getElement(
                CONFIG.MOBILE_INPUT
            );

        if (mobileInput) {
            mobileInput.addEventListener(
                "input",
                handleMobileInput
            );
        }

        /*
         * If the backend redirects the user back
         * to this page after payment, verification
         * begins automatically.
         */
        if (
            isPaymentCallback()
        ) {
            verifyPaymentResult();
        }
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );
    } else {
        initialize();
    }

})();
