CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(50) PRIMARY KEY,
  season_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  prize_ratio INTEGER NOT NULL DEFAULT 100,
  chance_per_purchase INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_toman INTEGER NOT NULL DEFAULT 29000,
  image_url TEXT,
  download_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL REFERENCES campaigns(id),
  product_id VARCHAR(100) NOT NULL REFERENCES products(id),
  mobile VARCHAR(20),
  amount_toman INTEGER NOT NULL,
  amount_rial INTEGER NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  authority VARCHAR(255),
  amount_rial INTEGER NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'initiated',
  verify_code INTEGER,
  ref_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  campaign_id VARCHAR(50) NOT NULL REFERENCES campaigns(id),
  product_id VARCHAR(100) NOT NULL REFERENCES products(id),
  mobile VARCHAR(20) NOT NULL,
  chance_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chances (
  id UUID PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL REFERENCES campaigns(id),
  purchase_id UUID NOT NULL UNIQUE REFERENCES purchases(id) ON DELETE CASCADE,
  mobile VARCHAR(20) NOT NULL,
  chance_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(50) NOT NULL REFERENCES campaigns(id),
  title VARCHAR(255) NOT NULL,
  image_url TEXT,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(50) NOT NULL REFERENCES campaigns(id),
  prize_id UUID REFERENCES prizes(id),
  mobile VARCHAR(20),
  chance_id UUID REFERENCES chances(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(50) NOT NULL REFERENCES campaigns(id),
  stat_date DATE NOT NULL,
  purchase_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, stat_date)
);

CREATE TABLE IF NOT EXISTS live_visitor_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(50) REFERENCES campaigns(id),
  slot_key VARCHAR(100) NOT NULL,
  visitor_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, slot_key)
);

CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_mobile
  ON orders(mobile);

CREATE INDEX IF NOT EXISTS idx_orders_campaign
  ON orders(campaign_id);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders(status);

CREATE INDEX IF NOT EXISTS idx_purchases_mobile_campaign
  ON purchases(mobile, campaign_id);

CREATE INDEX IF NOT EXISTS idx_purchases_campaign
  ON purchases(campaign_id);

CREATE INDEX IF NOT EXISTS idx_chances_mobile_campaign
  ON chances(mobile, campaign_id);

CREATE INDEX IF NOT EXISTS idx_chances_campaign
  ON chances(campaign_id);

CREATE INDEX IF NOT EXISTS idx_daily_stats_campaign_date
  ON campaign_daily_stats(campaign_id, stat_date);

INSERT INTO products
  (id, name, description, price_toman, image_url, download_url, sort_order)
VALUES
  (
    'iranian-images',
    'مجموعه تصاویر و پس‌زمینه‌های ایرانی',
    'مجموعه تصاویر و پس‌زمینه‌های ایرانی',
    29000,
    'pic/images.jpg',
    NULL,
    1
  ),
  (
    'iranian-music',
    'مجموعه موسیقی‌های شاهکار هنری 100 سال اخیر ایران',
    'مجموعه موسیقی‌های شاهکار هنری 100 سال اخیر ایران',
    29000,
    'pic/music.jpg',
    NULL,
    2
  ),
  (
    'kids-books',
    'مجموعه E-Book / کتاب‌های کودک و نوجوان',
    'مجموعه کتاب‌های دیجیتال کودک و نوجوان',
    29000,
    'pic/kids.jpg',
    NULL,
    3
  ),
  (
    'adult-books',
    'مجموعه کتاب‌های بزرگسالان',
    'مجموعه کتاب‌های دیجیتال بزرگسالان',
    29000,
    'pic/adult.jpg',
    NULL,
    4
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_toman = EXCLUDED.price_toman,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

INSERT INTO prizes
  (campaign_id, title, image_url, is_main, sort_order)
SELECT
  c.id,
  p.title,
  p.image_url,
  p.is_main,
  p.sort_order
FROM campaigns c
CROSS JOIN (
  VALUES
    ('پژو 206', 'pic/car.jpg', TRUE, 1),
    ('گوشی موبایل', 'pic/phone.jpg', FALSE, 2),
    ('جایزه نقدی 200 میلیون تومان', 'pic/cash.jpg', FALSE, 3),
    ('سکه طلا', 'pic/coin.jpg', FALSE, 4),
    ('ست گردنبند و گوشواره طلا', 'pic/jewelry.jpg', FALSE, 5),
    ('PlayStation 5', 'pic/ps5.jpg', FALSE, 6),
    ('تلویزیون 60 اینچ دوو', 'pic/tv.jpg', FALSE, 7),
    ('سایر جوایز', 'pic/other.jpg', FALSE, 8)
) AS p(title, image_url, is_main, sort_order)
WHERE c.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1
    FROM prizes existing
    WHERE existing.campaign_id = c.id
      AND existing.title = p.title
  );
