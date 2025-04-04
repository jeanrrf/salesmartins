import React from 'react';
import { Container } from 'react-bootstrap';
import styles from './Footer.module.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footerWrapper}>
      <Container>
        <div className={`${styles.footerContent} ${styles.footerContentMobile}`}>
          <p className={styles.copyright}>
            © {year} SENTINNELL Analytics. Todos os direitos reservados.
          </p>
          <div className={`${styles.links} ${styles.linksMobile}`}>
            <a href="/terms" className={styles.link}>
              Termos de Uso
            </a>
            <a href="/privacy" className={styles.link}>
              Política de Privacidade
            </a>
            <a href="/contact" className={styles.link}>
              Contato
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;