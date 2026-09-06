/* =========================================================
   T.T.KALAA — API
   ارتباط امن فرانت‌اند با بک‌اند
========================================================= */

(function () {
  "use strict";

  /* =======================================================
     تنظیمات اصلی API
  ======================================================= */

  const CONFIG = {
    baseURL: "https://api.ttkalaa.ir/api",
    timeout: 15000
  };


  /* =======================================================
     خطای اختصاصی API
  ======================================================= */

  class TTKALAAApiError extends Error {
    constructor(message, status = 0, code = "API_ERROR", data = null) {
      super(message);

      this.name = "TTKALAAApiError";
      this.status = status;
      this.code = code;
      this.data = data;
    }
  }


  /* =======================================================
     تبدیل اعداد فارسی و عربی به انگلیسی
     برای پردازش داخلی شماره موبایل
  ======================================================= */

  function normalizeDigits(value) {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value)
      .replace(/[۰-۹]/g, function (digit) {
        return String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
      })
      .replace(/[٠-٩]/g, function (digit) {
        return String("٠١٢٣٤٥٦٧٨٩".indexOf(digit));
      });
  }


  /* =======================================================
     نرمال‌سازی شماره موبایل
     
     نکته:
     سایت فقط شماره کامل ۱۱ رقمی ایران را قبول می‌کند.
     
     نمونه معتبر:
     09357777777
     ۰۹۳۵۷۷۷۷۷۷۷
     
     شماره ناقص هرگز به عنوان شماره معتبر پذیرفته نمی‌شود.
  ======================================================= */

  function normalizeMobile(value) {
    let mobile = normalizeDigits(value)
      .replace(/[\s\-\(\)]/g, "");

    if (mobile.startsWith("+98")) {
      mobile = "0" + mobile.slice(3);
    }

    if (mobile.startsWith("0098")) {
      mobile = "0" + mobile.slice(4);
    }

    if (!/^09\d{9}$/.test(mobile)) {
      return null;
    }

    return mobile;
  }


  /* =======================================================
     ساخت URL
  ======================================================= */

  function buildURL(path) {
    const cleanBase = CONFIG.baseURL.replace(/\/+$/, "");
    const cleanPath = String(path).replace(/^\/+/, "");

    return cleanBase + "/" + cleanPath;
  }


  /* =======================================================
     درخواست عمومی
  ======================================================= */

  async function request(path, options = {}) {
    const controller = new AbortController();

    const timeoutId = setTimeout(function () {
      controller.abort();
    }, CONFIG.timeout);

    const requestOptions = {
      method: options.method || "GET",
      headers: {
        "Accept": "application/json",
        ...(options.body
          ? {
              "Content-Type": "application/json"
            }
          : {}),
        ...(options.headers || {})
      },
      credentials: "include",
      signal: controller.signal
    };

    if (options.body !== undefined && options.body !== null) {
      requestOptions.body =
        typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(
        buildURL(path),
        requestOptions
      );

      clearTimeout(timeoutId);

      let data = null;

      const contentType =
        response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch (error) {
          data = null;
        }
      } else {
        try {
          data = await response.text();
        } catch (error) {
          data = null;
        }
      }


      /* ===================================================
         پاسخ موفق
      =================================================== */

      if (response.ok) {
        return data;
      }


      /* ===================================================
         استخراج پیام فنی از بک‌اند
      =================================================== */

      const backendMessage =
        data &&
        typeof data === "object" &&
        (
          data.message ||
          data.error ||
          data.detail
        );

      throw new TTKALAAApiError(
        backendMessage ||
          "خطا در ارتباط با سرور.",
        response.status,
        data &&
        typeof data === "object" &&
        data.code
          ? data.code
          : "HTTP_ERROR",
        data
      );

    } catch (error) {

      clearTimeout(timeoutId);

      if (error instanceof TTKALAAApiError) {
        throw error;
      }

      if (error.name === "AbortError") {
        throw new TTKALAAApiError(
          "زمان پاسخ‌گویی سرور به پایان رسید.",
          0,
          "TIMEOUT"
        );
      }

      throw new TTKALAAApiError(
        "ارتباط با سرور برقرار نشد.",
        0,
        "NETWORK_ERROR"
      );
    }
  }


  /* =======================================================
     GET
  ======================================================= */

  async function get(path, options = {}) {
    return request(path, {
      ...options,
      method: "GET"
    });
  }


  /* =======================================================
     POST
  ======================================================= */

  async function post(path, body = {}, options = {}) {
    return request(path, {
      ...options,
      method: "POST",
      body
    });
  }


  /* =======================================================
     دریافت دوره جاری
  ======================================================= */

  async function getCurrentCampaign() {
    return get("/campaign/current");
  }


  /* =======================================================
     دریافت یک دوره مشخص
  ======================================================= */

  async function getCampaign(campaignId) {
    if (!campaignId) {
      throw new TTKALAAApiError(
        "شناسه دوره مشخص نیست.",
        0,
        "INVALID_CAMPAIGN_ID"
      );
    }

    return get(
      "/campaign/" +
      encodeURIComponent(campaignId)
    );
  }


  /* =======================================================
     دریافت محصولات
  ======================================================= */

  async function getProducts() {
    return get("/products");
  }


  /* =======================================================
     دریافت محصول
  ======================================================= */

  async function getProduct(productId) {
    if (!productId) {
      throw new TTKALAAApiError(
        "شناسه محصول مشخص نیست.",
        0,
        "INVALID_PRODUCT_ID"
      );
    }

    return get(
      "/products/" +
      encodeURIComponent(productId)
    );
  }


  /* =======================================================
     آمار لحظه‌ای
     
     این اطلاعات باید از بک‌اند بیاید تا:
     - برای همه کاربران یکسان باشد
     - با Refresh تغییر تصادفی نکند
     - روی دستگاه‌های مختلف یک مقدار مشترک داشته باشد
  ======================================================= */

  async function getLiveStats(campaignId) {
    const query =
      campaignId
        ? "?campaignId=" +
          encodeURIComponent(campaignId)
        : "";

    return get("/live-stats" + query);
  }


  /* =======================================================
     بررسی شانس
     
     مهم:
     نتیجه این endpoint باید فقط یکی از دو وضعیت
     user-facing زیر باشد:
     
     BUYER
     NON_BUYER
     
     اگر شماره معتبر باشد ولی خریدی برای آن ثبت نشده باشد،
     بک‌اند باید NON_BUYER برگرداند؛
     نه خطای 404 یا خطای «اطلاعات پیدا نشد».
  ======================================================= */

  async function lookupChance(mobile, campaignId) {
    const normalizedMobile = normalizeMobile(mobile);

    if (!normalizedMobile) {
      throw new TTKALAAApiError(
        "شماره موبایل معتبر نیست.",
        400,
        "INVALID_MOBILE"
      );
    }

    if (!campaignId) {
      throw new TTKALAAApiError(
        "دوره جاری مشخص نیست.",
        0,
        "INVALID_CAMPAIGN_ID"
      );
    }

    const response = await post(
      "/chance/lookup",
      {
        mobile: normalizedMobile,
        campaignId: campaignId
      }
    );


    /* ===================================================
       استانداردسازی پاسخ بک‌اند
    =================================================== */

    if (!response || typeof response !== "object") {
      throw new TTKALAAApiError(
        "پاسخ معتبر از سرور دریافت نشد.",
        0,
        "INVALID_API_RESPONSE"
      );
    }

    const rawStatus =
      response.status ||
      response.result ||
      response.state ||
      response.type;

    const normalizedStatus =
      String(rawStatus || "")
        .trim()
        .toUpperCase();


    /* ===================================================
       فقط دو وضعیت معتبر برای کاربر
    =================================================== */

    if (
      normalizedStatus === "BUYER" ||
      normalizedStatus === "PURCHASED" ||
      normalizedStatus === "ENTERED"
    ) {
      return {
        status: "BUYER",

        purchaseCount:
          Number(
            response.purchaseCount ??
            response.purchases ??
            response.totalPurchases ??
            0
          ) || 0,

        chanceCount:
          Number(
            response.chanceCount ??
            response.chances ??
            response.totalChances ??
            response.purchaseCount ??
            0
          ) || 0,

        trackingCode:
          response.trackingCode ||
          response.tracking_code ||
          response.orderTrackingCode ||
          "",

        productName:
          response.productName ||
          response.product ||
          "",

        products:
          Array.isArray(response.products)
            ? response.products
            : [],

        campaignId:
          response.campaignId ||
          campaignId,

        mobile:
          normalizedMobile
      };
    }


    if (
      normalizedStatus === "NON_BUYER" ||
      normalizedStatus === "NOT_ENTERED" ||
      normalizedStatus === "NOT_PURCHASED"
    ) {
      return {
        status: "NON_BUYER",

        campaignId:
          response.campaignId ||
          campaignId,

        mobile:
          normalizedMobile
      };
    }


    /* ===================================================
       اگر بک‌اند پاسخ را با وضعیت واضح نفرستاده باشد،
       آن را نتیجه کاربر تلقی نمی‌کنیم.
    =================================================== */

    throw new TTKALAAApiError(
      "پاسخ بررسی شانس قابل تشخیص نیست.",
      0,
      "INVALID_CHANCE_STATUS",
      response
    );
  }


  /* =======================================================
     ایجاد سفارش
     
     موبایل در این مرحله دریافت نمی‌شود.
     
     ترتیب درست:
     محصول
       ↓
     ایجاد سفارش
       ↓
     پرداخت زرین‌پال
       ↓
     تأیید پرداخت
       ↓
     ثبت موبایل
       ↓
     ثبت شانس
  ======================================================= */

  async function createOrder({
    productId,
    campaignId
  } = {}) {

    if (!productId) {
      throw new TTKALAAApiError(
        "محصول مشخص نشده است.",
        400,
        "INVALID_PRODUCT_ID"
      );
    }

    if (!campaignId) {
      throw new TTKALAAApiError(
        "دوره جاری مشخص نیست.",
        400,
        "INVALID_CAMPAIGN_ID"
      );
    }

    return post(
      "/orders",
      {
        productId,
        campaignId
      }
    );
  }


  /* =======================================================
     شروع پرداخت
  ======================================================= */

  async function startPayment(orderId) {

    if (!orderId) {
      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست.",
        400,
        "INVALID_ORDER_ID"
      );
    }

    return post(
      "/payments/start",
      {
        orderId
      }
    );
  }


  /* =======================================================
     دریافت نتیجه پرداخت
  ======================================================= */

  async function getPaymentResult(orderId) {

    if (!orderId) {
      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست.",
        400,
        "INVALID_ORDER_ID"
      );
    }

    return get(
      "/payments/result?orderId=" +
      encodeURIComponent(orderId)
    );
  }


  /* =======================================================
     دریافت سفارش
  ======================================================= */

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


  /* =======================================================
     ثبت شماره موبایل بعد از پرداخت
     
     این مرحله بعد از پرداخت موفق انجام می‌شود.
     بک‌اند باید:
     - شماره را اعتبارسنجی کند
     - سفارش را بررسی کند
     - پرداخت را بررسی کند
     - شماره را به همان سفارش متصل کند
     - خرید را در دوره جاری ثبت کند
     - یک شانس برای همان خرید ثبت کند
     - در برابر ثبت تکراری مقاوم باشد
  ======================================================= */

  async function registerPurchaseMobile({
    orderId,
    mobile
  } = {}) {

    if (!orderId) {
      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست.",
        400,
        "INVALID_ORDER_ID"
      );
    }

    const normalizedMobile =
      normalizeMobile(mobile);

    if (!normalizedMobile) {
      throw new TTKALAAApiError(
        "شماره موبایل معتبر نیست.",
        400,
        "INVALID_MOBILE"
      );
    }

    return post(
      "/orders/register-mobile",
      {
        orderId,
        mobile: normalizedMobile
      }
    );
  }


  /* =======================================================
     دریافت لینک دانلود
     
     لینک واقعی فایل نباید مستقیماً داخل HTML باشد.
     بک‌اند باید بعد از بررسی سفارش، لینک امن
     و ترجیحاً زمان‌دار ایجاد کند.
  ======================================================= */

  async function getDownloadLink(orderId) {

    if (!orderId) {
      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست.",
        400,
        "INVALID_ORDER_ID"
      );
    }

    return get(
      "/orders/" +
      encodeURIComponent(orderId) +
      "/download"
    );
  }


  /* =======================================================
     سلامت API
  ======================================================= */

  async function healthCheck() {
    return get("/health");
  }


  /* =======================================================
     پیام خطای قابل استفاده در رابط کاربری
     
     خطای فنی را نباید به عنوان «خریدار نیست» نشان داد.
  ======================================================= */

  function getUserSafeError(error) {

    if (!error) {
      return "ارتباط با سرور برقرار نشد.";
    }

    if (
      error.code === "INVALID_MOBILE"
    ) {
      return "شماره موبایل معتبر نیست.";
    }

    if (
      error.code === "TIMEOUT"
    ) {
      return "ارتباط با سرور کمی طول کشید. دوباره تلاش کنید.";
    }

    if (
      error.code === "NETWORK_ERROR"
    ) {
      return "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
    }

    if (
      error.code === "INVALID_CHANCE_STATUS" ||
      error.code === "INVALID_API_RESPONSE"
    ) {
      return "پاسخ بررسی شانس کامل دریافت نشد. دوباره تلاش کنید.";
    }

    return "امکان انجام درخواست وجود ندارد. دوباره تلاش کنید.";
  }


  /* =======================================================
     خروجی عمومی
  ======================================================= */

  window.TTKALAAApi = {

    config: CONFIG,

    TTKALAAApiError,

    normalizeDigits,
    normalizeMobile,

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

    registerPurchaseMobile,

    getDownloadLink,

    healthCheck,

    getUserSafeError
  };

})();
