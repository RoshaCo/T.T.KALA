/* =========================================================
   T.T.KALAA - مدیریت خرید و پرداخت
   مسیر:
   انتخاب محصول → ایجاد سفارش → انتقال به زرین‌پال
   → بازگشت از درگاه → ثبت شماره موبایل → ثبت شانس
   ========================================================= */

(function () {
  "use strict";

  let selectedProduct = null;
  let currentOrder = null;
  let currentCampaign = null;

  const purchaseModal = document.getElementById("purchaseModal");
  const paymentResultModal = document.getElementById("paymentResultModal");

  const purchaseProductName =
    document.getElementById("purchaseProductName");

  const purchaseProductPrice =
    document.getElementById("purchaseProductPrice");

  const purchaseMobile =
    document.getElementById("purchaseMobile");

  const purchaseConfirmBtn =
    document.getElementById("purchaseConfirmBtn");

  const purchaseCloseBtn =
    document.getElementById("purchaseCloseBtn");

  const paymentResultContent =
    document.getElementById("paymentResultContent");

  const paymentResultCloseBtn =
    document.getElementById("paymentResultCloseBtn");

  /* =========================================================
     ابزارهای عمومی
     ========================================================= */

  function normalizeDigits(value) {
    return String(value || "")
      .replace(/[۰-۹]/g, function (digit) {
        return String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
      })
      .replace(/[٠-٩]/g, function (digit) {
        return String("٠١٢٣٤٥٦٧٨٩".indexOf(digit));
      });
  }

  function normalizeMobile(value) {
    let mobile = normalizeDigits(value)
      .replace(/[^\d+]/g, "");

    if (mobile.startsWith("+98")) {
      mobile = "0" + mobile.slice(3);
    } else if (mobile.startsWith("0098")) {
      mobile = "0" + mobile.slice(4);
    }

    return mobile;
  }

  function isValidMobile(value) {
    return /^09\d{9}$/.test(value);
  }

  function toPersianNumber(value) {
    return String(value)
      .replace(/\d/g, function (digit) {
        return "۰۱۲۳۴۵۶۷۸۹"[digit];
      });
  }

  function formatPrice(value) {
    return Number(value || 0)
      .toLocaleString("fa-IR") + " تومان";
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =========================================================
     مدیریت مودال خرید
     ========================================================= */

  function openPurchaseModal(product) {
    if (!product || !purchaseModal) {
      return;
    }

    selectedProduct = product;

    if (purchaseProductName) {
      purchaseProductName.textContent =
        product.name || product.title || "محصول دیجیتال";
    }

    if (purchaseProductPrice) {
      purchaseProductPrice.textContent =
        formatPrice(product.price || 29000);
    }

    if (purchaseMobile) {
      purchaseMobile.value = "";
    }

    purchaseModal.classList.add("show");
    document.body.classList.add("modal-open");

    setTimeout(function () {
      if (purchaseMobile) {
        purchaseMobile.focus();
      }
    }, 100);
  }

  function closePurchaseModal() {
    if (!purchaseModal) {
      return;
    }

    purchaseModal.classList.remove("show");
    document.body.classList.remove("modal-open");

    selectedProduct = null;
  }

  function openPaymentResultModal() {
    if (!paymentResultModal) {
      return;
    }

    paymentResultModal.classList.add("show");
    document.body.classList.add("modal-open");
  }

  function closePaymentResultModal() {
    if (!paymentResultModal) {
      return;
    }

    paymentResultModal.classList.remove("show");
    document.body.classList.remove("modal-open");
  }

  /* =========================================================
     نمایش نتیجه پرداخت
     ========================================================= */

  function showPaymentResult(type, data) {
    if (!paymentResultContent) {
      return;
    }

    const trackingCode = escapeHTML(
      data && (
        data.trackingCode ||
        data.tracking_code ||
        data.referenceId ||
        data.reference_id
      ) || "در حال ثبت"
    );

    if (type === "success") {
      paymentResultContent.innerHTML = `
        <div class="payment-success">
          <div class="payment-result-icon">✓</div>

          <h3>پرداخت با موفقیت انجام شد</h3>

          <p>
            خرید شما ثبت شد و شانس شما برای قرعه‌کشی
            دوره جاری ایجاد شد.
          </p>

          <div class="payment-result-info">
            <span>کد پیگیری</span>
            <strong>${trackingCode}</strong>
          </div>

          <button
            type="button"
            class="payment-result-action"
            id="paymentGoChanceBtn"
          >
            بررسی شانس من
          </button>
        </div>
      `;

      const chanceButton =
        document.getElementById("paymentGoChanceBtn");

      if (chanceButton) {
        chanceButton.addEventListener("click", function () {
          closePaymentResultModal();

          const chanceSection =
            document.getElementById("chance");

          if (chanceSection) {
            chanceSection.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }
        });
      }
    } else {
      paymentResultContent.innerHTML = `
        <div class="payment-failed">
          <div class="payment-result-icon">!</div>

          <h3>پرداخت تکمیل نشد</h3>

          <p>
            پرداخت شما تأیید نشده است.
            مبلغی به عنوان خرید موفق برای شما ثبت نمی‌شود.
          </p>

          <button
            type="button"
            class="payment-result-action"
            id="paymentRetryBtn"
          >
            بازگشت به محصولات
          </button>
        </div>
      `;

      const retryButton =
        document.getElementById("paymentRetryBtn");

      if (retryButton) {
        retryButton.addEventListener("click", function () {
          closePaymentResultModal();

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

    openPaymentResultModal();
  }

  /* =========================================================
     دریافت دوره جاری
     ========================================================= */

  async function loadCurrentCampaign() {
    if (currentCampaign) {
      return currentCampaign;
    }

    if (
      !window.TTKALAAApi ||
      typeof window.TTKALAAApi.getCurrentCampaign !== "function"
    ) {
      throw new Error("Campaign API unavailable");
    }

    const response =
      await window.TTKALAAApi.getCurrentCampaign();

    currentCampaign =
      response && response.data
        ? response.data
        : response && response.campaign
        ? response.campaign
        : response;

    if (!currentCampaign) {
      throw new Error("Current campaign unavailable");
    }

    return currentCampaign;
  }

  function getCampaignId(campaign) {
    return (
      campaign &&
      (
        campaign.id ||
        campaign.campaignId ||
        campaign.campaign_id
      )
    );
  }

  /* =========================================================
     ایجاد سفارش
     ========================================================= */

  async function createOrder() {
    if (!selectedProduct) {
      throw new Error("Product not selected");
    }

    const campaign = await loadCurrentCampaign();

    const campaignId = getCampaignId(campaign);

    if (!campaignId) {
      throw new Error("Campaign ID unavailable");
    }

    if (
      !window.TTKALAAApi ||
      typeof window.TTKALAAApi.createOrder !== "function"
    ) {
      throw new Error("Order API unavailable");
    }

    /*
      شماره موبایل قبل از پرداخت به سفارش ارسال نمی‌شود.
      ابتدا سفارش ایجاد می‌شود، سپس پرداخت انجام می‌شود.
      بعد از تأیید پرداخت، شماره موبایل به سفارش پرداخت‌شده
      متصل خواهد شد.
    */
    currentOrder =
      await window.TTKALAAApi.createOrder({
        productId: selectedProduct.id,
        campaignId: campaignId
      });

    return currentOrder;
  }

  /* =========================================================
     شروع پرداخت زرین‌پال
     ========================================================= */

  async function startPayment() {
    if (!currentOrder) {
      throw new Error("Order not created");
    }

    const orderId =
      currentOrder.id ||
      currentOrder.orderId ||
      currentOrder.order_id;

    if (!orderId) {
      throw new Error("Order ID unavailable");
    }

    if (
      !window.TTKALAAApi ||
      typeof window.TTKALAAApi.startPayment !== "function"
    ) {
      throw new Error("Payment API unavailable");
    }

    const response =
      await window.TTKALAAApi.startPayment(orderId);

    const paymentUrl =
      response &&
      (
        response.paymentUrl ||
        response.payment_url ||
        response.url ||
        (response.data && response.data.paymentUrl) ||
        (response.data && response.data.payment_url) ||
        (response.data && response.data.url)
      );

    if (!paymentUrl) {
      throw new Error("Payment URL unavailable");
    }

    /*
      انتقال مستقیم کاربر به درگاه پرداخت.
    */
    window.location.href = paymentUrl;
  }

  /* =========================================================
     ثبت شماره موبایل بعد از پرداخت موفق
     ========================================================= */

  async function registerMobileAfterPayment(orderId, mobile) {
    if (
      !window.TTKALAAApi ||
      typeof window.TTKALAAApi.registerPurchaseMobile !== "function"
    ) {
      throw new Error("Register mobile API unavailable");
    }

    return await window.TTKALAAApi.registerPurchaseMobile({
      orderId: orderId,
      mobile: mobile
    });
  }

  /* =========================================================
     پردازش بازگشت از درگاه
     ========================================================= */

  async function processPaymentCallback() {
    const params =
      new URLSearchParams(window.location.search);

    const orderId =
      params.get("orderId") ||
      params.get("order_id");

    const authority =
      params.get("Authority") ||
      params.get("authority");

    const status =
      params.get("Status") ||
      params.get("status");

    /*
      اگر صفحه از بازگشت درگاه نیامده باشد،
      هیچ پردازشی انجام نمی‌شود.
    */
    if (!orderId && !authority && !status) {
      return;
    }

    try {
      if (
        !window.TTKALAAApi ||
        typeof window.TTKALAAApi.getPaymentResult !== "function"
      ) {
        throw new Error("Payment result API unavailable");
      }

      const result =
        await window.TTKALAAApi.getPaymentResult({
          orderId: orderId,
          authority: authority,
          status: status
        });

      const paymentStatus =
        result &&
        (
          result.status ||
          result.paymentStatus ||
          result.payment_status
        );

      const normalizedStatus =
        String(paymentStatus || "").toUpperCase();

      if (
        normalizedStatus === "PAID" ||
        normalizedStatus === "SUCCESS" ||
        normalizedStatus === "VERIFIED"
      ) {
        /*
          پرداخت موفق است.
          شماره موبایل در این مرحله از کاربر گرفته می‌شود
          تا سفارش پرداخت‌شده به موبایل او متصل شود.
        */
        currentOrder = result.order || result;

        const returnedOrderId =
          result.orderId ||
          result.order_id ||
          (result.order && (
            result.order.id ||
            result.order.orderId ||
            result.order.order_id
          )) ||
          orderId;

        await askMobileForPaidOrder(returnedOrderId);

        return;
      }

      showPaymentResult("failed", result);
    } catch (error) {
      console.error(
        "Payment callback error:",
        error
      );

      showPaymentResult("failed", {});
    }
  }

  /* =========================================================
     گرفتن شماره موبایل بعد از پرداخت
     ========================================================= */

  async function askMobileForPaidOrder(orderId) {
    if (!purchaseModal) {
      return;
    }

    selectedProduct = null;
    currentOrder = {
      id: orderId
    };

    if (purchaseProductName) {
      purchaseProductName.textContent =
        "ثبت شماره موبایل برای تکمیل ثبت خرید";
    }

    if (purchaseProductPrice) {
      purchaseProductPrice.textContent =
        "پرداخت شما تأیید شده است";
    }

    if (purchaseMobile) {
      purchaseMobile.value = "";
    }

    purchaseModal.classList.add("show");
    document.body.classList.add("modal-open");

    /*
      مشخص می‌کنیم این مودال برای ثبت شماره بعد از پرداخت است.
    */
    purchaseModal.dataset.mode = "register-mobile";

    setTimeout(function () {
      if (purchaseMobile) {
        purchaseMobile.focus();
      }
    }, 100);
  }

  /* =========================================================
     تأیید خرید یا ثبت موبایل
     ========================================================= */

  async function confirmPurchase() {
    if (!purchaseMobile) {
      return;
    }

    const mobile =
      normalizeMobile(purchaseMobile.value);

    if (!isValidMobile(mobile)) {
      purchaseMobile.focus();
      return;
    }

    if (purchaseConfirmBtn) {
      purchaseConfirmBtn.disabled = true;
      purchaseConfirmBtn.classList.add("loading");
    }

    try {
      /*
        حالت ثبت موبایل برای سفارش پرداخت‌شده
      */
      if (
        purchaseModal &&
        purchaseModal.dataset.mode === "register-mobile"
      ) {
        const orderId =
          currentOrder &&
          (
            currentOrder.id ||
            currentOrder.orderId ||
            currentOrder.order_id
          );

        if (!orderId) {
          throw new Error("Paid order ID unavailable");
        }

        const registered =
          await registerMobileAfterPayment(
            orderId,
            mobile
          );

        closePurchaseModal();

        showPaymentResult(
          "success",
          registered || currentOrder
        );

        /*
          پاک‌سازی URL بازگشت از درگاه
          بدون تغییر مسیر صفحه.
        */
        try {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        } catch (historyError) {
          console.warn(
            "History cleanup failed:",
            historyError
          );
        }

        return;
      }

      /*
        حالت خرید عادی:
        1. ایجاد سفارش
        2. شروع پرداخت
        3. انتقال به زرین‌پال

        شماره موبایل هنوز ثبت نمی‌شود.
      */
      await createOrder();

      closePurchaseModal();

      await startPayment();
    } catch (error) {
      console.error(
        "Purchase process error:",
        error
      );

      /*
        در صورت خطای فنی، پرداخت یا خرید موفق اعلام نمی‌شود.
      */
      if (
        purchaseModal &&
        purchaseModal.dataset.mode === "register-mobile"
      ) {
        purchaseMobile.focus();
      }
    } finally {
      if (purchaseConfirmBtn) {
        purchaseConfirmBtn.disabled = false;
        purchaseConfirmBtn.classList.remove("loading");
      }
    }
  }

  /* =========================================================
     اتصال دکمه‌های محصولات
     ========================================================= */

  function bindProductButtons() {
    document.addEventListener("click", function (event) {
      const button =
        event.target.closest(
          "[data-product-id], .product-select-btn, .product-buy-btn"
        );

      if (!button) {
        return;
      }

      const productId =
        button.dataset.productId ||
        button.getAttribute("data-product-id");

      if (!productId) {
        return;
      }

      if (
        !window.TTKALAAProducts ||
        typeof window.TTKALAAProducts.getById !== "function"
      ) {
        return;
      }

      const product =
        window.TTKALAAProducts.getById(productId);

      if (product) {
        if (purchaseModal) {
          purchaseModal.dataset.mode = "new-order";
        }

        openPurchaseModal(product);
      }
    });
  }

  /* =========================================================
     رویدادهای مودال
     ========================================================= */

  if (purchaseCloseBtn) {
    purchaseCloseBtn.addEventListener(
      "click",
      closePurchaseModal
    );
  }

  if (paymentResultCloseBtn) {
    paymentResultCloseBtn.addEventListener(
      "click",
      closePaymentResultModal
    );
  }

  if (purchaseConfirmBtn) {
    purchaseConfirmBtn.addEventListener(
      "click",
      confirmPurchase
    );
  }

  if (purchaseMobile) {
    purchaseMobile.addEventListener(
      "input",
      function () {
        this.value = normalizeDigits(this.value)
          .replace(/[^\d+]/g, "")
          .slice(0, 13);
      }
    );

    purchaseMobile.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          confirmPurchase();
        }
      }
    );
  }

  /* بستن مودال با کلیک روی پس‌زمینه */
  if (purchaseModal) {
    purchaseModal.addEventListener(
      "click",
      function (event) {
        if (event.target === purchaseModal) {
          closePurchaseModal();
        }
      }
    );
  }

  if (paymentResultModal) {
    paymentResultModal.addEventListener(
      "click",
      function (event) {
        if (event.target === paymentResultModal) {
          closePaymentResultModal();
        }
      }
    );
  }

  /* بستن مودال با کلید Escape */
  document.addEventListener(
    "keydown",
    function (event) {
      if (event.key !== "Escape") {
        return;
      }

      closePurchaseModal();
      closePaymentResultModal();
    }
  );

  /* =========================================================
     مقداردهی اولیه
     ========================================================= */

  bindProductButtons();

  /*
    اگر کاربر از زرین‌پال برگشته باشد،
    نتیجه پرداخت بررسی می‌شود.
  */
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      processPaymentCallback
    );
  } else {
    processPaymentCallback();
  }

  /* =========================================================
     خروجی عمومی
     ========================================================= */

  window.TTKALAAPayment = {
    openPurchaseModal,
    closePurchaseModal,
    processPaymentCallback,
    getSelectedProduct: function () {
      return selectedProduct;
    },
    getCurrentOrder: function () {
      return currentOrder;
    }
  };
})();
