(() => {
  "use strict";

  const form = document.getElementById("chanceForm");
  const mobileInput = document.getElementById("chanceMobile");
  const submitButton = document.getElementById("chanceSubmit");
  const hint = document.getElementById("chanceHint");
  const result = document.getElementById("chanceResult");

  let isLoading = false;

  function toEnglishDigits(value) {
    return String(value ?? "")
      .replace(/[۰-۹]/g, digit => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
      .replace(/[٠-٩]/g, digit => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));
  }

  function normalizeMobile(value) {
    let mobile = toEnglishDigits(value)
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "");

    if (mobile.startsWith("+98")) {
      mobile = "0" + mobile.slice(3);
    } else if (mobile.startsWith("0098")) {
      mobile = "0" + mobile.slice(4);
    }

    return mobile;
  }

  function formatPersianNumber(value) {
    return String(value ?? 0).replace(
      /\d/g,
      digit => "۰۱۲۳۴۵۶۷۸۹"[digit]
    );
  }

  function showHint(message, type = "default") {
    if (!hint) return;

    hint.textContent = message;
    hint.dataset.type = type;
  }

  function clearResult() {
    if (!result) return;

    result.innerHTML = "";
    result.classList.remove("is-visible");
  }

  function showResult({
    success = false,
    title = "",
    message = "",
    chances = null,
    purchases = null
  }) {
    if (!result) return;

    const icon = success ? "✓" : "i";

    let statsHTML = "";

    if (success && chances !== null) {
      statsHTML = `
        <div class="chance-result__stats">
          <div>
            <span>تعداد خرید</span>
            <strong>
              ${formatPersianNumber(purchases ?? 1)}
            </strong>
          </div>

          <div>
            <span>شانس فعال</span>
            <strong>
              ${formatPersianNumber(chances)}
            </strong>
          </div>
        </div>
      `;
    }

    result.innerHTML = `
      <div class="chance-result__icon ${success ? "success" : "info"}">
        ${icon}
      </div>

      <div class="chance-result__body">
        <strong class="chance-result__title">
          ${title}
        </strong>

        <p class="chance-result__message">
          ${message}
        </p>

        ${statsHTML}
      </div>
    `;

    result.classList.add("is-visible");
  }

  function setLoading(loading) {
    isLoading = loading;

    if (!submitButton) return;

    submitButton.disabled = loading;
    submitButton.setAttribute(
      "aria-busy",
      loading ? "true" : "false"
    );

    submitButton.dataset.originalText =
      submitButton.dataset.originalText ||
      submitButton.textContent;

    submitButton.textContent = loading
      ? "در حال بررسی..."
      : submitButton.dataset.originalText;
  }

  function validateMobile(mobile) {
    return /^09\d{9}$/.test(mobile);
  }

  function getCampaignId() {
    const remoteCampaign =
      window.TTKALAACurrentCampaign;

    if (remoteCampaign?.id) {
      return remoteCampaign.id;
    }

    const localCampaign =
      window.TTKALAACountdown?.getCurrentCampaign?.();

    if (!localCampaign) {
      return null;
    }

    return (
      localCampaign.id ||
      `${localCampaign.year}-${localCampaign.name}`
    );
  }

  async function lookupChance(mobile) {
    if (
      !window.TTKALAAApi ||
      typeof window.TTKALAAApi.lookupChance !==
        "function"
    ) {
      throw new Error(
        "سامانه بررسی شانس در دسترس نیست."
      );
    }

    const campaignId =
      getCampaignId();

    return window.TTKALAAApi.lookupChance(
      mobile,
      campaignId
    );
  }

  function handleNoPurchase(data) {
    showResult({
      success: false,
      title: "هنوز خریدی برای این شماره ثبت نشده",
      message:
        data?.message ||
        "برای این شماره هنوز خریدی در این دوره ثبت نشده و شانس فعالی ندارید."
    });

    showHint(
      "اگر خریدی انجام نداده‌اید، می‌توانید همین حالا محصول موردنظر خود را انتخاب و خرید کنید.",
      "info"
    );

    const productsSection =
      document.getElementById("products");

    if (productsSection) {
      const buyButton =
        productsSection.querySelector(
          "[data-buy-product]"
        );

      if (buyButton) {
        const existingCTA =
          result.querySelector(
            ".chance-result__cta"
          );

        if (!existingCTA) {
          const cta = document.createElement("button");

          cta.type = "button";
          cta.className =
            "chance-result__cta";
          cta.textContent =
            "مشاهده محصولات و خرید";

          cta.addEventListener(
            "click",
            () => {
              productsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });
            }
          );

          result.appendChild(cta);
        }
      }
    }
  }

  function handleSuccess(data) {
    const chances =
      Number(
        data?.chances ??
        data?.chanceCount ??
        data?.activeChances ??
        0
      );

    const purchases =
      Number(
        data?.purchases ??
        data?.purchaseCount ??
        1
      );

    showResult({
      success: true,
      title: "شانس شما فعال است",
      message:
        data?.message ||
        "خرید شما در این دوره ثبت شده و شانس شما در قرعه‌کشی فعال است.",
      chances,
      purchases
    });

    showHint(
      "اطلاعات شانس بر اساس سوابق ثبت‌شده در سامانه نمایش داده شد.",
      "success"
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) return;

    clearResult();

    const mobile =
      normalizeMobile(
        mobileInput?.value
      );

    if (!validateMobile(mobile)) {
      showHint(
        "لطفاً شماره موبایل ۱۱ رقمی معتبر خود را وارد کنید.",
        "error"
      );

      mobileInput?.focus();
      return;
    }

    if (mobileInput) {
      mobileInput.value = mobile;
    }

    setLoading(true);

    showHint(
      "در حال بررسی سوابق خرید و شانس شما...",
      "loading"
    );

    try {
      const response =
        await lookupChance(mobile);

      const hasPurchase =
        Boolean(
          response?.hasPurchase ??
          response?.hasPurchases ??
          response?.purchased ??
          (
            Number(
              response?.purchases ??
              response?.purchaseCount ??
              0
            ) > 0
          )
        );

      if (hasPurchase) {
        handleSuccess(response);
      } else {
        handleNoPurchase(response);
      }
    } catch (error) {
      console.error(
        "Chance lookup error:",
        error
      );

      showResult({
        success: false,
        title: "بررسی انجام نشد",
        message:
          window.TTKALAAApi?.getSafeErrorMessage
            ? window.TTKALAAApi.getSafeErrorMessage(
                error
              )
            : "در حال حاضر امکان بررسی وجود ندارد. لطفاً دوباره تلاش کنید."
      });

      showHint(
        "لطفاً چند لحظه بعد دوباره امتحان کنید.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function maskMobileInput() {
    if (!mobileInput) return;

    const value =
      toEnglishDigits(
        mobileInput.value
      ).replace(/\D/g, "");

    if (value.length <= 4) {
      mobileInput.value = value;
      return;
    }

    mobileInput.value = value.slice(0, 11);
  }

  function initialize() {
    if (!form) return;

    form.addEventListener(
      "submit",
      handleSubmit
    );

    mobileInput?.addEventListener(
      "input",
      maskMobileInput
    );

    mobileInput?.addEventListener(
      "keydown",
      event => {
        if (event.key === "Enter") {
          event.preventDefault();
          form.requestSubmit();
        }
      }
    );
  }

  window.TTKALAAChance = {
    lookup: lookupChance,
    normalizeMobile,
    getCampaignId
  };

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );
})();
