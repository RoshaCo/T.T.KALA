/* =========================================================
   شمارش معکوس خودکار فصل قرعه‌کشی
   منطقه زمانی: تهران
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
     محاسبه تاریخ‌های فصل بر اساس تقویم شمسی
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
     تشخیص سال کبیسه شمسی
     --------------------------------------------------------- */

  function isJalaliLeapYear(year) {
    const g1 = jalaliToGregorian(year, 1, 1);
    const g2 = jalaliToGregorian(year + 1, 1, 1);

    const diff =
      Math.round(
        (Date.UTC(
          g2.year,
          g2.month - 1,
          g2.day
        ) -
          Date.UTC(
            g1.year,
            g1.month - 1,
            g1.day
          )) /
          86400000
      );

    return diff === 366;
  }

  /* ---------------------------------------------------------
     تعیین فصل فعلی و پایان آن
     --------------------------------------------------------- */

  function getSeasonInfo(now) {
    const tehranString = now.toLocaleString("en-US", {
      timeZone: "Asia/Tehran"
    });

    const tehranDate = new Date(tehranString);

    const jalali = gregorianToJalali(
      tehranDate.getFullYear(),
      tehranDate.getMonth() + 1,
      tehranDate.getDate()
    );

    const y = jalali.year;
    const m = jalali.month;
    const d = jalali.day;

    let season;
    let endYear;
    let endMonth;
    let endDay;

    if (m >= 1 && m <= 3) {
      season = "بهار";
      endYear = y;
      endMonth = 3;
      endDay = 31;
    } else if (m >= 4 && m <= 6) {
      season = "تابستان";
      endYear = y;
      endMonth = 6;
      endDay = 31;
    } else if (m >= 7 && m <= 9) {
      season = "پاییز";
      endYear = y;
      endMonth = 9;
      endDay = 30;
    } else {
      season = "زمستان";
      endYear = y;
      endMonth = 12;
      endDay = isJalaliLeapYear(y) ? 30 : 29;
    }

    const endDate = createTehranDate(
      endYear,
      endMonth,
      endDay,
      23,
      59,
      59
    );

    return {
      season: season,
      year: y,
      endDate: endDate
    };
  }

  /* ---------------------------------------------------------
     نمایش شمارش معکوس
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
    const info = getSeasonInfo(now);

    let difference =
      info.endDate.getTime() -
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
        "پایان قرعه‌کشی فصل " +
        info.season;
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
