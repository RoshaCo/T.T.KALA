/* =========================================================
   T.T.KALAA — API CLIENT
   مسیر فایل: api.js
========================================================= */

(function (window) {
  "use strict";

  const API_BASE_URL = "https://api.ttkalaa.ir/api";
  const REQUEST_TIMEOUT = 15000;

  class TTKALAAApiError extends Error {
    constructor(message, status = 0, code = "") {
      super(message);
      this.name = "TTKALAAApiError";
      this.status = status;
      this.code = code;
    }
  }

  function normalizeDigits(value) {
    return String(value ?? "")
      .replace(/[۰-۹]/g, function (char) {
        return String("۰۱۲۳۴۵۶۷۸۹".indexOf(char));
      })
      .replace(/[٠-٩]/g, function (char) {
        return String("٠١٢٣٤٥٦٧٨٩".indexOf(char));
      });
  }

  function normalizeMobile(value) {
    let mobile = normalizeDigits(value)
      .replace(/\s+/g, "")
      .replace(/[-()]/g, "");

    if (mobile.startsWith("+98")) {
      mobile = "0" + mobile.slice(3);
    }

    if (mobile.startsWith("0098")) {
      mobile = "0" + mobile.slice(4);
    }

    if (!/^09\d{9}$/.test(mobile)) {
      throw new TTKALAAApiError(
        "شماره تماس واردشده صحیح نیست.",
        400,
        "INVALID_MOBILE"
      );
    }

    return mobile;
  }

  function createTimeoutSignal() {
    const controller = new AbortController();

    const timer = setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT);

    return {
      signal: controller.signal,
      clear: function () {
        clearTimeout(timer);
      }
    };
  }

  async function request(path, options = {}) {
    const timeout = createTimeoutSignal();

    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(API_BASE_URL + path, {
        method: options.method || "GET",
        headers,
        body: options.body
          ? JSON.stringify(options.body)
          : undefined,
        signal: timeout.signal,
        credentials: "omit",
        cache: "no-store"
      });

      const contentType = response.headers.get("content-type") || "";

      let data = null;

      if (contentType.includes("application/json")) {
        data = await response.json().catch(function () {
          return null;
        });
      } else {
        const text = await response.text().catch(function () {
          return "";
        });

        data = text ? { message: text } : null;
      }

      if (!response.ok) {
        const message =
          data?.message ||
          data?.error ||
          "ارتباط با سرور با مشکل مواجه شد.";

        throw new TTKALAAApiError(
          message,
          response.status,
          data?.code || ""
        );
      }

      return data;
    } catch (error) {
      if (error instanceof TTKALAAApiError) {
        throw error;
      }

      if (error?.name === "AbortError") {
        throw new TTKALAAApiError(
          "زمان پاسخ‌گویی سرور تمام شد.",
          408,
          "TIMEOUT"
        );
      }

      throw new TTKALAAApiError(
        "ارتباط با سرور برقرار نشد.",
        0,
        "NETWORK_ERROR"
      );
    } finally {
      timeout.clear();
    }
  }

  async function getCurrentCampaign() {
    return request("/campaign/current");
  }

  async function getCampaign(campaignId) {
    if (!campaignId) {
      throw new TTKALAAApiError(
        "شناسه دوره مشخص نیست.",
        400,
        "CAMPAIGN_ID_REQUIRED"
      );
    }

    return request(
      "/campaign/" + encodeURIComponent(campaignId)
    );
  }

  async function getProducts() {
    return request("/products");
  }

  async function getProduct(productId) {
    if (!productId) {
      throw new TTKALAAApiError(
        "شناسه محصول مشخص نیست.",
        400,
        "PRODUCT_ID_REQUIRED"
      );
    }

    return request(
      "/products/" + encodeURIComponent(productId)
    );
  }

  async function getLiveStats(campaignId) {
    const query = campaignId
      ? "?campaignId=" + encodeURIComponent(campaignId)
      : "";

    return request("/live-stats" + query);
  }

  async function lookupChance(mobile, campaignId) {
    const normalizedMobile = normalizeMobile(mobile);

    const query = new URLSearchParams({
      mobile: normalizedMobile
    });

    if (campaignId) {
      query.set("campaignId", campaignId);
    }

    const response = await request(
      "/chance/lookup?" + query.toString()
    );

    /*
      وضعیت‌های معتبر:
      BUYER      = خریدار دوره جاری
      NON_BUYER  = هنوز خریدی در دوره جاری ندارد
    */

    if (response?.status === "BUYER") {
      return {
        status: "BUYER",
        mobile: normalizedMobile,
        campaignId:
          response.campaignId || campaignId || null,
        purchaseCount: Number(response.purchaseCount || 0),
        chanceCount: Number(response.chanceCount || 0),
        trackingCode: response.trackingCode || "",
        productName: response.productName || "",
        products: Array.isArray(response.products)
          ? response.products
          : []
      };
    }

    if (response?.status === "NON_BUYER") {
      return {
        status: "NON_BUYER",
        mobile: normalizedMobile,
        campaignId:
          response.campaignId || campaignId || null
      };
    }

    throw new TTKALAAApiError(
      "پاسخ سرور قابل شناسایی نیست.",
      502,
      "INVALID_CHANCE_RESPONSE"
    );
  }

  async function createOrder({
    productId,
    campaignId
  }) {
    if (!productId) {
      throw new TTKALAAApiError(
        "محصول انتخاب نشده است.",
        400,
        "PRODUCT_ID_REQUIRED"
      );
    }

    if (!campaignId) {
      throw new TTKALAAApiError(
        "دوره جاری مشخص نیست.",
        400,
        "CAMPAIGN_ID_REQUIRED"
      );
    }

    return request("/orders", {
      method: "POST",
      body: {
        productId,
        campaignId
      }
    });
  }

  async function startPayment(orderId) {
    if (!orderId) {
      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست.",
        400,
        "ORDER_ID_REQUIRED"
      );
    }

    return request("/payments/start", {
      method: "POST",
      body: {
        orderId
      }
    });
  }

  async function getPaymentResult(orderId) {
    if (!orderId) {
      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست.",
        400,
        "ORDER_ID_REQUIRED"
      );
    }

    return request(
      "/payments/result?orderId=" +
        encodeURIComponent(orderId)
    );
  }

  async function getOrder(orderId) {
    if (!orderId) {
      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست.",
        400,
        "ORDER_ID_REQUIRED"
      );
    }

    return request(
      "/orders/" + encodeURIComponent(orderId)
    );
  }

  async function registerPurchaseMobile({
    orderId,
    mobile
  }) {
    if (!orderId) {
      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست.",
        400,
        "ORDER_ID_REQUIRED"
      );
    }

    const normalizedMobile = normalizeMobile(mobile);

    return request("/orders/register-mobile", {
      method: "POST",
      body: {
        orderId,
        mobile: normalizedMobile
      }
    });
  }

  async function getDownloadLink(orderId) {
    if (!orderId) {
      throw new TTKALAAApiError(
        "شناسه سفارش مشخص نیست.",
        400,
        "ORDER_ID_REQUIRED"
      );
    }

    return request(
      "/orders/" +
        encodeURIComponent(orderId) +
        "/download"
    );
  }

  async function getUserPurchases(mobile, campaignId) {
    const normalizedMobile = normalizeMobile(mobile);

    const query = new URLSearchParams({
      mobile: normalizedMobile
    });

    if (campaignId) {
      query.set("campaignId", campaignId);
    }

    return request(
      "/purchases?" + query.toString()
    );
  }

  async function healthCheck() {
    return request("/health");
  }

  function getUserSafeError(error) {
    if (error instanceof TTKALAAApiError) {
      if (error.code === "INVALID_MOBILE") {
        return "شماره تماس واردشده صحیح نیست.";
      }

      if (
        error.code === "TIMEOUT" ||
        error.code === "NETWORK_ERROR"
      ) {
        return "لطفاً چند دقیقه بعد دوباره تلاش کنید";
      }

      if (error.status >= 500) {
        return "لطفاً چند دقیقه بعد دوباره تلاش کنید";
      }

      if (error.message) {
        return error.message;
      }
    }

    return "لطفاً چند دقیقه بعد دوباره تلاش کنید";
  }

  window.TTKALAA_API = {
    request,
    normalizeDigits,
    normalizeMobile,
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
    getUserPurchases,
    healthCheck,
    getUserSafeError,
    TTKALAAApiError
  };

})(window);
