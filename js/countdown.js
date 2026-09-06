(() => {
  "use strict";

  const TEHRAN_TIME_ZONE = "Asia/Tehran";

  const PERSIAN_MONTHS = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند"
  ];

  const SEASONS = [
    {
      name: "بهار",
      startMonth: 1,
      startDay: 1,
      endMonth: 3,
      endDayNormal: 31,
      endDayLeap: 31
    },
    {
      name: "تابستان",
      startMonth: 4,
      startDay: 1,
      endMonth: 6,
      endDayNormal: 31,
      endDayLeap: 31
    },
    {
      name: "پاییز",
      startMonth: 7,
      startDay: 1,
      endMonth: 9,
      endDayNormal: 30,
      endDayLeap: 30
    },
    {
      name: "زمستان",
      startMonth: 10,
      startDay: 1,
      endMonth: 12,
      endDayNormal: 29,
      endDayLeap: 30
    }
  ];

  let timer = null;
  let currentCampaign = null;

  function toPersianDigits(value) {
    return String(value).replace(/\d/g, digit => "۰۱۲۳۴۵۶۷۸۹"[digit]);
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatNumber(value) {
    return toPersianDigits(pad(value));
  }

  function gregorianToJalali(gy, gm, gd) {
    const gDaysInMonth = [
      31,
      28,
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

    const jDaysInMonth = [
      31,
      31,
      31,
      31,
      31,
      31,
      30,
      30,
      30,
      30,
      30,
      29
    ];

    let gy2 = gy - 1600;
    let gm2 = gm - 1;
    let gd2 = gd - 1;

    let gDayNo =
      365 * gy2 +
      Math.floor((gy2 + 3) / 4) -
      Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400);

    for (let i = 0; i < gm2; ++i) {
      gDayNo += gDaysInMonth[i];
    }

    if (
      gm2 > 1 &&
      (gy % 4 === 0 && gy % 100 !== 0 || gy % 400 === 0)
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

    while (
      jm < 11 &&
      jDayNo >= jDaysInMonth[jm]
    ) {
      jDayNo -= jDaysInMonth[jm];
      jm++;
    }

    const jd = jDayNo + 1;

    return {
      year: jy,
      month: jm + 1,
      day: jd
    };
  }

  function jalaliToGregorian(jy, jm, jd) {
    const breaks = [
      -61, 9, 38, 199, 426, 686, 756, 818, 1111,
      1181, 1210, 1635, 2060, 2097, 2192, 2262,
      2324, 2394, 2456, 3178
    ];

    function jalCal(jy) {
      const bl = breaks.length;
      let gy = jy + 621;
      let leapJ = -14;
      let jp = breaks[0];

      if (jy < jp || jy >= breaks[bl - 1]) {
        return null;
      }

      let jump;
      let leap;
      let jm;

      for (let i = 1; i < bl; i++) {
        jm = breaks[i];
        jump = jm - jp;

        if (jy < jm) {
          break;
        }

        leapJ += Math.floor(jump / 33) * 8;
        leapJ += Math.floor((jump % 33) / 4);
        jp = jm;
      }

      let n = jy - jp;

      leapJ += Math.floor(n / 33) * 8;
      leapJ += Math.floor(((n % 33) + 3) / 4);

      if (jump % 33 === 4 && jump - n === 4) {
        leapJ++;
      }

      const leapG =
        Math.floor(gy / 4) -
        Math.floor(((Math.floor(gy / 100) + 1) * 3) / 4) -
        150;

      const march = 20 + leapJ - leapG;

      if (jump - n < 6) {
        n = n - jump + Math.floor((jump + 4) / 33) * 33;
      }

      leap = (((n + 1) % 33) - 1) % 4;

      if (leap === -1) {
        leap = 4;
      }

      return {
        leap: leap,
        gy: gy,
        march: march
      };
    }

    const cal = jalCal(jy);

    if (!cal) {
      return null;
    }

    const gy = cal.gy;
    const march = cal.march;

    let jDayNo;

    if (jm <= 6) {
      jDayNo = (jm - 1) * 31 + (jd - 1);
    } else {
      jDayNo = 6 * 31 + (jm - 7) * 30 + (jd - 1);
    }

    const gDayNo =
      gregorianDayNumber(gy, 3, march) + jDayNo;

    return dayNumberToGregorian(gDayNo);
  }

  function gregorianDayNumber(y, m, d) {
    let yy = y - 1;

    return (
      365 * yy +
      Math.floor(yy / 4) -
      Math.floor(yy / 100) +
      Math.floor(yy / 400) +
      Math.floor(
        (367 * m - 362) / 12
      ) +
      (m <= 2
        ? 0
        : isGregorianLeapYear(y)
          ? -1
          : -2) +
      d
    );
  }

  function dayNumberToGregorian(dayNumber) {
    let low = 1;
    let high = 5000;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);

      if (gregorianDayNumber(mid, 1, 1) <= dayNumber) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const year = high;
    let dayOfYear =
      dayNumber - gregorianDayNumber(year, 1, 1) + 1;

    const monthLengths = [
      31,
      isGregorianLeapYear(year) ? 29 : 28,
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

    let month = 1;

    while (
      dayOfYear > monthLengths[month - 1]
    ) {
      dayOfYear -= monthLengths[month - 1];
      month++;
    }

    return {
      year,
      month,
      day: dayOfYear
    };
  }

  function isGregorianLeapYear(year) {
    return (
      year % 4 === 0 &&
      (year % 100 !== 0 || year % 400 === 0)
    );
  }

  function isJalaliLeapYear(year) {
    const nextYear = jalaliToGregorian(
      year + 1,
      1,
      1
    );

    const currentYear = jalaliToGregorian(
      year,
      1,
      1
    );

    if (!currentYear || !nextYear) {
      return false;
    }

    const currentDate = new Date(
      Date.UTC(
        currentYear.year,
        currentYear.month - 1,
        currentYear.day
      )
    );

    const nextDate = new Date(
      Date.UTC(
        nextYear.year,
        nextYear.month - 1,
        nextYear.day
      )
    );

    const difference =
      Math.round(
        (nextDate - currentDate) /
        86400000
      );

    return difference === 366;
  }

  function getTehranDateParts() {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: TEHRAN_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
      }
    );

    const parts = formatter.formatToParts(now);

    const result = {};

    parts.forEach(part => {
      if (part.type !== "literal") {
        result[part.type] = Number(part.value);
      }
    });

    return result;
  }

  function getTehranOffsetMilliseconds(date) {
    const formatter = new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: TEHRAN_TIME_ZONE,
        timeZoneName: "longOffset"
      }
    );

    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(
      part => part.type === "timeZoneName"
    );

    if (!offsetPart) {
      return 0;
    }

    const match = offsetPart.value.match(
      /GMT([+-])(\d{2}):?(\d{2})/
    );

    if (!match) {
      return 0;
    }

    const sign = match[1] === "+" ? 1 : -1;
    const hours = Number(match[2]);
    const minutes = Number(match[3]);

    return sign *
      (hours * 60 + minutes) *
      60 *
      1000;
  }

  function tehranLocalToUTC(
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0
  ) {
    const approximateUTC = Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      second
    );

    let date = new Date(approximateUTC);

    const offset = getTehranOffsetMilliseconds(date);

    date = new Date(
      approximateUTC - offset
    );

    return date;
  }

  function getSeason(jalali) {
    const month = jalali.month;

    if (month <= 3) {
      return SEASONS[0];
    }

    if (month <= 6) {
      return SEASONS[1];
    }

    if (month <= 9) {
      return SEASONS[2];
    }

    return SEASONS[3];
  }

  function getSeasonEndDay(season, year) {
    if (season.endMonth === 12) {
      return isJalaliLeapYear(year)
        ? season.endDayLeap
        : season.endDayNormal;
    }

    return season.endDayNormal;
  }

  function getNextSeasonStart(
    currentSeason,
    jalaliYear
  ) {
    const index = SEASONS.indexOf(currentSeason);

    const nextIndex =
      (index + 1) % SEASONS.length;

    const nextSeason = SEASONS[nextIndex];

    const nextYear =
      nextIndex === 0
        ? jalaliYear + 1
        : jalaliYear;

    return {
      season: nextSeason,
      year: nextYear
    };
  }

  function buildCampaignWindow(jalali) {
    const season = getSeason(jalali);

    const endDay = getSeasonEndDay(
      season,
      jalali.year
    );

    const endDate = jalaliToGregorian(
      jalali.year,
      season.endMonth,
      endDay
    );

    const next = getNextSeasonStart(
      season,
      jalali.year
    );

    const nextStartDate = jalaliToGregorian(
      next.year,
      next.season.startMonth,
      next.season.startDay
    );

    return {
      name: season.name,
      year: jalali.year,
      start: tehranLocalToUTC(
        jalali.year,
        season.startMonth,
        season.startDay
      ),
      end: tehranLocalToUTC(
        endDate.year,
        endDate.month,
        endDate.day,
        23,
        59,
        59
      ),
      nextStart: tehranLocalToUTC(
        nextStartDate.year,
        nextStartDate.month,
        nextStartDate.day
      ),
      nextSeasonName: next.season.name,
      nextSeasonYear: next.year
    };
  }

  function getCurrentCampaign() {
    const parts = getTehranDateParts();

    const jalali = gregorianToJalali(
      parts.year,
      parts.month,
      parts.day
    );

    return buildCampaignWindow(jalali);
  }

  function formatCampaignDate(campaign) {
    const endJalali = getEndJalaliDate(campaign);

    return `
      تا پایان ${campaign.name}
      ${toPersianDigits(campaign.year)}
      در
      ${PERSIAN_MONTHS[endJalali.month - 1]}
      ${toPersianDigits(endJalali.day)}
    `;
  }

  function getEndJalaliDate(campaign) {
    const endUTC = campaign.end;

    return gregorianToJalali(
      endUTC.getUTCFullYear(),
      endUTC.getUTCMonth() + 1,
      endUTC.getUTCDate()
    );
  }

  function calculateRemaining(targetDate) {
    const now = new Date();
    const difference =
      targetDate.getTime() - now.getTime();

    if (difference <= 0) {
      return {
        total: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };
    }

    const totalSeconds =
      Math.floor(difference / 1000);

    return {
      total: difference,
      days: Math.floor(
        totalSeconds / 86400
      ),
      hours: Math.floor(
        (totalSeconds % 86400) / 3600
      ),
      minutes: Math.floor(
        (totalSeconds % 3600) / 60
      ),
      seconds: totalSeconds % 60
    };
  }

  function updateElement(id, value) {
    const element =
      document.getElementById(id);

    if (!element) return;

    element.textContent =
      toPersianDigits(value);
  }

  function updateCountdown() {
    currentCampaign =
      getCurrentCampaign();

    const remaining =
      calculateRemaining(
        currentCampaign.end
      );

    if (remaining.total <= 0) {
      currentCampaign =
        getCurrentCampaign();
      return;
    }

    updateElement(
      "countdownDays",
      remaining.days
    );

    updateElement(
      "countdownHours",
      formatNumber(remaining.hours)
    );

    updateElement(
      "countdownMinutes",
      formatNumber(remaining.minutes)
    );

    updateElement(
      "countdownSeconds",
      formatNumber(remaining.seconds)
    );

    const dateText =
      document.getElementById(
        "campaignDateText"
      );

    if (dateText) {
      dateText.textContent =
        formatCampaignDate(
          currentCampaign
        );
    }

    const campaignName =
      document.getElementById(
        "rulesCampaignName"
      );

    if (campaignName) {
      campaignName.textContent =
        `${currentCampaign.name} ${toPersianDigits(currentCampaign.year)}`;
    }
  }

  async function syncRemoteCampaign() {
    try {
      if (
        window.TTKALAAApi &&
        typeof window.TTKALAAApi.getCurrentCampaign ===
          "function"
      ) {
        const remote =
          await window.TTKALAAApi.getCurrentCampaign();

        if (remote) {
          window.TTKALAACurrentCampaign =
            remote;
        }
      }
    } catch (error) {
      console.warn(
        "Campaign API unavailable. Local seasonal countdown is active.",
        error
      );
    }
  }

  window.TTKALAACountdown = {
    getCurrentCampaign,
    getRemaining: () =>
      currentCampaign
        ? calculateRemaining(
            currentCampaign.end
          )
        : null,
    update: updateCountdown
  };

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      updateCountdown();

      timer = setInterval(
        updateCountdown,
        1000
      );

      syncRemoteCampaign();
    }
  );

  window.addEventListener(
    "beforeunload",
    () => {
      if (timer) {
        clearInterval(timer);
      }
    }
  );
})();
