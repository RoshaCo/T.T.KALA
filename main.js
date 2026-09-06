(function (window) {
  "use strict";

  let currentCampaign = null;

  const VISITOR_KEY = "ttkalaa_visitor_value";
  const VISITOR_TIME_KEY = "ttkalaa_visitor_time";

  const STATS_KEY = "ttkalaa_daily_stats";
  const TEHRAN_OFFSET = 3.5 * 60 * 60 * 1000;

  const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

  function toPersian(value) {
    return String(value).replace(/\d/g, function (digit) {
      return PERSIAN_DIGITS[digit];
    });
  }

  function getElement(id) {
    return document.getElementById(id);
  }

  function getIranDate() {
    return new Date(
      Date.now() + TEHRAN_OFFSET
    );
  }

  function getIranDateKey() {
    const date = getIranDate();

    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, "0"),
      String(date.getUTCDate()).padStart(2, "0")
    ].join("-");
  }

  function getSeasonNumber(jalaliMonth) {
    if (jalaliMonth <= 3) {
      return 1;
    }

    if (jalaliMonth <= 6) {
      return 2;
    }

    if (jalaliMonth <= 9) {
      return 3;
    }

    return 4;
  }

  function getStableNumber(seed, min, max) {
    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash =
        (hash * 31 + seed.charCodeAt(i)) |
        0;
    }

    hash = Math.abs(hash);

    return min + (hash % (max - min + 1));
  }

  function getFallbackStats() {
    const dateKey = getIranDateKey();

    let saved = null;

    try {
      saved =
        JSON.parse(
          localStorage.getItem(STATS_KEY) || "null"
        );
    } catch (error) {
      saved = null;
    }

    if (
      saved &&
      saved.dateKey === dateKey &&
      Number.isFinite(saved.today)
    ) {
      return saved;
    }

    /*
      خرید امروز:
      عدد تقریبی و پایدار برای همان روز.
      در ساعت ۰۰:۰۰ به وقت ایران تغییر می‌کند.
    */

    const today =
      getStableNumber(
        "today-" + dateKey,
        90,
        412
      );

    const season =
      getStableNumber(
        "season-" + dateKey.slice(0, 4),
        1,
        4
      );

    /*
      مجموع شرکت‌کنندگان از جمع خریدهای روزانه
      تا این روز ساخته می‌شود و هیچ‌وقت از ۹۰۰۰ عبور نمی‌کند.
    */

    const dayOfYear =
      Math.floor(
        (
          getIranDate().getTime() -
          new Date(
            getIranDate().getUTCFullYear(),
            0,
            1
          ).getTime()
        ) / 86400000
      );

    let total =
      Math.min(
        9000,
        Math.max(
          today,
          today +
            dayOfYear *
              getStableNumber(
                "growth-" + season,
                10,
                24
              )
        )
      );

    /*
      عدد باید در بازه منطقی کمپین باشد.
    */

    total = Math.min(
      9000,
      Math.max(100, total)
    );

    const result = {
      dateKey,
      today,
      total,
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(
        STATS_KEY,
        JSON.stringify(result)
      );
    } catch (error) {
      /* ignore */
    }

    return result;
  }

  function renderStats(stats) {
    if (!stats) {
      stats = getFallbackStats();
    }

    const todayElement =
      getElement("todayPurchases");

    const totalElement =
      getElement("totalParticipants");

    if (todayElement) {
      todayElement.textContent =
        toPersian(
          Number(stats.today || 0).toLocaleString(
            "en-US"
          )
        );
    }

    if (totalElement) {
      totalElement.textContent =
        toPersian(
          Number(stats.total || 0).toLocaleString(
            "en-US"
          )
        );
    }
  }

  function renderCampaign(campaign) {
    if (!campaign) {
      return;
    }

    const campaignNumber =
      getElement("campaignNumber");

    if (!campaignNumber) {
      return;
    }

    const number =
      campaign?.number ||
      campaign?.campaignNumber ||
      campaign?.seasonNumber ||
      campaign?.data?.number ||
      campaign?.data?.campaignNumber;

    if (number !== undefined && number !== null) {
      campaignNumber.textContent =
        toPersian(number);
    }
  }

  function getVisitorRange() {
    const date = getIranDate();

    const hour =
      date.getUTCHours();

    const day =
      date.getUTCDay();

    /*
      جمعه ۲ بامداد تا ۱۰ صبح
    */

    if (
      day === 5 &&
      hour >= 2 &&
      hour < 10
    ) {
      return {
        min: 6,
        max: 23
      };
    }

    /*
      ۱ بامداد تا ۸ صبح
    */

    if (
      hour >= 1 &&
      hour < 8
    ) {
      return {
        min: 7,
        max: 19
      };
    }

    return {
      min: 25,
      max: 34
    };
  }

  function getVisitorValue() {
    const now = Date.now();
    const range = getVisitorRange();

    let previousValue = null;
    let previousTime = 0;

    try {
      previousValue =
        Number(
          localStorage.getItem(
            VISITOR_KEY
          )
        );

      previousTime =
        Number(
          localStorage.getItem(
            VISITOR_TIME_KEY
          )
        );
    } catch (error) {
      previousValue = null;
      previousTime = 0;
    }

    /*
      عدد فقط هر ۲ تا ۴ دقیقه تغییر می‌کند.
    */

    if (
      Number.isFinite(previousValue) &&
      previousTime &&
      now - previousTime <
        2 * 60 * 1000
    ) {
      return previousValue;
    }

    const slot =
      Math.floor(
        now / (3 * 60 * 1000)
      );

    let value =
      getStableNumber(
        "visitor-" + slot,
        range.min,
        range.max
      );

    /*
      تغییرات ناگهانی ممنوع.
    */

    if (Number.isFinite(previousValue)) {
      if (
        value - previousValue > 3
      ) {
        value =
          previousValue + 3;
      }

      if (
        previousValue - value > 3
      ) {
        value =
          previousValue - 3;
      }
    }

    /*
      یک عدد بیشتر از دو بار پشت سر هم
      تکرار نشود.
    */

    if (
      value === previousValue
    ) {
      const alternative =
        value < range.max
          ? value + 1
          : value - 1;

      value = alternative;
    }

    value = Math.min(
      range.max,
      Math.max(range.min, value)
    );

    try {
      localStorage.setItem(
        VISITOR_KEY,
        String(value)
      );

      localStorage.setItem(
        VISITOR_TIME_KEY,
        String(now)
      );
    } catch (error) {
      /* ignore */
    }

    return value;
  }

  function renderVisitors() {
    const element =
      getElement("visitorCount");

    if (!element) {
      return;
    }

    element.textContent =
      toPersian(
        getVisitorValue()
      );
  }

  async function loadCampaign() {
    if (
      !window.TTKALAA_API ||
      typeof window.TTKALAA_API.getCurrentCampaign !==
        "function"
    ) {
      return null;
    }

    try {
      currentCampaign =
        await window.TTKALAA_API.getCurrentCampaign();

      renderCampaign(
        currentCampaign
      );

      return currentCampaign;
    } catch (error) {
      return null;
    }
  }

  async function loadLiveStats() {
    let stats = null;

    try {
      const campaign =
        currentCampaign;

      const campaignId =
        campaign?.id ||
        campaign?.campaignId ||
        campaign?.data?.id ||
        campaign?.data?.campaignId ||
        "";

      if (
        window.TTKALAA_API &&
        typeof window.TTKALAA_API.getLiveStats ===
          "function"
      ) {
        const response =
          await window.TTKALAA_API.getLiveStats(
            campaignId
          );

        if (response) {
          stats = {
            today:
              Number(
                response.todayPurchases ??
                response.today ??
                response.data?.todayPurchases ??
                response.data?.today
              ),

            total:
              Number(
                response.totalParticipants ??
                response.participants ??
                response.total ??
                response.data?.totalParticipants ??
                response.data?.total
              )
          };

          if (
            !Number.isFinite(stats.today) ||
            !Number.isFinite(stats.total)
          ) {
            stats = null;
          }
        }
      }
    } catch (error) {
      stats = null;
    }

    /*
      اگر آمار واقعی سرور در دسترس نباشد،
      عدد پایدار روزانه نمایش داده می‌شود.
    */

    if (!stats) {
      stats = getFallbackStats();
    }

    stats.today =
      Math.max(
        90,
        Math.min(412, stats.today)
      );

    stats.total =
      Math.max(
        stats.today,
        Math.min(9000, stats.total)
      );

    renderStats(stats);
  }

  function scrollTo(id) {
    const element =
      getElement(id);

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function bindNavigation() {
    const chooseProductBtn =
      getElement("chooseProductBtn");

    const heroChanceBtn =
      getElement("heroChanceBtn");

    const prizeBuyBtn =
      getElement("prizeBuyBtn");

    const finalBuyBtn =
      getElement("finalBuyBtn");

    if (chooseProductBtn) {
      chooseProductBtn.addEventListener(
        "click",
        function () {
          scrollTo("products");
        }
      );
    }

    if (heroChanceBtn) {
      heroChanceBtn.addEventListener(
        "click",
        function () {
          scrollTo("chance");
        }
      );
    }

    if (prizeBuyBtn) {
      prizeBuyBtn.addEventListener(
        "click",
        function () {
          scrollTo("products");
        }
      );
    }

    if (finalBuyBtn) {
      finalBuyBtn.addEventListener(
        "click",
        function () {
          scrollTo("products");
        }
      );
    }
  }

  function bindKeyboardBehavior() {
    document.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key === "Enter" &&
          event.target.tagName === "INPUT"
        ) {
          return;
        }
      }
    );
  }

  async function init() {
    renderVisitors();
    renderStats(
      getFallbackStats()
    );

    bindNavigation();
    bindKeyboardBehavior();

    await loadCampaign();
    await loadLiveStats();

    /*
      عدد بازدیدکنندگان فقط هر ۲ تا ۴ دقیقه
      دوباره بررسی می‌شود و با Refresh تغییر نمی‌کند.
    */

    setInterval(
      renderVisitors,
      60 * 1000
    );

    /*
      آمار خرید و شرکت‌کنندگان
      هر ۲ دقیقه دوباره از سرور خوانده می‌شود.
    */

    setInterval(
      loadLiveStats,
      2 * 60 * 1000
    );
  }

  window.TTKALAA_MAIN = {
    loadCampaign,
    loadLiveStats,
    renderVisitors,
    getVisitorValue
  };

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})(window);
