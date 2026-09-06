/* =========================================================
   T.T.KALAA - هسته اصلی رابط کاربری
   مدیریت آمار زنده، آمار دوره، محصولات و تعاملات صفحه
   ========================================================= */

(function () {
  "use strict";

  let currentCampaign = null;
  let currentStats = null;

  let visitorTimer = null;
  let statsTimer = null;

  let lastVisitorNumber = null;
  let lastVisitorChangeAt = 0;

  /* =========================================================
     ابزارهای عمومی
     ========================================================= */

  function toPersianNumber(value) {
    return String(value).replace(/\d/g, function (digit) {
      return "۰۱۲۳۴۵۶۷۸۹"[digit];
    });
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("fa-IR");
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =========================================================
     ساعت تهران
     ========================================================= */

  function getTehranHour() {
    try {
      const formatter = new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone: "Asia/Tehran",
          hour: "numeric",
          hour12: false
        }
      );

      return Number(formatter.format(new Date()));
    } catch (error) {
      return new Date().getHours();
    }
  }

  function getTehranWeekday() {
    try {
      const formatter = new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone: "Asia/Tehran",
          weekday: "short"
        }
      );

      return formatter.format(new Date());
    } catch (error) {
      return new Date().toLocaleDateString(
        "en-US",
        { weekday: "short" }
      );
    }
  }

  /* =========================================================
     تولید عدد بازدیدکننده
     توجه:
     عدد واقعی و مشترک بین همه کاربران باید از backend بیاید.
     این تابع فقط fallback کنترل‌شده است.
     ========================================================= */

  function getVisitorRange() {
    const hour = getTehranHour();
    const weekday = getTehranWeekday();

    /*
      جمعه بین ساعت ۲ تا ۱۰ صبح:
      ۶ تا ۲۳ نفر
    */
    if (
      weekday === "Fri" &&
      hour >= 2 &&
      hour < 10
    ) {
      return {
        min: 6,
        max: 23
      };
    }

    /*
      ساعت ۱ بامداد تا ۸ صبح:
      ۷ تا ۱۹ نفر
    */
    if (hour >= 1 && hour < 8) {
      return {
        min: 7,
        max: 19
      };
    }

    /*
      سایر ساعات:
      ۲۵ تا ۳۴ نفر
    */
    return {
      min: 25,
      max: 34
    };
  }

  /*
    عدد fallback با تغییر تدریجی تولید می‌شود.
    تغییر بزرگ ناگهانی مجاز نیست.
  */
  function generateVisitorNumber() {
    const range = getVisitorRange();

    if (lastVisitorNumber === null) {
      return Math.floor(
        Math.random() *
          (range.max - range.min + 1)
      ) + range.min;
    }

    let candidates = [];

    for (
      let value = range.min;
      value <= range.max;
      value++
    ) {
      if (
        Math.abs(value - lastVisitorNumber) <= 2
      ) {
        candidates.push(value);
      }
    }

    if (!candidates.length) {
      candidates.push(range.min);
    }

    /*
      عدد قبلی حداکثر یک بار پشت سر هم تکرار می‌شود.
    */
    if (
      candidates.length > 1 &&
      candidates.includes(lastVisitorNumber)
    ) {
      candidates = candidates.filter(
        value => value !== lastVisitorNumber
      );
    }

    const next =
      candidates[
        Math.floor(
          Math.random() * candidates.length
        )
      ];

    lastVisitorNumber = next;

    return next;
  }

  function renderVisitors(number) {
    const element =
      document.getElementById(
        "liveVisitorsNumber"
      );

    if (!element) {
      return;
    }

    element.textContent =
      toPersianNumber(number);
  }

  /*
    در حالت عادی backend باید عدد مشترک را ارسال کند.
    اگر backend در دسترس نباشد، fallback محلی استفاده می‌شود.
  */
  async function loadLiveStats() {
    try {
      if (
        !window.TTKALAAApi ||
        typeof window.TTKALAAApi.getLiveStats !==
          "function"
      ) {
        throw new Error(
          "Live stats API unavailable"
        );
      }

      if (!currentCampaign) {
        await loadCampaign();
      }

      const campaignId =
        getCampaignId(currentCampaign);

      if (!campaignId) {
        throw new Error(
          "Campaign ID unavailable"
        );
      }

      const response =
        await window.TTKALAAApi.getLiveStats(
          campaignId
        );

      currentStats =
        response && response.data
          ? response.data
          : response;

      if (
        currentStats &&
        (
          currentStats.visitors !== undefined ||
          currentStats.liveVisitors !== undefined ||
          currentStats.live_visitors !== undefined
        )
      ) {
        const visitors = Number(
          currentStats.visitors ??
          currentStats.liveVisitors ??
          currentStats.live_visitors
        );

        if (
          Number.isFinite(visitors) &&
          visitors >= 0
        ) {
          lastVisitorNumber = visitors;
          renderVisitors(visitors);
        }
      }

      updateCampaignStats(currentStats);

      return currentStats;
    } catch (error) {
      /*
        fallback فقط برای نمایش ظاهری سایت است.
        داده‌های خرید و شرکت‌کنندگان از backend جعل نمی‌شوند.
      */
      console.warn(
        "Live stats unavailable:",
        error
      );

      renderVisitors(
        generateVisitorNumber()
      );

      return null;
    }
  }

  /* =========================================================
     تغییر دوره‌ای عدد بازدیدکننده
     ========================================================= */

  function startVisitorFallbackTimer() {
    if (visitorTimer) {
      clearInterval(visitorTimer);
    }

    /*
      هر ۳ تا ۴ دقیقه یک تغییر تدریجی.
    */
    const scheduleNext = function () {
      const delay =
        180000 +
        Math.floor(
          Math.random() * 60001
        );

      visitorTimer = setTimeout(
        async function () {
          await loadLiveStats();

          scheduleNext();
        },
        delay
      );
    };

    scheduleNext();
  }

  /* =========================================================
     دوره جاری
     ========================================================= */

  function getCampaignId(campaign) {
    return (
      campaign &&
      (
        campaign.id ||
        campaign.campaignId ||
        campaign.campaign_id
      )
    );
  }

  function getCampaignTitle(campaign) {
    return (
      campaign &&
      (
        campaign.title ||
        campaign.name ||
        campaign.label
      )
    ) || "دوره جاری";
  }

  function updateCampaignTitle(campaign) {
    const elements = [
      document.getElementById(
        "campaignSeasonInline"
      )
    ];

    const title =
      getCampaignTitle(campaign);

    elements.forEach(function (element) {
      if (element) {
        element.textContent =
          title;
      }
    });
  }

  async function loadCampaign() {
    try {
      if (
        !window.TTKALAAApi ||
        typeof window.TTKALAAApi
          .getCurrentCampaign !== "function"
      ) {
        return null;
      }

      const response =
        await window.TTKALAAApi
          .getCurrentCampaign();

      currentCampaign =
        response && response.data
          ? response.data
          : response && response.campaign
          ? response.campaign
          : response;

      if (currentCampaign) {
        updateCampaignTitle(
          currentCampaign
        );
      }

      return currentCampaign;
    } catch (error) {
      console.warn(
        "Campaign load error:",
        error
      );

      return null;
    }
  }

  /* =========================================================
     آمار خرید امروز و کل شرکت‌کنندگان
     ========================================================= */

  function updateCampaignStats(stats) {
    if (!stats) {
      return;
    }

    const todayElement =
      document.getElementById(
        "todayPurchases"
      );

    const totalElement =
      document.getElementById(
        "totalParticipants"
      );

    const today =
      stats.todayPurchases ??
      stats.today_purchases ??
      stats.today;

    const total =
      stats.totalParticipants ??
      stats.total_participants ??
      stats.total;

    /*
      اگر backend مقدار معتبر ارسال کرده باشد
      همان مقدار نمایش داده می‌شود.
    */
    if (
      todayElement &&
      today !== undefined &&
      Number.isFinite(Number(today))
    ) {
      todayElement.textContent =
        formatNumber(today);
    }

    if (
      totalElement &&
      total !== undefined &&
      Number.isFinite(Number(total))
    ) {
      totalElement.textContent =
        formatNumber(total);
    }
  }

  /* =========================================================
     بارگذاری محصولات
     ========================================================= */

  function renderProducts() {
    if (
      !window.TTKALAAProducts ||
      typeof window.TTKALAAProducts.renderProducts !==
        "function"
    ) {
      return;
    }

    /*
      products.js خودش محل مناسب نمایش محصولات را پیدا می‌کند.
    */
    window.TTKALAAProducts.renderProducts();
  }

  /* =========================================================
     بروزرسانی دوره‌ای آمار
     ========================================================= */

  function startStatsTimer() {
    if (statsTimer) {
      clearInterval(statsTimer);
    }

    /*
      آمار اصلی از backend دریافت می‌شود.
      بازدیدکننده نیز از همین مسیر به‌روزرسانی می‌شود.
    */
    statsTimer = setInterval(
      function () {
        loadLiveStats();
      },
      180000
    );
  }

  /* =========================================================
     لینک‌های داخلی صفحه
     ========================================================= */

  function bindSmoothLinks() {
    document.addEventListener(
      "click",
      function (event) {
        const link =
          event.target.closest(
            'a[href^="#"]'
          );

        if (!link) {
          return;
        }

        const targetId =
          link.getAttribute("href");

        if (
          !targetId ||
          targetId === "#"
        ) {
          return;
        }

        const target =
          document.querySelector(
            targetId
          );

        if (!target) {
          return;
        }

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    );
  }

  /* =========================================================
     جلوگیری از رفتار ناخواسته فرم‌ها
     ========================================================= */

  function bindForms() {
    document.addEventListener(
      "submit",
      function (event) {
        const form = event.target;

        if (!form) {
          return;
        }

        /*
          فرم بررسی شانس توسط chance.js مدیریت می‌شود.
          بنابراین ارسال سنتی فرم نباید انجام شود.
        */
        if (
          form.id === "chanceForm"
        ) {
          event.preventDefault();
        }
      }
    );
  }

  /* =========================================================
     نمایش وضعیت اولیه بازدیدکننده
     ========================================================= */

  function initializeVisitorDisplay() {
    const element =
      document.getElementById(
        "liveVisitorsNumber"
      );

    if (!element) {
      return;
    }

    /*
      تا رسیدن داده backend، یک عدد fallback نمایش داده می‌شود.
    */
    renderVisitors(
      generateVisitorNumber()
    );
  }

  /* =========================================================
     اجرای اصلی سایت
     ========================================================= */

  async function initialize() {
    initializeVisitorDisplay();

    bindSmoothLinks();
    bindForms();

    renderProducts();

    await loadCampaign();

    await loadLiveStats();

    /*
      fallback / بروزرسانی دوره‌ای
    */
    startVisitorFallbackTimer();
    startStatsTimer();

    /*
      اگر countdown.js وجود داشته باشد،
      خودش نیز دوره جاری را دریافت می‌کند.
    */
    if (
      window.TTKALAA_Countdown &&
      typeof window.TTKALAA_Countdown.load ===
        "function"
    ) {
      window.TTKALAA_Countdown.load();
    }
  }

  /* =========================================================
     خروجی عمومی
     ========================================================= */

  window.TTKALAAMain = {
    loadCampaign,
    loadLiveStats,
    renderProducts,
    updateCampaignStats,
    getCurrentCampaign: function () {
      return currentCampaign;
    },
    getCurrentStats: function () {
      return currentStats;
    }
  };

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );
  } else {
    initialize();
  }
})();
