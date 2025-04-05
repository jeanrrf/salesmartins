import React, { useState, useEffect } from 'react';
import './TransparentNavbar.css';

class TransparentNavbar {
  constructor() {
    this.navbarVisible = true;
    this.lastScrollY = window.scrollY;
  }

  handleScroll = () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > this.lastScrollY) {
      this.navbarVisible = false; // Esconde a barra ao rolar para baixo
    } else {
      this.navbarVisible = true; // Mostra a barra ao rolar para cima
    }
    this.lastScrollY = currentScrollY;
  };
}

const NavbarComponent = () => {
  const [navbar, setNavbar] = useState(new TransparentNavbar());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      navbar.handleScroll();
      setVisible(navbar.navbarVisible);
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [navbar]);

  return (
    <nav className={`transparent-navbar ${visible ? 'visible' : 'hidden'}`}>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  );
};

export default NavbarComponent;
