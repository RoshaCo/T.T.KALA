/* =========================================================
   ارتباط سایت T.T.KALAA با سرور
========================================================= */

(function () {
  "use strict";

  /* =========================================================
     تنظیمات اتصال به سرور
  ========================================================== */

  const CONFIG = {
    baseURL: "https://api.ttkalaa.ir/api",
    timeout: 15000
  };


  /* =========================================================
     خطای اختصاصی API
  ========================================================== */

  class TTKALAAApiError extends Error {
    constructor(message, status = 0, data = null) {
      super(message);
      this.name = "TTKALAAApiError";
      this.status = status;
      this.data = data;
    }
  }


  /* =========================================================
     تبدیل اعداد فارسی و عربی به انگلیسی
  ========================================================== */

  function normalizeDigits(value) {
    return String(value || "")
      .replace(/[۰-۹]/g, function (digit) {
        return String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
      })
      .replace(/[٠-٩]/g, function (digit) {
        return String("٠١٢٣٤٥٦٧٨٩".indexOf(digit));
      });
  }


  /* =========================================================
     تمیز کردن شماره موبایل
  ========================================================== */

  function normalizeMobile(value) {
    let mobile = normalizeDigits(value)
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "");

    if (mobile.startsWith("+98")) {
      mobile = "0" + mobile.slice(3);
    }

    if (mobile.startsWith("0098")) {
      mobile = "0" + mobile.slice(4);
    }

    return mobile;
  }


  /* =========================================================
     بررسی شماره موبایل
  ========================================================== */

  function isValidMobile(value) {
    const mobile = normalizeMobile(value);
    return /^09\d{9}$/.test(mobile);
  }


  /* =========================================================
     درخواست عمومی به API
  ========================================================== */

  async function request(path, options = {}) {

    const controller = new AbortController();

    const timeoutId = setTimeout(function () {
      controller.abort();
    }, CONFIG.timeout);


    try {

      const headers = {
        Accept: "application/json",
        ...(options.body
          ? {
              "Content-Type": "application/json"
            }
          : {}),
        ...(options.headers || {})
      };


      const response = await fetch(
        CONFIG.baseURL + path,
        {
          method: options.method || "GET",

          headers,

          body:
            options.body !== undefined
              ? JSON.stringify(options.body)
              : undefined,

          credentials: "omit",

          cache: "no-store",

          signal: controller.signal
        }
      );


      let data = null;

      const contentType =
        response.headers.get("content-type") || "";


      if (contentType.includes("application/json")) {

        try {
          data = await response.json();
        } catch {
          data = null;
        }

      } else {

        try {
          data = await response.text();
        } catch {
          data = null;
        }

      }


      if (!response.ok) {

        const message =
          data &&
          typeof data === "object" &&
          (data.message || data.error)
            ? data.message || data.error
            : "ارتباط با سرور با مشکل مواجه شد.";

        throw new TTKALAAApiError(
          message,
          response.status,
          data
        );
      }


      return data;

    } catch (error) {

      if (error.name === "AbortError") {

        throw new TTKALAAApiError(
          "زمان پاسخ‌گویی سرور به پایان رسید.",
          408
        );
      }


      if (error instanceof TTKALAAApiError) {
        throw error;
      }


      throw new TTKALAAApiError(
        "اتصال به سرور برقرار نشد.",
        0,
        error
      );

    } finally {

      clearTimeout(timeoutId);
    }
  }


  /* =========================================================
     GET
  ========================================================== */

  async function get(path) {
    return request(path, {
      method: "GET"
    });
  }


  /* =========================================================
     POST
  ========================================================== */

  async function post(path, body) {
    return request(path, {
      method: "POST",
      body
    });
  }


  /* =========================================================
     دریافت دوره جاری
  ========================================================== */

  async function getCurrentCampaign() {
    return get("/campaign/current");
  }


  /* =========================================================
     دریافت یک دوره
  ========================================================== */

  async function getCampaign(campaignId) {

    if (!campaignId) {
      throw new TTKALAAApiError(
        "شناسه دوره مشخص نیست."
      );
    }

    return get(
      "/campaign/" + encodeURIComponent(campaignId)
    );
  }


  /* =========================================================
     دریافت محصولات
  ========================================================== */

  async function getProducts() {
    return get("/products");
  }


  /* =========================================================
     دریافت یک محصول
  ========================================================== */

  async function getProduct(productId) {

    if (!productId) {
      throw new TTKALAAApiError(
        "شناسه محصول مشخص نیست."
      );
    }

    return get(
      "/products/" + encodeURIComponent(productId)
    );
  }


  /* =========================================================
     دریافت وضعیت نمایشی لحظه‌ای
  ========================================================== */

  async function getLiveStats(campaignId) {

    const query = campaignId
      ? "?campaignId=" +
        encodeURIComponent(campaignId)
      : "";

    return get("/live-stats" + query);
  }


  /* =========================================================
     بررسی شانس با شماره موبایل
  ========================================================== */

  async function lookupChance(
    mobile,
    campaignId
  ) {

    const normalizedMobile =
      normalizeMobile(mobile);


    if (!isValidMobile(normalizedMobile)) {

      throw new TTKALAAApiError(
        "شماره موبایل را به شکل صحیح وارد کنید."
      );
    }


    return post(
      "/chance/lookup",
      {
        mobile: normalizedMobile,
        campaignId: campaignId || null
      }
    );
  }


  /* =========================================================
     ایجاد سفارش
  ========================================================== */

  async function createOrder({
    productId,
    campaignId,
    mobile
  }) {

    const normalizedMobile =
      normalizeMobile(mobile);


    if (!productId) {

      throw new TTKALAAApiError(
        "محصول انتخاب نشده است."
      );
    }


    if (!isValidMobile(normalizedMobile)) {

      throw new TTKALAAApiError(
        "شماره موبایل صحیح نیست."
      );
    }


    return post(
      "/orders",
      {
        productId,
        campaignId: campaignId || null,
        mobile: normalizedMobile
      }
    );
  }


  /* =========================================================
     شروع پرداخت
  ========================================================== */

  async function startPayment(orderId) {

    if (!orderId) {

      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست."
      );
    }


    return post(
      "/payments/start",
      {
        orderId
      }
    );
  }


  /* =========================================================
     دریافت نتیجه پرداخت
  ========================================================== */

  async function getPaymentResult(orderId) {

    if (!orderId) {

      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست."
      );
    }


    return get(
      "/payments/result?orderId=" +
      encodeURIComponent(orderId)
    );
  }


  /* =========================================================
     دریافت اطلاعات سفارش
  ========================================================== */

  async function getOrder(orderId) {

    if (!orderId) {

      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست."
      );
    }


    return get(
      "/orders/" +
      encodeURIComponent(orderId)
    );
  }


  /* =========================================================
     ثبت شماره موبایل بعد از پرداخت موفق
  ========================================================== */

  async function registerPurchaseMobile({
    orderId,
    mobile
  }) {

    const normalizedMobile =
      normalizeMobile(mobile);


    if (!orderId) {

      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست."
      );
    }


    if (!isValidMobile(normalizedMobile)) {

      throw new TTKALAAApiError(
        "شماره موبایل را به شکل صحیح وارد کنید."
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


  /* =========================================================
     دریافت محصول خریداری‌شده
  ========================================================== */

  async function getDownloadLink(orderId) {

    if (!orderId) {

      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست."
      );
    }


    return get(
      "/orders/" +
      encodeURIComponent(orderId) +
      "/download"
    );
  }


  /* =========================================================
     بررسی سلامت سرور
  ========================================================== */

  async function healthCheck() {
    return get("/health");
  }


  /* =========================================================
     تبدیل خطا به پیام قابل نمایش برای کاربر
  ========================================================== */

  function getSafeErrorMessage(error) {

    if (
      error &&
      typeof error.message === "string" &&
      error.message.trim()
    ) {

      return error.message;
    }


    return "در حال حاضر امکان انجام این درخواست وجود ندارد.";
  }


  /* =========================================================
     خروجی عمومی
  ========================================================== */

  window.TTKALAAApi = {

    CONFIG,

    TTKALAAApiError,

    normalizeDigits,

    normalizeMobile,

    isValidMobile,

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

    getSafeErrorMessage
  };

})();
