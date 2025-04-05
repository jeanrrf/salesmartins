const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const analyticsMiddleware = async (req, res, next) => {
  if (req.user) {
    try {
      await prisma.accessLog.create({
        data: {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          pageUrl: req.originalUrl,
          action: req.method,
          device: req.device?.type || 'unknown',
          browser: req.useragent?.browser || 'unknown',
          platform: req.useragent?.platform || 'unknown'
        }
      });
    } catch (error) {
      console.error('Analytics logging error:', error);
    }
  }
  next();
};

module.exports = analyticsMiddleware;
