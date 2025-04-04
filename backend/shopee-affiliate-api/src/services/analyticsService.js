const AffiliateLink = require('../models/affiliateLink');
const Stats = require('../models/stats');

const analyticsService = {
    getAffiliatePerformance: async (userId) => {
        try {
            const links = await AffiliateLink.find({ userId });
            const stats = await Stats.find({ userId });

            const performanceData = links.map(link => {
                const linkStats = stats.find(stat => stat.linkId === link._id) || {};
                return {
                    linkId: link._id,
                    clicks: linkStats.clicks || 0,
                    conversions: linkStats.conversions || 0,
                    earnings: linkStats.earnings || 0,
                };
            });

            return performanceData;
        } catch (error) {
            throw new Error('Error fetching affiliate performance data: ' + error.message);
        }
    },

    generatePerformanceReport: async (userId) => {
        try {
            const performanceData = await analyticsService.getAffiliatePerformance(userId);
            // Logic to generate a report (e.g., PDF, CSV) can be added here
            return performanceData;
        } catch (error) {
            throw new Error('Error generating performance report: ' + error.message);
        }
    }
};

module.exports = analyticsService;