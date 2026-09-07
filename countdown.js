/* =========================================================
   شمارش معکوس خودکار فصل قرعه‌کشی
   منطقه زمانی: تهران
   تاریخ پایان: ۳۰ / ۹ / ۱۴۰۵
   ترتیب نمایش: چپ به راست (روز، ساعت، دقیقه، ثانیه)
========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     تبدیل اعداد انگلیسی و فارسی
     --------------------------------------------------------- */

  function toPersianNumber(value) {
    return String(value).replace(/\d/g, function (digit) {
      return "۰۱۲۳۴۵۶۷۸۹"[digit];
    });
  }

  /* ---------------------------------------------------------
     محاسبه تاریخ‌های شمسی
     بدون نیاز به کتابخانه خارجی
     --------------------------------------------------------- */

  function gregorianToJalali(gy, gm, gd) {
    const gDaysInMonth = [
      31, 28, 31, 30, 31, 30,
      31, 31, 30, 31, 30, 31
    ];

    const jDaysInMonth = [
      31, 31, 31, 31, 31, 31,
      30, 30, 30, 30, 30, 29
    ];

    let gy2 = gy - 1600;
    let gm2 = gm - 1;
    let gd2 = gd - 1;

    let gDayNo =
      365 * gy2 +
      Math.floor((gy2 + 3) / 4) -
      Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400);

    for (let i = 0; i < gm2; i++) {
      gDayNo += gDaysInMonth[i];
    }

    if (
      gm2 > 1 &&
      ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)
    ) {
      gDayNo++;
    }

    gDayNo += gd2;

    let jDayNo = gDayNo - 79;

    const jNp = Math.floor(jDayNo / 12053);
    jDayNo %= 12053;

    let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);

    jDayNo %= 1461;

    if (jDayNo >= 366) {
      jy += Math.floor((jDayNo - 1) / 365);
      jDayNo = (jDayNo - 1) % 365;
    }

    let jm = 0;

    for (let i = 0; i < 11 && jDayNo >= jDaysInMonth[i]; i++) {
      jDayNo -= jDaysInMonth[i];
      jm++;
    }

    return {
      year: jy,
      month: jm + 1,
      day: jDayNo + 1
    };
  }

  function jalaliToGregorian(jy, jm, jd) {
    jy -= 979;

    let jDayNo =
      365 * jy +
      Math.floor(jy / 33) * 8 +
      Math.floor((jy % 33 + 3) / 4);

    for (let i = 0; i < jm - 1; i++) {
      jDayNo += i < 6 ? 31 : 30;
    }

    jDayNo += jd - 1;

    let gDayNo = jDayNo + 79;

    let gy =
      1600 +
      400 * Math.floor(gDayNo / 146097);

    gDayNo %= 146097;

    let leap = true;

    if (gDayNo >= 36525) {
      gDayNo--;

      gy +=
        100 * Math.floor(gDayNo / 36524);

      gDayNo %= 36524;

      if (gDayNo >= 365) {
        gDayNo++;
      } else {
        leap = false;
      }
    }

    gy += 4 * Math.floor(gDayNo / 1461);
    gDayNo %= 1461;

    if (gDayNo >= 366) {
      leap = false;
      gDayNo--;

      gy += Math.floor(gDayNo / 365);
      gDayNo %= 365;
    }

    const gDaysInMonth = [
      31,
      leap ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31
    ];

    let gm = 0;

    while (
      gm < 12 &&
      gDayNo >= gDaysInMonth[gm]
    ) {
      gDayNo -= gDaysInMonth[gm];
      gm++;
    }

    return {
      year: gy,
      month: gm + 1,
      day: gDayNo + 1
    };
  }

  /* ---------------------------------------------------------
     ساخت تاریخ میلادی با ساعت تهران
     --------------------------------------------------------- */

  function createTehranDate(jy, jm, jd, hour, minute, second) {
    const g = jalaliToGregorian(jy, jm, jd);

    const iso =
      String(g.year).padStart(4, "0") +
      "-" +
      String(g.month).padStart(2, "0") +
      "-" +
      String(g.day).padStart(2, "0") +
      "T" +
      String(hour).padStart(2, "0") +
      ":" +
      String(minute).padStart(2, "0") +
      ":" +
      String(second).padStart(2, "0") +
      "+03:30";

    return new Date(iso);
  }

  /* ---------------------------------------------------------
     تاریخ پایان قرعه‌کشی
     ۳۰ / ۹ / ۱۴۰۵ شمسی
     --------------------------------------------------------- */

  const END_DATE = createTehranDate(
    1405,
    9,
    30,
    23,
    59,
    59
  );

  /* ---------------------------------------------------------
     نمایش شمارش معکوس
     ترتیب: چپ به راست
     روز، ساعت، دقیقه، ثانیه
     --------------------------------------------------------- */

  function updateCountdown() {
    const daysElement = document.getElementById("countdownDays");
    const hoursElement = document.getElementById("countdownHours");
    const minutesElement = document.getElementById("countdownMinutes");
    const secondsElement = document.getElementById("countdownSeconds");
    const seasonElement = document.getElementById("countdownSeason");

    if (
      !daysElement ||
      !hoursElement ||
      !minutesElement ||
      !secondsElement
    ) {
      return;
    }

    const now = new Date();

    let difference =
      END_DATE.getTime() -
      now.getTime();

    if (difference < 0) {
      difference = 0;
    }

    const totalSeconds =
      Math.floor(difference / 1000);

    const days =
      Math.floor(totalSeconds / 86400);

    const hours =
      Math.floor(
        (totalSeconds % 86400) / 3600
      );

    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );

    const seconds =
      totalSeconds % 60;

    daysElement.textContent =
      toPersianNumber(days);

    hoursElement.textContent =
      toPersianNumber(
        String(hours).padStart(2, "0")
      );

    minutesElement.textContent =
      toPersianNumber(
        String(minutes).padStart(2, "0")
      );

    secondsElement.textContent =
      toPersianNumber(
        String(seconds).padStart(2, "0")
      );

    if (seasonElement) {
      seasonElement.textContent =
        "پایان قرعه‌کشی ۳۰ آذر ۱۴۰۵";
    }
  }

  /* ---------------------------------------------------------
     اجرای شمارش معکوس
     --------------------------------------------------------- */

  function startCountdown() {
    updateCountdown();

    setInterval(
      updateCountdown,
      1000
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      startCountdown
    );
  } else {
    startCountdown();
  }

})();
