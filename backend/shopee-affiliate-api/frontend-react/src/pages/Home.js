import React from 'react';
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

// Using public URLs instead of local images
const IMAGES = {
  dashboardPreview: "https://cdn.pixabay.com/photo/2017/02/07/10/33/computer-2045379_1280.jpg",
  featureAnalytics: "https://cdn.pixabay.com/photo/2017/10/22/11/55/online-2877135_1280.jpg",
  featureProducts: "https://cdn.pixabay.com/photo/2016/11/22/19/41/app-1850150_1280.jpg", 
  featureVitrine: "https://cdn.pixabay.com/photo/2016/04/21/13/27/e-commerce-1343032_1280.jpg",
  featureCategory: "https://cdn.pixabay.com/photo/2018/03/15/17/29/business-3228520_1280.jpg"
};

const Home = () => {
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Available";
  };

  return (
    <>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <h1 className={styles.heroTitle}>Maximize seus ganhos com análises avançadas</h1>
              <p className={styles.heroSubtitle}>
                A plataforma completa para afiliados Shopee que desejam aumentar suas conversões
                através de dados precisos e insights acionáveis.
              </p>
              <div>
                <Link to="/performance-analysis">
                  <Button variant="light" size="lg" className="me-3 mb-2">
                    Ver Análises
                  </Button>
                </Link>
                <Link to="/champion-products">
                  <Button variant="outline-light" size="lg" className="mb-2">
                    Produtos Campeões
                  </Button>
                </Link>
                <Link to="/sales-martins">
                  <Button variant="success" size="lg" className="mb-2">
                    Acessar Sales Martins
                  </Button>
                </Link>
              </div>
            </Col>
            <Col lg={6} className="d-flex justify-content-center">
              <img 
                src={IMAGES.dashboardPreview}
                alt="Preview of the analytics dashboard" 
                className={styles.heroImage}
                onError={handleImageError}
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="mb-5">
        <Row className="text-center mb-4">
          <Col>
            <h2 className={styles.sectionTitle}>Nossos Recursos</h2>
            <p className={styles.sectionSubtitle}>Ferramentas poderosas para impulsionar seu sucesso como afiliado</p>
          </Col>
        </Row>

        <Row>
          <Col md={6} lg={3} className="mb-4">
            <Card className={styles.featureCard}>
              <Card.Img 
                variant="top" 
                src={IMAGES.featureAnalytics} 
                alt="Feature analytics"
                onError={handleImageError}
              />
              <Card.Body>
                <Card.Title>Análise Detalhada</Card.Title>
                <Card.Text>
                  Obtenha insights profundos sobre o desempenho dos seus links de afiliado
                  com métricas detalhadas.
                </Card.Text>
                <Link to="/performance-analysis">
                  <Button variant="primary">Explore</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3} className="mb-4">
            <Card className={styles.featureCard}>
              <Card.Img 
                variant="top" 
                src={IMAGES.featureProducts} 
                alt="Feature products"
                onError={handleImageError}
              />
              <Card.Body>
                <Card.Title>Produtos Campeões</Card.Title>
                <Card.Text>
                  Descubra os produtos com maior potencial de conversão baseados em dados reais
                  de vendas.
                </Card.Text>
                <Link to="/champion-products">
                  <Button variant="primary">Descubra</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3} className="mb-4">
            <Card className={styles.featureCard}>
              <Card.Img 
                variant="top" 
                src={IMAGES.featureVitrine} 
                alt="Feature virtual showcase"
                onError={handleImageError}
              />
              <Card.Body>
                <Card.Title>Vitrine Virtual</Card.Title>
                <Card.Text>
                  Crie uma vitrine de produtos personalizada para compartilhar em suas redes
                  sociais.
                </Card.Text>
                <Link to="/vitrine">
                  <Button variant="primary">Crie Agora</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={3} className="mb-4">
            <Card className={styles.featureCard}>
              <Card.Img 
                variant="top" 
                src={IMAGES.featureCategory} 
                alt="Feature category repair"
                onError={handleImageError}
              />
              <Card.Body>
                <Card.Title>Reparo de Categorias</Card.Title>
                <Card.Text>
                  Corrija problemas de categorização e otimize a organização dos seus produtos.
                </Card.Text>
                <Link to="/category-repair">
                  <Button variant="primary">Reparar</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Stats Section */}
      <Container className="mb-5">
        <Row>
          <Col md={3} sm={6}>
            <Card className={styles.statCard}>
              <Card.Body>
                <div className={styles.statValue}>10k+</div>
                <div className={styles.statLabel}>Afiliados Ativos</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3} sm={6}>
            <Card className={styles.statCard}>
              <Card.Body>
                <div className={styles.statValue}>1.5M+</div>
                <div className={styles.statLabel}>Produtos Analisados</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3} sm={6}>
            <Card className={styles.statCard}>
              <Card.Body>
                <div className={styles.statValue}>35%</div>
                <div className={styles.statLabel}>Aumento médio em conversões</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={3} sm={6}>
            <Card className={styles.statCard}>
              <Card.Body>
                <div className={styles.statValue}>24/7</div>
                <div className={styles.statLabel}>Suporte ao Cliente</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Testimonials */}
      <Container className="mb-5">
        <Row className="text-center mb-4">
          <Col>
            <h2 className={styles.sectionTitle}>Depoimentos</h2>
            <p className={styles.sectionSubtitle}>O que nossos usuários dizem sobre a plataforma</p>
          </Col>
        </Row>

        <Carousel className={styles.customCarousel} indicators controls interval={5000}>
          <Carousel.Item>
            <Row>
              <Col md={4} className="mb-4 mb-md-0">
                <Card className={styles.testimonialCard}>
                  <Card.Body>
                    <p className={styles.quote}>
                      A ferramenta de Produtos Campeões me ajudou a duplicar minha renda como afiliado
                      em menos de 3 meses. Melhor investimento que fiz para o meu negócio!
                    </p>
                    <div className="mt-4">
                      <p className={styles.author}>Carlos Silva</p>
                      <p className={styles.position}>Afiliado há 2 anos</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4} className="mb-4 mb-md-0">
                <Card className={styles.testimonialCard}>
                  <Card.Body>
                    <p className={styles.quote}>
                      A análise de desempenho me mostrou exatamente onde meus links não estavam 
                      convertendo e me deu insights para resolver o problema.
                    </p>
                    <div className="mt-4">
                      <p className={styles.author}>Amanda Oliveira</p>
                      <p className={styles.position}>Empreendedora Digital</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className={styles.testimonialCard}>
                  <Card.Body>
                    <p className={styles.quote}>
                      O suporte da equipe SENTINNELL é incrível. Sempre prontos para ajudar e
                      implementam recursos que realmente atendem às nossas necessidades.
                    </p>
                    <div className="mt-4">
                      <p className={styles.author}>Rafael Costa</p>
                      <p className={styles.position}>Influenciador Digital</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Carousel.Item>
          
          <Carousel.Item>
            <Row>
              <Col md={4} className="mb-4 mb-md-0">
                <Card className={styles.testimonialCard}>
                  <Card.Body>
                    <p className={styles.quote}>
                      Nunca imaginei que dados analíticos poderiam fazer tanta diferença. Minha
                      taxa de conversão aumentou 45% no primeiro mês de uso.
                    </p>
                    <div className="mt-4">
                      <p className={styles.author}>Mariana Santos</p>
                      <p className={styles.position}>Blogueira de Moda</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4} className="mb-4 mb-md-0">
                <Card className={styles.testimonialCard}>
                  <Card.Body>
                    <p className={styles.quote}>
                      A funcionalidade de Vitrine transformou a maneira como apresento produtos
                      no meu Instagram. Meus seguidores adoram!
                    </p>
                    <div className="mt-4">
                      <p className={styles.author}>Pedro Mendes</p>
                      <p className={styles.position}>Criador de Conteúdo</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className={styles.testimonialCard}>
                  <Card.Body>
                    <p className={styles.quote}>
                      Descobri produtos nicho de alta conversão que nem imaginava existirem.
                      A plataforma se pagou em menos de uma semana!
                    </p>
                    <div className="mt-4">
                      <p className={styles.author}>Luciana Ferreira</p>
                      <p className={styles.position}>Afiliada Profissional</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Carousel.Item>
        </Carousel>
      </Container>

      {/* CTA Section */}
      <div className={styles.ctaSection}>
        <Container>
          <h2 className={styles.ctaTitle}>Pronto para maximizar seus resultados?</h2>
          <p className="mb-4">
            Comece a usar nossas ferramentas hoje e transforme sua estratégia como afiliado.
          </p>
          <Button className={styles.ctaButton} size="lg">Comece Agora</Button>
        </Container>
      </div>
    </>
  );
};

export default Home;