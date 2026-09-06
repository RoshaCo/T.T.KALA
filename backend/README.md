# T.T.KALAA Backend

این پوشه مربوط به API امن، پردازش سفارش، پرداخت زرین‌پال، ثبت شانس، کمپین‌ها و داده‌های موردنیاز سایت T.T.KALAA است.

## معماری

Frontend:
- GitHub Pages
- HTML
- CSS
- Vanilla JavaScript

Backend:
- API مستقل
- HTTPS
- Database
- ZarinPal
- مدیریت سفارش
- Verify پرداخت
- ایجاد شانس

Frontend نباید هیچ Secret، API Key، Merchant ID حساس، رمز دیتابیس یا Private Key داشته باشد.

---

## جریان خرید

```text
انتخاب محصول
    ↓
ارسال productId + mobile + campaignId
    ↓
Backend
    ↓
اعتبارسنجی محصول
    ↓
اعتبارسنجی کمپین
    ↓
محاسبه مبلغ واقعی از Database
    ↓
ایجاد Order
    ↓
دریافت Authority از ZarinPal
    ↓
Redirect به ZarinPal
    ↓
پرداخت کاربر
    ↓
بازگشت به Backend
    ↓
Verify توسط Backend
    ↓
تأیید مبلغ و Authority
    ↓
Finalize Order
    ↓
ایجاد Chance
    ↓
ثبت Transaction
    ↓
نمایش نتیجه به کاربر
