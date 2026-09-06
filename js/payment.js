(() => {
  "use strict";

  const purchaseForm =
    document.getElementById("purchaseForm");

  const purchaseSubmit =
    document.getElementById("purchaseSubmit");

  const purchaseMobile =
    document.getElementById("purchaseMobile");

  const purchaseProductId =
    document.getElementById("purchaseProductId");

  const resultModal =
    document.getElementById("paymentResultModal");

  const resultIcon =
    document.getElementById("paymentResultIcon");

  const resultTitle =
    document.getElementById("paymentResultTitle");

  const resultContent =
    document.getElementById("paymentResultContent");

  let submitting = false;

  function toEnglishDigits(value) {
    return String(value ?? "")
      .replace(/[۰-۹]/g, digit =>
        "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
      )
      .replace(/[٠-٩]/g, digit =>
        "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
      );
  }

  function normalizeMobile(value) {
    let mobile = toEnglishDigits(value)
      .replace(/\D/g, "");

    if (mobile.startsWith("98")) {
      mobile = "0" + mobile.slice(2);
    }

    if (
      mobile.startsWith("0098")
    ) {
      mobile = "0" + mobile.slice(4);
    }

    return mobile;
  }

  function isValidMobile(mobile) {
    return /^09\d{9}$/.test(mobile);
  }

  function getCampaignId() {
    const remote =
      window.TTKALAACurrentCampaign;

    if (remote?.id) {
      return remote.id;
    }

    const local =
      window.TTKALAACountdown?.getCurrentCampaign?.();

    if (!local) {
      return null;
    }

    return (
      local.id ||
      `${local.year}-${local.name}`
    );
  }

  function setSubmitting(value) {
    submitting = value;

    if (!purchaseSubmit) return;

    purchaseSubmit.disabled = value;
    purchaseSubmit.setAttribute(
      "aria-busy",
      value ? "true" : "false"
    );

    if (!purchaseSubmit.dataset.originalText) {
      purchaseSubmit.dataset.originalText =
        purchaseSubmit.textContent;
    }

    purchaseSubmit.textContent = value
      ? "در حال آماده‌سازی پرداخت..."
      : purchaseSubmit.dataset.originalText;
  }

  function closePurchaseModal() {
    if (
      window.TTKALAAProducts &&
      typeof window.TTKALAAProducts.closePurchaseModal ===
        "function"
    ) {
      window.TTKALAAProducts.closePurchaseModal();
      return;
    }

    const modal =
      document.getElementById(
        "purchaseModal"
      );

    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "modal-open"
    );
  }

  function openResultModal({
    success,
    title,
    message,
    orderId = null,
    chanceCount = null
  }) {
    if (!resultModal) return;

    if (resultIcon) {
      resultIcon.textContent =
        success ? "✓" : "!";
      resultIcon.className =
        `payment-result__icon ${
          success ? "success" : "error"
        }`;
    }

    if (resultTitle) {
      resultTitle.textContent =
        title;
    }

    if (resultContent) {
      let html = `
        <p>${escapeHTML(message)}</p>
      `;

      if (orderId) {
        html += `
          <div class="payment-result__reference">
            شماره سفارش:
            <strong>
              ${escapeHTML(orderId)}
            </strong>
          </div>
        `;
      }

      if (
        success &&
        chanceCount !== null &&
        chanceCount !== undefined
      ) {
        html += `
          <div class="payment-result__chance">
            شانس ثبت‌شده این خرید:
            <strong>
              ${toPersianDigits(chanceCount)}
            </strong>
          </div>
        `;
      }

      resultContent.innerHTML = html;
    }

    resultModal.classList.add(
      "is-open"
    );

    resultModal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "modal-open"
    );
  }

  function closeResultModal() {
    if (!resultModal) return;

    resultModal.classList.remove(
      "is-open"
    );

    resultModal.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "modal-open"
    );
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toPersianDigits(value) {
    return String(value ?? "")
      .replace(
        /\d/g,
        digit => "۰۱۲۳۴۵۶۷۸۹"[digit]
      );
  }

  function getSafeErrorMessage(error) {
    if (
      window.TTKALAAApi &&
      typeof window.TTKALAAApi.getSafeErrorMessage ===
        "function"
    ) {
      return window.TTKALAAApi.getSafeErrorMessage(
        error
      );
    }

    return (
      error?.message ||
      "در حال حاضر امکان ادامه پرداخت وجود ندارد. لطفاً دوباره تلاش کنید."
    );
  }

  async function createOrder({
    productId,
    mobile,
    campaignId
  }) {
    if (
      !window.TTKALAAApi ||
      typeof window.TTKALAAApi.createOrder !==
        "function"
    ) {
      throw new Error(
        "سامانه سفارش در دسترس نیست."
      );
    }

    return window.TTKALAAApi.createOrder({
      productId,
      campaignId,
      mobile
    });
  }

  async function startPayment(orderId) {
    if (
      !window.TTKALAAApi ||
      typeof window.TTKALAAApi.startPayment !==
        "function"
    ) {
      throw new Error(
        "سامانه پرداخت در دسترس نیست."
      );
    }

    return window.TTKALAAApi.startPayment(
      orderId
    );
  }

  function extractPaymentUrl(response) {
    if (!response) {
      return null;
    }

    return (
      response.paymentUrl ||
      response.payment_url ||
      response.url ||
      response.redirectUrl ||
      response.redirect_url ||
      response.data?.paymentUrl ||
      response.data?.payment_url ||
      response.data?.url ||
      null
    );
  }

  function extractOrderId(response) {
    if (!response) {
      return null;
    }

    return (
      response.orderId ||
      response.order_id ||
      response.data?.orderId ||
      response.data?.order_id ||
      response.id ||
      response.data?.id ||
      null
    );
  }

  async function handlePurchase(event) {
    event.preventDefault();

    if (submitting) return;

    const mobile =
      normalizeMobile(
        purchaseMobile?.value
      );

    const productId =
      purchaseProductId?.value?.trim();

    if (!isValidMobile(mobile)) {
      openResultModal({
        success: false,
        title: "شماره موبایل نامعتبر است",
        message:
          "لطفاً شماره موبایل ۱۱ رقمی معتبر خود را وارد کنید."
      });

      purchaseMobile?.focus();
      return;
    }

    if (!productId) {
      openResultModal({
        success: false,
        title: "محصول انتخاب نشده است",
        message:
          "لطفاً ابتدا محصول موردنظر خود را انتخاب کنید."
      });

      return;
    }

    setSubmitting(true);

    try {
      const campaignId =
        getCampaignId();

      if (!campaignId) {
        throw new Error(
          "دوره فعال قرعه‌کشی مشخص نشد."
        );
      }

      /*
       * مرحله اول:
       * ایجاد سفارش در سرور.
       *
       * مبلغ محصول باید فقط توسط Backend
       * از روی productId تعیین شود.
       */
      const order =
        await createOrder({
          productId,
          mobile,
          campaignId
        });

      const orderId =
        extractOrderId(order);

      if (!orderId) {
        throw new Error(
          "شماره سفارش از سرور دریافت نشد."
        );
      }

      /*
       * مرحله دوم:
       * ایجاد درخواست پرداخت.
       *
       * Backend باید مبلغ واقعی سفارش را
       * به درگاه زرین‌پال ارسال کند.
       */
      const payment =
        await startPayment(orderId);

      const paymentUrl =
        extractPaymentUrl(payment);

      if (!paymentUrl) {
        throw new Error(
          "آدرس پرداخت از درگاه دریافت نشد."
        );
      }

      closePurchaseModal();

      /*
       * انتقال مستقیم به درگاه.
       * نتیجه پرداخت توسط Backend
       * و فرآیند Verify مشخص خواهد شد.
       */
      window.location.assign(
        paymentUrl
      );
    } catch (error) {
      console.error(
        "Payment initialization error:",
        error
      );

      openResultModal({
        success: false,
        title: "پرداخت آماده نشد",
        message:
          getSafeErrorMessage(error)
      });
    } finally {
      setSubmitting(false);
    }
  }

  function getCallbackParameters() {
    const url =
      new URL(
        window.location.href
      );

    return {
      orderId:
        url.searchParams.get(
          "orderId"
        ) ||
        url.searchParams.get(
          "order_id"
        ),

      authority:
        url.searchParams.get(
          "Authority"
        ),

      status:
        url.searchParams.get(
          "Status"
        )
    };
  }

  async function processPaymentCallback() {
    const callback =
      getCallbackParameters();

    if (!callback.orderId) {
      return;
    }

    /*
     * اگر کاربر از درگاه برگشته باشد،
     * نتیجه نباید از پارامتر URL
     * به‌تنهایی معتبر تلقی شود.
     *
     * Backend باید نتیجه واقعی زرین‌پال
     * را Verify کرده باشد.
     */
    try {
      if (
        !window.TTKALAAApi ||
        typeof window.TTKALAAApi.getPaymentResult !==
          "function"
      ) {
        return;
      }

      const paymentResult =
        await window.TTKALAAApi.getPaymentResult(
          callback.orderId
        );

      const success =
        Boolean(
          paymentResult?.success ||
          paymentResult?.paid ||
          paymentResult?.verified ||
          paymentResult?.status ===
            "paid"
        );

      const chanceCount =
        paymentResult?.chanceCount ??
        paymentResult?.chances ??
        paymentResult?.activeChances ??
        null;

      if (success) {
        openResultModal({
          success: true,
          title:
            "خرید با موفقیت ثبت شد",
          message:
            paymentResult?.message ||
            "پرداخت شما تأیید شد و خرید در سامانه ثبت گردید. شانس این خرید نیز به‌صورت خودکار ثبت شده است.",
          orderId:
            paymentResult?.orderId ||
            callback.orderId,
          chanceCount
        });
      } else {
        openResultModal({
          success: false,
          title:
            "پرداخت تأیید نشد",
          message:
            paymentResult?.message ||
            "پرداخت شما توسط سامانه تأیید نشده است. در صورت کسر وجه، وضعیت تراکنش از طریق سامانه پرداخت بررسی خواهد شد.",
          orderId:
            paymentResult?.orderId ||
            callback.orderId
        });
      }

      cleanCallbackUrl();
    } catch (error) {
      console.error(
        "Payment callback error:",
        error
      );

      openResultModal({
        success: false,
        title:
          "بررسی نتیجه پرداخت ممکن نشد",
        message:
          "نتیجه پرداخت در حال بررسی است. لطفاً دوباره وارد صفحه نشوید و در صورت نیاز با پشتیبانی تماس بگیرید.",
        orderId:
          callback.orderId
      });
    }
  }

  function cleanCallbackUrl() {
    try {
      const url =
        new URL(
          window.location.href
        );

      [
        "orderId",
        "order_id",
        "Authority",
        "Status"
      ].forEach(parameter => {
        url.searchParams.delete(
          parameter
        );
      });

      window.history.replaceState(
        {},
        document.title,
        url.pathname +
          (url.search
            ? url.search
            : "") +
          url.hash
      );
    } catch (error) {
      console.warn(
        "Could not clean payment callback URL.",
        error
      );
    }
  }

  function initialize() {
    if (purchaseForm) {
      purchaseForm.addEventListener(
        "submit",
        handlePurchase
      );
    }

    if (purchaseMobile) {
      purchaseMobile.addEventListener(
        "input",
        () => {
          purchaseMobile.value =
            toEnglishDigits(
              purchaseMobile.value
            )
              .replace(/\D/g, "")
              .slice(0, 11);
        }
      );
    }

    if (resultModal) {
      resultModal
        .querySelectorAll(
          "[data-close-modal], .modal-close"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            closeResultModal
          );
        });

      resultModal.addEventListener(
        "click",
        event => {
          if (
            event.target ===
            resultModal
          ) {
            closeResultModal();
          }
        }
      );
    }

    document.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Escape" &&
          resultModal?.classList.contains(
            "is-open"
          )
        ) {
          closeResultModal();
        }
      }
    );

    processPaymentCallback();
  }

  window.TTKALAAPayment = {
    start: startPayment,
    processCallback:
      processPaymentCallback,
    closeResultModal
  };

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );
})();
