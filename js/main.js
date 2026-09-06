/* ==================================================
   T.T.KALAA — MAIN APPLICATION CONTROLLER
   Global UI / Navigation / UX / Initialization
   ================================================== */

(function () {
    "use strict";

    /* ==================================================
       CONFIGURATION
       ================================================== */

    const CONFIG = {
        MOBILE_BREAKPOINT: 900,
        TOAST_DURATION: 3500,
        STATS_REFRESH_INTERVAL: 60000,
        SCROLL_OFFSET: 90
    };

    let statsTimer = null;

    /* ==================================================
       DOM HELPERS
       ================================================== */

    function $(selector, parent) {
        return (
            (parent || document).querySelector(
                selector
            )
        );
    }

    function $$(selector, parent) {
        return Array.from(
            (parent || document).querySelectorAll(
                selector
            )
        );
    }

    function setText(selector, value) {
        const element = $(selector);

        if (element) {
            element.textContent =
                value ?? "";
        }
    }

    /* ==================================================
       HTML ESCAPE
       ================================================== */

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* ==================================================
       PERSIAN DIGITS
       ================================================== */

    function toPersianDigits(value) {
        return String(value ?? "")
            .replace(/\d/g, function (digit) {
                return "۰۱۲۳۴۵۶۷۸۹"[digit];
            });
    }

    /* ==================================================
       HEADER / MOBILE NAVIGATION
       ================================================== */

    function initializeNavigation() {
        const menuButton =
            $("[data-menu-toggle]");

        const mobileMenu =
            $("[data-mobile-menu]");

        if (!menuButton || !mobileMenu) {
            return;
        }

        function closeMenu() {
            mobileMenu.classList.remove(
                "is-open"
            );

            menuButton.classList.remove(
                "is-active"
            );

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }

        function toggleMenu() {
            const isOpen =
                mobileMenu.classList.toggle(
                    "is-open"
                );

            menuButton.classList.toggle(
                "is-active",
                isOpen
            );

            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        }

        menuButton.addEventListener(
            "click",
            function () {
                toggleMenu();
            }
        );

        $$(".nav-link", mobileMenu)
            .forEach(function (link) {
                link.addEventListener(
                    "click",
                    function () {
                        closeMenu();
                    }
                );
            });

        document.addEventListener(
            "click",
            function (event) {
                if (
                    !mobileMenu.contains(
                        event.target
                    ) &&
                    !menuButton.contains(
                        event.target
                    )
                ) {
                    closeMenu();
                }
            }
        );

        document.addEventListener(
            "keydown",
            function (event) {
                if (
                    event.key === "Escape"
                ) {
                    closeMenu();
                }
            }
        );

        window.addEventListener(
            "resize",
            function () {
                if (
                    window.innerWidth >
                    CONFIG.MOBILE_BREAKPOINT
                ) {
                    closeMenu();
                }
            }
        );
    }

    /* ==================================================
       SMOOTH SCROLL
       ================================================== */

    function initializeSmoothScroll() {
        $$(
            'a[href^="#"]'
        ).forEach(function (link) {
            link.addEventListener(
                "click",
                function (event) {
                    const href =
                        link.getAttribute(
                            "href"
                        );

                    if (
                        !href ||
                        href === "#"
                    ) {
                        return;
                    }

                    const target =
                        $(href);

                    if (!target) {
                        return;
                    }

                    event.preventDefault();

                    const offset =
                        CONFIG.SCROLL_OFFSET;

                    const top =
                        target.getBoundingClientRect()
                            .top +
                        window.scrollY -
                        offset;

                    window.scrollTo({
                        top:
                            Math.max(
                                0,
                                top
                            ),
                        behavior:
                            "smooth"
                    });

                    history.replaceState(
                        null,
                        "",
                        href
                    );
                }
            );
        });
    }

    /* ==================================================
       STICKY HEADER
       ================================================== */

    function initializeHeaderScroll() {
        const header =
            $("header");

        if (!header) {
            return;
        }

        function updateHeader() {
            header.classList.toggle(
                "is-scrolled",
                window.scrollY > 12
            );
        }

        updateHeader();

        window.addEventListener(
            "scroll",
            updateHeader,
            {
                passive: true
            }
        );
    }

    /* ==================================================
       REVEAL ANIMATIONS
       ================================================== */

    function initializeRevealAnimations() {
        const elements =
            $$(
                "[data-reveal]"
            );

        if (
            !elements.length
        ) {
            return;
        }

        if (
            !("IntersectionObserver" in window)
        ) {
            elements.forEach(
                function (element) {
                    element.classList.add(
                        "is-visible"
                    );
                }
            );

            return;
        }

        const observer =
            new IntersectionObserver(
                function (
                    entries,
                    observerInstance
                ) {
                    entries.forEach(
                        function (entry) {
                            if (
                                entry.isIntersecting
                            ) {
                                entry.target.classList.add(
                                    "is-visible"
                                );

                                observerInstance.unobserve(
                                    entry.target
                                );
                            }
                        }
                    );
                },
                {
                    threshold: 0.12,
                    rootMargin:
                        "0px 0px -40px 0px"
                }
            );

        elements.forEach(
            function (element) {
                observer.observe(
                    element
                );
            }
        );
    }

    /* ==================================================
       FAQ ACCORDION
       ================================================== */

    function initializeFAQ() {
        const items =
            $$(
                "[data-faq-item]"
            );

        if (
            !items.length
        ) {
            return;
        }

        items.forEach(
            function (item) {
                const question =
                    $(
                        "[data-faq-question]",
                        item
                    );

                const answer =
                    $(
                        "[data-faq-answer]",
                        item
                    );

                if (
                    !question ||
                    !answer
                ) {
                    return;
                }

                question.addEventListener(
                    "click",
                    function () {
                        const isOpen =
                            item.classList.contains(
                                "is-open"
                            );

                        items.forEach(
                            function (
                                otherItem
                            ) {
                                otherItem.classList.remove(
                                    "is-open"
                                );

                                const otherQuestion =
                                    $(
                                        "[data-faq-question]",
                                        otherItem
                                    );

                                if (
                                    otherQuestion
                                ) {
                                    otherQuestion.setAttribute(
                                        "aria-expanded",
                                        "false"
                                    );
                                }
                            }
                        );

                        if (
                            !isOpen
                        ) {
                            item.classList.add(
                                "is-open"
                            );

                            question.setAttribute(
                                "aria-expanded",
                                "true"
                            );
                        }
                    }
                );
            }
        );
    }

    /* ==================================================
       CHANCE BUTTONS
       ================================================== */

    function initializeChanceButtons() {
        $$(
            "[data-open-chance]"
        ).forEach(
            function (button) {
                button.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();

                        if (
                            window.TTKALAA_CHANCE &&
                            typeof window.TTKALAA_CHANCE.open ===
                                "function"
                        ) {
                            window.TTKALAA_CHANCE.open();
                        }
                    }
                );
            }
        );
    }

    /* ==================================================
       PURCHASE BUTTONS
       ================================================== */

    function initializePurchaseButtons() {
        $$(
            "[data-buy-product]"
        ).forEach(
            function (button) {
                button.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();

                        const productId =
                            button.getAttribute(
                                "data-buy-product"
                            );

                        if (
                            !productId
                        ) {
                            return;
                        }

                        if (
                            window.TTKALAA_PAYMENT &&
                            typeof window.TTKALAA_PAYMENT.openPurchase ===
                                "function"
                        ) {
                            window.TTKALAA_PAYMENT.openPurchase(
                                productId
                            );
                        }
                    }
                );
            }
        );
    }

    /* ==================================================
       TOAST SYSTEM
       ================================================== */

    function showToast(
        message,
        type
    ) {
        const toast =
            $(
                "#toast"
            );

        if (!toast) {
            return;
        }

        toast.classList.remove(
            "is-success",
            "is-error",
            "is-info"
        );

        toast.classList.add(
            type === "success"
                ? "is-success"
                : type === "error"
                ? "is-error"
                : "is-info"
        );

        toast.textContent =
            message;

        toast.classList.add(
            "is-visible"
        );

        clearTimeout(
            toast._ttkalaaTimer
        );

        toast._ttkalaaTimer =
            setTimeout(
                function () {
                    toast.classList.remove(
                        "is-visible"
                    );
                },
                CONFIG.TOAST_DURATION
            );
    }

    window.TTKALAA_TOAST = {
        show:
            showToast
    };

    /* ==================================================
       LIVE STATISTICS
       ================================================== */

    async function refreshLiveStats() {
        if (
            !window.TTKALAA_API ||
            typeof window.TTKALAA_API.getLiveStats !==
                "function"
        ) {
            return;
        }

        let campaignId =
            null;

        if (
            window.TTKALAA_COUNTDOWN &&
            typeof window.TTKALAA_COUNTDOWN.getCampaignId ===
                "function"
        ) {
            campaignId =
                window.TTKALAA_COUNTDOWN.getCampaignId();
        }

        try {
            const response =
                await window.TTKALAA_API.getLiveStats(
                    campaignId
                );

            const data =
                response?.data ||
                response?.result ||
                response ||
                {};

            const participants =
                data.participantsCount ??
                data.participants ??
                data.users ??
                null;

            const chances =
                data.chancesCount ??
                data.chances ??
                data.totalChances ??
                null;

            const status =
                data.statusLabel ??
                data.status ??
                "فعال";

            if (
                participants !== null
            ) {
                setText(
                    "#participantsCount",
                    Number(
                        participants
                    ).toLocaleString(
                        "fa-IR"
                    )
                );
            }

            if (
                chances !== null
            ) {
                setText(
                    "#chancesCount",
                    Number(
                        chances
                    ).toLocaleString(
                        "fa-IR"
                    )
                );
            }

            setText(
                "#campaignStatus",
                status
            );
        } catch (error) {
            console.warn(
                "TTKALAA live stats unavailable:",
                error
            );
        }
    }

    function initializeLiveStats() {
        refreshLiveStats();

        clearInterval(
            statsTimer
        );

        statsTimer =
            setInterval(
                refreshLiveStats,
                CONFIG.STATS_REFRESH_INTERVAL
            );
    }

    /* ==================================================
       CAMPAIGN DATA SYNC
       ================================================== */

    async function initializeCampaignData() {
        if (
            !window.TTKALAA_API ||
            typeof window.TTKALAA_API.getCurrentCampaign !==
                "function"
        ) {
            return;
        }

        try {
            const response =
                await window.TTKALAA_API.getCurrentCampaign();

            const campaign =
                response?.data ||
                response?.result ||
                response;

            if (
                !campaign
            ) {
                return;
            }

            /*
             * The local Persian-calendar engine remains
             * the authoritative frontend fallback.
             *
             * Backend campaign data is used only when
             * compatible and valid.
             */
            if (
                campaign.title
            ) {
                $$(
                    "[data-campaign-season]"
                ).forEach(
                    function (element) {
                        element.textContent =
                            campaign.title;
                    }
                );
            }
        } catch (error) {
            console.warn(
                "TTKALAA campaign API unavailable:",
                error
            );
        }
    }

    /* ==================================================
       PAYMENT SUCCESS FEEDBACK
       ================================================== */

    function initializePaymentEvents() {
        window.addEventListener(
            "ttkalaa:payment-success",
            function (event) {
                const chanceCount =
                    event.detail?.chanceCount;

                if (
                    chanceCount
                ) {
                    showToast(
                        "پرداخت شما با موفقیت ثبت شد و شانس شما ایجاد شد.",
                        "success"
                    );
                } else {
                    showToast(
                        "پرداخت شما با موفقیت ثبت شد.",
                        "success"
                    );
                }
            }
        );
    }

    /* ==================================================
       WHATSAPP SUPPORT
       ================================================== */

    function initializeWhatsAppLinks() {
        $$(
            "[data-whatsapp]"
        ).forEach(
            function (element) {
                const number =
                    element.getAttribute(
                        "data-whatsapp"
                    ) ||
                    "989357765956";

                const normalized =
                    String(number)
                        .replace(
                            /\D/g,
                            ""
                        )
                        .replace(
                            /^0/,
                            "98"
                        );

                const message =
                    element.getAttribute(
                        "data-whatsapp-message"
                    ) ||
                    "سلام، برای دریافت راهنمایی درباره T.T.KALAA پیام می‌دهم.";

                element.setAttribute(
                    "href",
                    "https://wa.me/" +
                        normalized +
                        "?text=" +
                        encodeURIComponent(
                            message
                        )
                );

                element.setAttribute(
                    "target",
                    "_blank"
                );

                element.setAttribute(
                    "rel",
                    "noopener noreferrer"
                );
            }
        );
    }

    /* ==================================================
       ACTIVE NAVIGATION
       ================================================== */

    function initializeActiveNavigation() {
        const sections =
            $$(
                "main section[id]"
            );

        const links =
            $$(
                ".nav-link[href^='#']"
            );

        if (
            !sections.length ||
            !links.length
        ) {
            return;
        }

        if (
            !("IntersectionObserver" in window)
        ) {
            return;
        }

        const linkMap =
            new Map();

        links.forEach(
            function (link) {
                const id =
                    link
                        .getAttribute(
                            "href"
                        )
                        ?.replace(
                            "#",
                            ""
                        );

                if (id) {
                    linkMap.set(
                        id,
                        link
                    );
                }
            }
        );

        const observer =
            new IntersectionObserver(
                function (
                    entries
                ) {
                    entries.forEach(
                        function (entry) {
                            if (
                                !entry.isIntersecting
                            ) {
                                return;
                            }

                            links.forEach(
                                function (
                                    link
                                ) {
                                    link.classList.remove(
                                        "is-active"
                                    );
                                }
                            );

                            const activeLink =
                                linkMap.get(
                                    entry.target.id
                                );

                            if (
                                activeLink
                            ) {
                                activeLink.classList.add(
                                    "is-active"
                                );
                            }
                        }
                    );
                },
                {
                    rootMargin:
                        "-25% 0px -65% 0px",
                    threshold: 0
                }
            );

        sections.forEach(
            function (section) {
                observer.observe(
                    section
                );
            }
        );
    }

    /* ==================================================
       EXTERNAL LINKS SECURITY
       ================================================== */

    function initializeExternalLinks() {
        $$(
            'a[target="_blank"]'
        ).forEach(
            function (link) {
                const rel =
                    link.getAttribute(
                        "rel"
                    ) || "";

                const values =
                    new Set(
                        rel
                            .split(
                                /\s+/
                            )
                            .filter(
                                Boolean
                            )
                    );

                values.add(
                    "noopener"
                );

                values.add(
                    "noreferrer"
                );

                link.setAttribute(
                    "rel",
                    Array.from(
                        values
                    ).join(" ")
                );
            }
        );
    }

    /* ==================================================
       IMAGE LAZY LOADING
       ================================================== */

    function initializeImages() {
        $$(
            "img"
        ).forEach(
            function (image) {
                if (
                    !image.hasAttribute(
                        "loading"
                    )
                ) {
                    image.setAttribute(
                        "loading",
                        "lazy"
                    );
                }

                if (
                    !image.hasAttribute(
                        "decoding"
                    )
                ) {
                    image.setAttribute(
                        "decoding",
                        "async"
                    );
                }
            }
        );
    }

    /* ==================================================
       BACK TO TOP
       ================================================== */

    function initializeBackToTop() {
        const button =
            $(
                "[data-back-to-top]"
            );

        if (!button) {
            return;
        }

        function update() {
            button.classList.toggle(
                "is-visible",
                window.scrollY >
                    500
            );
        }

        button.addEventListener(
            "click",
            function () {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        );

        update();

        window.addEventListener(
            "scroll",
            update,
            {
                passive: true
            }
        );
    }

    /* ==================================================
       FORM PROTECTION
       ================================================== */

    function initializeForms() {
        $$(
            "form"
        ).forEach(
            function (form) {
                form.addEventListener(
                    "submit",
                    function () {
                        form.classList.add(
                            "is-submitting"
                        );
                    }
                );
            }
        );
    }

    /* ==================================================
       YEAR / FOOTER
       ================================================== */

    function initializeYear() {
        const yearElements =
            $$(
                "[data-current-year]"
            );

        if (
            !yearElements.length
        ) {
            return;
        }

        const year =
            new Intl.DateTimeFormat(
                "fa-IR-u-ca-persian",
                {
                    timeZone:
                        "Asia/Tehran",
                    year:
                        "numeric"
                }
            ).format(
                new Date()
            );

        yearElements.forEach(
            function (element) {
                element.textContent =
                    year;
            }
        );
    }

    /* ==================================================
       CONNECTION / OFFLINE STATE
       ================================================== */

    function initializeConnectionState() {
        function update() {
            document.body.classList.toggle(
                "is-offline",
                navigator.onLine === false
            );
        }

        window.addEventListener(
            "online",
            update
        );

        window.addEventListener(
            "offline",
            update
        );

        update();
    }

    /* ==================================================
       PERFORMANCE SAFETY
       ================================================== */

    function initializePerformanceHints() {
        $$(
            "a[href]"
        ).forEach(
            function (link) {
                const href =
                    link.getAttribute(
                        "href"
                    );

                if (
                    !href
                ) {
                    return;
                }

                if (
                    href.startsWith(
                        "https://"
                    ) ||
                    href.startsWith(
                        "http://"
                    )
                ) {
                    link.setAttribute(
                        "rel",
                        "noopener noreferrer"
                    );
                }
            }
        );
    }

    /* ==================================================
       GLOBAL ERROR HANDLING
       ================================================== */

    window.addEventListener(
        "error",
        function (event) {
            console.error(
                "TTKALAA frontend error:",
                event.error ||
                    event.message
            );
        }
    );

    window.addEventListener(
        "unhandledrejection",
        function (event) {
            console.error(
                "TTKALAA unhandled promise rejection:",
                event.reason
            );
        }
    );

    /* ==================================================
       PUBLIC APPLICATION API
       ================================================== */

    window.TTKALAA_APP = {
        version: "1.0.0",

        refreshStats:
            refreshLiveStats,

        refreshCampaign:
            initializeCampaignData,

        toast:
            showToast,

        scrollTo:
            function (selector) {
                const element =
                    $(selector);

                if (!element) {
                    return;
                }

                const top =
                    element.getBoundingClientRect()
                        .top +
                    window.scrollY -
                    CONFIG.SCROLL_OFFSET;

                window.scrollTo({
                    top:
                        Math.max(
                            0,
                            top
                        ),
                    behavior:
                        "smooth"
                });
            }
    };

    /* ==================================================
       APPLICATION INITIALIZATION
       ================================================== */

    function initializeApplication() {
        initializeNavigation();
        initializeSmoothScroll();
        initializeHeaderScroll();
        initializeRevealAnimations();

        initializeFAQ();

        initializeChanceButtons();
        initializePurchaseButtons();

        initializeLiveStats();
        initializeCampaignData();

        initializePaymentEvents();

        initializeWhatsAppLinks();

        initializeActiveNavigation();

        initializeExternalLinks();

        initializeImages();

        initializeBackToTop();

        initializeForms();

        initializeYear();

        initializeConnectionState();

        initializePerformanceHints();

        /*
         * Mark the application as ready.
         * Useful for CSS and future integrations.
         */
        document.documentElement.classList.add(
            "ttkalaa-ready"
        );

        window.dispatchEvent(
            new CustomEvent(
                "ttkalaa:ready"
            )
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeApplication,
            {
                once: true
            }
        );
    } else {
        initializeApplication();
    }

})();
