const { pool } = require('../config/database');

class UserSettings {
  static async findByUserId(userId) {
    const [rows] = await pool.promise().query('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
    return rows[0];
  }
  
  static async create(settingsData) {
    const { user_id, affiliate_id, default_commission, notification_email, auto_tracking } = settingsData;
    
    const [result] = await pool.promise().query(
      `INSERT INTO user_settings 
      (user_id, affiliate_id, default_commission, notification_email, auto_tracking, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [user_id, affiliate_id, default_commission, notification_email, auto_tracking]
    );
    
    return {
      id: result.insertId,
      user_id,
      affiliate_id,
      default_commission,
      notification_email,
      auto_tracking
    };
  }
  
  static async update(userId, settingsData) {
    const { affiliate_id, default_commission, notification_email, auto_tracking } = settingsData;
    
    // Construir a query dinamicamente baseada nos campos fornecidos
    const updates = [];
    const values = [];
    
    if (affiliate_id !== undefined) {
      updates.push('affiliate_id = ?');
      values.push(affiliate_id);
    }
    
    if (default_commission !== undefined) {
      updates.push('default_commission = ?');
      values.push(default_commission);
    }
    
    if (notification_email !== undefined) {
      updates.push('notification_email = ?');
      values.push(notification_email);
    }
    
    if (auto_tracking !== undefined) {
      updates.push('auto_tracking = ?');
      values.push(auto_tracking);
    }
    
    if (updates.length === 0) {
      return this.findByUserId(userId); // Nada para atualizar
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId); // Para a condição WHERE
    
    await pool.promise().query(
      `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );
    
    return this.findByUserId(userId);
  }
  
  static async getOrCreate(userId) {
    let settings = await this.findByUserId(userId);
    
    if (!settings) {
      // Criar configurações padrão para o usuário
      settings = await this.create({
        user_id: userId,
        affiliate_id: null, // O usuário precisará configurar seu ID de afiliado
        default_commission: 5.0, // Percentual padrão de comissão
        notification_email: false, // Sem notificações por e-mail por padrão
        auto_tracking: true // Rastreamento automático habilitado por padrão
      });
    }
    
    return settings;
  }
}

module.exports = UserSettings;