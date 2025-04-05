import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaSearch, FaHome, FaPlay, FaPause, FaPercent, FaTrophy 
} from 'react-icons/fa';
import { affiliateService } from '../../services/api';
import styles from './SalesMartins.module.css';
import ProductCatalog from '../../components/SalesMartins/ProductCatalog';
import SpecialProductsSection from '../../components/SalesMartins/SpecialProductsSection';
import EnhancedProductCard from '../../components/SalesMartins/EnhancedProductCard';
import promoVideo from '../../assets/videos/promo.mp4';
import heroBackground from '../../assets/images/hero-background.jpg';
import posterImage from '../../assets/images/sales-martins-logo.jpg';

const SalesMartins = () => {
  const [popularCategories, setPopularCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(true);
  
  const videoRef = useRef(null);
  const productsSectionRef = useRef(null);
  const categoryWrapperRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await affiliateService.getCategories();
        if (response.data?.data) {
          const categories = response.data.data.map(category => ({
            id: category.category_id,
            name: category.category_name
          }));
          setPopularCategories(categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = heroBackground;
    img.onerror = () => {
      console.warn('Hero background image not found, using fallback styles');
      setBackgroundImageLoaded(false);
    };
    img.onload = () => setBackgroundImageLoaded(true);
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
    
    setTimeout(() => {
      if (productsSectionRef.current) {
        productsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Header com efeito glass black piano */}
      <header className={styles.header}>
        <Container>
          <div className={styles.headerInner}>
            <div className={styles.logo}>Sales Martins</div>
            <div className={styles.headerNav}>
              <Link to="/" className={styles.returnLink}>
                <FaHome className={styles.homeIcon} />
                <span>Voltar ao Dashboard</span>
              </Link>
            </div>
          </div>
        </Container>
      </header>

      {/* Banner Hero com Video */}
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
                  >
                    Ver Ofertas
                  </Button>
                  <Button 
                    variant="outline-light" 
                    size="lg" 
                    className={`mb-2 ${styles.videoButton}`}
                    onClick={toggleVideo}
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
                  ></video>
                  {!isVideoPlaying && (
                    <div className={styles.videoOverlay}>
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

      {/* Categorias em linha com efeito glass */}
      <div className={styles.categoryWrapper} ref={categoryWrapperRef}>
        <Container>
          <div className={styles.categoryList}>
            {popularCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'primary' : 'outline-light'}
                onClick={() => handleCategoryClick(category.id)}
                className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ''}`}
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryName}>{category.name}</span>
              </Button>
            ))}
          </div>
          
          <div className={styles.scrollIndicator}>
            <div className={`${styles.scrollDot} ${styles.active}`}></div>
            <div className={styles.scrollDot}></div>
            <div className={styles.scrollDot}></div>
          </div>
        </Container>
      </div>

      {/* Search Bar */}
      <Container className={styles.searchContainer}>
        <Form onSubmit={handleSearch} className={styles.searchForm}>
          <Form.Control
            type="text"
            placeholder="Buscar produtos com melhor preço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            id="productSearch"
            name="productSearch"
            aria-label="Busca de produtos"
          />
          <Button type="submit" variant="primary" className={styles.searchButton}>
            <FaSearch className="me-2" /> Buscar
          </Button>
        </Form>
      </Container>

      {/* Seção de descontos */}
      <SpecialProductsSection 
        title="Caution Descontos!" 
        icon={<FaPercent />} 
        sectionClass="discountSection"
        filterParams={{
          sortBy: 'discount',
          minDiscount: 20
        }}
        limit={4}
      />

      {/* Products Section */}
      <div ref={productsSectionRef}>
        <Container>
          <h2 className={styles.sectionTitle}>Produtos Campeões em Economia</h2>
          <ProductCatalog 
            categoryId={selectedCategory} 
            searchQuery={searchQuery} 
            CardComponent={EnhancedProductCard}
          />
        </Container>
      </div>

      {/* Seção de mais bem avaliados */}
      <SpecialProductsSection 
        title="Mais Bem Avaliados" 
        icon={<FaTrophy />} 
        sectionClass="topRatedSection"
        filterParams={{
          sortBy: 'rating',
          minRating: 4.5
        }}
        limit={4}
      />

      {/* Footer personalizado */}
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
