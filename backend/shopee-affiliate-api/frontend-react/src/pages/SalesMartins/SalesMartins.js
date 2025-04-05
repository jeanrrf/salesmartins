import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Form, Spinner } from 'react-bootstrap';
import { 
  FaSearch, FaHome, FaPlay, FaPause, FaPercent, FaTrophy, FaTshirt, FaCouch, FaBaby, FaCar, FaTools
} from 'react-icons/fa';
import axios from 'axios';
import styles from './SalesMartins.module.css';
import ProductCatalog from '../../components/SalesMartins/ProductCatalog';
import SpecialProductsSection from '../../components/SalesMartins/SpecialProductsSection';
import EnhancedProductCard from '../../components/SalesMartins/EnhancedProductCard';
import CategoryList from '../../components/CategoryList';
import promoVideo from '../../assets/videos/promo.mp4';
import heroBackground from '../../assets/images/hero-background.jpg';
import posterImage from '../../assets/images/sales-martins-logo.jpg';

const SalesMartins = () => {
  const [popularCategories, setPopularCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(true);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const productsSectionRef = useRef(null);
  const categoryWrapperRef = useRef(null);

  // Carrega as categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setError(null);

        // Fetch categories directly from the API
        const response = await axios.get('/api/products', {
          params: { categoryOnly: true }
        });

        if (response.data?.success && response.data?.data) {
          // Garantir que as categorias estão no formato esperado e não têm duplicatas
          const categories = response.data.data.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: getCategoryIcon(cat.name) // Adiciona ícones com base no nome da categoria
          }));

          // Eliminar duplicatas com base no ID
          const uniqueCategories = categories.filter(
            (cat, index, self) => index === self.findIndex((c) => c.id === cat.id)
          );

          setPopularCategories(uniqueCategories);
        } else {
          setError('Não foi possível carregar as categorias');
        }
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
        setError('Erro ao carregar categorias. Tente novamente.');
      }
    };

    fetchCategories();
  }, []);

  // Função auxiliar para obter ícone com base no nome da categoria
  const getCategoryIcon = (categoryName) => {
    const name = categoryName ? categoryName.toLowerCase() : '';

    if (name.includes('eletrônico')) return <FaTools />;
    if (name.includes('ferramenta') || name.includes('construção')) return <FaTools />;
    if (name.includes('beleza') || name.includes('cuidado')) return <FaBaby />;
    if (name.includes('casa') || name.includes('decoração')) return <FaCouch />;
    if (name.includes('moda')) return <FaTshirt />;
    if (name.includes('automotivo')) return <FaCar />;

    // Ícone padrão
    return <FaHome />;
  };

  // Carrega a imagem de fundo
  useEffect(() => {
    const img = new Image();
    img.src = heroBackground;
    img.onerror = () => {
      console.warn('Hero background image not found, using fallback styles');
      setBackgroundImageLoaded(false);
    };
    img.onload = () => setBackgroundImageLoaded(true);
  }, []);

  // Carrega produtos com tratamento de erros melhorado
  const fetchProducts = async (categoryId = null) => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (categoryId) {
        params.category = categoryId;
      }

      const response = await axios.get('/api/products', { params });

      if (response.data?.success) {
        setProducts(response.data.data || []);
      } else {
        setError('Não foi possível carregar os produtos');
        setProducts([]);
      }
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError('Erro ao carregar produtos. Tente novamente.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Carrega todos os produtos inicialmente
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      setVideoVisible(!videoVisible);
      if (!isVideoPlaying) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const onVideoEnded = () => {
    setIsVideoPlaying(false);
    setTimeout(() => {
      setVideoVisible(false);
    }, 300);
  };

  const handleCategoryClick = (categoryId) => {
    console.log('Category selected:', categoryId);
    setSelectedCategory(categoryId);
    fetchProducts(categoryId);
    
    setTimeout(() => {
      if (productsSectionRef.current) {
        productsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <header className={styles.header}>
        <Container>
          <div className={styles.headerInner}>
            <div className={styles.logo}>Sales Martins</div>
          </div>
        </Container>
      </header>

      {/* Banner Hero */}
      <div className={styles.heroBanner}>
        <div 
          className={styles.backgroundImage} 
          style={!backgroundImageLoaded ? {
            backgroundColor: '#151515',
            backgroundImage: 'linear-gradient(45deg, #151515 25%, #252525 25%, #252525 50%, #151515 50%, #151515 75%, #252525 75%, #252525 100%)',
            backgroundSize: '10px 10px'
          } : { backgroundImage: `url(${heroBackground})` }}
        ></div>
        
        <div className={styles.contentContainer}>
          <Container>
            <Row className="align-items-center">
              <Col md={7}>
                <h1 className={styles.heroBannerTitle}>
                  Descubra as <span className={styles.highlightText}>Melhores Ofertas</span> da Shopee
                </h1>
                <p className={styles.heroBannerSubtitle}>
                  Produtos com preços imbatíveis e descontos exclusivos para você economizar em suas compras
                </p>
                <div className={styles.heroActions}>
                  <Button 
                    variant="light" 
                    size="lg" 
                    className="me-3 mb-2" 
                    onClick={() => {
                      if (categoryWrapperRef.current) {
                        categoryWrapperRef.current.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    aria-label="Ver ofertas disponíveis"
                  >
                    Ver Ofertas
                  </Button>
                  <Button 
                    variant="outline-light" 
                    size="lg" 
                    className={`mb-2 ${styles.videoButton}`}
                    onClick={toggleVideo}
                    aria-label={isVideoPlaying ? "Pausar vídeo de demonstração" : "Assistir vídeo de demonstração"}
                  >
                    {isVideoPlaying ? <FaPause className="me-2" /> : <FaPlay className="me-2" />}
                    {isVideoPlaying ? 'Pausar Vídeo' : 'Ver Destaques'}
                  </Button>
                </div>
              </Col>
              <Col md={5} className={styles.videoColumn}>
                <div className={`${styles.videoWrapper} ${videoVisible ? styles.videoVisible : ''}`}>
                  <video 
                    ref={videoRef}
                    className={styles.promoVideo}
                    src={promoVideo}
                    poster={posterImage}
                    onEnded={onVideoEnded}
                    onClick={toggleVideo}
                    playsInline
                    aria-label="Vídeo promocional de ofertas"
                  ></video>
                  {!isVideoPlaying && (
                    <div className={styles.videoOverlay} role="button" aria-label="Iniciar vídeo">
                      <div className={styles.playButton}>
                        <FaPlay />
                      </div>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {/* Conteúdo Principal - Categorias laterais e produtos */}
      <Container fluid="lg">
        <div className={styles.mainContentWrapper} ref={categoryWrapperRef}>
          {/* Sidebar com categorias */}
          <CategoryList
            categories={popularCategories}
            selectedCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
          />

          {/* Área principal de conteúdo */}
          <main className={styles.productsContentArea}>
            {/* Search bar */}
            <div className={styles.compactSearchContainer}>
              <Form onSubmit={handleSearch} className={styles.compactSearchForm}>
                <Form.Control
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.compactSearchInput}
                  id="productSearch"
                  name="productSearch"
                  aria-label="Busca de produtos"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className={styles.compactSearchButton}
                  aria-label="Buscar"
                >
                  <FaSearch />
                </Button>
              </Form>
            </div>

            {/* Cabeçalho da Categoria */}
            {selectedCategory ? (
              <div className={styles.categoryHeader}>
                <h2 className={styles.categoryTitle}>
                  {popularCategories.find(c => c.id === selectedCategory)?.name || ''}
                </h2>
                <p className={styles.categorySubtitle}>
                  Explore produtos exclusivos desta categoria
                </p>
              </div>
            ) : (
              <>
                {/* Seção de descontos - só aparece quando não há categoria selecionada */}
                <SpecialProductsSection
                  title="Caution Descontos!"
                  icon={<FaPercent />}
                  sectionClass="discountSection"
                  filterParams={{
                    sortBy: 'discount',
                    minDiscount: 20,
                    categoryId: null
                  }}
                  limit={4}
                />
              </>
            )}

            {/* Products Section - Principal catálogo de produtos */}
            <div ref={productsSectionRef}>
              <h2 className={styles.sectionTitle}>
                {selectedCategory
                  ? popularCategories.find(c => c.id === selectedCategory)?.name || ''
                  : 'Produtos Campeões em Economia'}
              </h2>

              {/* Show loading, error, or products */}
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" aria-label="Carregando produtos" />
                  <p className="mt-3">Carregando produtos...</p>
                </div>
              ) : error ? (
                <div className="text-center py-5">
                  <p className="text-danger">{error}</p>
                  <Button
                    variant="outline-primary"
                    onClick={() => fetchProducts(selectedCategory)}
                    aria-label="Tentar carregar produtos novamente"
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-5">
                  <p>Nenhum produto encontrado nesta categoria.</p>
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      setSelectedCategory(null);
                      fetchProducts();
                    }}
                    aria-label="Ver todos os produtos disponíveis"
                  >
                    Ver todos os produtos
                  </Button>
                </div>
              ) : (
                      <ProductCatalog
                        products={products}
                        searchQuery={searchQuery}
                        CardComponent={EnhancedProductCard}
                        cardStyle={{ maxWidth: '220px' }}
                      />
              )}
            </div>

            {/* Seções condicionais com base na categoria selecionada */}
            {selectedCategory ? (
              /* Quando uma categoria está selecionada, mostramos seções filtradas por essa categoria */
              <>
                <SpecialProductsSection
                  title="Melhores Descontos desta Categoria"
                  icon={<FaPercent />}
                  sectionClass="discountSection"
                  filterParams={{
                    sortBy: 'discount',
                    minDiscount: 5,
                    categoryId: selectedCategory
                  }}
                  limit={4}
                />

                <SpecialProductsSection
                  title="Mais Bem Avaliados desta Categoria"
                  icon={<FaTrophy />}
                  sectionClass="topRatedSection"
                  filterParams={{
                    sortBy: 'rating',
                    minRating: 4.0,
                    categoryId: selectedCategory
                  }}
                  limit={4}
                />
              </>
            ) : (
              /* Quando nenhuma categoria está selecionada, mostramos seção de mais bem avaliados geral */
              <SpecialProductsSection
                title="Mais Bem Avaliados"
                icon={<FaTrophy />}
                sectionClass="topRatedSection"
                filterParams={{
                  sortBy: 'rating',
                    minRating: 4.5,
                    categoryId: null
                  }}
                  limit={4}
                />
            )}
          </main>
        </div>
      </Container>

      {/* Footer */}
      <footer className={styles.footer}>
        <Container>
          <div className={styles.footerContent}>
            <p>© {new Date().getFullYear()} Sales Martins. Todos os direitos reservados.</p>
            <p className={styles.poweredBy}>
              Powered by <span className={styles.sentinnelLogo}>SENTINNELL Analytics</span>
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default SalesMartins;
