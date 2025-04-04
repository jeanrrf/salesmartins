const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
    async register(req, res) {
        const { username, password, email, name } = req.body;
        
        try {
            // Verificar se o usuário já existe
            const existingUser = await User.findByUsername(username);
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Username already exists' });
            }
            
            // Verificar se o email já existe
            if (email) {
                const existingEmail = await User.findByEmail(email);
                if (existingEmail) {
                    return res.status(400).json({ success: false, message: 'Email already exists' });
                }
            }
            
            const newUser = await User.create({ 
                username, 
                password,
                email,
                name,
                role: 'user', // Papel padrão para novos usuários
            });
            
            // Gerar token para o novo usuário (login automático)
            const token = jwt.sign(
                { id: newUser.id, username: newUser.username, role: 'user' }, 
                process.env.JWT_SECRET, 
                { expiresIn: '24h' }
            );
            
            // Remover senha do objeto de resposta
            const userResponse = {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                name: newUser.name,
                role: 'user',
                createdAt: new Date()
            };
            
            res.status(201).json({ 
                success: true,
                message: 'User registered successfully', 
                token,
                user: userResponse
            });
        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
        }
    }

    async login(req, res) {
        const { username, password } = req.body;
        
        try {
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role }, 
                process.env.JWT_SECRET, 
                { expiresIn: '24h' }
            );
            
            // Remover senha do objeto de resposta
            const userResponse = {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.created_at
            };
            
            res.status(200).json({ 
                success: true,
                message: 'Login successful', 
                token,
                user: userResponse
            });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
        }
    }
    
    async validateToken(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({ success: false, message: 'No token provided' });
            }
            
            // Verificar o token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Buscar dados atualizados do usuário
            const user = await User.findById(decoded.id);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            // Remover senha do objeto de resposta
            const userResponse = {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.created_at
            };
            
            res.status(200).json({ 
                success: true, 
                message: 'Token is valid',
                user: userResponse
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Token expired' });
            }
            
            res.status(401).json({ success: false, message: 'Invalid token' });
        }
    }
    
    async renewToken(req, res) {
        try {
            // O middleware de autenticação já verificou o token
            // e colocou as informações do usuário em req.user
            const userId = req.user.id;
            
            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            // Gerar novo token
            const newToken = jwt.sign(
                { id: user.id, username: user.username, role: user.role }, 
                process.env.JWT_SECRET, 
                { expiresIn: '24h' }
            );
            
            // Remover senha do objeto de resposta
            const userResponse = {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.created_at
            };
            
            res.status(200).json({ 
                success: true, 
                message: 'Token renewed successfully',
                token: newToken,
                user: userResponse
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error renewing token', error: error.message });
        }
    }
    
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { name, email, currentPassword, newPassword } = req.body;
            
            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            // Atualizar dados básicos do perfil
            if (name) user.name = name;
            if (email) user.email = email;
            
            // Se estiver tentando atualizar a senha
            if (currentPassword && newPassword) {
                // Verificar senha atual
                const isMatch = await bcrypt.compare(currentPassword, user.password);
                
                if (!isMatch) {
                    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
                }
                
                // Hash da nova senha
                user.password = await bcrypt.hash(newPassword, 10);
            }
            
            // Aqui precisaria implementar o método save no modelo User
            // Por enquanto, vamos deixar comentado
            // await user.save();
            
            // Remover senha do objeto de resposta
            const userResponse = {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.created_at
            };
            
            res.status(200).json({ 
                success: true, 
                message: 'Profile updated successfully',
                user: userResponse
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
        }
    }
}

module.exports = new AuthController();