/* =========================================================
   بخش «سابقه خرید و شرایط من»
   جستجوی شانس فقط با شماره موبایل
   به‌روزرسانی: قیمت ۳۵,۰۰۰ تومان
========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     عناصر بخش شانس
     --------------------------------------------------------- */

  const form = document.getElementById("chanceForm");
  const mobileInput = document.getElementById("chanceMobile");
  const submitButton = document.getElementById("chanceSubmit");
  const resultBox = document.getElementById("chanceResult");

  if (!form || !mobileInput || !submitButton || !resultBox) {
    return;
  }

  /* ---------------------------------------------------------
     تبدیل اعداد فارسی و عربی به انگلیسی
     --------------------------------------------------------- */

  function normalizeDigits(value) {
    return String(value || "")
      .replace(/[۰-۹]/g, function (digit) {
        return "۰۱۲۳۴۵۶۷۸۹".indexOf(digit);
      })
      .replace(/[٠-٩]/g, function (digit) {
        return "٠١٢٣٤٥٦٧٨٩".indexOf(digit);
      });
  }

  /* ---------------------------------------------------------
     استانداردسازی شماره موبایل
     --------------------------------------------------------- */

  function normalizeMobile(value) {
    let mobile = normalizeDigits(value)
      .replace(/[\s\-()]/g, "");

    if (mobile.startsWith("+98")) {
      mobile = "0" + mobile.slice(3);
    }

    if (mobile.startsWith("0098")) {
      mobile = "0" + mobile.slice(4);
    }

    return mobile;
  }

  /* ---------------------------------------------------------
     اعتبارسنجی شماره موبایل
     --------------------------------------------------------- */

  function isValidMobile(value) {
    return /^09\d{9}$/.test(
      normalizeMobile(value)
    );
  }

  /* ---------------------------------------------------------
     نمایش پیام
     --------------------------------------------------------- */

  function showMessage(
    type,
    title,
    message,
    extraHTML
  ) {
    resultBox.className =
      "chance-result chance-result-" + type;

    resultBox.innerHTML = `
      <div class="chance-result-title">
        ${title}
      </div>

      <div class="chance-result-message">
        ${message}
      </div>

      ${
        extraHTML
          ? `<div class="chance-result-extra">${extraHTML}</div>`
          : ""
      }
    `;

    resultBox.hidden = false;
  }

  /* ---------------------------------------------------------
     پاک کردن نتیجه قبلی
     --------------------------------------------------------- */

  function clearResult() {
    resultBox.hidden = true;
    resultBox.innerHTML = "";
  }

  /* ---------------------------------------------------------
     پیام خطای شماره
     --------------------------------------------------------- */

  function showMobileError() {
    showMessage(
      "error",
      "شماره موبایل صحیح نیست",
      "شماره موبایل خودتان را کامل وارد کنید."
    );

    mobileInput.focus();
  }

  /* ---------------------------------------------------------
     تبدیل عدد به فارسی
     --------------------------------------------------------- */

  function toPersianNumber(value) {
    return String(value).replace(
      /\d/g,
      function (digit) {
        return "۰۱۲۳۴۵۶۷۸۹"[digit];
      }
    );
  }

  /* ---------------------------------------------------------
     استخراج اطلاعات نتیجه
     --------------------------------------------------------- */

  function getValue(object, keys, fallback) {
    for (const key of keys) {
      if (
        object &&
        object[key] !== undefined &&
        object[key] !== null
      ) {
        return object[key];
      }
    }

    return fallback;
  }

  /* ---------------------------------------------------------
     نمایش نتیجه خریدار
     --------------------------------------------------------- */

  function renderBuyerResult(data) {
    const purchases = Number(
      getValue(
        data,
        [
          "purchaseCount",
          "purchases",
          "totalPurchases",
          "count"
        ],
        1
      )
    );

    const chances = Number(
      getValue(
        data,
        [
          "chanceCount",
          "chances",
          "totalChances"
        ],
        purchases
      )
    );

    const trackingCode = getValue(
      data,
      [
        "trackingCode",
        "tracking_code",
        "code"
      ],
      "ثبت شده"
    );

    const productName = getValue(
      data,
      [
        "productName",
        "product",
        "lastProductName"
      ],
      "محصول خریداری‌شده"
    );

    showMessage(
      "success",
      "شما در قرعه‌کشی شرکت داده شده‌اید",
      "خرید شما با موفقیت ثبت شده و شانس شما در دوره جاری فعال است.",
      `
        <div class="chance-info-grid">

          <div class="chance-info-item">
            <span>تعداد خرید</span>
            <strong>${toPersianNumber(purchases)}</strong>
          </div>

          <div class="chance-info-item">
            <span>تعداد شانس</span>
            <strong>${toPersianNumber(chances)}</strong>
          </div>

          <div class="chance-info-item">
            <span>محصول</span>
            <strong>${productName}</strong>
          </div>

          <div class="chance-info-item">
            <span>کد پیگیری</span>
            <strong>${trackingCode}</strong>
          </div>

        </div>
      `
    );
  }

  /* ---------------------------------------------------------
     نمایش نتیجه فردی که خرید نکرده است
     --------------------------------------------------------- */

  function renderNonBuyerResult() {
    showMessage(
      "empty",
      "شما هنوز در این دوره شرکت نکرده‌اید",
      "برای ورود به قرعه‌کشی یکی از محصولات ۳۵,۰۰۰ تومانی را تهیه کنید.",
      `
        <button
          type="button"
          class="chance-buy-button"
          data-buy-from-chance
        >
          دریافت بلیت ورود
        </button>
      `
    );

    const buyButton =
      resultBox.querySelector(
        "[data-buy-from-chance]"
      );

    if (buyButton) {
      buyButton.addEventListener(
        "click",
        function () {
          const productsSection =
            document.getElementById("products");

          if (productsSection) {
            productsSection.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        }
      );
    }
  }

  /* ---------------------------------------------------------
     جستجوی شانس
     --------------------------------------------------------- */

  async function lookupChance() {
    clearResult();

    const mobile =
      normalizeMobile(mobileInput.value);

    if (!isValidMobile(mobile)) {
      showMobileError();
      return;
    }

    submitButton.disabled = true;
    submitButton.classList.add("is-loading");

    try {
      /* -----------------------------------------------------
         دریافت دوره فعال
         ----------------------------------------------------- */

      const campaign =
        await TTKALAAApi.getCurrentCampaign();

      const campaignId =
        getValue(
          campaign,
          ["id", "campaignId"],
          null
        );

      /* -----------------------------------------------------
         جستجوی شماره در دوره جاری
         ----------------------------------------------------- */

      const result =
        await TTKALAAApi.lookupChance(
          mobile,
          campaignId
        );

      const isBuyer =
        result &&
        (
          result.hasPurchase === true ||
          result.hasChance === true ||
          result.registered === true ||
          result.status === "buyer" ||
          result.status === "entered"
        );

      if (isBuyer) {
        renderBuyerResult(result);
      } else {
        renderNonBuyerResult();
      }

    } catch (error) {

      showMessage(
        "error",
        "امکان بررسی اطلاعات وجود ندارد",
        "لطفاً چند لحظه بعد دوباره تلاش کنید."
      );

      console.error(
        "TTKALAA chance lookup error:",
        error
      );

    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove(
        "is-loading"
      );
    }
  }

  /* ---------------------------------------------------------
     ارسال فرم
     --------------------------------------------------------- */

  form.addEventListener(
    "submit",
    function (event) {
      event.preventDefault();
      lookupChance();
    }
  );

  /* ---------------------------------------------------------
     کنترل ورود شماره
     فقط اعداد فارسی و انگلیسی
     --------------------------------------------------------- */

  mobileInput.addEventListener(
    "input",
    function () {
      let value = mobileInput.value;

      value = value.replace(
        /[^0-9۰-۹]/g,
        ""
      );

      if (value.length > 11) {
        value = value.slice(0, 11);
      }

      mobileInput.value = value;
    }
  );

})();
