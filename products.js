/* =========================================================
   مدیریت محصولات T.T.KALAA
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     فهرست محصولات
     --------------------------------------------------------- */

  const products = [
    {
      id: "images",
      title: "مجموعه تصاویر و پس‌زمینه‌های ایرانی",
      description:
        "مجموعه‌ای منتخب از تصاویر و پس‌زمینه‌های زیبا با حال‌وهوای ایرانی.",
      price: 29000,
      image: "images/images.jpg"
    },

    {
      id: "music",
      title: "مجموعه موسیقی‌های شاهکار هنری ۱۰۰ سال اخیر ایران",
      description:
        "منتخبی از موسیقی‌های ماندگار و ارزشمند هنری ایران در یک مجموعه دیجیتال.",
      price: 29000,
      image: "images/music.jpg"
    },

    {
      id: "kids",
      title: "مجموعه کتاب‌های کودک و نوجوان",
      description:
        "مجموعه‌ای از کتاب‌های الکترونیکی داستانی و تصویری مناسب کودکان و نوجوانان.",
      price: 29000,
      image: "images/kids.jpg"
    },

    {
      id: "adult",
      title: "مجموعه کتاب‌های بزرگسالان",
      description:
        "مجموعه‌ای منتخب از کتاب‌های الکترونیکی برای علاقه‌مندان به مطالعه.",
      price: 29000,
      image: "images/adult.jpg"
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

      card.setAttribute("data-buy-product", product.id);
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
