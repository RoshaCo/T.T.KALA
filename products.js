/* =========================================================
   T.T.KALAA — PRODUCTS
   File: js/products.js
   ========================================================= */

"use strict";

/* =========================================================
   01. PRODUCT DATA
   ========================================================= */

window.TTKALAA_PRODUCTS = [
  {
    id: "iranian-images",
    title: "مجموعه تصاویر و پس‌زمینه‌های ایرانی",
    shortDescription:
      "مجموعه‌ای منتخب از تصاویر و پس‌زمینه‌های باکیفیت با حال‌وهوای ایرانی.",
    price: 29000,
    currency: "تومان",
    chance: 1,
    badge: "فرهنگی",
    icon: "▧",
    active: true
  },
  {
    id: "iranian-masterpieces-music",
    title: "مجموعه موسیقی‌های شاهکار هنری ۱۰۰ سال اخیر ایران",
    shortDescription:
      "مجموعه‌ای ارزشمند از آثار ماندگار و منتخب موسیقی ایران.",
    price: 29000,
    currency: "تومان",
    chance: 1,
    badge: "ویژه",
    icon: "♫",
    active: true
  },
  {
    id: "kids-ebooks",
    title: "مجموعه کتاب‌های کودک و نوجوان",
    shortDescription:
      "مجموعه‌ای از کتاب‌های الکترونیکی مناسب کودکان و نوجوانان.",
    price: 29000,
    currency: "تومان",
    chance: 1,
    badge: "محبوب",
    icon: "▤",
    active: true
  },
  {
    id: "adult-ebooks",
    title: "مجموعه کتاب‌های بزرگسالان",
    shortDescription:
      "مجموعه‌ای از کتاب‌های الکترونیکی برای علاقه‌مندان به مطالعه.",
    price: 29000,
    currency: "تومان",
    chance: 1,
    badge: "فرهنگی",
    icon: "▥",
    active: true
  }
];

/* =========================================================
   02. PRODUCT HELPERS
   ========================================================= */

function ttkalaaGetProductById(productId) {
  return window.TTKALAA_PRODUCTS.find(
    (product) => product.id === productId
  ) || null;
}

function ttkalaaFormatPrice(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return "—";
  }

  return new Intl.NumberFormat("fa-IR").format(numericPrice);
}

function ttkalaaGetProductIcon(product) {
  return product?.icon || "▤";
}

/* =========================================================
   03. PRODUCT CARD RENDERING
   ========================================================= */

function ttkalaaRenderProducts(products = window.TTKALAA_PRODUCTS) {
  const container = document.querySelector("[data-products-grid]");

  if (!container) {
    return;
  }

  const activeProducts = products.filter(
    (product) => product && product.active !== false
  );

  container.innerHTML = activeProducts
    .map((product) => {
      const price = ttkalaaFormatPrice(product.price);

      return `
        <article class="product-card" data-product-id="${ttkalaaEscapeHTML(product.id)}">

          <div class="product-cover">

            ${
              product.badge
                ? `
                  <span class="product-badge">
                    ${ttkalaaEscapeHTML(product.badge)}
                  </span>
                `
                : ""
            }

            <div class="product-cover-placeholder" aria-hidden="true">
              ${ttkalaaEscapeHTML(ttkalaaGetProductIcon(product))}
            </div>

          </div>

          <div class="product-content">

            <h3 class="product-title">
              ${ttkalaaEscapeHTML(product.title)}
            </h3>

            <p class="product-description">
              ${ttkalaaEscapeHTML(product.shortDescription)}
            </p>

            <div class="product-bottom">

              <div class="product-price">
                ${price}
                <span>${ttkalaaEscapeHTML(product.currency)}</span>
              </div>

              <button
                type="button"
                class="btn btn-primary btn-sm"
                data-buy-product="${ttkalaaEscapeHTML(product.id)}"
                aria-label="خرید ${ttkalaaEscapeHTML(product.title)}"
              >
                خرید و دریافت شانس
              </button>

            </div>

          </div>

        </article>
      `;
    })
    .join("");
}

/* =========================================================
   04. ESCAPE HTML
   ========================================================= */

function ttkalaaEscapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   05. PURCHASE MODAL
   ========================================================= */

function ttkalaaOpenPurchaseModal(productId) {
  const product = ttkalaaGetProductById(productId);

  if (!product) {
    if (typeof window.showToast === "function") {
      window.showToast(
        "محصول موردنظر پیدا نشد.",
        "error"
      );
    }

    return;
  }

  const modal = document.getElementById("purchaseModal");

  if (!modal) {
    return;
  }

  modal.dataset.productId = product.id;

  const title = modal.querySelector("[data-purchase-title]");
  const description = modal.querySelector("[data-purchase-description]");
  const price = modal.querySelector("[data-purchase-price]");
  const chance = modal.querySelector("[data-purchase-chance]");
  const icon = modal.querySelector("[data-purchase-icon]");

  if (title) {
    title.textContent = product.title;
  }

  if (description) {
    description.textContent = product.shortDescription;
  }

  if (price) {
    price.textContent =
      `${ttkalaaFormatPrice(product.price)} ${product.currency}`;
  }

  if (chance) {
    chance.textContent =
      `${ttkalaaFormatPrice(product.chance)} شانس`;
  }

  if (icon) {
    icon.textContent = ttkalaaGetProductIcon(product);
  }

  if (typeof window.openModal === "function") {
    window.openModal(modal);
  } else {
    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
  }
}

/* =========================================================
   06. PURCHASE BUTTON EVENTS
   ========================================================= */

function ttkalaaHandleProductClick(event) {
  const button = event.target.closest("[data-buy-product]");

  if (!button) {
    return;
  }

  const productId = button.getAttribute("data-buy-product");

  ttkalaaOpenPurchaseModal(productId);
}

/* =========================================================
   07. API PRODUCT SYNC
   ========================================================= */

async function ttkalaaSyncProductsFromAPI() {
  if (
    !window.TTKALAA_API_CLIENT ||
    typeof window.TTKALAA_API_CLIENT.getProducts !== "function"
  ) {
    return;
  }

  try {
    const response =
      await window.TTKALAA_API_CLIENT.getProducts();

    const serverProducts =
      Array.isArray(response)
        ? response
        : Array.isArray(response?.products)
          ? response.products
          : null;

    if (!serverProducts || serverProducts.length === 0) {
      return;
    }

    const normalizedProducts = serverProducts
      .map((product) => ({
        id: String(product.id || product.slug || ""),
        title: String(product.title || ""),
        shortDescription: String(
          product.short_description ||
          product.shortDescription ||
          ""
        ),
        price: Number(product.price || 29000),
        currency: String(
          product.currency || "تومان"
        ),
        chance: Number(product.chance || 1),
        badge: String(product.badge || ""),
        icon: String(product.icon || "▤"),
        active: product.active !== false
      }))
      .filter(
        (product) =>
          product.id &&
          product.title &&
          product.active !== false
      );

    if (normalizedProducts.length === 0) {
      return;
    }

    window.TTKALAA_PRODUCTS = normalizedProducts;

    ttkalaaRenderProducts(normalizedProducts);
  } catch (error) {
    /*
      در صورت خطای API، اطلاعات پایه موجود در فایل
      بدون توقف سایت استفاده می‌شوند.
    */

    console.warn(
      "T.T.KALAA: دریافت محصولات از API انجام نشد.",
      error
    );
  }
}

/* =========================================================
   08. PUBLIC PRODUCT API
   ========================================================= */

window.TTKALAA_PRODUCT_CLIENT = {
  getAll() {
    return [...window.TTKALAA_PRODUCTS];
  },

  getById(productId) {
    return ttkalaaGetProductById(productId);
  },

  formatPrice(price) {
    return ttkalaaFormatPrice(price);
  },

  openPurchase(productId) {
    ttkalaaOpenPurchaseModal(productId);
  },

  render(products) {
    ttkalaaRenderProducts(products);
  },

  async sync() {
    await ttkalaaSyncProductsFromAPI();
  }
};

/* =========================================================
   09. INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  ttkalaaRenderProducts();

  document.addEventListener(
    "click",
    ttkalaaHandleProductClick
  );

  /*
    API اطلاعات واقعی را در صورت فعال بودن
    به‌صورت غیرمسدودکننده جایگزین می‌کند.
  */

  ttkalaaSyncProductsFromAPI();
});

/* =========================================================
   END OF FILE
   ========================================================= */
