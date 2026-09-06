/* ==================================================
   T.T.KALAA — MY CHANCE / CHANCE LOOKUP
   Secure Frontend Integration
   ================================================== */

(function () {
    "use strict";

    /* ==================================================
       CONFIGURATION
       ================================================== */

    const CONFIG = {
        FORM_SELECTOR: "#chanceForm",
        MOBILE_SELECTOR: "#chanceMobile",
        RESULT_SELECTOR: "#chanceResult",
        SUBMIT_SELECTOR: "#chanceSubmit",
        MODAL_SELECTOR: "#chanceModal",

        MIN_LENGTH: 11,
        MAX_LENGTH: 11,

        REQUEST_TIMEOUT: 15000,

        RATE_LIMIT_MS: 3000
    };

    let lastRequestTime = 0;
    let isLoading = false;

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

    function showElement(element) {
        if (!element) return;

        element.hidden = false;
        element.removeAttribute("hidden");
    }

    function hideElement(element) {
        if (!element) return;

        element.hidden = true;
        element.setAttribute("hidden", "");
    }

    /* ==================================================
       MOBILE NUMBER NORMALIZATION
       ================================================== */

    function convertPersianDigits(value) {
        return String(value)
            .replace(/[۰-۹]/g, function (digit) {
                return String(
                    "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
                );
            })
            .replace(/[٠-٩]/g, function (digit) {
                return String(
                    "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
                );
            });
    }

    function normalizeMobile(value) {
        let mobile =
            convertPersianDigits(
                value || ""
            ).trim();

        mobile = mobile
            .replace(/[\s\-().]/g, "")
            .replace(/^tel:/i, "");

        if (mobile.indexOf("+98") === 0) {
            mobile =
                "0" +
                mobile.slice(3);
        }

        if (mobile.indexOf("0098") === 0) {
            mobile =
                "0" +
                mobile.slice(4);
        }

        if (
            mobile.indexOf("98") === 0 &&
            mobile.length === 12
        ) {
            mobile =
                "0" +
                mobile.slice(2);
        }

        return mobile;
    }

    function isValidMobile(value) {
        const mobile =
            normalizeMobile(value);

        return /^09\d{9}$/.test(
            mobile
        );
    }

    /* ==================================================
       FORMATTING
       ================================================== */

    function toPersianDigits(value) {
        return String(value)
            .replace(/\d/g, function (digit) {
                return "۰۱۲۳۴۵۶۷۸۹"[digit];
            });
    }

    function formatNumber(value) {
        const number =
            Number(value);

        if (!Number.isFinite(number)) {
            return "۰";
        }

        return number
            .toLocaleString("fa-IR");
    }

    function maskMobile(value) {
        const mobile =
            normalizeMobile(value);

        if (
            !isValidMobile(mobile)
        ) {
            return "شماره ثبت‌شده";
        }

        return (
            mobile.slice(0, 4) +
            "••••" +
            mobile.slice(-3)
        );
    }

    /* ==================================================
       RESULT UI
       ================================================== */

    function clearResult() {
        const result =
            getElement(
                CONFIG.RESULT_SELECTOR
            );

        if (!result) return;

        result.innerHTML = "";
        result.className =
            "chance-result";
        hideElement(result);
    }

    function showLoading() {
        const result =
            getElement(
                CONFIG.RESULT_SELECTOR
            );

        if (!result) return;

        result.className =
            "chance-result chance-result--loading";

        result.innerHTML = `
            <div class="chance-result__loading" role="status">
                <span class="chance-result__spinner" aria-hidden="true"></span>
                <span>در حال بررسی اطلاعات شما...</span>
            </div>
        `;

        showElement(result);
    }

    function showError(message) {
        const result =
            getElement(
                CONFIG.RESULT_SELECTOR
            );

        if (!result) return;

        result.className =
            "chance-result chance-result--error";

        result.innerHTML = `
            <div class="chance-result__icon" aria-hidden="true">
                !
            </div>

            <div class="chance-result__content">
                <strong>امکان بررسی وجود ندارد</strong>
                <p>${escapeHTML(message)}</p>
            </div>
        `;

        showElement(result);
    }

    function showEmptyResult(mobile) {
        const result =
            getElement(
                CONFIG.RESULT_SELECTOR
            );

        if (!result) return;

        result.className =
            "chance-result chance-result--empty";

        result.innerHTML = `
            <div class="chance-result__icon" aria-hidden="true">
                ?
            </div>

            <div class="chance-result__content">
                <strong>هنوز خریدی برای این شماره ثبت نشده است</strong>

                <p>
                    برای شماره
                    <span class="chance-result__mobile">
                        ${escapeHTML(maskMobile(mobile))}
                    </span>
                    هنوز خریدی در این دوره ثبت نشده است.
                </p>

                <button
                    type="button"
                    class="btn btn-primary chance-result__action"
                    data-close-chance-result
                >
                    مشاهده محصولات
                </button>
            </div>
        `;

        showElement(result);
    }

    function showSuccessResult(data, mobile) {
        const result =
            getElement(
                CONFIG.RESULT_SELECTOR
            );

        if (!result) return;

        const purchaseCount =
            Number(
                data.purchaseCount ??
                data.purchases ??
                data.orderCount ??
                0
            );

        const chanceCount =
            Number(
                data.chanceCount ??
                data.chances ??
                0
            );

        const campaignName =
            data.campaignName ||
            data.campaign ||
            "دوره جاری";

        const status =
            data.statusLabel ||
            data.status ||
            "فعال";

        const registeredAt =
            data.registeredAt ||
            data.createdAt ||
            "";

        result.className =
            "chance-result chance-result--success";

        result.innerHTML = `
            <div class="chance-result__header">
                <div class="chance-result__icon" aria-hidden="true">
                    ✓
                </div>

                <div>
                    <strong>اطلاعات شما پیدا شد</strong>
                    <p>
                        شماره:
                        <span class="chance-result__mobile">
                            ${escapeHTML(maskMobile(mobile))}
                        </span>
                    </p>
                </div>
            </div>

            <div class="chance-result__stats">

                <div class="chance-result__stat">
                    <span class="chance-result__stat-label">
                        تعداد خرید
                    </span>

                    <strong>
                        ${formatNumber(purchaseCount)}
                    </strong>
                </div>

                <div class="chance-result__stat chance-result__stat--highlight">
                    <span class="chance-result__stat-label">
                        تعداد شانس
                    </span>

                    <strong>
                        ${formatNumber(chanceCount)}
                    </strong>
                </div>

                <div class="chance-result__stat">
                    <span class="chance-result__stat-label">
                        دوره
                    </span>

                    <strong>
                        ${escapeHTML(campaignName)}
                    </strong>
                </div>

                <div class="chance-result__stat">
                    <span class="chance-result__stat-label">
                        وضعیت
                    </span>

                    <strong>
                        ${escapeHTML(status)}
                    </strong>
                </div>

            </div>

            ${
                registeredAt
                    ? `
                        <p class="chance-result__meta">
                            آخرین بروزرسانی:
                            ${escapeHTML(
                                formatDate(
                                    registeredAt
                                )
                            )}
                        </p>
                    `
                    : ""
            }

            <div class="chance-result__footer">
                <span>
                    اطلاعات از سامانه ثبت سفارش دریافت شده است.
                </span>
            </div>
        `;

        showElement(result);
    }

    /* ==================================================
       DATE FORMATTING
       ================================================== */

    function formatDate(value) {
        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        try {
            return new Intl.DateTimeFormat(
                "fa-IR",
                {
                    timeZone: "Asia/Tehran",
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            ).format(date);
        } catch (error) {
            return "";
        }
    }

    /* ==================================================
       SECURITY
       ================================================== */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function validateRateLimit() {
        const now =
            Date.now();

        if (
            now - lastRequestTime <
            CONFIG.RATE_LIMIT_MS
        ) {
            return false;
        }

        lastRequestTime = now;

        return true;
    }

    /* ==================================================
       API RESPONSE NORMALIZATION
       ================================================== */

    function normalizeResponse(response) {
        if (!response) {
            return {
                found: false,
                data: null
            };
        }

        const data =
            response.data ||
            response.result ||
            response;

        const found =
            data.found === true ||
            data.exists === true ||
            data.hasPurchase === true ||
            Boolean(
                data.purchaseCount ||
                data.purchases ||
                data.chanceCount ||
                data.chances
            );

        return {
            found: found,
            data: data
        };
    }

    /* ==================================================
       BACKEND REQUEST
       ================================================== */

    async function lookupChance(mobile) {
        if (
            !window.TTKALAA_API ||
            typeof window.TTKALAA_API.lookupChance !==
                "function"
        ) {
            throw new Error(
                "سرویس بررسی شانس در دسترس نیست."
            );
        }

        const campaignId =
            window.TTKALAA_COUNTDOWN &&
            typeof window.TTKALAA_COUNTDOWN.getCampaignId ===
                "function"
                ? window.TTKALAA_COUNTDOWN.getCampaignId()
                : null;

        return window.TTKALAA_API.lookupChance(
            mobile,
            campaignId
        );
    }

    /* ==================================================
       FORM SUBMISSION
       ================================================== */

    async function handleSubmit(event) {
        event.preventDefault();

        if (isLoading) {
            return;
        }

        if (!validateRateLimit()) {
            showError(
                "لطفاً چند لحظه صبر کنید و دوباره تلاش کنید."
            );

            return;
        }

        const input =
            getElement(
                CONFIG.MOBILE_SELECTOR
            );

        if (!input) {
            return;
        }

        const mobile =
            normalizeMobile(
                input.value
            );

        input.value =
            mobile;

        clearResult();

        if (!isValidMobile(mobile)) {
            input.setCustomValidity(
                "شماره موبایل معتبر وارد کنید."
            );

            input.reportValidity();

            return;
        }

        input.setCustomValidity("");

        isLoading = true;

        setSubmitState(true);

        showLoading();

        try {
            const response =
                await lookupChance(
                    mobile
                );

            const normalized =
                normalizeResponse(
                    response
                );

            if (!normalized.found) {
                showEmptyResult(
                    mobile
                );
            } else {
                showSuccessResult(
                    normalized.data,
                    mobile
                );
            }
        } catch (error) {
            console.error(
                "TTKALAA chance lookup error:",
                error
            );

            showError(
                getSafeErrorMessage(
                    error
                )
            );
        } finally {
            isLoading = false;

            setSubmitState(false);
        }
    }

    /* ==================================================
       SUBMIT BUTTON STATE
       ================================================== */

    function setSubmitState(
        loading
    ) {
        const button =
            getElement(
                CONFIG.SUBMIT_SELECTOR
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

            button.innerHTML = `
                <span
                    class="btn-spinner"
                    aria-hidden="true"
                ></span>
                در حال بررسی...
            `;
        } else {
            button.disabled = false;

            if (
                button.dataset.originalText
            ) {
                button.textContent =
                    button.dataset.originalText;
            }
        }
    }

    /* ==================================================
       ERROR MESSAGES
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
            return "تعداد درخواست‌ها زیاد است. لطفاً کمی بعد دوباره تلاش کنید.";
        }

        if (
            message.includes(
                "404"
            )
        ) {
            return "اطلاعات موردنظر پیدا نشد.";
        }

        if (
            message.includes(
                "500"
            )
        ) {
            return "سامانه موقتاً با مشکل مواجه شده است. لطفاً بعداً دوباره تلاش کنید.";
        }

        if (message) {
            return message;
        }

        return "در ارتباط با سامانه مشکلی ایجاد شد. لطفاً دوباره تلاش کنید.";
    }

    /* ==================================================
       INPUT UX
       ================================================== */

    function handleInput(event) {
        const input =
            event.target;

        let value =
            convertPersianDigits(
                input.value
            );

        value =
            value.replace(
                /\D/g,
                ""
            );

        if (
            value.length >
            CONFIG.MAX_LENGTH
        ) {
            value =
                value.slice(
                    0,
                    CONFIG.MAX_LENGTH
                );
        }

        input.value =
            value;

        input.setCustomValidity("");
    }

    function handlePaste(event) {
        event.preventDefault();

        const pasted =
            (
                event.clipboardData ||
                window.clipboardData
            ).getData("text");

        const value =
            normalizeMobile(
                pasted
            ).slice(
                0,
                CONFIG.MAX_LENGTH
            );

        event.target.value =
            value;

        event.target.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles: true
                }
            )
        );
    }

    /* ==================================================
       MODAL
       ================================================== */

    function openModal() {
        const modal =
            getElement(
                CONFIG.MODAL_SELECTOR
            );

        if (!modal) return;

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
                CONFIG.MOBILE_SELECTOR
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

    function closeModal() {
        const modal =
            getElement(
                CONFIG.MODAL_SELECTOR
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

    /* ==================================================
       EVENT DELEGATION
       ================================================== */

    function handleDocumentClick(
        event
    ) {
        const openButton =
            event.target.closest(
                "[data-open-chance]"
            );

        if (openButton) {
            event.preventDefault();

            openModal();

            return;
        }

        const closeButton =
            event.target.closest(
                "[data-close-chance]"
            );

        if (closeButton) {
            event.preventDefault();

            closeModal();

            return;
        }

        const resultButton =
            event.target.closest(
                "[data-close-chance-result]"
            );

        if (resultButton) {
            event.preventDefault();

            const productsSection =
                document.querySelector(
                    "#products"
                );

            closeModal();

            if (
                productsSection
            ) {
                productsSection.scrollIntoView(
                    {
                        behavior: "smooth",
                        block: "start"
                    }
                );
            }

            return;
        }

        const overlay =
            event.target.closest(
                CONFIG.MODAL_SELECTOR
            );

        if (
            overlay &&
            event.target === overlay
        ) {
            closeModal();
        }
    }

    function handleEscape(
        event
    ) {
        if (
            event.key === "Escape"
        ) {
            closeModal();
        }
    }

    /* ==================================================
       PUBLIC CLIENT
       ================================================== */

    window.TTKALAA_CHANCE = {
        open: openModal,
        close: closeModal,
        lookup: lookupChance,

        normalizeMobile:
            normalizeMobile,

        isValidMobile:
            isValidMobile,

        maskMobile:
            maskMobile,

        clear: clearResult
    };

    /* ==================================================
       INITIALIZATION
       ================================================== */

    function initialize() {
        const form =
            getElement(
                CONFIG.FORM_SELECTOR
            );

        const input =
            getElement(
                CONFIG.MOBILE_SELECTOR
            );

        if (form) {
            form.addEventListener(
                "submit",
                handleSubmit
            );
        }

        if (input) {
            input.addEventListener(
                "input",
                handleInput
            );

            input.addEventListener(
                "paste",
                handlePaste
            );
        }

        document.addEventListener(
            "click",
            handleDocumentClick
        );

        document.addEventListener(
            "keydown",
            handleEscape
        );

        clearResult();
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
