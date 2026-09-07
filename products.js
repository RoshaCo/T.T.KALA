/* =========================================================
   مدیریت محصولات T.T.KALAA
   به‌روزرسانی: مسیر عکس‌ها از پوشه pic
   و دکمه‌های خرید تک‌ستونه
========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     فهرست محصولات
     --------------------------------------------------------- */

  const products = [
    {
      id: "images",
      title: "تصاویر ایرانی",
      description:
        "خرید مجموعه تصاویر پس زمینه، از ایران",
      price: 35000,
      image: "pic/Im9.jpg"
    },

    {
      id: "music",
      title: "موسیقی ایرانی",
      description:
        "خرید برگزیده شاهکارهای موسیقی ایران",
      price: 35000,
      image: "pic/Im10.jpg"
    },

    {
      id: "adult",
      title: "کتاب بزرگسال",
      description:
        "خرید مجموعه ebook مخصوص بزرگسالان",
      price: 35000,
      image: "pic/Im12.jpg"
    },

    {
      id: "kids",
      title: "کتاب نوجوانان",
      description:
        "خرید مجموعه ebook مخصوص نوجوانان",
      price: 35000,
      image: "pic/Im11.jpg"
    }
  ];

  /* ---------------------------------------------------------
     دسترسی به فهرست محصولات
     --------------------------------------------------------- */

  window.TTKALAAProducts = {

    getAll: function () {
      return products.slice();
    },

    getById: function (id) {
      return products.find(function (product) {
        return product.id === id;
      }) || null;
    },

    getPrice: function (id) {
      const product = this.getById(id);
      return product ? product.price : 0;
    },

    formatPrice: function (price) {
      return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
    }

  };

  /* ---------------------------------------------------------
     قرار دادن اطلاعات محصولات روی کارت‌های سایت
     --------------------------------------------------------- */

  function renderProducts() {
    const cards = document.querySelectorAll("[data-product-id]");

    cards.forEach(function (card) {
      const productId = card.getAttribute("data-product-id");
      const product = TTKALAAProducts.getById(productId);

      if (!product) return;

      const image = card.querySelector("[data-product-image]");
      const title = card.querySelector("[data-product-title]");
      const description = card.querySelector("[data-product-description]");
      const price = card.querySelector("[data-product-price]");
      const buyButton = card.querySelector("[data-buy-product]");

      if (image) {
        image.src = product.image;
        image.alt = product.title;
      }

      if (title) {
        title.textContent = product.title;
      }

      if (description) {
        description.textContent = product.description;
      }

      if (price) {
        price.textContent = TTKALAAProducts.formatPrice(product.price);
      }

      if (buyButton) {
        buyButton.textContent = product.description;
        buyButton.setAttribute("data-buy-product", product.id);
      }
    });
  }

  /* ---------------------------------------------------------
     آماده‌سازی صفحه
     --------------------------------------------------------- */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderProducts);
  } else {
    renderProducts();
  }

})();
