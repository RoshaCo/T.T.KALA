/* =========================================================
   فایل اصلی مدیریت سایت T.T.KALAA
   اتصال بخش‌های مختلف، آمار لحظه‌ای و تعاملات عمومی
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     تنظیمات عمومی
     --------------------------------------------------------- */

  const CONFIG = {
    visitorUpdateMin: 180000,
    visitorUpdateMax: 240000,
    statsRefresh: 60000
  };

  /* ---------------------------------------------------------
     تبدیل اعداد به فارسی
     --------------------------------------------------------- */

  function toPersianNumber(value) {
    return String(value).replace(
      /\d/g,
      function (digit) {
        return "۰۱۲۳۴۵۶۷۸۹"[digit];
      }
    );
  }

  /* ---------------------------------------------------------
     تولید عدد تصادفی
     --------------------------------------------------------- */

  function randomInt(min, max) {
    return Math.floor(
      Math.random() * (max - min + 1)
    ) + min;
  }

  /* ---------------------------------------------------------
     تشخیص ساعت تهران
     --------------------------------------------------------- */

  function getTehranDate() {
    const parts =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone: "Asia/Tehran",
          hour: "numeric",
          minute: "numeric",
          hour12: false,
          weekday: "short"
        }
      ).formatToParts(new Date());

    const result = {};

    parts.forEach(function (part) {
      result[part.type] = part.value;
    });

    return {
      hour: Number(result.hour),
      minute: Number(result.minute),
      weekday: result.weekday
    };
  }

  /* ---------------------------------------------------------
     محدوده تعداد بازدیدکنندگان لحظه‌ای
     --------------------------------------------------------- */

  function getVisitorRange() {
    const tehran =
      getTehranDate();

    const hour =
      tehran.hour;

    const isFriday =
      tehran.weekday === "Fri";

    /*
     * ساعت ۱ بامداد تا ۸ صبح
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

    /*
     * جمعه از ساعت ۲ بامداد تا ۱۰ صبح
     */

    if (
      isFriday &&
      hour >= 2 &&
      hour < 10
    ) {
      return {
        min: 6,
        max: 23
      };
    }

    /*
     * سایر ساعات
     */

    return {
      min: 25,
      max: 34
    };
  }

  /* ---------------------------------------------------------
     تولید عدد بعدی بدون جهش شدید
     --------------------------------------------------------- */

  let currentVisitors = null;

  function getNextVisitorCount() {
    const range =
      getVisitorRange();

    if (
      currentVisitors === null ||
      currentVisitors < range.min ||
      currentVisitors > range.max
    ) {
      currentVisitors =
        randomInt(
          range.min,
          range.max
        );

      return currentVisitors;
    }

    let minNext =
      Math.max(
        range.min,
        currentVisitors - 2
      );

    let maxNext =
      Math.min(
        range.max,
        currentVisitors + 2
      );

    let next =
      randomInt(
        minNext,
        maxNext
      );

    /*
     * عدد قبلی پشت سر هم تکرار نشود.
     */

    if (
      next === currentVisitors
    ) {
      if (
        next < range.max
      ) {
        next++;
      } else {
        next--;
      }
    }

    currentVisitors =
      next;

    return currentVisitors;
  }

  /* ---------------------------------------------------------
     نمایش تعداد بازدیدکنندگان
     --------------------------------------------------------- */

  function updateVisitors() {
    const element =
      document.getElementById(
        "liveVisitors"
      );

    if (!element) return;

    const count =
      getNextVisitorCount();

    element.textContent =
      "همین حالا " +
      toPersianNumber(count) +
      " نفر در سایت هستند";
  }

  /* ---------------------------------------------------------
     زمان تغییر بعدی بازدیدکنندگان
     --------------------------------------------------------- */

  function scheduleVisitorUpdate() {
    const delay =
      randomInt(
        CONFIG.visitorUpdateMin,
        CONFIG.visitorUpdateMax
      );

    setTimeout(function () {
      updateVisitors();
      scheduleVisitorUpdate();
    }, delay);
  }

  /* ---------------------------------------------------------
     تولید آمار نمایشی خرید
     ---------------------------------------------------------
     این اعداد صرفاً برای نمایش وضعیت لحظه‌ای هستند
     و با اطلاعات واقعی سفارش‌ها یکی نیستند.
     --------------------------------------------------------- */

  function getDailyDisplayCount() {
    const now =
      getTehranDate();

    /*
     * یک مقدار ثابت بر اساس تاریخ روز ایجاد می‌کنیم
     * تا کاربران مختلف در همان روز عدد یکسان ببینند.
     */

    const dateParts =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone: "Asia/Tehran"
        }
      ).format(new Date());

    let seed = 0;

    for (
      let i = 0;
      i < dateParts.length;
      i++
    ) {
      seed =
        (seed * 31 +
          dateParts.charCodeAt(i)) %
        100000;
    }

    const value =
      90 +
      (seed % 323);

    return value;
  }

  /* ---------------------------------------------------------
     محاسبه مجموع نمایشی دوره
     سقف کل: ۹۰۰۰
     --------------------------------------------------------- */

  function getTotalDisplayCount() {
    const now =
      new Date();

    const tehranDate =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone: "Asia/Tehran"
        }
      ).format(now);

    let seed = 0;

    for (
      let i = 0;
      i < tehranDate.length;
      i++
    ) {
      seed =
        (seed * 37 +
          tehranDate.charCodeAt(i)) %
        1000000;
    }

    /*
     * مقدار بین ۳۰۰۰ تا ۸۹۹۹
     */

    return (
      3000 +
      (seed % 6000)
    );
  }

  /* ---------------------------------------------------------
     نمایش آمار نمایشی
     --------------------------------------------------------- */

  function updateDisplayStats() {
    const todayElement =
      document.getElementById(
        "todayParticipants"
      );

    const totalElement =
      document.getElementById(
        "totalParticipants"
      );

    const dailyCount =
      getDailyDisplayCount();

    let totalCount =
      getTotalDisplayCount();

    /*
     * جلوگیری از عبور مجموع از سقف ۹۰۰۰
     */

    totalCount =
      Math.min(
        totalCount,
        9000
      );

    if (todayElement) {
      todayElement.textContent =
        toPersianNumber(
          dailyCount
        );
    }

    if (totalElement) {
      totalElement.textContent =
        toPersianNumber(
          totalCount
        );
    }
  }

  /* ---------------------------------------------------------
     اسکرول نرم برای لینک‌های داخلی
     --------------------------------------------------------- */

  function setupSmoothScroll() {
    document.addEventListener(
      "click",
      function (event) {

        const link =
          event.target.closest(
            'a[href^="#"]'
          );

        if (!link) return;

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

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    );
  }

  /* ---------------------------------------------------------
     فعال‌سازی دکمه‌های انتخاب محصول
     --------------------------------------------------------- */

  function setupProductButtons() {
    document.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest(
            "[data-buy-product]"
          );

        if (!button) return;

        const productId =
          button.getAttribute(
            "data-buy-product"
          );

        if (
          window.TTKALAAPayment &&
          window.TTKALAAPayment
            .openPurchaseModal
        ) {
          window.TTKALAAPayment
            .openPurchaseModal(
              productId
            );
        }
      }
    );
  }

  /* ---------------------------------------------------------
     دکمه‌های CTA
     --------------------------------------------------------- */

  function setupCTAButtons() {
    document.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest(
            "[data-scroll-products]"
          );

        if (!button) return;

        const products =
          document.getElementById(
            "products"
          );

        if (!products) return;

        event.preventDefault();

        products.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    );
  }

  /* ---------------------------------------------------------
     کنترل منوی موبایل
     --------------------------------------------------------- */

  function setupMobileMenu() {
    const toggle =
      document.querySelector(
        "[data-menu-toggle]"
      );

    const menu =
      document.querySelector(
        "[data-mobile-menu]"
      );

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener(
      "click",
      function () {

        const isOpen =
          menu.classList.toggle(
            "is-open"
          );

        toggle.setAttribute(
          "aria-expanded",
          String(isOpen)
        );
      }
    );

    menu.addEventListener(
      "click",
      function (event) {

        if (
          event.target.closest("a")
        ) {
          menu.classList.remove(
            "is-open"
          );

          toggle.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );
  }

  /* ---------------------------------------------------------
     جلوگیری از کلیک دوباره هنگام پرداخت
     --------------------------------------------------------- */

  function preventDoubleSubmit() {
    document.addEventListener(
      "submit",
      function (event) {

        const form =
          event.target;

        if (
          form.dataset.processing ===
          "true"
        ) {
          event.preventDefault();
          return;
        }

        if (
          form.matches(
            "#purchaseForm"
          )
        ) {
          form.dataset.processing =
            "true";

          setTimeout(
            function () {
              form.dataset.processing =
                "false";
            },
            10000
          );
        }
      }
    );
  }

  /* ---------------------------------------------------------
     اجرای اولیه
     --------------------------------------------------------- */

  function init() {

    updateVisitors();

    scheduleVisitorUpdate();

    updateDisplayStats();

    setInterval(
      updateDisplayStats,
      CONFIG.statsRefresh
    );

    setupSmoothScroll();

    setupProductButtons();

    setupCTAButtons();

    setupMobileMenu();

    preventDoubleSubmit();
  }

  /* ---------------------------------------------------------
     شروع سایت
     --------------------------------------------------------- */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
