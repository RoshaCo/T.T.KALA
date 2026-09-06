/* =========================================================
   T.T.KALAA — 10 YEAR IRANIAN SEASON COUNTDOWN
   فصل‌ها بر اساس تقویم شمسی ایران
========================================================= */

(function (window) {
  "use strict";

  const FALLBACK_OFFSET = 3.5 * 60 * 60 * 1000;

  let serverOffset = 0;
  let timer = null;

  const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

  function toPersian(value) {
    return String(value).replace(/\d/g, function (digit) {
      return PERSIAN_DIGITS[digit];
    });
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function getIranNow() {
    return new Date(Date.now() + serverOffset);
  }

  function gregorianToJalali(gy, gm, gd) {
    const gDaysInMonth = [
      0, 31, 28, 31, 30, 31,
      30, 31, 31, 30, 31, 30, 31
    ];

    const jDaysInMonth = [
      0, 31, 31, 31, 31, 31,
      31, 30, 30, 30, 30, 30, 29
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
      gDayNo += gDaysInMonth[i + 1];
    }

    if (
      gm2 > 1 &&
      (
        gy % 4 === 0 &&
        gy % 100 !== 0
      ) ||
      gy % 400 === 0
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

    let jm = 1;

    while (
      jm <= 12 &&
      jDayNo >= jDaysInMonth[jm]
    ) {
      jDayNo -= jDaysInMonth[jm];
      jm++;
    }

    const jd = jDayNo + 1;

    return {
      year: jy,
      month: jm,
      day: jd
    };
  }

  function jalaliToGregorian(jy, jm, jd) {
    let gy = jy + 621;

    const leap = function (year) {
      const breaks = [
        -61, 9, 38, 199, 426, 686, 756,
        818, 1111, 1181, 1210, 1635,
        2060, 2097, 2192, 2262, 2324,
        2394, 2456, 3178
      ];

      let bl = breaks.length;
      let gy2 = year + 621;
      let leapJ = -14;
      let jp = breaks[0];

      let jump = 0;

      for (let i = 1; i < bl; i++) {
        const jm2 = breaks[i];

        jump = jm2 - jp;

        if (year < jm2) {
          break;
        }

        leapJ +=
          Math.floor(jump / 33) * 8 +
          Math.floor((jump % 33) / 4);

        jp = jm2;
      }

      let n = year - jp;

      leapJ +=
        Math.floor(n / 33) * 8 +
        Math.floor(((n % 33) + 3) / 4);

      if (jump % 33 === 4 && jump - n === 4) {
        leapJ++;
      }

      const leapG =
        Math.floor(gy2 / 4) -
        Math.floor(
          (Math.floor(gy2 / 100) + 1) * 3 / 4
        ) -
        150;

      const march =
        20 +
        leapJ -
        leapG;

      let n2;

      if (jm <= 6) {
        n2 = (jm - 1) * 31 + (jd - 1);
      } else {
        n2 =
          (jm - 7) * 30 +
          186 +
          (jd - 1);
      }

      const result =
        new Date(
          Date.UTC(
            gy2,
            2,
            march + n2
          )
        );

      return result;
    };

    return leap(jy);
  }

  function getSeason(jalali) {
    if (jalali.month >= 1 && jalali.month <= 3) {
      return {
        name: "بهار",
        startMonth: 1,
        startDay: 1,
        endMonth: 3,
        endDay: 31
      };
    }

    if (jalali.month >= 4 && jalali.month <= 6) {
      return {
        name: "تابستان",
        startMonth: 4,
        startDay: 1,
        endMonth: 6,
        endDay: 31
      };
    }

    if (jalali.month >= 7 && jalali.month <= 9) {
      return {
        name: "پاییز",
        startMonth: 7,
        startDay: 1,
        endMonth: 9,
        endDay: 30
      };
    }

    return {
      name: "زمستان",
      startMonth: 10,
      startDay: 1,
      endMonth: 12,
      endDay: 29
    };
  }

  function isJalaliLeapYear(year) {
    const start = jalaliToGregorian(
      year,
      1,
      1
    );

    const next = jalaliToGregorian(
      year + 1,
      1,
      1
    );

    const days =
      Math.round(
        (next.getTime() - start.getTime()) /
        86400000
      );

    return days === 366;
  }

  function getSeasonEnd(jalali) {
    const season = getSeason(jalali);

    let endDay = season.endDay;

    if (
      season.endMonth === 12 &&
      isJalaliLeapYear(jalali.year)
    ) {
      endDay = 30;
    }

    /*
      پایان دوره در آخرین روز فصل، ساعت 23:59:59
      و بلافاصله دوره بعدی آغاز می‌شود.
    */

    return jalaliToGregorian(
      jalali.year,
      season.endMonth,
      endDay
    );
  }

  function getSeasonStart(jalali) {
    const season = getSeason(jalali);

    return jalaliToGregorian(
      jalali.year,
      season.startMonth,
      season.startDay
    );
  }

  function getNextSeasonStart(jalali) {
    const season = getSeason(jalali);

    if (season.name === "بهار") {
      return jalaliToGregorian(
        jalali.year,
        4,
        1
      );
    }

    if (season.name === "تابستان") {
      return jalaliToGregorian(
        jalali.year,
        7,
        1
      );
    }

    if (season.name === "پاییز") {
      return jalaliToGregorian(
        jalali.year,
        10,
        1
      );
    }

    return jalaliToGregorian(
      jalali.year + 1,
      1,
      1
    );
  }

  function getCurrentSeasonInfo() {
    const now = getIranNow();

    const jalali =
      gregorianToJalali(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate()
      );

    const season = getSeason(jalali);

    let endDate =
      getSeasonEnd(jalali);

    /*
      jalaliToGregorian خروجی UTC است.
      زمان پایان دوره: 23:59:59 به وقت ایران.
    */

    endDate.setUTCHours(20, 29, 59, 999);

    if (now.getTime() > endDate.getTime()) {
      const nextStart =
        getNextSeasonStart(jalali);

      return {
        season: season.name,
        jalaliYear: jalali.year,
        start: nextStart,
        end: getSeasonEnd(
          gregorianToJalali(
            nextStart.getUTCFullYear(),
            nextStart.getUTCMonth() + 1,
            nextStart.getUTCDate()
          )
        )
      };
    }

    return {
      season: season.name,
      jalaliYear: jalali.year,
      start: getSeasonStart(jalali),
      end: endDate
    };
  }

  function updateCountdown() {
    const info =
      getCurrentSeasonInfo();

    const now =
      getIranNow().getTime();

    let difference =
      info.end.getTime() - now;

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

    const daysElement =
      document.getElementById(
        "countdownDays"
      );

    const hoursElement =
      document.getElementById(
        "countdownHours"
      );

    const minutesElement =
      document.getElementById(
        "countdownMinutes"
      );

    const secondsElement =
      document.getElementById(
        "countdownSeconds"
      );

    if (daysElement) {
      daysElement.textContent =
        toPersian(days);
    }

    if (hoursElement) {
      hoursElement.textContent =
        toPersian(pad(hours));
    }

    if (minutesElement) {
      minutesElement.textContent =
        toPersian(pad(minutes));
    }

    if (secondsElement) {
      secondsElement.textContent =
        toPersian(pad(seconds));
    }
  }

  async function syncServerTime() {
    if (
      !window.TTKALAA_API ||
      typeof window.TTKALAA_API.request !== "function"
    ) {
      return;
    }

    try {
      const startedAt = Date.now();

      const response =
        await window.TTKALAA_API.request(
          "/time"
        );

      const receivedAt = Date.now();

      if (!response?.timestamp) {
        return;
      }

      const serverTimestamp =
        Number(response.timestamp);

      if (!Number.isFinite(serverTimestamp)) {
        return;
      }

      const roundTrip =
        receivedAt - startedAt;

      const estimatedNow =
        serverTimestamp +
        Math.floor(roundTrip / 2);

      serverOffset =
        estimatedNow - Date.now();

    } catch (error) {
      /*
        در صورت قطع بودن سرور،
        زمان ایران به عنوان fallback استفاده می‌شود.
      */
      serverOffset = FALLBACK_OFFSET - new Date().getTimezoneOffset() * 60000;
    }
  }

  function start() {
    updateCountdown();

    if (timer) {
      clearInterval(timer);
    }

    timer = setInterval(
      updateCountdown,
      1000
    );

    syncServerTime().then(
      updateCountdown
    );

    setInterval(
      syncServerTime,
      5 * 60 * 1000
    );
  }

  window.TTKALAA_COUNTDOWN = {
    start,
    updateCountdown,
    getCurrentSeasonInfo
  };

  document.addEventListener(
    "DOMContentLoaded",
    start
  );

})(window);
