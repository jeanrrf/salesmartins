import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Tabs, Tab, Dropdown } from 'react-bootstrap';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import styled from 'styled-components';
import { statsService } from '../../services/api';
import { formatCurrency, formatPercent, getTrendColor, getTrendIcon, calculatePercentageDifference } from '../../utils/helper';
import LoadingSpinner from '../../components/LoadingSpinner';

// Registre os componentes necessários do Chart.js
Chart.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend
);

const PageTitle = styled.h1`
  margin: 2rem 0;
  color: var(--primary-color);
  position: relative;
  display: inline-block;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 60px;
    height: 4px;
    background-color: var(--accent-color);
  }
`;

const StatsCard = styled(Card)`
  margin-bottom: 1.5rem;
  border: none;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    background-color: var(--primary-color);
    color: white;
    font-weight: 600;
    padding: 0.75rem 1rem;
  }
  
  .stat-value {
    font-size: 1.8rem;
    font-weight: bold;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
  }
  
  .stat-change {
    font-size: 0.9rem;
    
    &.positive {
      color: #28a745;
    }
    
    &.negative {
      color: #dc3545;
    }
  }
`;

const ChartCard = styled(Card)`
  margin-bottom: 2rem;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  
  .card-header {
    background-color: white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    font-weight: 600;
  }
`;

const ProductTable = styled(Table)`
  font-size: 0.9rem;
  
  th {
    font-weight: 600;
  }
  
  .product-name {
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .trend-up {
    color: #28a745;
  }
  
  .trend-down {
    color: #dc3545;
  }
`;

const FilterBar = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
`;

const ExportButton = styled(Button)`
  margin-left: 1rem;
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  
  &:hover {
    background-color: var(--secondary-color-dark);
    border-color: var(--secondary-color-dark);
  }
`;

const DateRangePicker = styled.div`
  display: flex;
  gap: 10px;
  
  input {
    font-size: 0.9rem;
  }
`;

const PerformanceAnalysis = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [affiliateLinks, setAffiliateLinks] = useState([]);
  const [selectedLinkId, setSelectedLinkId] = useState('all');
  const [stats, setStats] = useState({
    clicks: 0,
    clicksTrend: 0,
    conversions: 0,
    conversionsTrend: 0,
    revenue: 0,
    revenueTrend: 0,
    conversionRate: 0
  });
  const [products, setProducts] = useState([]);
  const [chartData, setChartData] = useState({
    clicks: { labels: [], data: [] },
    conversions: { labels: [], data: [] },
    revenue: { labels: [], data: [] },
    categories: { labels: [], data: [] }
  });
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchStats = useCallback(async (range, linkId) => {
    setLoading(true);
    setError(null);

    try {
      const params = { 
        dateRange: useCustomDateRange ? 'custom' : range,
        linkId: linkId !== 'all' ? linkId : undefined
      };
      
      if (useCustomDateRange) {
        params.startDate = customDateRange.startDate;
        params.endDate = customDateRange.endDate;
      }
      
      const { data } = await statsService.getStatsByDateRange(params);
      
      setStats({
        clicks: data.summary.clicks.current,
        clicksTrend: calculatePercentageDifference(data.summary.clicks.current, data.summary.clicks.previous),
        conversions: data.summary.conversions.current,
        conversionsTrend: calculatePercentageDifference(data.summary.conversions.current, data.summary.conversions.previous),
        revenue: data.summary.revenue.current,
        revenueTrend: calculatePercentageDifference(data.summary.revenue.current, data.summary.revenue.previous),
        conversionRate: data.summary.clicks.current > 0 ? 
          (data.summary.conversions.current / data.summary.clicks.current) * 100 : 0
      });
      
      setChartData({
        clicks: {
          labels: data.timeSeries.map(item => item.date),
          data: data.timeSeries.map(item => item.clicks)
        },
        conversions: {
          labels: data.timeSeries.map(item => item.date),
          data: data.timeSeries.map(item => item.conversions)
        },
        revenue: {
          labels: data.timeSeries.map(item => item.date),
          data: data.timeSeries.map(item => item.revenue)
        },
        categories: {
          labels: data.categories.map(item => item.name),
          data: data.categories.map(item => item.revenue)
        }
      });
      
      const productsResponse = await statsService.getTopProducts(params);
      setProducts(productsResponse.data);
      
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      setError('Não foi possível carregar os dados de estatísticas.');
    } finally {
      setLoading(false);
    }
  }, [useCustomDateRange, customDateRange.startDate, customDateRange.endDate]);
  
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data } = await statsService.getLinksList();
        setAffiliateLinks([{ id: 'all', name: 'Todos os links' }, ...data]);
      } catch (err) {
        console.error('Erro ao buscar links:', err);
        setError('Não foi possível carregar a lista de links de afiliados.');
      }
    };

    fetchLinks();
    fetchStats(dateRange, selectedLinkId);
  }, [dateRange, fetchStats, selectedLinkId]);
  
  const handleDateRangeChange = (e) => {
    const newRange = e.target.value;
    setDateRange(newRange);
    setUseCustomDateRange(newRange === 'custom');
    fetchStats(newRange, selectedLinkId);
  };
  
  const handleLinkChange = (e) => {
    const newLinkId = e.target.value;
    setSelectedLinkId(newLinkId);
    fetchStats(dateRange, newLinkId);
  };
  
  const handleCustomDateChange = (e) => {
    setCustomDateRange({
      ...customDateRange,
      [e.target.name]: e.target.value
    });
  };
  
  const exportToCSV = () => {
    const headers = [
      'Data',
      'Cliques',
      'Conversões',
      'Receita (R$)',
      'Taxa de Conversão (%)'
    ].join(',');

    const dataRows = chartData.clicks.labels.map((date, index) => {
      const clicks = chartData.clicks.data[index] || 0;
      const conversions = chartData.conversions.data[index] || 0;
      const revenue = chartData.revenue.data[index] || 0;
      const convRate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : '0';

      return [
        date,
        clicks,
        conversions,
        revenue.toFixed(2),
        convRate
      ].join(',');
    });

    const csvContent = [headers, ...dataRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `performance-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    alert('Exportação para PDF será implementada em breve!');
  };

  const exportProductsToCSV = () => {
    const headers = [
      'Posição',
      'Produto',
      'Cliques',
      'Conversões',
      'Receita (R$)',
      'Taxa de Conversão (%)',
      'Variação (%)'
    ].join(',');

    const dataRows = products.map((product, index) => {
      const convRate = product.clicks > 0 ? 
        (product.conversions / product.clicks) * 100 : 0;

      return [
        index + 1,
        `"${product.name}"`,
        product.clicks,
        product.conversions,
        product.revenue.toFixed(2),
        convRate.toFixed(2),
        product.changePercent.toFixed(1)
      ].join(',');
    });

    const csvContent = [headers, ...dataRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `product-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clicksData = {
    labels: chartData.clicks.labels,
    datasets: [
      {
        label: 'Cliques',
        data: chartData.clicks.data,
        borderColor: '#2A3990',
        backgroundColor: 'rgba(42, 57, 144, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  const conversionsData = {
    labels: chartData.conversions.labels,
    datasets: [
      {
        label: 'Conversões',
        data: chartData.conversions.data,
        backgroundColor: '#FF5757',
      }
    ]
  };
  
  const revenueByCategory = {
    labels: chartData.categories.labels,
    datasets: [
      {
        data: chartData.categories.data,
        backgroundColor: [
          '#2A3990',
          '#6777c7',
          '#FF5757',
          '#FFC107',
          '#17a2b8',
          '#6c757d',
          '#28a745',
          '#dc3545',
          '#20c997',
          '#fd7e14'
        ]
      }
    ]
  };

  if (error) {
    return (
      <Container className="mt-5">
        <div className="alert alert-danger">{error}</div>
        <Button variant="primary" onClick={() => fetchStats(dateRange, selectedLinkId)}>
          Tentar Novamente
        </Button>
      </Container>
    );
  }
  
  return (
    <Container>
      <PageTitle>Análise de Desempenho</PageTitle>
      
      <FilterBar>
        <Form>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Período</Form.Label>
                <Form.Select 
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  disabled={loading}
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="90d">Últimos 90 dias</option>
                  <option value="1y">Último ano</option>
                  <option value="custom">Período personalizado</option>
                </Form.Select>
              </Form.Group>
              
              {useCustomDateRange && (
                <DateRangePicker className="mt-2">
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={customDateRange.startDate}
                    onChange={handleCustomDateChange}
                  />
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={customDateRange.endDate}
                    onChange={handleCustomDateChange}
                  />
                </DateRangePicker>
              )}
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Link de Afiliado</Form.Label>
                <Form.Select 
                  value={selectedLinkId}
                  onChange={handleLinkChange}
                  disabled={loading}
                >
                  {affiliateLinks.map(link => (
                    <option key={link.id} value={link.id}>
                      {link.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                className="flex-grow-1"
                onClick={() => fetchStats(dateRange, selectedLinkId)}
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Atualizar Dados'}
              </Button>
              
              <Dropdown>
                <Dropdown.Toggle 
                  as={ExportButton} 
                  variant="secondary"
                  disabled={loading || !chartData.clicks.labels.length}
                >
                  Exportar
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={exportToCSV}>
                    Exportar dados de gráficos (CSV)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={exportProductsToCSV}>
                    Exportar dados de produtos (CSV)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={exportToPDF}>
                    Exportar relatório completo (PDF)
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Form>
      </FilterBar>
      
      {loading ? (
        <div className="text-center my-5">
          <LoadingSpinner size="lg" />
          <p className="mt-3">Carregando dados de desempenho...</p>
        </div>
      ) : (
        <>
          <Row>
            <Col md={3}>
              <StatsCard>
                <Card.Header>Total de Cliques</Card.Header>
                <Card.Body>
                  <div className="stat-value">{stats.clicks.toLocaleString()}</div>
                  <div className={`stat-change ${getTrendColor(stats.clicksTrend)}`}>
                    {getTrendIcon(stats.clicksTrend)} {Math.abs(stats.clicksTrend).toFixed(1)}% vs período anterior
                  </div>
                </Card.Body>
              </StatsCard>
            </Col>
            
            <Col md={3}>
              <StatsCard>
                <Card.Header>Conversões</Card.Header>
                <Card.Body>
                  <div className="stat-value">{stats.conversions.toLocaleString()}</div>
                  <div className={`stat-change ${getTrendColor(stats.conversionsTrend)}`}>
                    {getTrendIcon(stats.conversionsTrend)} {Math.abs(stats.conversionsTrend).toFixed(1)}% vs período anterior
                  </div>
                </Card.Body>
              </StatsCard>
            </Col>
            
            <Col md={3}>
              <StatsCard>
                <Card.Header>Receita (R$)</Card.Header>
                <Card.Body>
                  <div className="stat-value">{formatCurrency(stats.revenue)}</div>
                  <div className={`stat-change ${getTrendColor(stats.revenueTrend)}`}>
                    {getTrendIcon(stats.revenueTrend)} {Math.abs(stats.revenueTrend).toFixed(1)}% vs período anterior
                  </div>
                </Card.Body>
              </StatsCard>
            </Col>
            
            <Col md={3}>
              <StatsCard>
                <Card.Header>Taxa de Conversão</Card.Header>
                <Card.Body>
                  <div className="stat-value">{formatPercent(stats.conversionRate)}</div>
                  <div className="stat-change">
                    Média do período selecionado
                  </div>
                </Card.Body>
              </StatsCard>
            </Col>
          </Row>
          
          <Tabs defaultActiveKey="charts" className="mb-4">
            <Tab eventKey="charts" title="Gráficos">
              <Row>
                <Col md={8}>
                  <ChartCard>
                    <Card.Header>Cliques ao Longo do Tempo</Card.Header>
                    <Card.Body style={{ height: '300px' }}>
                      <Line data={clicksData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </Card.Body>
                  </ChartCard>
                </Col>
                
                <Col md={4}>
                  <ChartCard>
                    <Card.Header>Receita por Categoria</Card.Header>
                    <Card.Body style={{ height: '300px' }}>
                      <Pie data={revenueByCategory} options={{ responsive: true, maintainAspectRatio: false }} />
                    </Card.Body>
                  </ChartCard>
                </Col>
                
                <Col md={12}>
                  <ChartCard>
                    <Card.Header>Conversões Diárias</Card.Header>
                    <Card.Body style={{ height: '300px' }}>
                      <Bar data={conversionsData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </Card.Body>
                  </ChartCard>
                </Col>
              </Row>
            </Tab>
            
            <Tab eventKey="products" title="Produtos">
              <ChartCard>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>Desempenho por Produto</div>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={exportProductsToCSV}
                    disabled={products.length === 0}
                  >
                    Exportar Dados
                  </Button>
                </Card.Header>
                <Card.Body>
                  {products.length === 0 ? (
                    <div className="text-center py-4">
                      <p>Nenhum produto encontrado para o período selecionado.</p>
                    </div>
                  ) : (
                    <ProductTable hover responsive>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Produto</th>
                          <th>Cliques</th>
                          <th>Conversões</th>
                          <th>Receita (R$)</th>
                          <th>Taxa Conv.</th>
                          <th>Tendência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, index) => (
                          <tr key={product.id || index}>
                            <td>{index + 1}</td>
                            <td className="product-name" title={product.name}>{product.name}</td>
                            <td>{product.clicks.toLocaleString()}</td>
                            <td>{product.conversions.toLocaleString()}</td>
                            <td>{formatCurrency(product.revenue)}</td>
                            <td>{formatPercent(product.clicks > 0 ? (product.conversions / product.clicks) * 100 : 0)}</td>
                            <td className={getTrendColor(product.trend)}>
                              {getTrendIcon(product.trend)} {Math.abs(product.changePercent).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </ProductTable>
                  )}
                </Card.Body>
              </ChartCard>
            </Tab>
          </Tabs>
        </>
      )}
    </Container>
  );
};

export default PerformanceAnalysis;