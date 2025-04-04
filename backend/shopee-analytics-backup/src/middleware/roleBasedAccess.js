/**
 * Middleware para controle de acesso baseado em funções (RBAC)
 * Este middleware verifica se o usuário tem o papel necessário para acessar a rota
 */

// Middleware que restringe o acesso apenas aos usuários com papel específico
const restrictTo = (...roles) => {
    return (req, res, next) => {
      // req.user é configurado pelo middleware de autenticação
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para acessar este recurso'
        });
      }
      next();
    };
  };
  
  // Middleware que verifica permissão para a rota Sales Martins (todos os usuários têm acesso)
  const allowSalesMartins = (req, res, next) => {
    // Todos os usuários autenticados podem acessar Sales Martins
    next();
  };
  
  // Verificação de permissões específicas baseadas em operação
  const checkPermission = (operation) => {
    return (req, res, next) => {
      // Admin tem todas as permissões
      if (req.user && req.user.role === 'admin') {
        return next();
      }
  
      // Verificar se o usuário tem a permissão necessária
      switch (operation) {
        case 'viewDashboard':
          // Apenas admin pode ver o dashboard
          if (req.user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Acesso restrito ao dashboard'
            });
          }
          break;
        case 'viewSettings':
          // Apenas admin pode ver configurações avançadas
          if (req.user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Acesso restrito às configurações'
            });
          }
          break;
        default:
          // Permissões não reconhecidas são negadas por padrão
          return res.status(403).json({
            success: false,
            message: 'Permissão não reconhecida'
          });
      }
      
      next();
    };
  };
  
  module.exports = {
    restrictTo,
    allowSalesMartins,
    checkPermission
  };
  