import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Form, Spinner } from 'react-bootstrap';
import { 
  FaSearch, FaHome, FaArrowRight, FaArrowLeft, FaPercent, FaTrophy, FaTshirt,
  FaCouch, FaBaby, FaCar, FaTools, FaCommentDots, FaWhatsapp, FaEnvelope
} from 'react-icons/fa';
import axios from 'axios';
import styles from './SalesMartins.module.css';
import ProductCatalog from '../../components/SalesMartins/ProductCatalog';
import SpecialProductsSection from '../../components/SalesMartins/SpecialProductsSection';
import EnhancedProductCard from '../../components/SalesMartins/EnhancedProductCard';
import CategoryList from '../../components/CategoryList';
import heroBackground from '../../assets/images/hero-background.jpg';

const SalesMartins = () => {
  const [popularCategories, setPopularCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [backgroundImageLoaded, setBackgroundImageLoaded] = useState(true);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  
  const slideImages = [
    heroBackground,
    'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  ];

  const productsSectionRef = useRef(null);
  const categoryWrapperRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setError(null);

        const response = await axios.get('/api/products', {
          params: { categoryOnly: true }
        });

        if (response.data?.success && response.data?.data) {
          const categories = response.data.data.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: getCategoryIcon(cat.name)
          }));

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

  const getCategoryIcon = (categoryName) => {
    const name = categoryName ? categoryName.toLowerCase() : '';

    if (name.includes('eletrônico')) return <FaTools />;
    if (name.includes('ferramenta') || name.includes('construção')) return <FaTools />;
    if (name.includes('beleza') || name.includes('cuidado')) return <FaBaby />;
    if (name.includes('casa') || name.includes('decoração')) return <FaCouch />;
    if (name.includes('moda')) return <FaTshirt />;
    if (name.includes('automotivo')) return <FaCar />;

    return <FaHome />;
  };

  useEffect(() => {
    const img = new Image();
    img.src = heroBackground;
    img.onerror = () => {
      console.warn('Hero background image not found, using fallback styles');
      setBackgroundImageLoaded(false);
    };
    img.onload = () => setBackgroundImageLoaded(true);
  }, []);

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

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slideImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slideImages.length]);

  const handleSearch = (e) => {
    e.preventDefault();

    const isActive = searchQuery.trim().length > 0;
    setIsSearchActive(isActive);

    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim() === '') {
      setIsSearchActive(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slideImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? slideImages.length - 1 : prev - 1));
  };

  const toggleContactForm = () => {
    setShowContactForm(!showContactForm);
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
      <header className={styles.header}>
        <Container>
          <div className={styles.headerInner}>
            <div className={styles.logo}>Sales Martins</div>
          </div>
        </Container>
      </header>

      <div className={styles.heroBanner}>
        <div 
          className={styles.backgroundImage} 
          style={{ backgroundImage: `url(${slideImages[currentSlide]})` }}
        ></div>
        
        <button className={styles.sliderButton + ' ' + styles.prevButton} onClick={prevSlide} aria-label="Imagem anterior">
          <FaArrowLeft />
        </button>
        <button className={styles.sliderButton + ' ' + styles.nextButton} onClick={nextSlide} aria-label="Próxima imagem">
          <FaArrowRight />
        </button>

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
                  <div className={styles.contactButtonWrapper}>
                    <Button
                      variant="outline-light"
                      size="lg" 
                      className={`mb-2 ${styles.contactButton}`}
                      onClick={toggleContactForm}
                      aria-label="Entrar em contato"
                    >
                      <FaCommentDots className="me-2" />
                      Fale Conosco
                    </Button>

                    {showContactForm && (
                      <div className={styles.contactOptions}>
                        <div className={styles.contactCard}>
                          <a href="https://wa.me/+5500000000000" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                            <FaWhatsapp className={styles.contactIcon} />
                            <span>WhatsApp</span>
                          </a>
                          <a href="mailto:salesmartins.siaw@gmail.com" className={styles.contactLink}>
                            <FaEnvelope className={styles.contactIcon} />
                            <span>Email</span>
                          </a>
                          <button className={styles.contactCloseButton} onClick={toggleContactForm}>
                            Fechar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Col>
              <Col md={5} className={styles.sliderIndicators}>
                {slideImages.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.sliderDot} ${currentSlide === index ? styles.activeDot : ''}`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Ir para slide ${index + 1}`}
                  />
                ))}
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      <Container fluid>
        <div className={`${styles.mainContentWrapper} ${isSearchActive ? styles.searchActive : ''}`} ref={categoryWrapperRef}>
          <CategoryList
            categories={popularCategories}
            selectedCategory={selectedCategory}
            onCategoryClick={handleCategoryClick}
          />

          <main className={styles.productsContentArea}>
            <div className={styles.compactSearchContainer}>
              <Form onSubmit={handleSearch} className={styles.compactSearchForm}>
                <Form.Control
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
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

            {selectedCategory && !isSearchActive ? (
              <div className={styles.categoryHeader}>
                <h2 className={styles.categoryTitle}>
                  {popularCategories.find(c => c.id === selectedCategory)?.name || ''}
                </h2>
                <p className={styles.categorySubtitle}>
                  Explore produtos exclusivos desta categoria
                </p>
              </div>
            ) : null}

            {isSearchActive && (
              <div className={styles.searchResultsHeader}>
                <h2 className={styles.sectionTitle}>
                  Resultados para "{searchQuery}"
                </h2>
              </div>
            )}

            {!selectedCategory && !isSearchActive && (
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
            )}

            <div ref={productsSectionRef}>
              {!isSearchActive && !selectedCategory && (
                <h2 className={styles.sectionTitle}>
                  Produtos Campeões em Economia
                </h2>
              )}

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

            {!isSearchActive && (
              <>
                {selectedCategory ? (
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
              </>
            )}
          </main>
        </div>
      </Container>

      <footer className={styles.footer}>
        <Container>
          <div className={styles.footerContent}>
            <div className={styles.footerInfo}>
              <p>© {new Date().getFullYear()} Sales Martins. Todos os direitos reservados.</p>
              <p className={styles.contactInfo}>
                <span className={styles.contactItem}>
                  <i className="fas fa-envelope"></i> salesmartins.siaw@gmail.com
                </span>
                <span className={styles.contactItem}>
                  <i className="fas fa-map-marker-alt"></i> Criciuma/SC
                </span>
              </p>
            </div>
            <p className={styles.poweredBy}>
              Powered by <span className={styles.sentinnelLogo}>SENTINNELL IA WORKSPACE</span>
            </p>
          </div>
          <div className={styles.returnMessage}>
            <span>Volte Sempre!</span>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default SalesMartins;
