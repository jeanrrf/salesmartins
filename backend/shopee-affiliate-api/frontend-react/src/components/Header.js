import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button, Badge } from 'react-bootstrap';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
  const [expanded, setExpanded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <Navbar
      expand="lg"
      variant="dark"
      expanded={expanded}
      className={styles.navbar}
    >
      <Container fluid className="px-4">
        <Navbar.Brand href="/" className={styles.navbarBrand}>
          <span className={styles.logoImage}>SENTINEL Analytics</span>
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(expanded ? false : "expanded")}
          className={styles.navbarToggle}
        />

        <Navbar.Collapse id="basic-navbar-nav" className={styles.navbarCollapse}>
          <Nav className="mx-auto">
            {isAuthenticated && (
              <>
                <NavLink
                  to="/"
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                  onClick={() => setExpanded(false)}
                >
                  Home
                </NavLink>
                <NavLink
                  to="/champion-products"
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                  onClick={() => setExpanded(false)}
                >
                  Produtos Campeões
                </NavLink>
                <NavLink
                  to="/vitrine"
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                  onClick={() => setExpanded(false)}
                >
                  Vitrine
                </NavLink>
                <NavLink
                  to="/performance-analysis"
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                  onClick={() => setExpanded(false)}
                >
                  Análise de Desempenho
                </NavLink>
                <NavLink
                  to="/category-repair"
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                  onClick={() => setExpanded(false)}
                >
                  Reparador de Categorias
                </NavLink>
              </>
            )}
          </Nav>

          <Nav className="d-flex align-items-center">
            {isAuthenticated ? (
              <>
                <div className={styles.notificationIcon}>
                  <i className="fas fa-bell"></i>
                  <Badge pill bg="danger" className={styles.notificationBadge}>3</Badge>
                </div>
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                  onClick={() => setExpanded(false)}
                >
                  <i className="fas fa-user me-1"></i> Perfil
                </NavLink>
                <Button
                  className={styles.loginButton}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                className={styles.loginButton}
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;