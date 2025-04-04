const Stats = require('../models/stats');
const AffiliateLink = require('../models/affiliateLink');

class StatsController {
    async getStats(req, res) {
        try {
            // Verificar se o usuário é admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Not authorized to access overall statistics' 
                });
            }

            // Para administradores, recuperar estatísticas gerais
            const { startDate, endDate } = req.query;
            let stats;
            
            if (startDate && endDate) {
                stats = await Stats.findByDate(startDate, endDate);
            } else {
                // Se não houver datas especificadas, buscar todos os registros
                const allStats = await Stats.findByDate('2000-01-01', new Date().toISOString().split('T')[0]);
                
                // Calcular totais
                stats = {
                    totalClicks: allStats.reduce((sum, stat) => sum + stat.clicks, 0),
                    totalConversions: allStats.reduce((sum, stat) => sum + stat.conversions, 0),
                    totalRevenue: allStats.reduce((sum, stat) => sum + stat.revenue, 0),
                    conversionRate: allStats.reduce((sum, stat) => sum + stat.clicks, 0) > 0 
                        ? (allStats.reduce((sum, stat) => sum + stat.conversions, 0) / allStats.reduce((sum, stat) => sum + stat.clicks, 0)) * 100
                        : 0
                };
            }
            
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error retrieving statistics', error: error.message });
        }
    }

    async getUserStats(req, res) {
        try {
            const userId = req.user.id;
            
            // Buscar resumo de estatísticas do usuário
            const summary = await Stats.getSummary(userId);
            
            // Buscar todos os links do usuário
            const userLinks = await AffiliateLink.findByUserId(userId);
            
            // Para cada link, buscar estatísticas detalhadas
            const linksWithStats = await Promise.all(userLinks.map(async (link) => {
                const linkStats = await Stats.findByLinkId(link.id);
                return {
                    ...link,
                    stats: linkStats
                };
            }));
            
            // Calcular taxa de conversão
            const conversionRate = summary.totalClicks > 0
                ? (summary.totalConversions / summary.totalClicks) * 100
                : 0;
            
            const result = {
                summary: {
                    ...summary,
                    conversionRate
                },
                links: linksWithStats
            };
            
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error retrieving user statistics', error: error.message });
        }
    }

    async getStatsByDateRange(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Start date and end date are required' 
                });
            }
            
            // Buscar links do usuário
            const userLinks = await AffiliateLink.findByUserId(userId);
            const linkIds = userLinks.map(link => link.id);
            
            if (linkIds.length === 0) {
                return res.status(200).json({ 
                    success: true, 
                    data: {
                        totalClicks: 0,
                        totalConversions: 0,
                        totalRevenue: 0,
                        conversionRate: 0,
                        dailyStats: []
                    }
                });
            }
            
            // Buscar estatísticas para esses links no período especificado
            const stats = await Stats.findByDateRangeAndLinks(startDate, endDate, linkIds);
            
            // Agrupar estatísticas por dia
            const dailyStats = {};
            stats.forEach(stat => {
                const date = stat.date.toISOString().split('T')[0];
                if (!dailyStats[date]) {
                    dailyStats[date] = {
                        date,
                        clicks: 0,
                        conversions: 0,
                        revenue: 0
                    };
                }
                
                dailyStats[date].clicks += stat.clicks;
                dailyStats[date].conversions += stat.conversions;
                dailyStats[date].revenue += stat.revenue;
            });
            
            // Calcular totais
            const totalClicks = stats.reduce((sum, stat) => sum + stat.clicks, 0);
            const totalConversions = stats.reduce((sum, stat) => sum + stat.conversions, 0);
            const totalRevenue = stats.reduce((sum, stat) => sum + stat.revenue, 0);
            const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
            
            const result = {
                totalClicks,
                totalConversions,
                totalRevenue,
                conversionRate,
                dailyStats: Object.values(dailyStats)
            };
            
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error retrieving statistics by date range', error: error.message });
        }
    }

    async getLinkStats(req, res) {
        try {
            const { linkId } = req.params;
            const userId = req.user.id;
            
            // Verificar se o link pertence ao usuário
            const link = await AffiliateLink.findById(linkId);
            if (!link || link.user_id !== userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Not authorized to access this link statistics' 
                });
            }
            
            const stats = await Stats.findByLinkId(linkId);
            
            // Calcular totais
            const totalClicks = stats.reduce((sum, stat) => sum + stat.clicks, 0);
            const totalConversions = stats.reduce((sum, stat) => sum + stat.conversions, 0);
            const totalRevenue = stats.reduce((sum, stat) => sum + stat.revenue, 0);
            const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
            
            const result = {
                link,
                summary: {
                    totalClicks,
                    totalConversions,
                    totalRevenue,
                    conversionRate
                },
                dailyStats: stats
            };
            
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error retrieving link statistics', error: error.message });
        }
    }

    async getDashboardStats(req, res) {
        try {
            const userId = req.user.id;
            const { period = '30d' } = req.query; // Período padrão: 30 dias
            
            // Calcular data de início com base no período
            const endDate = new Date();
            const startDate = new Date();
            
            switch (period) {
                case '7d':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(startDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(startDate.getDate() - 90);
                    break;
                case '1y':
                    startDate.setFullYear(startDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(startDate.getDate() - 30); // Padrão: 30 dias
            }
            
            // Formatar datas para SQL
            const formattedStartDate = startDate.toISOString().split('T')[0];
            const formattedEndDate = endDate.toISOString().split('T')[0];
            
            // Buscar links do usuário
            const userLinks = await AffiliateLink.findByUserId(userId);
            const linkIds = userLinks.map(link => link.id);
            
            // Buscar estatísticas para o período selecionado
            let stats;
            if (linkIds.length > 0) {
                stats = await Stats.findByDateRangeAndLinks(formattedStartDate, formattedEndDate, linkIds);
            } else {
                stats = [];
            }
            
            // Calcular KPIs
            const totalClicks = stats.reduce((sum, stat) => sum + stat.clicks, 0);
            const totalConversions = stats.reduce((sum, stat) => sum + stat.conversions, 0);
            const totalRevenue = stats.reduce((sum, stat) => sum + stat.revenue, 0);
            const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
            const averageOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;
            
            // Calcular tendência (% de mudança em relação ao período anterior)
            // Para isso, precisamos buscar os dados do período anterior
            const previousStartDate = new Date(startDate);
            const previousEndDate = new Date(startDate);
            
            // Ajustar para o período anterior (mesmo tamanho do período atual)
            const periodDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
            previousStartDate.setDate(previousStartDate.getDate() - periodDays);
            previousEndDate.setDate(previousEndDate.getDate() - 1);
            
            const formattedPreviousStartDate = previousStartDate.toISOString().split('T')[0];
            const formattedPreviousEndDate = previousEndDate.toISOString().split('T')[0];
            
            let previousStats = [];
            if (linkIds.length > 0) {
                previousStats = await Stats.findByDateRangeAndLinks(
                    formattedPreviousStartDate,
                    formattedPreviousEndDate,
                    linkIds
                );
            }
            
            const previousTotalClicks = previousStats.reduce((sum, stat) => sum + stat.clicks, 0);
            const previousTotalConversions = previousStats.reduce((sum, stat) => sum + stat.conversions, 0);
            const previousTotalRevenue = previousStats.reduce((sum, stat) => sum + stat.revenue, 0);
            
            // Calcular tendências (% de mudança)
            const clicksTrend = previousTotalClicks > 0 
                ? ((totalClicks - previousTotalClicks) / previousTotalClicks) * 100 
                : 100; // Se não houver dados anteriores, consideramos como crescimento de 100%
                
            const conversionsTrend = previousTotalConversions > 0 
                ? ((totalConversions - previousTotalConversions) / previousTotalConversions) * 100 
                : 100;
                
            const revenueTrend = previousTotalRevenue > 0 
                ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
                : 100;
            
            // Agrupar dados por dia para gráfico
            const dailyStats = {};
            stats.forEach(stat => {
                const date = stat.date.toISOString().split('T')[0];
                if (!dailyStats[date]) {
                    dailyStats[date] = {
                        date,
                        clicks: 0,
                        conversions: 0,
                        revenue: 0
                    };
                }
                
                dailyStats[date].clicks += stat.clicks;
                dailyStats[date].conversions += stat.conversions;
                dailyStats[date].revenue += stat.revenue;
            });
            
            // Ordenar os dados diários por data
            const chartData = Object.values(dailyStats).sort((a, b) => 
                new Date(a.date) - new Date(b.date)
            );
            
            // Preparar o resultado final
            const dashboardData = {
                summary: {
                    totalLinks: userLinks.length,
                    totalClicks,
                    totalConversions,
                    totalRevenue,
                    conversionRate: parseFloat(conversionRate.toFixed(2)),
                    averageOrderValue: parseFloat(averageOrderValue.toFixed(2))
                },
                trends: {
                    clicks: parseFloat(clicksTrend.toFixed(2)),
                    conversions: parseFloat(conversionsTrend.toFixed(2)),
                    revenue: parseFloat(revenueTrend.toFixed(2))
                },
                chartData,
                period
            };
            
            res.status(200).json({ success: true, data: dashboardData });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error retrieving dashboard statistics', 
                error: error.message 
            });
        }
    }
}

module.exports = new StatsController();