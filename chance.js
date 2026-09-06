/* =========================================================
   T.T.KALAA - بررسی شانس کاربر
   فقط دو نتیجه عادی دارد:
   1) BUYER
   2) NON_BUYER
   ========================================================= */

(function () {
  "use strict";

  const mobileInput = document.getElementById("chanceMobile");
  const checkButton = document.getElementById("checkChanceBtn");
  const resultBox = document.getElementById("chanceResult");
  const resultContent = document.getElementById("chanceResultContent");

  let currentCampaignId = null;

  /* تبدیل اعداد فارسی و عربی به انگلیسی */
  function normalizeDigits(value) {
    return String(value || "")
      .replace(/[۰-۹]/g, function (digit) {
        return String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
      })
      .replace(/[٠-٩]/g, function (digit) {
        return String("٠١٢٣٤٥٦٧٨٩".indexOf(digit));
      });
  }

  /* نرمال‌سازی شماره موبایل */
  function normalizeMobile(value) {
    let mobile = normalizeDigits(value).replace(/[^\d+]/g, "");

    if (mobile.startsWith("+98")) {
      mobile = "0" + mobile.slice(3);
    } else if (mobile.startsWith("0098")) {
      mobile = "0" + mobile.slice(4);
    }

    return mobile;
  }

  /* بررسی فرمت شماره موبایل */
  function isValidMobile(value) {
    return /^09\d{9}$/.test(value);
  }

  /* فرمت عدد برای نمایش */
  function formatNumber(value) {
    const number = Number(value || 0);

    return number
      .toLocaleString("fa-IR");
  }

  /* جلوگیری از ورود HTML در اطلاعات دریافتی از سرور */
  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* نمایش باکس نتیجه */
  function showResult(html, type) {
    if (!resultBox || !resultContent) {
      return;
    }

    resultBox.classList.remove(
      "buyer-result",
      "non-buyer-result",
      "error-result",
      "show"
    );

    resultBox.classList.add(type || "show");
    resultContent.innerHTML = html;
    resultBox.classList.add("show");
  }

  /* حالت در حال بررسی */
  function showLoading() {
    showResult(
      `
        <div class="chance-result-loading">
          <span class="chance-spinner"></span>
          <strong>در حال بررسی...</strong>
        </div>
      `,
      "show"
    );
  }

  /* نتیجه کاربر خریدار */
  function renderBuyer(data) {
    const purchaseCount = Number(data.purchaseCount || 0);
    const chanceCount = Number(
      data.chanceCount || purchaseCount || 0
    );

    const trackingCode = escapeHTML(
      data.trackingCode || "در حال ثبت"
    );

    const productName = escapeHTML(
      data.productName || "محصول دیجیتال"
    );

    const products = Array.isArray(data.products)
      ? data.products
      : [];

    let productsHTML = "";

    if (products.length > 0) {
      productsHTML = `
        <div class="chance-products">
          <div class="chance-products-title">
            محصولات خریداری‌شده
          </div>

          ${products
            .map(function (product) {
              const name = escapeHTML(
                product.name ||
                product.title ||
                "محصول دیجیتال"
              );

              const count = Number(
                product.quantity || 1
              );

              return `
                <div class="chance-product-row">
                  <span>${name}</span>
                  <strong>${formatNumber(count)} عدد</strong>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    showResult(
      `
        <div class="chance-result-success">
          <div class="chance-result-icon">✓</div>

          <h3>شما در قرعه‌کشی این دوره شرکت داده شده‌اید</h3>

          <div class="chance-stats">
            <div class="chance-stat">
              <span>تعداد خرید</span>
              <strong>${formatNumber(purchaseCount)}</strong>
            </div>

            <div class="chance-stat">
              <span>تعداد شانس</span>
              <strong>${formatNumber(chanceCount)}</strong>
            </div>
          </div>

          <div class="chance-info">
            <span>محصول</span>
            <strong>${productName}</strong>
          </div>

          <div class="chance-info">
            <span>کد پیگیری</span>
            <strong>${trackingCode}</strong>
          </div>

          ${productsHTML}

          <div class="chance-download-area">
            <button
              type="button"
              id="downloadPurchasedProductBtn"
              class="chance-download-btn"
            >
              دانلود محصول خریداری‌شده
            </button>
          </div>
        </div>
      `,
      "buyer-result"
    );

    const downloadButton = document.getElementById(
      "downloadPurchasedProductBtn"
    );

    if (downloadButton) {
      downloadButton.addEventListener("click", async function () {
        await downloadProduct(data);
      });
    }
  }

  /* نتیجه کاربر غیرخریدار */
  function renderNonBuyer() {
    showResult(
      `
        <div class="chance-result-nonbuyer">
          <div class="chance-result-icon">!</div>

          <h3>شما هنوز در قرعه‌کشی این دوره شرکت نکرده‌اید</h3>

          <p>
            فقط با یک خرید ۲۹٬۰۰۰ تومانی،
            یک شانس برای شرکت در قرعه‌کشی این دوره دریافت می‌کنید.
          </p>

          <button
            type="button"
            id="chancePurchaseBtn"
            class="chance-purchase-btn"
          >
            خرید و دریافت شانس
          </button>
        </div>
      `,
      "non-buyer-result"
    );

    const purchaseButton = document.getElementById(
      "chancePurchaseBtn"
    );

    if (purchaseButton) {
      purchaseButton.addEventListener("click", function () {
        const productsSection =
          document.getElementById("products");

        if (productsSection) {
          productsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    }
  }

  /* دریافت لینک دانلود محصول */
  async function downloadProduct(data) {
    try {
      if (
        !window.TTKALAAApi ||
        typeof window.TTKALAAApi.getDownloadLink !== "function"
      ) {
        return;
      }

      if (!data.orderId) {
        /*
          اگر API کد سفارش را برای دانلود ارسال نکرده باشد،
          لینک دانلود نباید حدس زده یا جعل شود.
        */
        return;
      }

      const response =
        await window.TTKALAAApi.getDownloadLink(
          data.orderId
        );

      const downloadUrl =
        response &&
        (
          response.downloadUrl ||
          response.url ||
          (response.data && response.data.downloadUrl) ||
          (response.data && response.data.url)
        );

      if (downloadUrl) {
        window.location.href = downloadUrl;
      }
    } catch (error) {
      console.error("Download error:", error);
    }
  }

  /* دریافت شناسه دوره جاری */
  async function getCampaignId() {
    if (currentCampaignId) {
      return currentCampaignId;
    }

    if (
      !window.TTKALAAApi ||
      typeof window.TTKALAAApi.getCurrentCampaign !== "function"
    ) {
      throw new Error("Campaign API unavailable");
    }

    const response =
      await window.TTKALAAApi.getCurrentCampaign();

    const campaign =
      response && response.data
        ? response.data
        : response && response.campaign
        ? response.campaign
        : response;

    currentCampaignId =
      campaign &&
      (
        campaign.id ||
        campaign.campaignId ||
        campaign.campaign_id
      );

    if (!currentCampaignId) {
      throw new Error("Campaign ID unavailable");
    }

    return currentCampaignId;
  }

  /* بررسی شانس */
  async function checkChance() {
    if (!mobileInput || !checkButton) {
      return;
    }

    const mobile = normalizeMobile(
      mobileInput.value
    );

    if (!isValidMobile(mobile)) {
      /*
        این پیام فقط خطای ورودی است،
        نه نتیجه بررسی شانس.
      */
      showResult(
        `
          <div class="chance-input-error">
            <strong>شماره موبایل را کامل وارد کنید.</strong>
          </div>
        `,
        "error-result"
      );

      return;
    }

    checkButton.disabled = true;
    checkButton.classList.add("loading");

    showLoading();

    try {
      const campaignId = await getCampaignId();

      const result =
        await window.TTKALAAApi.lookupChance(
          mobile,
          campaignId
        );

      /*
        تنها دو وضعیت عادی از API پذیرفته می‌شود.
      */
      if (result.status === "BUYER") {
        renderBuyer(result);
      } else if (result.status === "NON_BUYER") {
        renderNonBuyer();
      } else {
        /*
          پاسخ ناشناخته، خطای فنی است و نباید
          به عنوان وضعیت سوم کاربر نمایش داده شود.
        */
        throw new Error("Unknown chance status");
      }
    } catch (error) {
      console.error("Chance lookup error:", error);

      /*
        خطای فنی با وضعیت خرید اشتباه نمی‌شود.
        نتیجه BUYER یا NON_BUYER جعل نمی‌کنیم.
      */
      showResult(
        `
          <div class="chance-input-error">
            <strong>امکان بررسی اطلاعات در حال حاضر وجود ندارد.</strong>
            <p>لطفاً چند لحظه بعد دوباره تلاش کنید.</p>
          </div>
        `,
        "error-result"
      );
    } finally {
      checkButton.disabled = false;
      checkButton.classList.remove("loading");
    }
  }

  /* محدود کردن ورودی به اعداد و کنترل Enter */
  if (mobileInput) {
    mobileInput.addEventListener("input", function () {
      this.value = normalizeDigits(this.value)
        .replace(/[^\d+]/g, "")
        .slice(0, 13);
    });

    mobileInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        checkChance();
      }
    });
  }

  if (checkButton) {
    checkButton.addEventListener(
      "click",
      checkChance
    );
  }

  /* خروجی عمومی */
  window.TTKALAAChance = {
    check: checkChance,
    normalizeMobile,
    isValidMobile
  };
})();
