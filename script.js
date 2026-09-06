// ===== تنظیمات =====
const IS_TEST_MODE = true; // فعلاً تست باشه

// ===== دیتابیس محلی =====
let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
let phoneNumbers = JSON.parse(localStorage.getItem('phoneNumbers')) || [];

// ===== ناوبری =====
function goToLuckPage() {
    window.location.href = 'luck.html';
}

function goBack() {
    window.location.href = 'index.html';
}

function goToProducts() {
    window.location.href = 'index.html#products';
}

function resetLuck() {
    document.getElementById('step3').classList.add('hidden');
    document.getElementById('step1').classList.remove('hidden');
    document.getElementById('phoneInput').value = '';
}

// ===== تایمر معکوس =====
function startCountdown() {
    // تاریخ قرعه‌کشی - ۲ روز دیگه
    const lotteryDate = new Date();
    lotteryDate.setDate(lotteryDate.getDate() + 2);
    lotteryDate.setHours(23, 59, 59, 0);
    
    function updateCountdown() {
        const now = new Date();
        const diff = lotteryDate - now;
        
        if (diff <= 0) {
            // قرعه‌کشی تموم شده
            document.getElementById('days').textContent = '۰۰';
            document.getElementById('hours').textContent = '۰۰';
            document.getElementById('minutes').textContent = '۰۰';
            document.getElementById('seconds').textContent = '۰۰';
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = formatNumber(days);
        document.getElementById('hours').textContent = formatNumber(hours);
        document.getElementById('minutes').textContent = formatNumber(minutes);
        document.getElementById('seconds').textContent = formatNumber(seconds);
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function formatNumber(num) {
    return num < 10 ? '۰' + num : num;
}

// ===== شمارنده شرکت‌کننده‌ها =====
function updateParticipants() {
    const baseParticipants = 12456;
    const basePurchases = 891;
    
    // افزایش تصادفی برای واقعی‌تر شدن
    const randomIncrease = Math.floor(Math.random() * 5);
    const currentParticipants = baseParticipants + randomIncrease;
    const currentPurchases = basePurchases + Math.floor(randomIncrease / 2);
    
    document.getElementById('participantsCount').textContent = 
        currentParticipants.toLocaleString('fa-IR');
    document.getElementById('todayPurchases').textContent = 
        currentPurchases.toLocaleString('fa-IR');
}

// ===== نوتیفیکیشن زنده =====
const notifications = [
    'مریم از تهران ۲ دقیقه پیش خرید کرد!',
    'علی از اصفهان ۵ دقیقه پیش شانسش رو چک کرد!',
    'زهرا از شیراز ۸ دقیقه پیش خرید کرد!',
    'محمد از تبریز ۱۲ دقیقه پیش برنده شد!',
    'فاطمه از مشهد ۱۵ دقیقه پیش خرید کرد!',
    'حسین از کرج ۱۸ دقیقه پیش شانسش رو چک کرد!',
    'نرگس از قم ۲۰ دقیقه پیش خرید کرد!',
    'رضا از اهواز ۲۳ دقیقه پیش خرید کرد!'
];

function startNotifications() {
    let index = 0;
    
    function showNotification() {
        const notificationText = document.getElementById('notificationText');
        const notificationBox = document.getElementById('liveNotification');
        
        if (notificationText && notificationBox) {
            notificationText.textContent = notifications[index];
            notificationBox.style.animation = 'fadeIn 0.5s';
            
            index = (index + 1) % notifications.length;
        }
    }
    
    showNotification();
    setInterval(showNotification, 5000);
}

// ===== چک شانس =====
function checkLuck() {
    const phoneInput = document.getElementById('phoneInput');
    const phone = phoneInput.value.trim();
    
    // اعتبارسنجی
    if (!isValidPhone(phone)) {
        alert('لطفاً شماره موبایل صحیح وارد کنید (مثال: 09123456789)');
        return;
    }
    
    // نمایش مرحله محاسبه
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    
    // تاخیر ۲ ثانیه‌ای برای هیجان
    setTimeout(() => {
        document.getElementById('step2').classList.add('hidden');
        document.getElementById('step3').classList.remove('hidden');
        
        const hasPurchased = purchases.some(p => p.phone === phone);
        
        let luckPercent;
        let message;
        let icon;
        
        if (hasPurchased) {
            luckPercent = Math.floor(85 + Math.random() * 10);
            message = '🎉 تو خریداری! شانست بالاست!';
            icon = '🌟';
        } else {
            luckPercent = Math.floor(40 + Math.random() * 30);
            message = '✅ ثبت شدی! با خرید، شانست ۲ برابر میشه!';
            icon = '💫';
        }
        
        document.getElementById('resultIcon').textContent = icon;
        document.getElementById('luckPercent').textContent = luckPercent + '٪';
        document.getElementById('luckMessage').textContent = message;
        
        const progressFill = document.getElementById('progressFill');
        setTimeout(() => {
            progressFill.style.width = luckPercent + '%';
        }, 100);
        
        // ذخیره شماره
        if (!phoneNumbers.includes(phone)) {
            phoneNumbers.push(phone);
            localStorage.setItem('phoneNumbers', JSON.stringify(phoneNumbers));
        }
    }, 2000);
}

// ===== اعتبارسنجی =====
function isValidPhone(phone) {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
}

// ===== خرید محصول =====
function buyProduct(productName, price) {
    const phone = prompt('📱 شماره موبایلت رو وارد کن (برای شرکت در قرعه‌کشی):');
    
    if (!phone || !isValidPhone(phone)) {
        alert('لطفاً شماره موبایل صحیح وارد کنید');
        return;
    }
    
    const purchase = savePurchase(phone, productName, price);
    
    if (IS_TEST_MODE) {
        showSuccessPage(purchase);
    } else {
        // اینجا زرین‌پال وصل میشه
        alert('اتصال به زرین‌پال...');
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
    
    if (!phoneNumbers.includes(phone)) {
        phoneNumbers.push(phone);
        localStorage.setItem('phoneNumbers', JSON.stringify(phoneNumbers));
    }
    
    return purchase;
}

// ===== تولید شناسه‌ها =====
function generatePurchaseId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function generateLotteryNumber() {
    return '#' + Math.floor(100 + Math.random() * 900);
}

// ===== نمایش موفقیت =====
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

// ===== دانلود =====
function downloadProduct(productName) {
    const downloadLinks = {
        'عکس‌های پس‌زمینه ایران': 'YOUR_DOWNLOAD_LINK_1',
        'موزیک‌های شاهکار ایرانی': 'YOUR_DOWNLOAD_LINK_2',
        'کتاب‌های خواندنی': 'YOUR_DOWNLOAD_LINK_3'
    };
    
    const link = downloadLinks[productName];
    
    if (link && !link.includes('YOUR_DOWNLOAD')) {
        window.open(link, '_blank');
    } else {
        alert('📥 لینک دانلود به زودی فعال میشه!\n\nنسخه تستی است.');
    }
}

// ===== قوانین =====
function showRules() {
    document.getElementById('rulesModal').classList.remove('hidden');
}

function closeRules() {
    document.getElementById('rulesModal').classList.add('hidden');
}

// ===== اجرای اولیه =====
document.addEventListener('DOMContentLoaded', function() {
    // اجرای تایمر فقط در صفحه اصلی
    if (document.getElementById('days')) {
        startCountdown();
        updateParticipants();
        setInterval(updateParticipants, 10000);
        startNotifications();
    }
    
    // چک شانس با Enter
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
        phoneInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkLuck();
            }
        });
    }
});
