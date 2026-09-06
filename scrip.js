/* ═══════════════════════════════════════════
   🎯 منطق و عملکرد سایت
   ═══════════════════════════════════════════ */

/* ─────────────────────────────────────────────
   ۱. تنظیمات قرعه‌کشی
   ───────────────────────────────────────────── */

const LOTTERY_CONFIG = {
    // تاریخ‌ها
    startDate: '2026-09-06',  // ۱۵ شهریور ۱۴۰۵
    endDate: '2026-12-21',    // ۳۰ آذر ۱۴۰۵
    
    // قانون هر ۱۰۰ نفر
    prizePerParticipants: 100,
    
    // تعداد پایه
    baseParticipants: 12458,
    baseTodayPurchases: 892,
    
    // فاصله زمانی اسلایدها (میلی‌ثانیه)
    slideInterval: 3000,
    
    // ارزش کل جوایز
    totalPrizesValue: '۵۰ میلیارد',
    
    // شانس برنده شدن
    winningChance: '۱ از ۱۰۰'
};

/* ─────────────────────────────────────────────
   ۲. دیتابیس محلی
   ───────────────────────────────────────────── */

let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
let phoneNumbers = JSON.parse(localStorage.getItem('phoneNumbers')) || [];

/* ─────────────────────────────────────────────
   ۳. سیستم اسلایدی
   ───────────────────────────────────────────── */

function startSlideshow(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const slides = container.querySelectorAll('.glass-card');
    if (slides.length === 0) return;
    
    let currentIndex = 0;
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });
    }
    
    showSlide(0);
    
    setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }, LOTTERY_CONFIG.slideInterval);
}

/* ─────────────────────────────────────────────
   ۴. تایمر معکوس
   ───────────────────────────────────────────── */

function startCountdown() {
    const endDate = new Date(LOTTERY_CONFIG.endDate);
    endDate.setHours(23, 59, 59, 0);
    
    function updateCountdown() {
        const now = new Date();
        const diff = endDate - now;
        
        if (diff <= 0) {
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
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/[0-9]/g, function(digit) {
        return persianDigits[parseInt(digit)];
    });
}

/* ─────────────────────────────────────────────
   ۵. آمار زنده
   ───────────────────────────────────────────── */

function updateLiveStats() {
    const randomIncrease = Math.floor(Math.random() * 5);
    const currentParticipants = LOTTERY_CONFIG.baseParticipants + randomIncrease;
    const currentPurchases = LOTTERY_CONFIG.baseTodayPurchases + Math.floor(randomIncrease / 2);
    const currentPrizes = Math.floor(currentParticipants / LOTTERY_CONFIG.prizePerParticipants);
    
    const participantsEl = document.getElementById('participantsCount');
    const purchasesEl = document.getElementById('todayPurchases');
    const prizesEl = document.getElementById('prizesCount');
    
    if (participantsEl) {
        participantsEl.textContent = formatNumber(currentParticipants);
    }
    if (purchasesEl) {
        purchasesEl.textContent = formatNumber(currentPurchases);
    }
    if (prizesEl) {
        prizesEl.textContent = formatNumber(currentPrizes);
    }
}

/* ─────────────────────────────────────────────
   ۶. چک شانس
   ───────────────────────────────────────────── */

function checkLuck() {
    const phoneInput = document.getElementById('phoneInput');
    const phone = phoneInput.value.trim();
    
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone) {
        alert('لطفاً شماره موبایل صحیح وارد کنید');
        return;
    }
    
    const faPhone = toPersianDigits(normalizedPhone);
    const hasPurchased = purchases.some(p => p.phone === normalizedPhone);
    
    let resultHTML;
    
    if (hasPurchased) {
        const userPurchases = purchases.filter(p => p.phone === normalizedPhone);
        const totalChances = userPurchases.length * 2;
        
        resultHTML = `
            <div style="text-align: center;">
                <p style="font-size: 18px; margin-bottom: 10px;">✅ سیستم شما رو شناخت!</p>
                <p style="font-size: 16px; margin: 8px 0;">📱 شماره: ${faPhone}</p>
                <p style="font-size: 16px; margin: 8px 0;">🎫 تعداد شانس: ${toPersianDigits(totalChances.toString())} عدد</p>
                <p style="font-size: 14px; margin: 8px 0; color: #00B894;">وضعیت: ثبت شده ✅</p>
                <button onclick="goToProducts()" style="
                    width: 100%;
                    padding: 12px;
                    background: #6C5CE7;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-family: inherit;
                    margin-top: 15px;
                ">🛒 خرید بیشتر برای شانس بیشتر!</button>
            </div>
        `;
    } else {
        resultHTML = `
            <div style="text-align: center;">
                <p style="font-size: 18px; margin-bottom: 10px;">✅ سیستم درست کار میکنه!</p>
                <p style="font-size: 16px; margin: 8px 0;">📱 شماره: ${faPhone}</p>
                <p style="font-size: 16px; margin: 8px 0;">🎫 تعداد شانس: ۰ عدد</p>
                <p style="font-size: 14px; margin: 8px 0; color: #E17055;">وضعیت: هنوز ثبت نشده ❌</p>
                <button onclick="goToProducts()" style="
                    width: 100%;
                    padding: 12px;
                    background: #00B894;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-family: inherit;
                    margin-top: 15px;
                ">💡 با خرید، شانس بگیر!</button>
            </div>
        `;
    }
    
    const resultDiv = document.getElementById('luckResult');
    resultDiv.innerHTML = resultHTML;
    resultDiv.classList.remove('hidden');
    
    if (!phoneNumbers.includes(normalizedPhone)) {
        phoneNumbers.push(normalizedPhone);
        localStorage.setItem('phoneNumbers', JSON.stringify(phoneNumbers));
    }
}

/* ─────────────────────────────────────────────
   ۷. نرمال‌سازی شماره موبایل
   ───────────────────────────────────────────── */

function normalizePhone(phone) {
    let digits = phone.replace(/\D/g, '');
    
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    for (let i = 0; i < 10; i++) {
        digits = digits.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
    }
    
    if (digits.startsWith('0098')) {
        digits = digits.substring(4);
    } else if (digits.startsWith('98')) {
        digits = digits.substring(2);
    } else if (digits.startsWith('0')) {
        digits = digits.substring(1);
    }
    
    const phoneRegex = /^9\d{9}$/;
    
    if (phoneRegex.test(digits)) {
        return '0' + digits;
    }
    
    return null;
}

/* ─────────────────────────────────────────────
   ۸. تبدیل به ارقام فارسی
   ───────────────────────────────────────────── */

function toPersianDigits(str) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.replace(/[0-9]/g, function(digit) {
        return persianDigits[parseInt(digit)];
    });
}

/* ─────────────────────────────────────────────
   ۹. ناوبری
   ───────────────────────────────────────────── */

function goToProducts() {
    document.querySelector('.products-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

/* ─────────────────────────────────────────────
   ۱۰. خرید محصول
   ───────────────────────────────────────────── */

function buyProduct(productName, price) {
    const phone = prompt('📱 شماره موبایلت رو وارد کن:');
    
    if (!phone) return;
    
    const normalizedPhone = normalizePhone(phone);
    
    if (!normalizedPhone) {
        alert('لطفاً شماره موبایل صحیح وارد کنید');
        return;
    }
    
    const purchase = {
        id: generatePurchaseId(),
        phone: normalizedPhone,
        product: productName,
        amount: price,
        date: new Date().toISOString(),
        lotteryNumber: generateLotteryNumber()
    };
    
    purchases.push(purchase);
    localStorage.setItem('purchases', JSON.stringify(purchases));
    
    if (!phoneNumbers.includes(normalizedPhone)) {
        phoneNumbers.push(normalizedPhone);
        localStorage.setItem('phoneNumbers', JSON.stringify(phoneNumbers));
    }
    
    showSuccessPage(purchase);
}

/* ─────────────────────────────────────────────
   ۱۱. تولید شناسه‌ها
   ───────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────
   ۱۲. نمایش صفحه موفقیت
   ───────────────────────────────────────────── */

function showSuccessPage(purchase) {
    const faPhone = toPersianDigits(purchase.phone);
    const faAmount = toPersianDigits(purchase.amount.toString());
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.85);
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
            padding: 25px;
            max-width: 380px;
            width: 100%;
            text-align: center;
        ">
            <div style="font-size: 56px; margin-bottom: 15px;">🎉</div>
            <h2 style="font-size: 22px; margin-bottom: 15px; color: #00B894;">خرید با موفقیت ثبت شد!</h2>
            
            <div style="
                background: #F8F9FA;
                border-radius: 10px;
                padding: 15px;
                text-align: right;
                margin: 15px 0;
            ">
                <p style="margin: 8px 0; font-size: 14px;"><strong>📦 محصول:</strong> ${purchase.product}</p>
                <p style="margin: 8px 0; font-size: 14px;"><strong>💰 مبلغ:</strong> ${faAmount} تومان</p>
                <p style="margin: 8px 0; font-size: 14px;"><strong>🔢 شماره خرید:</strong> ${purchase.id}</p>
                <p style="margin: 8px 0; font-size: 14px;"><strong>📅 تاریخ:</strong> ${new Date().toLocaleDateString('fa-IR')}</p>
                <hr style="margin: 10px 0; border: 1px solid #E0E0E0;">
                <p style="margin: 8px 0; font-size: 14px;"><strong>🎫 کد شرکت:</strong> ${purchase.lotteryNumber}</p>
                <p style="margin: 8px 0; font-size: 14px;"><strong>📊 شانس شما:</strong> ۲ عدد</p>
                <p style="margin: 8px 0; font-size: 14px;"><strong>📱 شماره:</strong> ${faPhone}</p>
                <p style="margin: 8px 0; font-size: 14px; color: #00B894;"><strong>وضعیت:</strong> ثبت قطعی شد ✅</p>
            </div>
            
            <button onclick="downloadProduct('${purchase.product}')" style="
                width: 100%;
                padding: 14px;
                background: #6C5CE7;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                margin-top: 10px;
                font-family: inherit;
                font-weight: bold;
            ">📥 دانلود محصول</button>
            
            <p style="
                font-size: 11px;
                color: #636E72;
                margin-top: 15px;
            ">این اطلاعات رو ذخیره کن! روز قرعه‌کشی (۳۰ آذر) با همین کد برنده اعلام میشه.</p>
            
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

/* ─────────────────────────────────────────────
   ۱۳. دانلود محصول
   ───────────────────────────────────────────── */

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
        alert('📥 لینک دانلود به زودی فعال میشه!');
    }
}

/* ─────────────────────────────────────────────
   ۱۴. قوانین
   ───────────────────────────────────────────── */

function showRules() {
    document.getElementById('rulesModal').classList.remove('hidden');
}

function closeRules() {
    document.getElementById('rulesModal').classList.add('hidden');
}

/* ─────────────────────────────────────────────
   ۱۵. اجرای اولیه
   ───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function() {
    // شروع اسلایدهای جوایز
    startSlideshow('prizesSlider');
    
    // شروع اسلایدهای اطلاعات
    startSlideshow('statsSlider');
    
    // شروع تایمر
    startCountdown();
    
    // آمار زنده
    updateLiveStats();
    setInterval(updateLiveStats, 10000);
    
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

/* ═══════════════════════════════════════════
   پایان منطق سایت 🎯
   ═══════════════════════════════════════════ */
