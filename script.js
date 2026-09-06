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
        document.getElementById
