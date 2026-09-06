/* =========================================================
   T.T.KALAA - شمارش معکوس دوره قرعه‌کشی
   ========================================================= */

(function () {
  "use strict";

  const els = {
    days: document.getElementById("countdownDays"),
    hours: document.getElementById("countdownHours"),
    minutes: document.getElementById("countdownMinutes"),
    seconds: document.getElementById("countdownSeconds"),
    title: document.getElementById("countdownTitle")
  };

  let timer = null;
  let campaignEnd = null;

  /* تبدیل اعداد انگلیسی به فارسی */
  function toPersianNumber(value) {
    return String(value).replace(/\d/g, function (digit) {
      return "۰۱۲۳۴۵۶۷۸۹"[digit];
    });
  }

  /* صفرگذاری برای نمایش مرتب */
  function pad(value) {
    return String(value).padStart(2, "0");
  }

  /* نمایش زمان باقی‌مانده */
  function render(days, hours, minutes, seconds) {
    if (els.days) {
      els.days.textContent = toPersianNumber(days);
    }

    if (els.hours) {
      els.hours.textContent = toPersianNumber(pad(hours));
    }

    if (els.minutes) {
      els.minutes.textContent = toPersianNumber(pad(minutes));
    }

    if (els.seconds) {
      els.seconds.textContent = toPersianNumber(pad(seconds));
    }
  }

  /* پایان شمارش معکوس */
  function renderFinished() {
    render(0, 0, 0, 0);

    if (els.title) {
      els.title.textContent = "دوره جاری به پایان رسیده است";
    }
  }

  /* محاسبه و نمایش زمان */
  function update() {
    if (!campaignEnd) {
      return;
    }

    const now = Date.now();
    const distance = campaignEnd - now;

    if (distance <= 0) {
      renderFinished();

      if (timer) {
        clearInterval(timer);
        timer = null;
      }

      return;
    }

    const totalSeconds = Math.floor(distance / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    render(days, hours, minutes, seconds);
  }

  /* تبدیل تاریخ‌های مختلف دریافتی از API به timestamp */
  function parseDate(value) {
    if (!value) {
      return null;
    }

    const timestamp = new Date(value).getTime();

    if (Number.isNaN(timestamp)) {
      return null;
    }

    return timestamp;
  }

  /* استخراج تاریخ پایان دوره از پاسخ‌های احتمالی API */
  function resolveCampaignEnd(campaign) {
    if (!campaign || typeof campaign !== "object") {
      return null;
    }

    const candidates = [
      campaign.endAt,
      campaign.end_at,
      campaign.endsAt,
      campaign.ends_at,
      campaign.endDate,
      campaign.end_date,
      campaign.finishAt,
      campaign.finish_at,
      campaign.expiresAt,
      campaign.expires_at
    ];

    for (const value of candidates) {
      const parsed = parseDate(value);

      if (parsed) {
        return parsed;
      }
    }

    return null;
  }

  /* شروع شمارش معکوس */
  function start(endDate) {
    const parsed = parseDate(endDate);

    if (!parsed) {
      return false;
    }

    campaignEnd = parsed;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    update();

    timer = setInterval(update, 1000);

    return true;
  }

  /* دریافت دوره جاری از API */
  async function load() {
    try {
      if (
        !window.TTKALAAApi ||
        typeof window.TTKALAAApi.getCurrentCampaign !== "function"
      ) {
        return false;
      }

      const response = await window.TTKALAAApi.getCurrentCampaign();

      const campaign =
        response && response.data
          ? response.data
          : response && response.campaign
          ? response.campaign
          : response;

      const endDate = resolveCampaignEnd(campaign);

      if (!endDate) {
        return false;
      }

      return start(endDate);
    } catch (error) {
      /*
        در صورت خطای API، شمارش معکوس ساختگی نمایش داده نمی‌شود.
        چون تاریخ واقعی پایان دوره باید از سمت سرور تعیین شود.
      */
      console.error("Countdown load error:", error);
      return false;
    }
  }

  /* دسترسی سایر فایل‌های سایت به شمارش معکوس */
  window.TTKALAA_Countdown = {
    start,
    load,
    update,
    stop: function () {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
  };

  /* شروع خودکار پس از آماده شدن صفحه */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
