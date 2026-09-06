/* =========================================================
   T.T.KALAA — API LAYER
   File: js/api.js
   ========================================================= */

"use strict";

/* =========================================================
   01. CONFIGURATION
   ========================================================= */

window.TTKALAA_API = {
  baseURL: "https://api.ttkalaa.ir/api",
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json"
  }
};

/* =========================================================
   02. INTERNAL HELPERS
   ========================================================= */

function ttkalaaNormalizeURL(endpoint) {
  const base = String(window.TTKALAA_API.baseURL || "").replace(/\/+$/, "");
  const path = String(endpoint || "").replace(/^\/+/, "");

  return `${base}/${path}`;
}

function ttkalaaCreateTimeoutController(timeout) {
  const controller = new AbortController();

  const timer = window.setTimeout(() => {
    controller.abort();
  }, timeout);

  return {
    controller,
    clear: () => window.clearTimeout(timer)
  };
}

async function ttkalaaParseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    success: response.ok,
    message: text || ""
  };
}

function ttkalaaCreateAPIError(message, status = 0, data = null) {
  const error = new Error(message || "خطایی در ارتباط با سرور رخ داد.");

  error.status = status;
  error.data = data;

  return error;
}

/* =========================================================
   03. GENERIC REQUEST
   ========================================================= */

async function ttkalaaRequest(endpoint, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const timeout = Number(options.timeout || window.TTKALAA_API.timeout);

  const headers = {
    ...window.TTKALAA_API.headers,
    ...(options.headers || {})
  };

  const requestOptions = {
    method,
    headers,
    credentials: options.credentials || "omit",
    cache: options.cache || "no-store"
  };

  if (options.body !== undefined && options.body !== null) {
    requestOptions.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  const timeoutController = ttkalaaCreateTimeoutController(timeout);

  requestOptions.signal = options.signal || timeoutController.controller.signal;

  try {
    const response = await fetch(
      ttkalaaNormalizeURL(endpoint),
      requestOptions
    );

    const data = await ttkalaaParseResponse(response);

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        "درخواست با خطا مواجه شد.";

      throw ttkalaaCreateAPIError(message, response.status, data);
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw ttkalaaCreateAPIError(
        "زمان پاسخ‌گویی سرور به پایان رسید. لطفاً دوباره تلاش کنید."
      );
    }

    if (error instanceof TypeError) {
      throw ttkalaaCreateAPIError(
        "ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید."
      );
    }

    throw error;
  } finally {
    timeoutController.clear();
  }
}

/* =========================================================
   04. GET
   ========================================================= */

async function ttkalaaGet(endpoint, options = {}) {
  return ttkalaaRequest(endpoint, {
    ...options,
    method: "GET"
  });
}

/* =========================================================
   05. POST
   ========================================================= */

async function ttkalaaPost(endpoint, body = {}, options = {}) {
  return ttkalaaRequest(endpoint, {
    ...options,
    method: "POST",
    body
  });
}

/* =========================================================
   06. PUBLIC API
   ========================================================= */

window.TTKALAA_API_CLIENT = {
  request: ttkalaaRequest,
  get: ttkalaaGet,
  post: ttkalaaPost,

  /* =======================================================
     CAMPAIGN
     ======================================================= */

  async getCurrentCampaign() {
    return ttkalaaGet("/campaigns/current");
  },

  /* =======================================================
     PRODUCTS
     ======================================================= */

  async getProducts() {
    return ttkalaaGet("/products");
  },

  async getProduct(productId) {
    if (!productId) {
      throw ttkalaaCreateAPIError("شناسه محصول معتبر نیست.");
    }

    return ttkalaaGet(`/products/${encodeURIComponent(productId)}`);
  },

  /* =======================================================
     LIVE STATS
     ======================================================= */

  async getLiveStats(campaignId = null) {
    const query = campaignId
      ? `?campaign_id=${encodeURIComponent(campaignId)}`
      : "";

    return ttkalaaGet(`/stats/live${query}`);
  },

  /* =======================================================
     CHANCE LOOKUP
     ======================================================= */

  async lookupChance(mobile, campaignId = null) {
    if (!mobile) {
      throw ttkalaaCreateAPIError("شماره موبایل وارد نشده است.");
    }

    return ttkalaaPost("/chance/lookup", {
      mobile,
      campaign_id: campaignId
    });
  },

  /* =======================================================
     ORDER
     ======================================================= */

  async createOrder(payload) {
    if (!payload || !payload.product_id || !payload.mobile) {
      throw ttkalaaCreateAPIError(
        "اطلاعات لازم برای ایجاد سفارش کامل نیست."
      );
    }

    return ttkalaaPost("/orders", {
      product_id: payload.product_id,
      mobile: payload.mobile,
      campaign_id: payload.campaign_id || null
    });
  },

  /* =======================================================
     PAYMENT
     ======================================================= */

  async startPayment(orderId) {
    if (!orderId) {
      throw ttkalaaCreateAPIError("شناسه سفارش معتبر نیست.");
    }

    return ttkalaaPost("/payments/start", {
      order_id: orderId
    });
  },

  /* =======================================================
     PAYMENT RESULT
     ======================================================= */

  async getPaymentResult(orderId) {
    if (!orderId) {
      throw ttkalaaCreateAPIError("شناسه سفارش معتبر نیست.");
    }

    return ttkalaaGet(
      `/payments/result/${encodeURIComponent(orderId)}`
    );
  },

  /* =======================================================
     HEALTH CHECK
     ======================================================= */

  async healthCheck() {
    return ttkalaaGet("/health", {
      timeout: 8000
    });
  }
};

/* =========================================================
   07. PHONE NORMALIZATION
   ========================================================= */

window.TTKALAA_UTILS = window.TTKALAA_UTILS || {};

window.TTKALAA_UTILS.normalizeMobile = function (value) {
  if (value === undefined || value === null) {
    return "";
  }

  let mobile = String(value).trim();

  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  mobile = mobile.replace(/[۰-۹]/g, function (digit) {
    return String(persianDigits.indexOf(digit));
  });

  mobile = mobile.replace(/[٠-٩]/g, function (digit) {
    return String(arabicDigits.indexOf(digit));
  });

  mobile = mobile.replace(/[\s\-()]/g, "");

  if (mobile.startsWith("+98")) {
    mobile = "0" + mobile.slice(3);
  } else if (mobile.startsWith("0098")) {
    mobile = "0" + mobile.slice(4);
  } else if (mobile.startsWith("98") && mobile.length === 12) {
    mobile = "0" + mobile.slice(2);
  }

  return mobile;
};

/* =========================================================
   08. PHONE VALIDATION
   ========================================================= */

window.TTKALAA_UTILS.isValidMobile = function (value) {
  const mobile = window.TTKALAA_UTILS.normalizeMobile(value);

  return /^09\d{9}$/.test(mobile);
};

/* =========================================================
   09. SAFE ERROR MESSAGE
   ========================================================= */

window.TTKALAA_UTILS.getSafeErrorMessage = function (error) {
  if (!error) {
    return "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
  }

  if (
    error.status === 400 ||
    error.status === 422
  ) {
    return (
      error?.data?.message ||
      error?.message ||
      "اطلاعات واردشده صحیح نیست."
    );
  }

  if (error.status === 401) {
    return "برای انجام این عملیات نیاز به احراز هویت دارید.";
  }

  if (error.status === 403) {
    return "دسترسی به این عملیات امکان‌پذیر نیست.";
  }

  if (error.status === 404) {
    return "اطلاعات موردنظر پیدا نشد.";
  }

  if (error.status === 429) {
    return "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.";
  }

  if (error.status >= 500) {
    return "سرور موقتاً با مشکل مواجه است. لطفاً کمی بعد دوباره تلاش کنید.";
  }

  return (
    error.message ||
    "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید."
  );
};

/* =========================================================
   10. DEV SAFETY
   ========================================================= */

if (window.location.protocol === "file:") {
  console.warn(
    "T.T.KALAA: این سایت باید از طریق GitHub Pages یا یک وب‌سرور اجرا شود؛ اجرای مستقیم فایل HTML ممکن است درخواست‌های API را مسدود کند."
  );
}

/* =========================================================
   END OF FILE
   ========================================================= */
