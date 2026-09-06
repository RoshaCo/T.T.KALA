-- =========================================================
-- T.T.KALAA - PostgreSQL Database Schema
-- =========================================================
-- این فایل ساختار کامل دیتابیس را ایجاد می‌کند.
-- اطلاعات واقعی خرید، پرداخت و شانس قرعه‌کشی در دیتابیس ثبت می‌شود.
-- =========================================================

BEGIN;

-- =========================================================
-- افزونه UUID
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- دوره‌های قرعه‌کشی
-- =========================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title VARCHAR(200) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('DRAFT', 'ACTIVE', 'ENDED')),

    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status
ON campaigns(status);

CREATE INDEX IF NOT EXISTS idx_campaigns_dates
ON campaigns(start_at, end_at);


-- =========================================================
-- محصولات
-- =========================================================

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    price_toman INTEGER NOT NULL DEFAULT 29000,

    price_rial INTEGER NOT NULL DEFAULT 290000,

    image VARCHAR(500),

    download_path VARCHAR(1000),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (price_toman > 0),
    CHECK (price_rial > 0)
);

CREATE INDEX IF NOT EXISTS idx_products_active
ON products(active);


-- =========================================================
-- سفارش‌ها
-- =========================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id UUID NOT NULL
        REFERENCES campaigns(id),

    product_id VARCHAR(100) NOT NULL
        REFERENCES products(id),

    amount_toman INTEGER NOT NULL,

    amount_rial INTEGER NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'PAYMENT_STARTED',
                'PAID',
                'FAILED',
                'CANCELLED',
                'EXPIRED'
            )
        ),

    mobile VARCHAR(11),

    tracking_code VARCHAR(100),

    authority VARCHAR(255),

    payment_reference VARCHAR(255),

    payment_verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        mobile IS NULL
        OR mobile ~ '^09[0-9]{9}$'
    ),

    CHECK (amount_toman > 0),

    CHECK (amount_rial > 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_campaign
ON orders(campaign_id);

CREATE INDEX IF NOT EXISTS idx_orders_product
ON orders(product_id);

CREATE INDEX IF NOT EXISTS idx_orders_mobile
ON orders(mobile);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_authority
ON orders(authority);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders(created_at);


-- =========================================================
-- تراکنش‌های پرداخت
-- =========================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL
        REFERENCES orders(id)
        ON DELETE CASCADE,

    provider VARCHAR(50) NOT NULL DEFAULT 'ZARINPAL',

    authority VARCHAR(255),

    reference_id VARCHAR(255),

    amount_rial INTEGER NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'INITIATED'
        CHECK (
            status IN (
                'INITIATED',
                'REDIRECTED',
                'VERIFIED',
                'FAILED',
                'CANCELLED'
            )
        ),

    request_response JSONB,

    verify_response JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_order
ON payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_authority
ON payments(authority);

CREATE INDEX IF NOT EXISTS idx_payments_reference
ON payments(reference_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_reference
ON payments(reference_id)
WHERE reference_id IS NOT NULL;


-- =========================================================
-- خریدهای موفق
-- =========================================================
-- هر رکورد = یک خرید موفق
-- هر خرید موفق = یک شانس

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL UNIQUE
        REFERENCES orders(id),

    campaign_id UUID NOT NULL
        REFERENCES campaigns(id),

    product_id VARCHAR(100) NOT NULL
        REFERENCES products(id),

    mobile VARCHAR(11) NOT NULL,

    amount_toman INTEGER NOT NULL,

    tracking_code VARCHAR(100) NOT NULL UNIQUE,

    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        mobile ~ '^09[0-9]{9}$'
    )
);

CREATE INDEX IF NOT EXISTS idx_purchases_campaign
ON purchases(campaign_id);

CREATE INDEX IF NOT EXISTS idx_purchases_mobile
ON purchases(mobile);

CREATE INDEX IF NOT EXISTS idx_purchases_campaign_mobile
ON purchases(campaign_id, mobile);

CREATE INDEX IF NOT EXISTS idx_purchases_product
ON purchases(product_id);

CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at
ON purchases(purchased_at);


-- =========================================================
-- شانس‌های قرعه‌کشی
-- =========================================================
-- به ازای هر خرید موفق دقیقاً یک شانس ایجاد می‌شود.
-- شانس همیشه به campaign همان خرید متصل است.
-- بنابراین شانس دوره قبلی به دوره جدید منتقل نمی‌شود.

CREATE TABLE IF NOT EXISTS chances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    purchase_id UUID NOT NULL UNIQUE
        REFERENCES purchases(id)
        ON DELETE CASCADE,

    campaign_id UUID NOT NULL
        REFERENCES campaigns(id),

    mobile VARCHAR(11) NOT NULL,

    chance_number BIGINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        mobile ~ '^09[0-9]{9}$'
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_chances_campaign_number
ON chances(campaign_id, chance_number);

CREATE INDEX IF NOT EXISTS idx_chances_mobile
ON chances(mobile);

CREATE INDEX IF NOT EXISTS idx_chances_campaign_mobile
ON chances(campaign_id, mobile);

CREATE INDEX IF NOT EXISTS idx_chances_purchase
ON chances(purchase_id);


-- =========================================================
-- جوایز هر دوره
-- =========================================================

CREATE TABLE IF NOT EXISTS prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id UUID NOT NULL
        REFERENCES campaigns(id)
        ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,

    image VARCHAR(500),

    is_main BOOLEAN NOT NULL DEFAULT FALSE,

    display_order INTEGER NOT NULL DEFAULT 0,

    quantity INTEGER NOT NULL DEFAULT 1,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_prizes_campaign
ON prizes(campaign_id);

CREATE INDEX IF NOT EXISTS idx_prizes_order
ON prizes(campaign_id, display_order);


-- =========================================================
-- برندگان
-- =========================================================

CREATE TABLE IF NOT EXISTS winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id UUID NOT NULL
        REFERENCES campaigns(id),

    prize_id UUID NOT NULL
        REFERENCES prizes(id),

    chance_id UUID NOT NULL
        REFERENCES chances(id),

    mobile VARCHAR(11) NOT NULL,

    tracking_code VARCHAR(100),

    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        mobile ~ '^09[0-9]{9}$'
    )
);

CREATE INDEX IF NOT EXISTS idx_winners_campaign
ON winners(campaign_id);

CREATE INDEX IF NOT EXISTS idx_winners_mobile
ON winners(mobile);

CREATE UNIQUE INDEX IF NOT EXISTS uq_winner_chance
ON winners(chance_id);


-- =========================================================
-- آمار روزانه
-- =========================================================
-- برای نمایش آمار دوره و خرید روزانه.
-- تاریخ بر اساس تهران در Backend محاسبه و ذخیره می‌شود.

CREATE TABLE IF NOT EXISTS campaign_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id UUID NOT NULL
        REFERENCES campaigns(id)
        ON DELETE CASCADE,

    stat_date DATE NOT NULL,

    purchase_count INTEGER NOT NULL DEFAULT 0,

    participant_count INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(campaign_id, stat_date),

    CHECK (purchase_count >= 0),

    CHECK (participant_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_campaign_date
ON campaign_daily_stats(campaign_id, stat_date);


-- =========================================================
-- بازدیدکنندگان لحظه‌ای
-- =========================================================
-- عددی که به همه کاربران در یک بازه زمانی نمایش داده می‌شود.
-- مقدار واقعی این جدول توسط سرویس Backend مدیریت خواهد شد.

CREATE TABLE IF NOT EXISTS live_visitor_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id UUID
        REFERENCES campaigns(id)
        ON DELETE CASCADE,

    visitor_count INTEGER NOT NULL,

    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    valid_until TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (visitor_count >= 0),

    CHECK (valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_live_visitors_validity
ON live_visitor_stats(valid_from, valid_until);

CREATE INDEX IF NOT EXISTS idx_live_visitors_campaign
ON live_visitor_stats(campaign_id);


-- =========================================================
-- رویدادهای سیستمی
-- =========================================================
-- برای ثبت عملیات حساس مثل پرداخت، ثبت خرید و ثبت شانس.

CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_type VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id VARCHAR(255),

    request_id VARCHAR(255),

    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_events_type
ON system_events(event_type);

CREATE INDEX IF NOT EXISTS idx_system_events_entity
ON system_events(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_system_events_created
ON system_events(created_at);


-- =========================================================
-- محصولات اولیه
-- =========================================================

INSERT INTO products (
    id,
    name,
    description,
    price_toman,
    price_rial,
    image,
    active
)
VALUES
(
    'images',
    'مجموعه تصاویر و پس‌زمینه‌های ایرانی',
    'مجموعه دیجیتال تصاویر و پس‌زمینه‌های ایرانی',
    29000,
    290000,
    'pic/images.jpg',
    TRUE
),
(
    'music',
    'مجموعه موسیقی‌های شاهکار هنری 100 سال اخیر ایران',
    'مجموعه دیجیتال موسیقی‌های منتخب ایرانی',
    29000,
    290000,
    'pic/music.jpg',
    TRUE
),
(
    'kids',
    'مجموعه E-Book کتاب‌های کودک و نوجوان',
    'مجموعه کتاب‌های دیجیتال کودک و نوجوان',
    29000,
    290000,
    'pic/kids.jpg',
    TRUE
),
(
    'adult',
    'مجموعه کتاب‌های بزرگسالان',
    'مجموعه کتاب‌های دیجیتال بزرگسالان',
    29000,
    290000,
    'pic/adult.jpg',
    TRUE
)
ON CONFLICT (id)
DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_toman = EXCLUDED.price_toman,
    price_rial = EXCLUDED.price_rial,
    image = EXCLUDED.image,
    active = EXCLUDED.active,
    updated_at = NOW();


-- =========================================================
-- پایان
-- =========================================================

COMMIT;
