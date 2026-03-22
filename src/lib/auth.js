const { pool } = require('./mysql');

async function findByEmailAndPassword(email, password) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const [rows] = await pool.execute(
    `SELECT p.*, u.first_name
     FROM BrandWaiUserProfile p
     LEFT JOIN BrandWaiUsers u ON p.user_id = u.id
     WHERE p.email = ? AND p.password = ?
     LIMIT 1`,
    [normalizedEmail, password]
  );
  if (!rows || rows.length === 0) return null;
  const { password: _, ...profile } = rows[0];
  return profile;
}

module.exports = { findByEmailAndPassword };
