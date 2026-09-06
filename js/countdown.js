/* ==================================================
   T.T.KALAA — SEASONAL CAMPAIGN COUNTDOWN
   Persian Calendar + Tehran Timezone
   ================================================== */

(function () {
    "use strict";

    /* ==================================================
       CONFIGURATION
       ================================================== */

    const TIMEZONE = "Asia/Tehran";
    const UPDATE_INTERVAL = 1000;

    const SEASONS = {
        spring: {
            key: "spring",
            title: "بهار",
            startMonth: 1,
            startDay: 1,
            endMonth: 3,
            endDay: 31
        },
        summer: {
            key: "summer",
            title: "تابستان",
            startMonth: 4,
            startDay: 1,
            endMonth: 6,
            endDay: 31
        },
        autumn: {
            key: "autumn",
            title: "پاییز",
            startMonth: 7,
            startDay: 1,
            endMonth: 9,
            endDay: 30
        },
        winter: {
            key: "winter",
            title: "زمستان",
            startMonth: 10,
            startDay: 1,
            endMonth: 12,
            endDay: null
        }
    };

    const PERSIAN_MONTH_NAMES = [
        "",
        "فروردین",
        "اردیبهشت",
        "خرداد",
        "تیر",
        "مرداد",
        "شهریور",
        "مهر",
        "آبان",
        "آذر",
        "دی",
        "بهمن",
        "اسفند"
    ];

    const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

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

    function toPersianDigits(value) {
        return String(value).replace(/\d/g, function (digit) {
            return PERSIAN_DIGITS[digit];
        });
    }

    function padNumber(value) {
        return String(value).padStart(2, "0");
    }

    function padPersianNumber(value) {
        return toPersianDigits(padNumber(value));
    }

    /* ==================================================
       PERSIAN CALENDAR UTILITIES
       ================================================== */

    function isPersianLeapYear(year) {
        const epBase = year - (year >= 0 ? 474 : 473);
        const epYear = 474 + mod(epBase, 2820);

        return (
            mod(
                (epYear + 38) * 682,
                2816
            ) < 682
        );
    }

    function mod(a, b) {
        return a - Math.floor(a / b) * b;
    }

    function jalaliToGregorian(jYear, jMonth, jDay) {
        const epBase = jYear - (jYear >= 0 ? 474 : 473);
        const epYear = 474 + mod(epBase, 2820);

        const monthDays =
            jMonth <= 7
                ? (jMonth - 1) * 31
                : (jMonth - 1) * 30 + 6;

        const days =
            jDay +
            monthDays +
            Math.floor((epYear * 682 - 110) / 2816) +
            (epYear - 1) * 365 +
            Math.floor(epBase / 2820) * 1029983 +
            (1948320 - 1);

        return gregorianFromJulianDay(days);
    }

    function gregorianFromJulianDay(jdn) {
        let j = 4 * jdn + 139361631;

        j =
            j +
            Math.floor(
                Math.floor(4 * jdn + 183187720) / 146097
            ) * 3 /
            4 *
            4;

        const i =
            Math.floor(
                j % 1461
            ) / 4;

        const e =
            5 * i + 461;

        const y =
            Math.floor(e / 153);

        const m =
            ((e % 153) / 5) + 1;

        const d =
            ((e % 153) % 5) + 1;

        const year =
            Math.floor(j / 1461) -
            100100 +
            Math.floor(
                (8 - m) / 6
            );

        const month =
            m > 13
                ? m - 12
                : m;

        const finalYear =
            month > 2
                ? year
                : year - 1;

        return {
            year: Math.floor(finalYear),
            month: Math.floor(month),
            day: Math.floor(d)
        };
    }

    /*
     * A more robust Gregorian conversion based on
     * the standard Persian 2820-year cycle.
     */
    function jalaliToGregorianDate(
        jYear,
        jMonth,
        jDay,
        hour,
        minute,
        second,
        millisecond
    ) {
        const g = jalaliToGregorian(
            jYear,
            jMonth,
            jDay
        );

        return {
            year: g.year,
            month: g.month,
            day: g.day,
            hour: hour || 0,
            minute: minute || 0,
            second: second || 0,
            millisecond: millisecond || 0
        };
    }

    /* ==================================================
       TEHRAN TIME UTILITIES
       ================================================== */

    function getTehranParts(timestamp) {
        const formatter = new Intl.DateTimeFormat(
            "en-US-u-ca-persian-nu-latn",
            {
                timeZone: TIMEZONE,
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hourCycle: "h23"
            }
        );

        const parts = formatter.formatToParts(
            new Date(timestamp)
        );

        const result = {};

        parts.forEach(function (part) {
            if (part.type !== "literal") {
                result[part.type] = Number(part.value);
            }
        });

        return result;
    }

    /*
     * Tehran uses historical DST rules, but modern dates
     * should be handled by Intl. We obtain the UTC offset
     * dynamically for the exact target timestamp.
     */
    function getTimeZoneOffset(timestamp) {
        const formatter = new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: TIMEZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hourCycle: "h23"
            }
        );

        const parts = formatter.formatToParts(
            new Date(timestamp)
        );

        const values = {};

        parts.forEach(function (part) {
            if (part.type !== "literal") {
                values[part.type] = Number(part.value);
            }
        });

        const utcEquivalent = Date.UTC(
            values.year,
            values.month - 1,
            values.day,
            values.hour,
            values.minute,
            values.second
        );

        return utcEquivalent - timestamp;
    }

    function tehranDateToTimestamp(
        jYear,
        jMonth,
        jDay,
        hour,
        minute,
        second,
        millisecond
    ) {
        const g = jalaliToGregorianDate(
            jYear,
            jMonth,
            jDay,
            hour,
            minute,
            second,
            millisecond
        );

        let guess = Date.UTC(
            g.year,
            g.month - 1,
            g.day,
            g.hour,
            g.minute,
            g.second,
            g.millisecond
        );

        /*
         * Two passes are enough to resolve the timezone
         * offset for the target date accurately.
         */
        for (let i = 0; i < 2; i++) {
            const offset = getTimeZoneOffset(guess);
            guess =
                Date.UTC(
                    g.year,
                    g.month - 1,
                    g.day,
                    g.hour,
                    g.minute,
                    g.second,
                    g.millisecond
                ) - offset;
        }

        return guess;
    }

    /* ==================================================
       SEASON CALCULATION
       ================================================== */

    function getWinterEndDay(jYear) {
        return isPersianLeapYear(jYear) ? 30 : 29;
    }

    function getSeasonForMonth(month) {
        if (month >= 1 && month <= 3) {
            return SEASONS.spring;
        }

        if (month >= 4 && month <= 6) {
            return SEASONS.summer;
        }

        if (month >= 7 && month <= 9) {
            return SEASONS.autumn;
        }

        return SEASONS.winter;
    }

    function getSeasonInfo(timestamp) {
        const now = getTehranParts(timestamp);

        const season = getSeasonForMonth(now.month);

        let endDay = season.endDay;

        if (season.key === "winter") {
            endDay = getWinterEndDay(now.year);
        }

        const startTimestamp = tehranDateToTimestamp(
            now.year,
            season.startMonth,
            season.startDay,
            0,
            0,
            0,
            0
        );

        const endTimestamp = tehranDateToTimestamp(
            now.year,
            season.endMonth,
            endDay,
            23,
            59,
            59,
            999
        );

        return {
            year: now.year,
            key: season.key,
            title: season.title,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
            startMonth: season.startMonth,
            startDay: season.startDay,
            endMonth: season.endMonth,
            endDay: endDay,
            campaignId:
                season.key +
                "-" +
                now.year
        };
    }

    function getNextSeasonInfo(current) {
        let year = current.year;

        let nextSeason;

        switch (current.key) {
            case "spring":
                nextSeason = SEASONS.summer;
                break;

            case "summer":
                nextSeason = SEASONS.autumn;
                break;

            case "autumn":
                nextSeason = SEASONS.winter;
                break;

            default:
                nextSeason = SEASONS.spring;
                year += 1;
                break;
        }

        const endDay =
            nextSeason.key === "winter"
                ? getWinterEndDay(year)
                : nextSeason.endDay;

        return {
            year: year,
            key: nextSeason.key,
            title: nextSeason.title,
            startTimestamp: tehranDateToTimestamp(
                year,
                nextSeason.startMonth,
                nextSeason.startDay,
                0,
                0,
                0,
                0
            ),
            endTimestamp: tehranDateToTimestamp(
                year,
                nextSeason.endMonth,
                endDay,
                23,
                59,
                59,
                999
            ),
            startMonth: nextSeason.startMonth,
            startDay: nextSeason.startDay,
            endMonth: nextSeason.endMonth,
            endDay: endDay,
            campaignId:
                nextSeason.key +
                "-" +
                year
        };
    }

    /* ==================================================
       DATE FORMATTING
       ================================================== */

    function formatPersianDate(
        timestamp
    ) {
        const parts = getTehranParts(timestamp);

        return (
            toPersianDigits(parts.year) +
            "/" +
            toPersianDigits(
                padNumber(parts.month)
            ) +
            "/" +
            toPersianDigits(
                padNumber(parts.day)
            )
        );
    }

    function formatPersianLongDate(
        timestamp
    ) {
        const parts = getTehranParts(timestamp);

        return (
            toPersianDigits(parts.day) +
            " " +
            PERSIAN_MONTH_NAMES[parts.month] +
            " " +
            toPersianDigits(parts.year)
        );
    }

    /* ==================================================
       COUNTDOWN CALCULATION
       ================================================== */

    function calculateRemaining(
        targetTimestamp,
        nowTimestamp
    ) {
        let difference =
            targetTimestamp -
            nowTimestamp;

        if (difference < 0) {
            difference = 0;
        }

        const totalSeconds =
            Math.floor(
                difference / 1000
            );

        const days =
            Math.floor(
                totalSeconds / 86400
            );

        const hours =
            Math.floor(
                (totalSeconds % 86400) / 3600
            );

        const minutes =
            Math.floor(
                (totalSeconds % 3600) / 60
            );

        const seconds =
            totalSeconds % 60;

        return {
            totalSeconds,
            days,
            hours,
            minutes,
            seconds
        };
    }

    function updateCountdownElements(
        remaining
    ) {
        const days = padPersianNumber(
            remaining.days
        );

        const hours = padPersianNumber(
            remaining.hours
        );

        const minutes = padPersianNumber(
            remaining.minutes
        );

        const seconds = padPersianNumber(
            remaining.seconds
        );

        /* Main countdown */

        setText(
            "#countdownDays",
            days
        );

        setText(
            "#countdownHours",
            hours
        );

        setText(
            "#countdownMinutes",
            minutes
        );

        setText(
            "#countdownSeconds",
            seconds
        );

        /* Mini countdown */

        setText(
            "#miniDays",
            days
        );

        setText(
            "#miniHours",
            hours
        );

        setText(
            "#miniMinutes",
            minutes
        );

        setText(
            "#miniSeconds",
            seconds
        );

        /* Generic data attributes */

        document
            .querySelectorAll(
                "[data-countdown-days]"
            )
            .forEach(function (element) {
                element.textContent = days;
            });

        document
            .querySelectorAll(
                "[data-countdown-hours]"
            )
            .forEach(function (element) {
                element.textContent = hours;
            });

        document
            .querySelectorAll(
                "[data-countdown-minutes]"
            )
            .forEach(function (element) {
                element.textContent = minutes;
            });

        document
            .querySelectorAll(
                "[data-countdown-seconds]"
            )
            .forEach(function (element) {
                element.textContent = seconds;
            });
    }

    /* ==================================================
       CAMPAIGN UI
       ================================================== */

    function updateCampaignUI(
        campaign
    ) {
        const campaignName =
            "قرعه‌کشی " +
            campaign.title;

        const campaignDate =
            formatPersianLongDate(
                campaign.endTimestamp
            );

        setText(
            "#currentSeason",
            campaign.title
        );

        setText(
            "#campaignName",
            campaignName
        );

        setText(
            "#campaignEndDate",
            campaignDate
        );

        setText(
            "#heroCampaignName",
            campaignName
        );

        setText(
            "#heroCampaignEndDate",
            campaignDate
        );

        setText(
            "#campaignStatus",
            "فعال"
        );

        document
            .querySelectorAll(
                "[data-campaign-season]"
            )
            .forEach(function (element) {
                element.textContent =
                    campaign.title;
            });

        document
            .querySelectorAll(
                "[data-campaign-id]"
            )
            .forEach(function (element) {
                element.textContent =
                    campaign.campaignId;
            });

        document
            .querySelectorAll(
                "[data-campaign-end]"
            )
            .forEach(function (element) {
                element.textContent =
                    campaignDate;
            });

        document
            .querySelectorAll(
                "[data-campaign-key]"
            )
            .forEach(function (element) {
                element.dataset.campaignKey =
                    campaign.campaignId;
            });
    }

    /* ==================================================
       GLOBAL CAMPAIGN STATE
       ================================================== */

    let activeCampaign = null;
    let countdownTimer = null;

    function exposeCampaignState(
        campaign
    ) {
        activeCampaign = campaign;

        window.TTKALAA_CAMPAIGN = {
            id: campaign.campaignId,
            year: campaign.year,
            key: campaign.key,
            title: campaign.title,
            startTimestamp:
                campaign.startTimestamp,
            endTimestamp:
                campaign.endTimestamp,
            startDate:
                formatPersianDate(
                    campaign.startTimestamp
                ),
            endDate:
                formatPersianDate(
                    campaign.endTimestamp
                ),
            endDateLong:
                formatPersianLongDate(
                    campaign.endTimestamp
                )
        };
    }

    /* ==================================================
       COUNTDOWN ENGINE
       ================================================== */

    function tick() {
        const now =
            Date.now();

        if (
            !activeCampaign ||
            now >
            activeCampaign.endTimestamp
        ) {
            initializeCampaign();

            return;
        }

        const remaining =
            calculateRemaining(
                activeCampaign.endTimestamp,
                now
            );

        updateCountdownElements(
            remaining
        );

        if (
            remaining.totalSeconds <= 0
        ) {
            initializeCampaign();
        }
    }

    function initializeCampaign() {
        const now =
            Date.now();

        let campaign =
            getSeasonInfo(now);

        /*
         * Safety check:
         * If the current season boundary has already
         * passed due to a conversion/timezone edge,
         * move to the next campaign automatically.
         */
        if (
            now >
            campaign.endTimestamp
        ) {
            campaign =
                getNextSeasonInfo(
                    campaign
                );
        }

        exposeCampaignState(
            campaign
        );

        updateCampaignUI(
            campaign
        );

        tick();
    }

    /* ==================================================
       PUBLIC API
       ================================================== */

    window.TTKALAA_COUNTDOWN = {
        getCampaign: function () {
            return activeCampaign;
        },

        getCampaignId: function () {
            return activeCampaign
                ? activeCampaign.campaignId
                : null;
        },

        getRemaining: function () {
            if (!activeCampaign) {
                return null;
            }

            return calculateRemaining(
                activeCampaign.endTimestamp,
                Date.now()
            );
        },

        getSeasonInfo: function () {
            return getSeasonInfo(
                Date.now()
            );
        },

        getNextSeason: function () {
            if (!activeCampaign) {
                return null;
            }

            return getNextSeasonInfo(
                activeCampaign
            );
        },

        refresh: function () {
            initializeCampaign();
        }
    };

    /* ==================================================
       INITIALIZATION
       ================================================== */

    function initialize() {
        initializeCampaign();

        if (countdownTimer) {
            clearInterval(
                countdownTimer
            );
        }

        countdownTimer =
            setInterval(
                tick,
                UPDATE_INTERVAL
            );
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
