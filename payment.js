(function (window) {
  "use strict";

  let selectedProduct = null;
  let currentOrder = null;
  let currentCampaign = null;

  function get(id) {
    return document.getElementById(id);
  }

  function openModal(id) {
    const modal = get(id);

    if (!modal) {
      return;
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(id) {
    const modal = get(id);

    if (!modal) {
      return;
    }

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal.is-open")) {
      document.body.style.overflow = "";
    }
  }

  function closeAllModals() {
    document
      .querySelectorAll(".modal.is-open")
      .forEach(function (modal) {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
      });

    document.body.style.overflow = "";
  }

  function formatPrice(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "۲۹٬۰۰۰ تومان";
    }

    return number.toLocaleString("fa-IR") + " تومان";
  }

  function getProduct(productId) {
    if (
      window.TTKALAAProducts &&
      typeof window.TTKALAAProducts.getProductById === "function"
    ) {
      return window.TTKALAAProducts.getProductById(productId);
    }

    if (Array.isArray(window.TTKALAA_PRODUCTS)) {
      return window.TTKALAA_PRODUCTS.find(function (product) {
        return product.id === productId;
      }) || null;
    }

    return null;
  }

  async function getCurrentCampaign() {
    if (currentCampaign) {
      return currentCampaign;
    }

    if (
      !window.TTKALAA_API ||
      typeof window.TTKALAA_API.getCurrentCampaign !== "function"
    ) {
      throw new Error("API unavailable");
    }

    currentCampaign =
      await window.TTKALAA_API.getCurrentCampaign();

    return currentCampaign;
  }

  function renderSelectedProduct() {
    const container = get("selectedProduct");

    if (!container || !selectedProduct) {
      return;
    }

    container.innerHTML = `
      <div class="selected-product">

        <img
          src="${selectedProduct.image}"
          alt="${selectedProduct.name}"
        >

        <h3>${selectedProduct.name}</h3>

        <div class="price">
          ${formatPrice(selectedProduct.price)}
        </div>

      </div>
    `;
  }

  function renderPaymentProduct() {
    const container = get("paymentProduct");

    if (!container || !selectedProduct) {
      return;
    }

    container.innerHTML = `
      <div class="payment-product">

        <img
          src="${selectedProduct.image}"
          alt="${selectedProduct.name}"
        >

        <h3>${selectedProduct.name}</h3>

        <div class="price">
          ${formatPrice(selectedProduct.price)}
        </div>

      </div>
    `;
  }

  function setPaymentStatus(message, type) {
    const element = get("paymentStatus");

    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.className =
      "payment-status" +
      (type ? " " + type : "");
  }

  function setMobileStatus(message) {
    const element =
      get("mobileRegisterStatus");

    if (!element) {
      return;
    }

    element.textContent = message || "";
  }

  function showPurchaseResult(data) {
    const container =
      get("purchaseResult");

    if (!container) {
      return;
    }

    const chanceCount =
      Number(
        data?.chanceCount ||
        data?.purchase?.chanceCount ||
        1
      );

    const trackingCode =
      data?.trackingCode ||
      data?.purchase?.trackingCode ||
      data?.order?.trackingCode ||
      "";

    container.innerHTML = `
      <h2>خرید با موفقیت ثبت شد</h2>

      <p>
        خرید شما با موفقیت ثبت شده و
        <strong>۱ شانس</strong>
        برای شما در دوره جاری ثبت شد.
      </p>

      ${
        trackingCode
          ? `
            <p>
              کد پیگیری:
              <strong>${trackingCode}</strong>
            </p>
          `
          : ""
      }

      <p>
        تعداد شانس شما:
        <strong>${chanceCount.toLocaleString("fa-IR")}</strong>
      </p>

      <button
        type="button"
        class="modal-primary-btn"
        id="resultChanceBtn"
      >
        شانس من چقدر است؟
      </button>
    `;

    const resultChanceBtn =
      get("resultChanceBtn");

    if (resultChanceBtn) {
      resultChanceBtn.addEventListener(
        "click",
        function () {
          closeAllModals();

          const chance =
            get("chance");

          if (chance) {
            chance.scrollIntoView({
              behavior: "smooth",
              block: "center"
            });
          }
        }
      );
    }

    openModal("resultModal");
  }

  async function selectProduct(product) {
    if (!product) {
      return;
    }

    selectedProduct = product;

    renderSelectedProduct();

    openModal("productModal");
  }

  async function continueToPayment() {
    if (!selectedProduct) {
      return;
    }

    closeModal("productModal");

    renderPaymentProduct();

    setPaymentStatus(
      "در حال آماده‌سازی پرداخت..."
    );

    openModal("paymentModal");

    try {
      const campaign =
        await getCurrentCampaign();

      const campaignId =
        campaign?.id ||
        campaign?.campaignId ||
        campaign?.data?.id ||
        campaign?.data?.campaignId;

      if (!campaignId) {
        throw new Error("CAMPAIGN_NOT_FOUND");
      }

      if (
        !window.TTKALAA_API ||
        typeof window.TTKALAA_API.createOrder !== "function"
      ) {
        throw new Error("API_UNAVAILABLE");
      }

      const order =
        await window.TTKALAA_API.createOrder({
          productId: selectedProduct.id,
          campaignId
        });

      currentOrder = order;

      const orderId =
        order?.id ||
        order?.orderId ||
        order?.data?.id ||
        order?.data?.orderId;

      if (!orderId) {
        throw new Error("ORDER_NOT_FOUND");
      }

      setPaymentStatus(
        "در حال انتقال به درگاه امن زرین‌پال..."
      );

      const payment =
        await window.TTKALAA_API.startPayment(
          orderId
        );

      const paymentUrl =
        payment?.paymentUrl ||
        payment?.url ||
        payment?.data?.paymentUrl ||
        payment?.data?.url;

      if (!paymentUrl) {
        throw new Error("PAYMENT_URL_NOT_FOUND");
      }

      window.location.href = paymentUrl;

    } catch (error) {
      setPaymentStatus(
        "در حال حاضر امکان اتصال به درگاه وجود ندارد. لطفاً چند دقیقه بعد دوباره تلاش کنید.",
        "error"
      );
    }
  }

  function showMobileRegister() {
    setMobileStatus("");

    const input =
      get("purchaseMobile");

    if (input) {
      input.value = "";
    }

    closeModal("paymentModal");
    openModal("mobileModal");

    if (input) {
      setTimeout(function () {
        input.focus();
      }, 150);
    }
  }

  async function registerMobile(event) {
    event.preventDefault();

    const input =
      get("purchaseMobile");

    if (!input || !currentOrder) {
      return;
    }

    let mobile =
      String(input.value || "")
        .replace(/[۰-۹]/g, function (char) {
          return String(
            "۰۱۲۳۴۵۶۷۸۹".indexOf(char)
          );
        })
        .replace(/[٠-٩]/g, function (char) {
          return String(
            "٠١٢٣٤٥٦٧٨٩".indexOf(char)
          );
        })
        .replace(/\s+/g, "");

    if (mobile.startsWith("+98")) {
      mobile = "0" + mobile.slice(3);
    }

    if (mobile.startsWith("0098")) {
      mobile = "0" + mobile.slice(4);
    }

    if (!/^09\d{9}$/.test(mobile)) {
      setMobileStatus(
        "لطفاً شماره تماس صحیح وارد کنید."
      );
      return;
    }

    setMobileStatus(
      "در حال ثبت خرید..."
    );

    try {
      if (
        !window.TTKALAA_API ||
        typeof window.TTKALAA_API.registerPurchaseMobile !==
          "function"
      ) {
        throw new Error("API_UNAVAILABLE");
      }

      const orderId =
        currentOrder?.id ||
        currentOrder?.orderId ||
        currentOrder?.data?.id ||
        currentOrder?.data?.orderId;

      const result =
        await window.TTKALAA_API.registerPurchaseMobile({
          orderId,
          mobile
        });

      closeModal("mobileModal");

      showPurchaseResult(result);

    } catch (error) {
      setMobileStatus(
        "ثبت خرید انجام نشد. لطفاً چند دقیقه بعد دوباره تلاش کنید."
      );
    }
  }

  async function handlePaymentReturn() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const orderId =
      params.get("orderId") ||
      params.get("order_id");

    const authority =
      params.get("Authority");

    const status =
      params.get("Status");

    if (!orderId && !authority) {
      return;
    }

    /*
      پارامترهای پرداخت از URL پاک می‌شوند
      تا با Refresh دوباره فرآیند پرداخت اجرا نشود.
    */

    try {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    } catch (error) {
      /* ignore */
    }

    if (
      status &&
      status.toUpperCase() !== "OK"
    ) {
      setPaymentStatus(
        "پرداخت لغو شد.",
        "error"
      );

      openModal("paymentModal");
      return;
    }

    if (!orderId) {
      setPaymentStatus(
        "شناسه سفارش پیدا نشد. لطفاً چند دقیقه بعد دوباره تلاش کنید.",
        "error"
      );

      openModal("paymentModal");
      return;
    }

    openModal("paymentModal");

    setPaymentStatus(
      "در حال بررسی و تأیید پرداخت..."
    );

    try {
      if (
        !window.TTKALAA_API ||
        typeof window.TTKALAA_API.getPaymentResult !==
          "function"
      ) {
        throw new Error("API_UNAVAILABLE");
      }

      const result =
        await window.TTKALAA_API.getPaymentResult(
          orderId
        );

      const paymentStatus =
        String(
          result?.status ||
          result?.paymentStatus ||
          result?.data?.status ||
          ""
        ).toUpperCase();

      if (
        paymentStatus === "PAID" ||
        paymentStatus === "SUCCESS" ||
        result?.paid === true ||
        result?.success === true
      ) {
        currentOrder = {
          id: orderId,
          orderId
        };

        setPaymentStatus(
          "پرداخت با موفقیت تأیید شد."
        );

        setTimeout(
          showMobileRegister,
          350
        );

        return;
      }

      if (
        paymentStatus === "CANCELLED" ||
        paymentStatus === "FAILED"
      ) {
        setPaymentStatus(
          "پرداخت انجام نشد.",
          "error"
        );

        return;
      }

      setPaymentStatus(
        "وضعیت پرداخت در حال بررسی است. لطفاً چند دقیقه بعد دوباره تلاش کنید.",
        "error"
      );

    } catch (error) {
      setPaymentStatus(
        "لطفاً چند دقیقه بعد دوباره تلاش کنید",
        "error"
      );
    }
  }

  function bindModalClosing() {
    document
      .querySelectorAll("[data-close-modal]")
      .forEach(function (element) {
        element.addEventListener(
          "click",
          closeAllModals
        );
      });

    document
      .querySelectorAll(".modal")
      .forEach(function (modal) {
        modal.addEventListener(
          "click",
          function (event) {
            if (
              event.target.classList.contains(
                "modal"
              )
            ) {
              closeAllModals();
            }
          }
        );
      });

    document.addEventListener(
      "keydown",
      function (event) {
        if (event.key === "Escape") {
          closeAllModals();
        }
      }
    );
  }

  function bindButtons() {
    const continueButton =
      get("continuePaymentBtn");

    if (continueButton) {
      continueButton.addEventListener(
        "click",
        continueToPayment
      );
    }

    const payButton =
      get("payBtn");

    if (payButton) {
      payButton.addEventListener(
        "click",
        continueToPayment
      );
    }

    const mobileForm =
      get("mobileRegisterForm");

    if (mobileForm) {
      mobileForm.addEventListener(
        "submit",
        registerMobile
      );
    }
  }

  function init() {
    bindModalClosing();
    bindButtons();
    handlePaymentReturn();
  }

  window.selectTTKALAAProduct =
    selectProduct;

  window.TTKALAAPayment = {
    selectProduct,
    continueToPayment,
    closeAllModals
  };

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

})(window);
