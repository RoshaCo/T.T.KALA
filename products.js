/* =========================================================
   T.T.KALAA — PRODUCTS
   مدیریت محصولات فرهنگی دیجیتال
========================================================= */

(function () {
  "use strict";

  /* =======================================================
     فهرست محصولات
     
     قیمت همه محصولات:
     ۲۹٬۰۰۰ تومان
  ======================================================= */

  const PRODUCTS = [
    {
      id: "images",
      name: "مجموعه تصاویر و پس‌زمینه‌های ایرانی",
      shortName: "تصاویر و پس‌زمینه‌های ایرانی",
      price: 29000,
      image: "pic/images.jpg"
    },

    {
      id: "music",
      name: "مجموعه موسیقی‌های شاهکار هنری ۱۰۰ سال اخیر ایران",
      shortName: "شاهکارهای موسیقی ایران",
      price: 29000,
      image: "pic/music.jpg"
    },

    {
      id: "kids",
      name: "مجموعه E-Book کتاب‌های کودک و نوجوان",
      shortName: "کتاب‌های کودک و نوجوان",
      price: 29000,
      image: "pic/kids.jpg"
    },

    {
      id: "adult",
      name: "مجموعه کتاب‌های بزرگسالان",
      shortName: "کتاب‌های بزرگسالان",
      price: 29000,
      image: "pic/adult.jpg"
    }
  ];


  /* =======================================================
     دریافت همه محصولات
  ======================================================= */

  function getAll() {
    return PRODUCTS.slice();
  }


  /* =======================================================
     دریافت محصول با شناسه
  ======================================================= */

  function getById(productId) {

    if (!productId) {
      return null;
    }

    return (
      PRODUCTS.find(function (product) {
        return product.id === productId;
      }) || null
    );
  }


  /* =======================================================
     دریافت قیمت محصول
  ======================================================= */

  function getPrice(productId) {

    const product = getById(productId);

    return product
      ? product.price
      : 0;
  }


  /* =======================================================
     فرمت قیمت برای نمایش فارسی
  ======================================================= */

  function formatPrice(price) {

    const numericPrice =
      Number(price) || 0;

    return numericPrice
      .toLocaleString("fa-IR") +
      " تومان";
  }


  /* =======================================================
     تبدیل عدد به اعداد فارسی
  ======================================================= */

  function toPersianNumber(value) {

    return String(value)
      .replace(/\d/g, function (digit) {
        return "۰۱۲۳۴۵۶۷۸۹"[digit];
      });
  }


  /* =======================================================
     ساخت HTML کارت محصول
     
     این تابع در صورت نیاز توسط main.js استفاده می‌شود.
  ======================================================= */

  function createProductCard(product) {

    if (!product) {
      return "";
    }

    return `
      <article
        class="product-card"
        data-product-id="${escapeHTML(product.id)}"
        data-buy-product="${escapeHTML(product.id)}"
      >

        <div class="product-image-wrap">

          <img
            src="${escapeHTML(product.image)}"
            alt="${escapeHTML(product.name)}"
            class="product-image"
            loading="lazy"
          >

        </div>

        <div class="product-content">

          <h3>
            ${escapeHTML(product.shortName || product.name)}
          </h3>

          <div class="product-bottom">

            <strong>
              ${escapeHTML(formatPrice(product.price))}
            </strong>

            <button
              type="button"
              class="product-buy-btn"
              data-buy-product="${escapeHTML(product.id)}"
            >
              انتخاب
            </button>

          </div>

        </div>

      </article>
    `;
  }


  /* =======================================================
     رندر محصولات
     
     اگر API بعداً اطلاعات محصولات را از بک‌اند برگرداند،
     می‌توان این تابع را با داده‌های بک‌اند تغذیه کرد.
  ======================================================= */

  function renderProducts(container, products) {

    if (!container) {
      return;
    }

    const list =
      Array.isArray(products)
        ? products
        : PRODUCTS;

    container.innerHTML =
      list
        .map(createProductCard)
        .join("");
  }


  /* =======================================================
     فرار دادن کاراکترهای HTML
     برای جلوگیری از ورود HTML ناخواسته
  ======================================================= */

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  /* =======================================================
     خروجی عمومی
  ======================================================= */

  window.TTKALAAProducts = {

    getAll,
    getById,
    getPrice,

    formatPrice,
    toPersianNumber,

    createProductCard,
    renderProducts,

    escapeHTML
  };

})();
