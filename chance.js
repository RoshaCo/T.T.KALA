(function (window) {
  "use strict";

  let currentCampaignId = null;

  function normalizeDigits(value) {
    return String(value || "")
      .replace(/[۰-۹]/g, function (char) {
        return String("۰۱۲۳۴۵۶۷۸۹".indexOf(char));
      })
      .replace(/[٠-٩]/g, function (char) {
        return String("٠١٢٣٤٥٦٧٨٩".indexOf(char));
      });
  }

  function normalizeMobile(value) {
    let mobile = normalizeDigits(value)
      .replace(/\s+/g, "")
      .replace(/[-()]/g, "");

    if (mobile.startsWith("+98")) {
      mobile = "0" + mobile.slice(3);
    }

    if (mobile.startsWith("0098")) {
      mobile = "0" + mobile.slice(4);
    }

    return mobile;
  }

  function isValidMobile(value) {
    return /^09\d{9}$/.test(
      normalizeMobile(value)
    );
  }

  function formatNumber(value) {
    const number = Number(value || 0);

    if (!Number.isFinite(number)) {
      return "۰";
    }

    return number.toLocaleString("fa-IR");
  }

  function getElement(id) {
    return document.getElementById(id);
  }

  function showResult(message, type) {
    const result = getElement("chanceResult");

    if (!result) {
      return;
    }

    result.className =
      "chance-result is-visible " +
      (type || "");

    result.textContent = message;
  }

  function showLoading() {
    const result = getElement("chanceResult");

    if (!result) {
      return;
    }

    result.className =
      "chance-result is-visible";

    result.textContent =
      "در حال بررسی سوابق شما...";
  }

  function showTechnicalError() {
    showResult(
      "لطفاً چند دقیقه بعد دوباره تلاش کنید",
      "error"
    );
  }

  function renderBuyerResult(data) {
    const chanceCount =
      Number(data.chanceCount || data.purchaseCount || 0);

    const purchaseCount =
      Number(data.purchaseCount || chanceCount || 0);

    let message =
      "شانس شما " +
      formatNumber(chanceCount) +
      " از ۱۰۰ نفر است.";

    if (purchaseCount > 1) {
      message +=
        " شما " +
        formatNumber(purchaseCount) +
        " خرید در دوره جاری دارید.";
    }

    showResult(
      message,
      "success"
    );
  }

  function renderNonBuyerResult() {
    showResult(
      "با خرید یک کالا به ارزش فقط ۲۹٬۰۰۰ تومان می‌تونی شانس شرکت در قرعه‌کشی داشته باشی",
      ""
    );
  }

  async function getCampaignId() {
    if (currentCampaignId) {
      return currentCampaignId;
    }

    if (
      !window.TTKALAA_API ||
      typeof window.TTKALAA_API.getCurrentCampaign !==
        "function"
    ) {
      return null;
    }

    try {
      const campaign =
        await window.TTKALAA_API.getCurrentCampaign();

      currentCampaignId =
        campaign?.id ||
        campaign?.campaignId ||
        campaign?.data?.id ||
        campaign?.data?.campaignId ||
        null;

      return currentCampaignId;
    } catch (error) {
      return null;
    }
  }

  async function checkChance(mobile) {
    if (
      !window.TTKALAA_API ||
      typeof window.TTKALAA_API.lookupChance !==
        "function"
    ) {
      showTechnicalError();
      return;
    }

    const normalizedMobile =
      normalizeMobile(mobile);

    if (!isValidMobile(normalizedMobile)) {
      showResult(
        "لطفاً شماره تماس صحیح وارد کنید.",
        "error"
      );
      return;
    }

    showLoading();

    try {
      const campaignId =
        await getCampaignId();

      const response =
        await window.TTKALAA_API.lookupChance(
          normalizedMobile,
          campaignId
        );

      if (response?.status === "BUYER") {
        renderBuyerResult(response);
        return;
      }

      if (response?.status === "NON_BUYER") {
        renderNonBuyerResult();
        return;
      }

      showTechnicalError();

    } catch (error) {
      showTechnicalError();
    }
  }

  function init() {
    const form =
      getElement("chanceForm");

    const input =
      getElement("chanceMobile");

    if (!form || !input) {
      return;
    }

    form.addEventListener(
      "submit",
      function (event) {
        event.preventDefault();

        checkChance(
          input.value
        );
      }
    );

    input.addEventListener(
      "input",
      function () {
        const normalized =
          normalizeDigits(input.value);

        input.value =
          normalized
            .replace(/[^\d+]/g, "")
            .slice(0, 13);
      }
    );
  }

  window.TTKALAAChance = {
    checkChance
  };

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})(window);
