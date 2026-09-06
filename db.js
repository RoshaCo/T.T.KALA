// =========================================================
// T.T.KALAA - اتصال به PostgreSQL
// =========================================================

"use strict";

require("dotenv").config();

const { Pool } = require("pg");

/*
  اطلاعات اتصال فقط از Environment خوانده می‌شود.
  رمز دیتابیس نباید داخل کد یا GitHub قرار بگیرد.
*/

if (!process.env.DATABASE_URL) {
  console.warn(
    "WARNING: DATABASE_URL تنظیم نشده است."
  );
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,

  max: Number(
    process.env.DB_POOL_MAX || 10
  ),

  idleTimeoutMillis: Number(
    process.env.DB_IDLE_TIMEOUT || 30000
  ),

  connectionTimeoutMillis: Number(
    process.env.DB_CONNECTION_TIMEOUT || 10000
  )
};

/*
  در صورت استفاده از دیتابیس‌های ابری که SSL لازم دارند،
  DATABASE_SSL=true قرار داده شود.
*/
if (
  String(process.env.DATABASE_SSL).toLowerCase() ===
  "true"
) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

/* =========================================================
   مدیریت خطاهای اتصال
   ========================================================= */

pool.on("error", function (error) {
  console.error(
    "Unexpected PostgreSQL pool error:",
    error
  );
});

/* =========================================================
   تست اتصال
   ========================================================= */

async function testConnection() {
  const client = await pool.connect();

  try {
    const result = await client.query(
      "SELECT NOW() AS server_time"
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

/* =========================================================
   اجرای Query
   ========================================================= */

async function query(text, params) {
  return pool.query(
    text,
    params
  );
}

/* =========================================================
   دریافت Client برای Transaction
   ========================================================= */

async function getClient() {
  return pool.connect();
}

/* =========================================================
   Transaction
   ========================================================= */

async function transaction(callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result =
      await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Rollback error:",
        rollbackError
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

/* =========================================================
   بستن Pool
   ========================================================= */

async function close() {
  await pool.end();
}

/* =========================================================
   خروجی عمومی
   ========================================================= */

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection,
  close
};
