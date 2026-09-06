// ===== تنظیمات =====
const IS_TEST_MODE = true; // فعلاً تست باشه، بعداً false کن

// ===== دیتابیس محلی (نسخه MVP) =====
let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
let phoneNumbers = JSON.parse(localStorage.getItem('phoneNumbers')) || [];

// ===== چک شانس =====
function checkLuck() {
    const phoneInput = document.getElementById('phoneInput');
    const phone = phoneInput.value.trim();
    
    // اعتبارسنجی شماره موبایل
    if (!isValidPhone(phone)) {
        alert('لطفاً شماره موبایل صحیح وارد کنید (مثال: 09123456789)');
        return;
    }
    
    // بررسی آیا قبلاً خریده
    const hasPurchased = purchases.some(p => p.phone === phone);
    
    // محاسبه شانس
    let luckPercent;
    let message;
    
    if (hasPurchased) {
        luckPercent = Math.floor(85 + Math.random() * 10); // 85-95%
        message = '🎉 تو خریداری! شانست بالاست!';
    } else {
        luckPercent = Math.floor(40 + Math.random() * 30); // 40-70%
        message = '✅ ثبت شدی! با خرید، شانست ۲ برابر میشه!';
    }
    
    // نمایش نتیجه
    showLuckResult(luckPercent, message);
    
    // ذخیره شماره برای قرعه‌کشی
    if (!phoneNumbers.includes(phone)) {
        phoneNumbers.push(phone);
        localStorage.setItem('phoneNumbers', JSON.stringify(phoneNumbers));
    }
}

// ===== اعتبارسنجی شماره موبایل =====
function isValidPhone(phone) {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
}

// ===== نمایش نتیجه شانس =====
function showLuckResult(percent, message) {
    const resultDiv = document.getElementById('luckResult');
    const percentSpan = document.getElementById('luckPercent');
    const messageP = document.getElementById('luckMessage');
    const progressFill = document.getElementById('progressFill');
    
    resultDiv.classList.remove('hidden');
    percentSpan.textContent = percent + '٪';
    messageP.textContent = message;
    
    // انیمیشن نوار پیشرفت
    setTimeout(() => {
        progressFill.style.width = percent + '%';
    }, 100);
}

// ===== خرید محصول =====
function buyProduct(productName, price) {
    // گرفتن شماره موبایل
    const phone = prompt('📱 شماره موبایلت رو وارد کن (برای شرکت در قرعه‌کشی):');
    
    if (!phone || !isValidPhone(phone)) {
        alert('لطفاً شماره موبایل صحیح وارد کنید');
        return;
    }
    
    // ثبت خرید
    const purchase = savePurchase(phone, productName, price);
    
    if (IS_TEST_MODE) {
        // حالت تست - بدون پرداخت واقعی
        showSuccessPage(purchase);
    } else {
        // پرداخت واقعی
        alert('اتصال به زرین‌پال... (در نسخه واقعی فعال میشه)');
    }
}

// ===== ذخیره خرید =====
function savePurchase(phone, product, amount) {
    const purchase = {
        id: generatePurchaseId(),
        phone: phone,
        product: product,
        amount: amount,
        date: new Date().toISOString(),
        lotteryNumber: generateLotteryNumber()
    };
    
    purchases.push(purchase);
    localStorage.setItem('purchases', JSON.stringify(purchases));
    
    // ذخیره شماره موبایل
    if (!phoneNumbers.includes(phone)) {
        phoneNumbers.push(phone);
        localStorage.setItem('phoneNumbers', JSON.stringify(phoneNumbers));
    }
    
    return purchase;
}

// ===== تولید شماره خرید =====
function generatePurchaseId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ===== تولید شماره شانس =====
function generateLotteryNumber() {
    return '#' + Math.floor(100 + Math.random() * 900);
}

// ===== نمایش صفحه موفقیت =====
function showSuccessPage(purchase) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 400px;
            text-align: center;
            animation: fadeIn 0.5s;
        ">
            <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
            <h2 style="font-size: 24px; margin-bottom: 15px; color: #00B894;">خرید موفق!</h2>
            
            <div style="text-align: right; margin: 20px 0;">
                <p style="margin: 10px 0;"><strong>📦 محصول:</strong> ${purchase.product}</p>
                <p style="margin: 10px 0;"><strong>🔢 شماره خرید:</strong> ${purchase.id}</p>
                <p style="margin: 10px 0;"><strong>🎟️ شماره شانس:</strong> ${purchase.lotteryNumber}</p>
                <p style="margin: 10px 0;"><strong>📱 شماره موبایل:</strong> ${purchase.phone}</p>
                <p style="margin: 10px 0;"><strong>💰 مبلغ:</strong> ${purchase.amount.toLocaleString('fa-IR')} تومان</p>
            </div>
            
            <button onclick="downloadProduct('${purchase.product}')" style="
                width: 100%;
                padding: 15px;
                background: #6C5CE7;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 18px;
                cursor: pointer;
                margin-top: 20px;
                font-family: inherit;
            ">📥 دانلود محصول</button>
            
            <button onclick="this.closest('div').parentElement.remove()" style="
                width: 100%;
                padding: 10px;
                background: #E0E0E0;
                color: #2D3436;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 10px;
                font-family: inherit;
            ">بستن</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ===== دانلود محصول =====
function downloadProduct(productName) {
    // اینجا لینک دانلود واقعی محصولات رو بذار
    const downloadLinks = {
        'عکس‌های پس‌زمینه ایران': 'YOUR_DOWNLOAD_LINK_1',
        'موزیک‌های شاهکار ایرانی': 'YOUR_DOWNLOAD_LINK_2',
        'کتاب‌های خواندنی': 'YOUR_DOWNLOAD_LINK_3'
    };
    
    const link = downloadLinks[productName];
    
    if (link && link !== 'YOUR_DOWNLOAD_LINK_1' && link !== 'YOUR_DOWNLOAD_LINK_2' && link !== 'YOUR_DOWNLOAD_LINK_3') {
        window.open(link, '_blank');
    } else {
        alert('📥 لینک دانلود به زودی فعال میشه!\n\nنسخه تستی است.');
    }
}

// ===== اجرای اولیه =====
document.addEventListener('DOMContentLoaded', function() {
    // چک کردن شماره موبایل با دکمه Enter
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
        phoneInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkLuck();
            }
        });
    }
});
