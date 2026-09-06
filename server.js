const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const crypto = require("crypto");
const db = require("./db");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

const FRONTEND_URL = process.env.FRONTEND_URL || "https://ttkalaa.github.io";
const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || "";
const PRODUCT_PRICE_TOMAN = Number(process.env.PRODUCT_PRICE_TOMAN || 29000);
const PRODUCT_PRICE_RIAL = Number(
  process.env.PRODUCT_PRICE_RIAL || PRODUCT_PRICE_TOMAN * 10
);
const CHANCE_PER_PURCHASE = Number(process.env.CHANCE_PER_PURCHASE || 1);
const PRIZE_RATIO = Number(process.env.PRIZE_RATIO || 100);
const APP_SECRET = process.env.APP_SECRET || "change-this-secret";
const DOWNLOAD_LINK_TTL = Number(process.env.DOWNLOAD_LINK_TTL || 900);
const SANDBOX = String(process.env.ZARINPAL_SANDBOX || "false") === "true";

const ZARINPAL_API = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment"
  : "https://payment.zarinpal.com/pg/v4/payment";

const ZARINPAL_START = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/StartPay"
  : "https://www.zarinpal.com/pg/StartPay";

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function normalizeMobile(value) {
  const mobile = normalizeDigits(value).replace(/\D/g, "");

  if (mobile.startsWith("98") && mobile.length === 12) {
    return "0" + mobile.slice(2);
  }

  if (mobile.startsWith("9") && mobile.length === 10) {
    return "0" + mobile;
  }

  return mobile;
}

function validMobile(value) {
  return /^09\d{9}$/.test(normalizeMobile(value));
}

function jsonError(res, status, message, code = "ERROR") {
  return res.status(status).json({
    success: false,
    code,
    message
  });
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function hashNumber(seed) {
  const h = sha256(seed);
  return parseInt(h.slice(0, 12), 16);
}

function tehranDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short"
  }).formatToParts(date);

  const get = (name) => parts.find((p) => p.type === name)?.value;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday")
  };
}

function isLeapJalali(year) {
  const r = year % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(r);
}

function jalaliToGregorian(jy, jm, jd) {
  jy = Number(jy);
  jm = Number(jm);
  jd = Number(jd);

  let gy = jy + 621;
  let days =
    365 * jy +
    Math.floor((jy + 3) / 4) -
    Math.floor((jy + 99) / 100) +
    Math.floor((jy + 399) / 400) -
    79;

  days += jm <= 7 ? (jm - 1) * 31 : (jm - 1) * 30 + 6;
  days += jd - 1;

  const gyStart = new Date(Date.UTC(1600, 0, 1));
  const gDays = days - 584401;

  return new Date(gyStart.getTime() + gDays * 86400000);
}

function gregorianToJalali(gy, gm, gd) {
  gy = Number(gy);
  gm = Number(gm);
  gd = Number(gd);

  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gy + (gm > 2 ? 1 : 0);

  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gdm[gm - 1];

  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;

  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm;
  let jd;

  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return { year: jy, month: jm, day: jd };
}

function currentJalali() {
  const t = tehranDateParts();
  return gregorianToJalali(t.year, t.month, t.day);
}

function seasonInfo(jy, jm) {
  if (jm >= 1 && jm <= 3) {
    return {
      number: 1,
      name: "بهار",
      start: { year: jy, month: 1, day: 1 },
      end: { year: jy, month: 3, day: 31 }
    };
  }

  if (jm >= 4 && jm <= 6) {
    return {
      number: 2,
      name: "تابستان",
      start: { year: jy, month: 4, day: 1 },
      end: { year: jy, month: 6, day: 31 }
    };
  }

  if (jm >= 7 && jm <= 9) {
    return {
      number: 3,
      name: "پاییز",
      start: { year: jy, month: 7, day: 1 },
      end: { year: jy, month: 9, day: 30 }
    };
  }

  return {
    number: 4,
    name: "زمستان",
    start: { year: jy, month: 10, day: 1 },
    end: { year: jy, month: 12, day: isLeapJalali(jy) ? 30 : 29 }
  };
}

function jalaliKey(j) {
  return `${j.year}-${String(j.month).padStart(2, "0")}-${String(j.day).padStart(
    2,
    "0"
  )}`;
}

function seasonId(jy, seasonNumber) {
  return `${jy}-${seasonNumber}`;
}

function seasonEndGregorian(j) {
  const g = jalaliToGregorian(j.year, j.month, j.day);
  return g.getTime() + 23 * 3600000 + 59 * 60000 + 
