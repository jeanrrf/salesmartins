const UserSettings = require('../models/userSettings');

class SettingsController {
    async getUserSettings(req, res) {
        try {
            const userId = req.user.id;
            
            // Obter configurações do usuário (ou criar se não existir)
            const settings = await UserSettings.getOrCreate(userId);
            
            res.status(200).json({ 
                success: true, 
                data: settings
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error retrieving user settings', 
                error: error.message 
            });
        }
    }
    
    async updateUserSettings(req, res) {
        try {
            const userId = req.user.id;
            const { affiliate_id, default_commission, notification_email, auto_tracking } = req.body;
            
            // Validar commission (se fornecido)
            if (default_commission !== undefined && (default_commission < 0 || default_commission > 100)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Commission percentage must be between 0 and 100' 
                });
            }
            
            // Atualizar configurações do usuário
            const updatedSettings = await UserSettings.update(userId, {
                affiliate_id,
                default_commission,
                notification_email,
                auto_tracking
            });
            
            res.status(200).json({ 
                success: true, 
                message: 'Settings updated successfully',
                data: updatedSettings
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error updating user settings', 
                error: error.message 
            });
        }
    }
    
    async validateAffiliateId(req, res) {
        try {
            const { affiliate_id } = req.body;
            
            if (!affiliate_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Affiliate ID is required' 
                });
            }
            
            // Aqui você pode implementar a lógica para validar o ID de afiliado com a API da Shopee
            // Por exemplo, verificando se o ID existe e está ativo
            
            // Simulando uma validação bem-sucedida
            const isValid = true; // Esta lógica deve ser substituída pela validação real
            
            if (isValid) {
                res.status(200).json({ 
                    success: true, 
                    message: 'Affiliate ID is valid',
                    data: { affiliate_id, valid: true }
                });
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: 'Invalid affiliate ID',
                    data: { affiliate_id, valid: false } 
                });
            }
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error validating affiliate ID', 
                error: error.message 
            });
        }
    }
    
    async getNotificationPreferences(req, res) {
        try {
            const userId = req.user.id;
            
            // Obter configurações do usuário
            const settings = await UserSettings.getOrCreate(userId);
            
            // Extrair preferências de notificação
            const notificationPreferences = {
                email: settings.notification_email,
                // Outras preferências podem ser adicionadas aqui no futuro
            };
            
            res.status(200).json({ 
                success: true, 
                data: notificationPreferences
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error retrieving notification preferences', 
                error: error.message 
            });
        }
    }
}

module.exports = new SettingsController();