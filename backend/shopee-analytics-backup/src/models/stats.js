const { pool } = require('../config/database');

class Stats {
  static async findByLinkId(linkId) {
    const [rows] = await pool.promise().query('SELECT * FROM stats WHERE link_id = ?', [linkId]);
    return rows;
  }

  static async findByDate(startDate, endDate) {
    const [rows] = await pool.promise().query(
      'SELECT * FROM stats WHERE date BETWEEN ? AND ?',
      [startDate, endDate]
    );
    return rows;
  }

  static async getSummary(userId) {
    const [rows] = await pool.promise().query(
      `SELECT SUM(s.clicks) as totalClicks, SUM(s.conversions) as totalConversions, SUM(s.revenue) as totalRevenue
       FROM stats s
       JOIN affiliate_links a ON s.link_id = a.id
       WHERE a.user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  static async findByDateRangeAndLinks(startDate, endDate, linkIds) {
    // Se não houver links, retorne um array vazio
    if (!linkIds || linkIds.length === 0) {
      return [];
    }
    
    // Cria placeholders para a query IN (?, ?, ...)
    const placeholders = linkIds.map(() => '?').join(',');
    
    const [rows] = await pool.promise().query(
      `SELECT * FROM stats 
       WHERE date BETWEEN ? AND ? 
       AND link_id IN (${placeholders})
       ORDER BY date ASC`,
      [startDate, endDate, ...linkIds]
    );
    
    return rows;
  }

  static async recordClick(linkId) {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await pool.promise().query(
        `INSERT INTO stats (link_id, clicks, date) VALUES (?, 1, ?)
         ON DUPLICATE KEY UPDATE clicks = clicks + 1`,
        [linkId, today]
      );
      return true;
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
      return false;
    }
  }

  static async recordConversion(linkId, revenue) {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      await pool.promise().query(
        `INSERT INTO stats (link_id, conversions, revenue, date) VALUES (?, 1, ?, ?)
         ON DUPLICATE KEY UPDATE conversions = conversions + 1, revenue = revenue + ?`,
        [linkId, revenue, today, revenue]
      );
      return true;
    } catch (error) {
      console.error('Erro ao registrar conversão:', error);
      return false;
    }
  }
}

module.exports = Stats;