// backend/server.js
// T.T.KALAA - سرور اصلی API
// این فایل نقطه ورود Backend است.
// اطلاعات حساس مانند کلید زرین‌پال و دیتابیس فقط از ENV خوانده می‌شوند.

"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const crypto = require("crypto");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://ttkalaa.ir";

/* =========================================================
   تنظیمات پایه
   ========================================================= */

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      /*
        درخواست‌های بدون Origin مانند برخی ابزارهای سروری
        مجاز هستند. برای مرورگر فقط دامنه‌های مشخص‌شده مجازند.
      */
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        FRONTEND_URL,
        "https://www.ttkalaa.ir",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS origin not allowed")
      );
    }
  })
);

app.use(
  express.json({
    limit: "100kb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "100kb"
  })
);

/* =========================================================
   ابزارهای عمومی
   ========================================================= */

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[۰-۹]/g, function (digit) {
      return String(
        "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
      );
    })
    .replace(/[٠-٩]/g, function (digit) {
      return String(
        "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
      );
    });
}

function normalizeMobile(value) {
  let mobile = normalizeDigits(value)
    .replace(/[^\d+]/g, "");

  if (mobile.startsWith("+98")) {
    mobile = "0" + mobile.slice(3);
  }

  if (mobile.startsWith("0098")) {
    mobile = "0" + mobile.slice(4);
  }

  return mobile;
}

function isValidMobile(value) {
  return /^09\d{9}$/.test(value);
}

function generateTrackingCode() {
  const random =
    crypto.randomBytes(5).toString("hex").toUpperCase();

  return "TTK-" + random;
}

function getRequestId() {
  return (
    crypto.randomUUID
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex")
  );
}

/* =========================================================
   پاسخ‌های استاندارد
   ========================================================= */

function success(res, data = {}) {
  return res.status(200).json({
    success: true,
    ...data
  });
}

function failure(
  res,
  statusCode,
  code,
  message
) {
  return res.status(statusCode).json({
    success: false,
    code,
    message
  });
}

/* =========================================================
   Health Check
   ========================================================= */

app.get("/api/health", async function (req, res) {
  return success(res, {
    status: "OK",
    service: "TTKALAA API",
    time: new Date().toISOString()
  });
});

/* =========================================================
   اطلاعات پایه
   ========================================================= */

app.get("/api/config", function (req, res) {
  return success(res, {
    currency: "TOMAN",
    productPrice: 29000,
    frontend: FRONTEND_URL
  });
});

/* =========================================================
   خطای 404
   ========================================================= */

app.use(function (req, res) {
  return failure(
    res,
    404,
    "NOT_FOUND",
    "مسیر موردنظر پیدا نشد."
  );
});

/* =========================================================
   مدیریت خطای نهایی
   ========================================================= */

app.use(function (error, req, res, next) {
  const requestId = getRequestId();

  console.error(
    `[${requestId}]`,
    error
  );

  if (res.headersSent) {
    return next(error);
  }

  return failure(
    res,
    500,
    "SERVER_ERROR",
    "خطای داخلی سرور."
  );
});

/* =========================================================
   اجرای سرور
   ========================================================= */

app.listen(PORT, function () {
  console.log(
    `T.T.KALAA API running on port ${PORT}`
  );
});
