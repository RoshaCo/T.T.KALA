// =========================================================
// T.T.KALAA - مدیریت دوره قرعه‌کشی
// =========================================================

"use strict";

const db = require("./db");

/* =========================================================
   دریافت دوره جاری
   ========================================================= */

async function getCurrentCampaign() {
  const result = await db.query(`
    SELECT
      id,
      title,
      status,
      start_at,
      end_at,
      created_at,
      updated_at
    FROM campaigns
    WHERE status = 'ACTIVE'
      AND start_at <= NOW()
      AND end_at > NOW()
    ORDER BY start_at DESC
    LIMIT 1
  `);

  return result.rows[0] || null;
}

/* =========================================================
   دریافت دوره با شناسه
   ========================================================= */

async function getCampaignById(campaignId) {
  if (!campaignId) {
    return null;
  }

  const result = await db.query(
    `
      SELECT
        id,
        title,
        status,
        start_at,
        end_at,
        created_at,
        updated_at
      FROM campaigns
      WHERE id = $1
      LIMIT 1
    `,
    [campaignId]
  );

  return result.rows[0] || null;
}

/* =========================================================
   بررسی فعال بودن دوره
   ========================================================= */

async function isCampaignActive(campaignId) {
  const campaign =
    await getCampaignById(campaignId);

  if (!campaign) {
    return false;
  }

  if (campaign.status !== "ACTIVE") {
    return false;
  }

  const now = Date.now();

  const start =
    new Date(campaign.start_at).getTime();

  const end =
    new Date(campaign.end_at).getTime();

  return (
    now >= start &&
    now < end
  );
}

/* =========================================================
   دریافت دوره جاری با اطلاعات کامل
   ========================================================= */

async function getCurrentCampaignWithStats() {
  const campaign =
    await getCurrentCampaign();

  if (!campaign) {
    return null;
  }

  const statsResult =
    await db.query(
      `
        SELECT
          COALESCE(
            SUM(purchase_count),
            0
          ) AS total_purchases,

          COALESCE(
            SUM(participant_count),
            0
          ) AS total_participants
        FROM campaign_daily_stats
        WHERE campaign_id = $1
      `,
      [campaign.id]
    );

  const stats =
    statsResult.rows[0] || {};

  return {
    ...campaign,

    totalPurchases:
      Number(stats.total_purchases || 0),

    totalParticipants:
      Number(stats.total_participants || 0)
  };
}

/* =========================================================
   ایجاد دوره جدید
   ========================================================= */

async function createCampaign({
  title,
  startAt,
  endAt
}) {
  if (!title) {
    throw new Error(
      "Campaign title is required"
    );
  }

  if (!startAt || !endAt) {
    throw new Error(
      "Campaign dates are required"
    );
  }

  const start =
    new Date(startAt);

  const end =
    new Date(endAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error(
      "Invalid campaign dates"
    );
  }

  if (end <= start) {
    throw new Error(
      "Campaign end must be after start"
    );
  }

  const result =
    await db.query(
      `
        INSERT INTO campaigns (
          title,
          status,
          start_at,
          end_at
        )
        VALUES (
          $1,
          'DRAFT',
          $2,
          $3
        )
        RETURNING
          id,
          title,
          status,
          start_at,
          end_at,
          created_at
      `,
      [
        title,
        start.toISOString(),
        end.toISOString()
      ]
    );

  return result.rows[0];
}

/* =========================================================
   فعال کردن دوره
   ========================================================= */

async function activateCampaign(
  campaignId
) {
  if (!campaignId) {
    throw new Error(
      "Campaign ID is required"
    );
  }

  return db.transaction(
    async function (client) {
      /*
        در هر لحظه فقط یک دوره فعال مجاز است.
      */
      await client.query(`
        UPDATE campaigns
        SET
          status = 'ENDED',
          updated_at = NOW()
        WHERE status = 'ACTIVE'
      `);

      const result =
        await client.query(
          `
            UPDATE campaigns
            SET
              status = 'ACTIVE',
              updated_at = NOW()
            WHERE id = $1
            RETURNING
              id,
              title,
              status,
              start_at,
              end_at
          `,
          [campaignId]
        );

      if (!result.rows[0]) {
        throw new Error(
          "Campaign not found"
        );
      }

      return result.rows[0];
    }
  );
}

/* =========================================================
   پایان دادن به دوره
   ========================================================= */

async function endCampaign(
  campaignId
) {
  if (!campaignId) {
    throw new Error(
      "Campaign ID is required"
    );
  }

  const result =
    await db.query(
      `
        UPDATE campaigns
        SET
          status = 'ENDED',
          updated_at = NOW()
        WHERE id = $1
        RETURNING
          id,
          title,
          status,
          start_at,
          end_at
      `,
      [campaignId]
    );

  if (!result.rows[0]) {
    throw new Error(
      "Campaign not found"
    );
  }

  return result.rows[0];
}

/* =========================================================
   دریافت آمار دوره
   ========================================================= */

async function getCampaignStats(
  campaignId
) {
  const result =
    await db.query(
      `
        SELECT
          COALESCE(
            SUM(purchase_count),
            0
          ) AS total_purchases,

          COALESCE(
            SUM(participant_count),
            0
          ) AS total_participants
        FROM campaign_daily_stats
        WHERE campaign_id = $1
      `,
      [campaignId]
    );

  const row =
    result.rows[0] || {};

  return {
    totalPurchases:
      Number(row.total_purchases || 0),

    totalParticipants:
      Number(row.total_participants || 0)
  };
}

/* =========================================================
   خروجی
   ========================================================= */

module.exports = {
  getCurrentCampaign,
  getCampaignById,
  getCurrentCampaignWithStats,
  getCampaignStats,
  isCampaignActive,
  createCampaign,
  activateCampaign,
  endCampaign
};
