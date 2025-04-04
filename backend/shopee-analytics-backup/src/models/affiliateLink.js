const { pool } = require('../config/database');

class AffiliateLink {
  static async findById(id) {
    const [rows] = await pool.promise().query('SELECT * FROM affiliate_links WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await pool.promise().query('SELECT * FROM affiliate_links WHERE user_id = ?', [userId]);
    return rows;
  }

  static async create(linkData) {
    const { user_id, original_url, affiliate_url, name } = linkData;
    
    const [result] = await pool.promise().query(
      'INSERT INTO affiliate_links (user_id, original_url, affiliate_url, name) VALUES (?, ?, ?, ?)',
      [user_id, original_url, affiliate_url, name]
    );
    
    return {
      id: result.insertId,
      user_id,
      original_url,
      affiliate_url,
      name
    };
  }

  static async update(id, linkData) {
    const { name, affiliate_url } = linkData;
    
    await pool.promise().query(
      'UPDATE affiliate_links SET name = ?, affiliate_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, affiliate_url, id]
    );
    
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.promise().query('DELETE FROM affiliate_links WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = AffiliateLink;