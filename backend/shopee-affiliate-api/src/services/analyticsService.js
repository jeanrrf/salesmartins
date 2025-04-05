const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnalyticsService {
  static async logAccess(userId, data) {
    try {
      return await prisma.accessLog.create({
        data: {
          userId,
          ipAddress: data.ip,
          userAgent: data.userAgent,
          pageUrl: data.pageUrl,
          action: data.action,
          device: data.device,
          browser: data.browser,
          platform: data.platform
        }
      });
    } catch (error) {
      console.error('Error logging access:', error);
      throw error;
    }
  }

  static async getUserAnalytics(userId) {
    try {
      return await prisma.accessLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        include: { user: true }
      });
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  }
}

module.exports = AnalyticsService;
