/* =========================================================
   T.T.KALAA — PRODUCTS
========================================================= */

(function (window) {
  "use strict";

  const PRODUCTS = [
    {
      id: "iranian-images",
      name: "مجموعه تصاویر و پس‌زمینه‌های ایرانی",
      price: 29000,
      image: "pic/images.jpg"
    },
    {
      id: "iranian-music",
      name: "مجموعه موسیقی‌های شاهکار هنری 100 سال اخیر ایران",
      price: 29000,
      image: "pic/music.jpg"
    },
    {
      id: "kids-books",
      name: "مجموعه E-Book / کتاب‌های کودک و نوجوان",
      price: 29000,
      image: "pic/kids.jpg"
    },
    {
      id: "adult-books",
      name: "مجموعه کتاب‌های بزرگسالان",
      price: 29000,
      image: "pic/adult.jpg"
    }
  ];

  function normalizeDigits(value) {
    return String(value ?? "")
      .replace(/[۰-۹]/g, function (char) {
        return String("۰۱۲۳۴۵۶۷۸۹".indexOf(char));
      })
      .replace(/[٠-٩]/g, function (char) {
        return String("٠١٢٣٤٥٦٧٨٩".indexOf(char));
      });
  }

  function formatPrice(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "۲۹٬۰۰۰ تومان";
    }

    return normalizeDigits(
      number.toLocaleString("fa-IR")
    ) + " تومان";
  }

  function getProducts() {
    return PRODUCTS.slice();
  }

  function getProductById(id) {
    return PRODUCTS.find(function (product) {
      return product.id === id;
    }) || null;
  }

  function createProductCard(product) {
    const article = document.createElement("article");

    article.className = "product-card";
    article.dataset.productId = product.id;

    article.innerHTML = `
      <img
        src="${product.image}"
        alt="${product.name}"
        loading="lazy"
      >

      <div class="product-card-content">

        <h3>${product.name}</h3>

        <button
          type="button"
          class="select-product-btn"
          data-product-id="${product.id}"
        >
          انتخاب
        </button>

      </div>
    `;

    return article;
  }

  function renderProducts() {
    const container =
      document.getElementById("productsGrid");

    if (!container) {
      return;
    }

    container.innerHTML = "";

    PRODUCTS.forEach(function (product) {
      container.appendChild(
        createProductCard(product)
      );
    });

    container
      .querySelectorAll(".select-product-btn")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          const productId =
            button.dataset.productId;

          const product =
            getProductById(productId);

          if (
            product &&
            typeof window.selectTTKALAAProduct === "function"
          ) {
            window.selectTTKALAAProduct(product);
          }
        });
      });
  }

  window.TTKALAA_PRODUCTS = PRODUCTS;

  window.TTKALAAProducts = {
    getProducts,
    getProductById,
    formatPrice,
    renderProducts
  };

  document.addEventListener(
    "DOMContentLoaded",
    renderProducts
  );

})(window);
