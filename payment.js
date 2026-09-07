/* =========================================================
   مدیریت خرید و پرداخت T.T.KALAA
   روند:
   انتخاب بلیت ورود ← ایجاد سفارش ← پرداخت زرین‌پال
   ← تأیید پرداخت توسط سرور ← دانلود محصول
   ← ثبت یک شماره موبایل برای شانس
   به‌روزرسانی: قیمت ۳۵,۰۰۰ تومان
========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     عناصر پنجره خرید
     --------------------------------------------------------- */

  const purchaseModal =
    document.getElementById("purchaseModal");

  const purchaseProductId =
    document.getElementById("purchaseProductId");

  const purchaseProductSummary =
    document.getElementById("purchaseProductSummary");

  const purchaseSubmit =
    document.getElementById("purchaseSubmit");

  /* ---------------------------------------------------------
     عناصر نتیجه پرداخت
     --------------------------------------------------------- */

  const paymentResultModal =
    document.getElementById("paymentResultModal");

  const paymentResultIcon =
    document.getElementById("paymentResultIcon");

  const paymentResultTitle =
    document.getElementById("paymentResultTitle");

  const paymentResultContent =
    document.getElementById("paymentResultContent");

  const postPurchaseForm =
    document.getElementById("postPurchaseForm");

  const postPurchaseMobile =
    document.getElementById("postPurchaseMobile");

  const postPurchaseSubmit =
    document.getElementById("postPurchaseSubmit");

  const postPurchaseResult =
    document.getElementById("postPurchaseResult");

  const downloadProduct =
    document.getElementById("downloadProduct");

  /* ---------------------------------------------------------
     سفارش در حال پرداخت
     --------------------------------------------------------- */

  let currentOrderId = null;

  /* ---------------------------------------------------------
     تبدیل اعداد فارسی به انگلیسی
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
     فرمت قیمت
     --------------------------------------------------------- */

  function formatPrice(price) {
    return new Intl.NumberFormat("fa-IR").format(
      Number(price || 0)
    ) + " تومان";
  }

  /* ---------------------------------------------------------
     باز کردن پنجره خرید
     --------------------------------------------------------- */

  function openPurchaseModal(productId) {
    if (!purchaseModal) return;

    const product =
      window.TTKALAAProducts &&
      window.TTKALAAProducts.getById(productId);

    if (!product) {
      showToast(
        "محصول موردنظر پیدا نشد."
      );
      return;
    }

    if (purchaseProductId) {
      purchaseProductId.value =
        product.id;
    }

    if (purchaseProductSummary) {
      purchaseProductSummary.innerHTML = `
        <div class="purchase-product-name">
          ${product.title}
        </div>

        <div class="purchase-product-price">
          ${formatPrice(product.price)}
        </div>

        <div class="purchase-product-chance">
          با این خرید، یک بلیت ورود به قرعه‌کشی
          برای شما ثبت می‌شود.
        </div>
      `;
    }

    purchaseModal.classList.add("is-open");
    purchaseModal.removeAttribute("hidden");

    document.body.classList.add(
      "modal-open"
    );
  }

  /* ---------------------------------------------------------
     بستن پنجره خرید
     --------------------------------------------------------- */

  function closePurchaseModal() {
    if (!purchaseModal) return;

    purchaseModal.classList.remove(
      "is-open"
    );

    purchaseModal.setAttribute(
      "hidden",
      ""
    );

    document.body.classList.remove(
      "modal-open"
    );
  }

  /* ---------------------------------------------------------
     بستن پنجره نتیجه پرداخت
     --------------------------------------------------------- */

  function closePaymentResultModal() {
    if (!paymentResultModal) return;

    paymentResultModal.classList.remove(
      "is-open"
    );

    paymentResultModal.setAttribute(
      "hidden",
      ""
    );

    document.body.classList.remove(
      "modal-open"
    );
  }

  /* ---------------------------------------------------------
     نمایش پیام کوتاه
     --------------------------------------------------------- */

  function showToast(message) {
    const toast =
      document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(
      window.__ttkalaaToastTimer
    );

    window.__ttkalaaToastTimer =
      setTimeout(function () {
        toast.classList.remove("show");
      }, 3500);
  }

  /* ---------------------------------------------------------
     نمایش حالت در حال پردازش
     --------------------------------------------------------- */

  function setPurchaseLoading(isLoading) {
    if (!purchaseSubmit) return;

    purchaseSubmit.disabled =
      isLoading;

    purchaseSubmit.classList.toggle(
      "is-loading",
      isLoading
    );

    purchaseSubmit.textContent =
      isLoading
        ? "در حال آماده‌سازی پرداخت..."
        : "پرداخت و دریافت بلیت ورود";
  }

  /* ---------------------------------------------------------
     باز کردن پنجره نتیجه پرداخت
     --------------------------------------------------------- */

  function openPaymentResultModal() {
    if (!paymentResultModal) return;

    paymentResultModal.classList.add(
      "is-open"
    );

    paymentResultModal.removeAttribute(
      "hidden"
    );

    document.body.classList.add(
      "modal-open"
    );
  }

  /* ---------------------------------------------------------
     نمایش موفقیت پرداخت
     --------------------------------------------------------- */

  function showPaymentSuccess(order) {
    if (paymentResultIcon) {
      paymentResultIcon.textContent = "✓";
    }

    if (paymentResultTitle) {
      paymentResultTitle.textContent =
        "پرداخت با موفقیت انجام شد";
    }

    if (paymentResultContent) {
      paymentResultContent.innerHTML = `
        <p>
          بلیت ورود شما با موفقیت ثبت شد.
        </p>
      `;
    }

    if (postPurchaseForm) {
      postPurchaseForm.hidden = false;
    }

    if (downloadProduct) {
      downloadProduct.hidden = true;
    }

    if (postPurchaseResult) {
      postPurchaseResult.hidden = true;
      postPurchaseResult.innerHTML = "";
    }

    if (postPurchaseMobile) {
      postPurchaseMobile.value = "";
    }

    openPaymentResultModal();

    if (order && order.id) {
      currentOrderId = order.id;
      sessionStorage.setItem(
        "ttkalaa_paid_order_id",
        order.id
      );
    }
  }

  /* ---------------------------------------------------------
     نمایش خطای پرداخت
     --------------------------------------------------------- */

  function showPaymentFailure(message) {
    if (paymentResultIcon) {
      paymentResultIcon.textContent = "×";
    }

    if (paymentResultTitle) {
      paymentResultTitle.textContent =
        "پرداخت تکمیل نشد";
    }

    if (paymentResultContent) {
      paymentResultContent.innerHTML = `
        <p>
          ${message ||
          "پرداخت شما تأیید نشد."}
        </p>
      `;
    }

    if (postPurchaseForm) {
      postPurchaseForm.hidden = true;
    }

    if (downloadProduct) {
      downloadProduct.hidden = true;
    }

    openPaymentResultModal();
  }

  /* ---------------------------------------------------------
     شروع پرداخت
     --------------------------------------------------------- */

  async function startPurchase() {
    const productId =
      purchaseProductId
        ? purchaseProductId.value
        : "";

    if (!productId) {
      showToast(
        "لطفاً ابتدا یک بلیت ورود انتخاب کنید."
      );
      return;
    }

    const product =
      window.TTKALAAProducts &&
      window.TTKALAAProducts.getById(
        productId
      );

    if (!product) {
      showToast(
        "بلیت ورود انتخاب‌شده معتبر نیست."
      );
      return;
    }

    setPurchaseLoading(true);

    try {
      /* -----------------------------------------------------
         دریافت دوره جاری
         ----------------------------------------------------- */

      const campaign =
        await TTKALAAApi.getCurrentCampaign();

      const campaignId =
        campaign &&
        (
          campaign.id ||
          campaign.campaignId
        );

      if (!campaignId) {
        throw new Error(
          "دوره فعال پیدا نشد."
        );
      }

      /* -----------------------------------------------------
         ایجاد سفارش
         ----------------------------------------------------- */

      const order =
        await TTKALAAApi.createOrder({
          productId: product.id,
          campaignId: campaignId
        });

      if (!order || !order.id) {
        throw new Error(
          "سفارش ایجاد نشد."
        );
      }

      currentOrderId =
        order.id;

      sessionStorage.setItem(
        "ttkalaa_pending_order_id",
        order.id
      );

      /* -----------------------------------------------------
         درخواست شروع پرداخت
         ----------------------------------------------------- */

      const payment =
        await TTKALAAApi.startPayment(
          order.id
        );

      const paymentUrl =
        payment &&
        (
          payment.paymentUrl ||
          payment.url ||
          payment.redirectUrl
        );

      if (!paymentUrl) {
        throw new Error(
          "لینک پرداخت دریافت نشد."
        );
      }

      window.location.href =
        paymentUrl;

    } catch (error) {

      console.error(
        "TTKALAA purchase error:",
        error
      );

      showToast(
        error &&
        error.message
          ? error.message
          : "خطا در آماده‌سازی پرداخت."
      );

      setPurchaseLoading(false);
    }
  }

  /* ---------------------------------------------------------
     بررسی نتیجه بازگشت از درگاه
     --------------------------------------------------------- */

  async function handlePaymentReturn() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const orderId =
      params.get("orderId") ||
      params.get("order_id");

    const authority =
      params.get("Authority") ||
      params.get("authority");

    if (!orderId && !authority) {
      return;
    }

    if (paymentResultModal) {
      openPaymentResultModal();
    }

    if (paymentResultTitle) {
      paymentResultTitle.textContent =
        "در حال بررسی پرداخت...";
    }

    if (paymentResultContent) {
      paymentResultContent.innerHTML =
        "<p>لطفاً چند لحظه صبر کنید.</p>";
    }

    try {

      const result =
        await TTKALAAApi.getPaymentResult(
          orderId
        );

      if (
        result &&
        (
          result.success === true ||
          result.status === "paid" ||
          result.status === "verified"
        )
      ) {
        currentOrderId =
          result.orderId ||
          orderId;

        showPaymentSuccess(
          {
            id: currentOrderId
          }
        );

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

      } else {
        showPaymentFailure(
          result &&
          result.message
            ? result.message
            : "پرداخت شما تأیید نشد."
        );
      }

    } catch (error) {

      console.error(
        "TTKALAA payment verification error:",
        error
      );

      showPaymentFailure(
        "امکان بررسی وضعیت پرداخت وجود ندارد."
      );
    }
  }

  /* ---------------------------------------------------------
     ثبت شماره موبایل بعد از خرید
     --------------------------------------------------------- */

  async function registerPurchaseMobile() {
    const mobile =
      normalizeMobile(
        postPurchaseMobile
          ? postPurchaseMobile.value
          : ""
      );

    if (!isValidMobile(mobile)) {

      if (postPurchaseResult) {
        postPurchaseResult.hidden =
          false;

        postPurchaseResult.className =
          "post-purchase-result error";

        postPurchaseResult.textContent =
          "شماره موبایل را کامل وارد کنید.";
      }

      if (postPurchaseMobile) {
        postPurchaseMobile.focus();
      }

      return;
    }

    if (!currentOrderId) {
      currentOrderId =
        sessionStorage.getItem(
          "ttkalaa_paid_order_id"
        ) ||
        sessionStorage.getItem(
          "ttkalaa_pending_order_id"
        );
    }

    if (!currentOrderId) {

      if (postPurchaseResult) {
        postPurchaseResult.hidden =
          false;

        postPurchaseResult.className =
          "post-purchase-result error";

        postPurchaseResult.textContent =
          "شناسه خرید پیدا نشد.";
      }

      return;
    }

    if (postPurchaseSubmit) {
      postPurchaseSubmit.disabled = true;
      postPurchaseSubmit.classList.add(
        "is-loading"
      );
      postPurchaseSubmit.textContent =
        "در حال ثبت شماره...";
    }

    try {

      const result =
        await TTKALAAApi.registerPurchaseMobile({
          orderId: currentOrderId,
          mobile: mobile
        });

      if (
        result &&
        (
          result.success === true ||
          result.registered === true
        )
      ) {

        if (postPurchaseResult) {
          postPurchaseResult.hidden =
            false;

          postPurchaseResult.className =
            "post-purchase-result success";

          postPurchaseResult.textContent =
            "شماره شما ثبت شد و شانس شما فعال شد.";
        }

        await loadDownloadLink();

        if (postPurchaseMobile) {
          postPurchaseMobile.disabled =
            true;
        }

        if (postPurchaseSubmit) {
          postPurchaseSubmit.disabled =
            true;

          postPurchaseSubmit.textContent =
            "شماره ثبت شد";
        }

      } else {

        throw new Error(
          result &&
          result.message
            ? result.message
            : "ثبت شماره انجام نشد."
        );
      }

    } catch (error) {

      console.error(
        "TTKALAA mobile registration error:",
        error
      );

      if (postPurchaseResult) {
        postPurchaseResult.hidden =
          false;

        postPurchaseResult.className =
          "post-purchase-result error";

        postPurchaseResult.textContent =
          error &&
          error.message
            ? error.message
            : "ثبت شماره انجام نشد.";
      }

    } finally {

      if (
        postPurchaseSubmit &&
        !postPurchaseMobile.disabled
      ) {
        postPurchaseSubmit.disabled =
          false;

        postPurchaseSubmit.classList.remove(
          "is-loading"
        );

        postPurchaseSubmit.textContent =
          "ثبت شماره و فعال‌سازی شانس";
      }
    }
  }

  /* ---------------------------------------------------------
     دریافت لینک دانلود محصول
     --------------------------------------------------------- */

  async function loadDownloadLink() {
    if (!currentOrderId) return;

    try {

      const result =
        await TTKALAAApi.getDownloadLink(
          currentOrderId
        );

      const downloadUrl =
        result &&
        (
          result.downloadUrl ||
          result.url ||
          result.link
        );

      if (
        downloadUrl &&
        downloadProduct
      ) {

        downloadProduct.href =
          downloadUrl;

        downloadProduct.target =
          "_blank";

        downloadProduct.rel =
          "noopener noreferrer";

        downloadProduct.hidden =
          false;
      }

    } catch (error) {

      console.error(
        "TTKALAA download link error:",
        error
      );
    }
  }

  /* ---------------------------------------------------------
     اتصال دکمه‌های خرید محصولات
     --------------------------------------------------------- */

  document.addEventListener(
    "click",
    function (event) {

      const buyButton =
        event.target.closest(
          "[data-buy-product]"
        );

      if (!buyButton) return;

      event.preventDefault();

      const productId =
        buyButton.getAttribute(
          "data-buy-product"
        );

      openPurchaseModal(
        productId
      );
    }
  );

  /* ---------------------------------------------------------
     ارسال فرم خرید
     --------------------------------------------------------- */

  if (purchaseSubmit) {
    purchaseSubmit.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        startPurchase();
      }
    );
  }

  /* ---------------------------------------------------------
     ارسال شماره موبایل بعد از خرید
     --------------------------------------------------------- */

  if (postPurchaseForm) {
    postPurchaseForm.addEventListener(
      "submit",
      function (event) {
        event.preventDefault();
        registerPurchaseMobile();
      }
    );
  }

  /* ---------------------------------------------------------
     کنترل ورود شماره موبایل
     --------------------------------------------------------- */

  if (postPurchaseMobile) {
    postPurchaseMobile.addEventListener(
      "input",
      function () {

        let value =
          postPurchaseMobile.value;

        value = value.replace(
          /[^0-9۰-۹]/g,
          ""
        );

        if (value.length > 11) {
          value =
            value.slice(0, 11);
        }

        postPurchaseMobile.value =
          value;
      }
    );
  }

  /* ---------------------------------------------------------
     دکمه‌های بستن پنجره‌ها
     --------------------------------------------------------- */

  document.addEventListener(
    "click",
    function (event) {

      if (
        event.target.matches(
          "[data-close-purchase]"
        )
      ) {
        closePurchaseModal();
      }

      if (
        event.target.matches(
          "[data-close-payment]"
        )
      ) {
        closePaymentResultModal();
      }
    }
  );

  /* ---------------------------------------------------------
     بستن با کلید Escape
     --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     بررسی بازگشت از درگاه
     --------------------------------------------------------- */

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      handlePaymentReturn
    );
  } else {
    handlePaymentReturn();
  }

  /* ---------------------------------------------------------
     دسترسی عمومی محدود برای سایر فایل‌ها
     --------------------------------------------------------- */

  window.TTKALAAPayment = {
    openPurchaseModal:
      openPurchaseModal,

    closePurchaseModal:
      closePurchaseModal,

    closePaymentResultModal:
      closePaymentResultModal
  };

})();
