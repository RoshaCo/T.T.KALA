(() => {
  "use strict";

  const FALLBACK_PRODUCTS = [
    {
      id: "iranian-images",
      title: "مجموعه تصاویر و پس‌زمینه‌های ایرانی",
      description: "مجموعه‌ای منتخب از تصاویر و پس‌زمینه‌های باکیفیت با حال‌وهوای ایرانی.",
      price: 29000,
      category: "تصاویر",
      badge: "محبوب"
    },
    {
      id: "iranian-masterpieces-music",
      title: "مجموعه موسیقی‌های شاهکار هنری ۱۰۰ سال اخیر ایران",
      description: "مجموعه‌ای از آثار موسیقایی منتخب و ارزشمند یک قرن اخیر ایران.",
      price: 29000,
      category: "موسیقی",
      badge: "منتخب"
    },
    {
      id: "kids-ebooks",
      title: "مجموعه E-Book کودک و نوجوان",
      description: "مجموعه‌ای از کتاب‌های الکترونیکی مناسب کودکان و نوجوانان.",
      price: 29000,
      category: "کتاب کودک",
      badge: "ویژه"
    },
    {
      id: "adult-ebooks",
      title: "مجموعه کتاب‌های بزرگسالان",
      description: "مجموعه‌ای از کتاب‌های الکترونیکی منتخب برای مخاطبان بزرگسال.",
      price: 29000,
      category: "کتاب",
      badge: "منتخب"
    }
  ];

  let products = [...FALLBACK_PRODUCTS];

  function formatPrice(value) {
    const number = Number(value) || 0;

    return `${number.toLocaleString("fa-IR")} تومان`;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getProduct(productId) {
    return products.find(product => product.id === productId) || null;
  }

  function renderProducts(list = products) {
    const grid = document.querySelector("[data-products-grid]");

    if (!grid) return;

    if (!Array.isArray(list) || list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <strong>محصولی برای نمایش وجود ندارد.</strong>
          <span>لطفاً کمی بعد دوباره تلاش کنید.</span>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map(product => {
      const id = escapeHTML(product.id);
      const title = escapeHTML(product.title);
      const description = escapeHTML(product.description);
      const category = escapeHTML(product.category || "محصول فرهنگی");
      const badge = escapeHTML(product.badge || "محصول فرهنگی");
      const price = formatPrice(product.price);

      return `
        <article class="product-card" data-product-id="${id}">
          <div class="product-card__top">
            <span class="product-card__category">${category}</span>
            <span class="product-card__badge">${badge}</span>
          </div>

          <div class="product-card__icon" aria-hidden="true">
            ${getProductIcon(product.id)}
          </div>

          <h3 class="product-card__title">${title}</h3>

          <p class="product-card__description">
            ${description}
          </p>

          <div class="product-card__bottom">
            <div class="product-card__price">
              <span>قیمت</span>
              <strong>${price}</strong>
            </div>

            <button
              type="button"
              class="product-card__button"
              data-buy-product="${id}"
              aria-label="خرید ${title}"
            >
              خرید و ثبت شانس
            </button>
          </div>
        </article>
      `;
    }).join("");

    bindPurchaseButtons();
  }

  function getProductIcon(productId) {
    const icons = {
      "iranian-images": `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2"></rect>
          <circle cx="8.5" cy="9" r="1.5"></circle>
          <path d="M4 17l5-5 3.5 3.5 2.5-2.5L20 18"></path>
        </svg>
      `,

      "iranian-masterpieces-music": `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 18V5l10-2v13"></path>
          <circle cx="6.5" cy="18" r="3"></circle>
          <circle cx="16.5" cy="16" r="3"></circle>
        </svg>
      `,

      "kids-ebooks": `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"></path>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 8H20"></path>
          <path d="M8 12h7M8 15h5"></path>
        </svg>
      `,

      "adult-ebooks": `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 4h14v17H5z"></path>
          <path d="M8 8h8M8 12h8M8 16h5"></path>
        </svg>
      `
    };

    return icons[productId] || `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2"></rect>
        <path d="M8 8h8M8 12h8M8 16h5"></path>
      </svg>
    `;
  }

  function bindPurchaseButtons() {
    const buttons = document.querySelectorAll("[data-buy-product]");

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const productId = button.dataset.buyProduct;
        const product = getProduct(productId);

        if (!product) return;

        openPurchaseModal(product);
      });
    });
  }

  function openPurchaseModal(product) {
    const modal = document.querySelector("#purchaseModal");

    if (!modal) return;

    const productIdInput = document.querySelector("#purchaseProductId");
    const summary = document.querySelector("#purchaseProductSummary");
    const mobileInput = document.querySelector("#purchaseMobile");

    if (productIdInput) {
      productIdInput.value = product.id;
    }

    if (summary) {
      summary.innerHTML = `
        <div class="purchase-summary">
          <div class="purchase-summary__category">
            ${escapeHTML(product.category || "محصول فرهنگی")}
          </div>

          <h3>${escapeHTML(product.title)}</h3>

          <p>
            ${escapeHTML(product.description)}
          </p>

          <div class="purchase-summary__price">
            ${formatPrice(product.price)}
          </div>

          <div class="purchase-summary__chance">
            <span>✓</span>
            با خرید موفق، شانس این دوره به‌صورت خودکار ثبت می‌شود.
          </div>
        </div>
      `;
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    if (mobileInput) {
      setTimeout(() => mobileInput.focus(), 100);
    }
  }

  function closePurchaseModal() {
    const modal = document.querySelector("#purchaseModal");

    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    const form = document.querySelector("#purchaseForm");

    if (form) {
      form.reset();
    }
  }

  function initializeModal() {
    const modal = document.querySelector("#purchaseModal");

    if (!modal) return;

    const closeButtons = modal.querySelectorAll(
      "[data-close-modal], .modal-close"
    );

    closeButtons.forEach(button => {
      button.addEventListener("click", closePurchaseModal);
    });

    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closePurchaseModal();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closePurchaseModal();
      }
    });
  }

  async function loadProducts() {
    try {
      if (
        window.TTKALAAApi &&
        typeof window.TTKALAAApi.getProducts === "function"
      ) {
        const remoteProducts = await window.TTKALAAApi.getProducts();

        if (Array.isArray(remoteProducts) && remoteProducts.length) {
          products = remoteProducts.map(product => ({
            ...product,
            price: Number(product.price) || 29000
          }));

          renderProducts();
          return products;
        }
      }
    } catch (error) {
      console.warn("Could not load products from API:", error);
    }

    products = [...FALLBACK_PRODUCTS];
    renderProducts();

    return products;
  }

  window.TTKALAAProducts = {
    getAll: () => [...products],
    getById: getProduct,
    load: loadProducts,
    render: renderProducts,
    openPurchaseModal,
    closePurchaseModal,
    formatPrice
  };

  document.addEventListener("DOMContentLoaded", () => {
    initializeModal();
    loadProducts();
  });
})();
