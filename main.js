/* =========================================================
   فایل اصلی مدیریت سایت T.T.KALAA
   اتصال بخش‌های مختلف، آمار لحظه‌ای و تعاملات عمومی
   به‌روزرسانی: فیک ریویو یکسان برای همه، خرید روزانه،
   مجموع دوره، صفحه قوانین و مدیریت دکمه برگشت
========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     تنظیمات عمومی
     --------------------------------------------------------- */

  const CONFIG = {
    visitorUpdateMin: 120000,
    visitorUpdateMax: 240000,
    statsRefresh: 60000,
    testimonialInterval: 3000,
    storageKey: "ttkalaa_shared_visitor",
    dailyStorageKey: "ttkalaa_daily_purchases",
    periodStorageKey: "ttkalaa_period_total"
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

    if (
      hour >= 1 &&
      hour < 8
    ) {
      return {
        min: 7,
        max: 19
      };
    }

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
     به‌صورت یکسان برای همه کاربران
     --------------------------------------------------------- */

  function updateVisitors() {
    const element =
      document.getElementById(
        "liveVisitors"
      );

    if (!element) return;

    const now = new Date();
    const currentMinute =
      now.getUTCMinutes();

    let stored =
      localStorage.getItem(
        CONFIG.storageKey
      );

    let sharedData = null;

    if (stored) {
      try {
        sharedData = JSON.parse(stored);
      } catch {
        sharedData = null;
      }
    }

    if (
      !sharedData ||
      !sharedData.value ||
      !sharedData.timestamp
    ) {
      sharedData = {
        value: randomInt(
          19,
          31
        ),
        timestamp: now.getTime()
      };

      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(sharedData)
      );
    }

    const elapsed =
      now.getTime() - sharedData.timestamp;

    const updateInterval =
      randomInt(
        CONFIG.visitorUpdateMin,
        CONFIG.visitorUpdateMax
      );

    if (elapsed >= updateInterval) {
      const range =
        getVisitorRange();

      let next;

      if (
        Number(sharedData.value) <
        range.min ||
        Number(sharedData.value) >
        range.max
      ) {
        next = randomInt(
          range.min,
          range.max
        );
      } else {
        const minNext =
          Math.max(
            range.min,
            Number(sharedData.value) - 2
          );

        const maxNext =
          Math.min(
            range.max,
            Number(sharedData.value) + 2
          );

        next =
          randomInt(
            minNext,
            maxNext
          );

        if (
          next ===
          Number(sharedData.value)
        ) {
          if (next < range.max) {
            next++;
          } else {
            next--;
          }
        }
      }

      sharedData = {
        value: next,
        timestamp: now.getTime()
      };

      localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(sharedData)
      );
    }

    element.textContent =
      "همین حالا " +
      toPersianNumber(
        sharedData.value
      ) +
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
     تولید عدد روزانه خرید
     --------------------------------------------------------- */

  function getDailyPurchases() {
    const now = new Date();

    const tehranString =
      now.toLocaleString("en-US", {
        timeZone: "Asia/Tehran"
      });

    const tehranNow =
      new Date(tehranString);

    const dayKey =
      String(tehranNow.getFullYear()) +
      "-" +
      String(tehranNow.getMonth() + 1) +
      "-" +
      String(tehranNow.getDate());

    let stored =
      localStorage.getItem(
        CONFIG.dailyStorageKey
      );

    let dailyData = null;

    if (stored) {
      try {
        dailyData = JSON.parse(stored);
      } catch {
        dailyData = null;
      }
    }

    if (
      !dailyData ||
      dailyData.day !== dayKey
    ) {
      const periodTotal =
        getPeriodTotal();

      const newDaily =
        0;

      dailyData = {
        day: dayKey,
        value: newDaily
      };

      localStorage.setItem(
        CONFIG.dailyStorageKey,
        JSON.stringify(dailyData)
      );

      updatePeriodTotal(
        periodTotal + newDaily
      );
    }

    const currentHour =
      tehranNow.getHours();

    const currentMinute =
      tehranNow.getMinutes();

    const progress =
      currentHour +
      currentMinute / 60;

    const maxDaily =
      83;

    const target =
      Math.min(
        maxDaily,
        Math.floor(
          maxDaily *
          Math.min(
            1,
            progress / 24
          )
        )
      );

    let currentValue =
      Number(dailyData.value);

    if (currentValue < target) {
      currentValue +=
        randomInt(0, 3);

      if (currentValue > target) {
        currentValue = target;
      }

      dailyData.value =
        currentValue;

      localStorage.setItem(
        CONFIG.dailyStorageKey,
        JSON.stringify(dailyData)
      );

      const periodTotal =
        getPeriodTotal();

      updatePeriodTotal(
        periodTotal +
        (currentValue -
          Number(dailyData.value) +
          currentValue)
      );
    }

    return dailyData.value;
  }

  /* ---------------------------------------------------------
     مجموع خریدهای این دوره
     --------------------------------------------------------- */

  function getPeriodTotal() {
    let stored =
      localStorage.getItem(
        CONFIG.periodStorageKey
      );

    if (stored) {
      const value =
        Number(stored);

      if (!isNaN(value)) {
        return value;
      }
    }

    const initial =
      randomInt(
        2500,
        4000
      );

    localStorage.setItem(
      CONFIG.periodStorageKey,
      String(initial)
    );

    return initial;
  }

  function updatePeriodTotal(value) {
    localStorage.setItem(
      CONFIG.periodStorageKey,
      String(value)
    );
  }

  /* ---------------------------------------------------------
     نمایش آمار وضعیت لحظه‌ای
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

    const periodElement =
      document.getElementById(
        "totalPurchases"
      );

    const dailyCount =
      getDailyPurchases();

    const periodTotal =
      getPeriodTotal();

    if (todayElement) {
      todayElement.textContent =
        toPersianNumber(
          dailyCount
        );
    }

    if (totalElement) {
      totalElement.textContent =
        toPersianNumber(
          dailyCount
        );
    }

    if (periodElement) {
      periodElement.textContent =
        toPersianNumber(
          periodTotal
        );
    }
  }

  /* ---------------------------------------------------------
     نظرات متحرک
     --------------------------------------------------------- */

  let currentTestimonialIndex = 0;

  function setupTestimonialSlider() {
    const slides =
      document.querySelectorAll(
        ".testimonial-slide"
      );

    if (slides.length === 0) {
      return;
    }

    function showNextTestimonial() {
      slides.forEach(function (slide) {
        slide.classList.remove(
          "is-active"
        );
      });

      currentTestimonialIndex =
        (currentTestimonialIndex + 1) %
        slides.length;

      slides[currentTestimonialIndex]
        .classList.add(
          "is-active"
        );
    }

    setInterval(
      showNextTestimonial,
      CONFIG.testimonialInterval
    );
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
     صفحه قوانین و مدیریت دکمه برگشت
     --------------------------------------------------------- */

  function setupLicensePage() {
    const licensePage =
      document.getElementById(
        "licensePage"
      );

    const licenseClose =
      document.getElementById(
        "licenseClose"
      );

    const footerRules =
      document.getElementById(
        "footerRules"
      );

    if (
      !licensePage ||
      !licenseClose ||
      !footerRules
    ) {
      return;
    }

    function openLicense() {
      licensePage.hidden = false;

      history.pushState(
        "license",
        ""
      );
    }

    function closeLicense() {
      licensePage.hidden = true;

      history.pushState(
        "home",
        ""
      );
    }

    footerRules.addEventListener(
      "click",
      function () {
        openLicense();
      }
    );

    licenseClose.addEventListener(
      "click",
      function () {
        closeLicense();
      }
    );

    window.addEventListener(
      "popstate",
      function (event) {
        if (!licensePage.hidden) {
          closeLicense();
        } else {
          window.location.href =
            "https://instagram.com/t.t.kalaa";
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

    setupTestimonialSlider();

    setupSmoothScroll();

    setupProductButtons();

    setupCTAButtons();

    setupMobileMenu();

    preventDoubleSubmit();

    setupLicensePage();
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
