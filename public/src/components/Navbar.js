/**
 * Navbar Component
 * Renders the global navigation for the project.
 */

export function renderNavbar() {
    const header = document.querySelector('.app-header');
    if (!header) return;

    header.innerHTML = `
    <div class="header-inner">
      <a href="/" class="header-brand">
        <img src="/assets/logo/logo-4.png" alt="Balela Trunfo" style="height: 48px; width: auto; object-fit: contain;">
        <div class="header-text">
          <h1 class="header-title">Balela Trunfo</h1>
          <span class="header-sub">Season Pass</span>
        </div>
      </a>

      <nav class="header-nav">
        <ul class="nav-list">
          <li><a href="/" class="nav-link">Home</a></li>
          <li><a href="/gerador" class="nav-link">Gerador</a></li>
          <li><a href="/galeria" class="nav-link">Galeria</a></li>
          <li><a href="/sobre" class="nav-link">Sobre</a></li>
        </ul>
      </nav>

      <div class="header-actions">
        <!-- Botão Login (visível quando deslogado) -->
        <button class="btn-login" id="btn-show-login">
            <i data-lucide="log-in"></i>
            <span>Entrar</span>
        </button>

        <!-- Perfil do Usuário (visível quando logado) -->
        <div class="user-profile hidden" id="user-profile">
            <div class="user-info">
                <span class="user-email" id="display-user-email">...</span>
                <span class="user-role" id="display-user-role">...</span>
            </div>
            <button class="btn-logout" id="btn-logout" title="Sair">
                <i data-lucide="log-out"></i>
            </button>
        </div>
      </div>

      <button class="menu-toggle" id="menu-toggle" aria-label="Abrir menu">
        <i data-lucide="menu"></i>
      </button>

      <!-- Mobile Menu Overlay -->
      <div class="mobile-menu" id="mobile-menu">
        <div class="mobile-menu-header">
          <img src="/assets/logo/logo-4.png" alt="Logo" style="height: 32px;">
          <button class="btn-close-menu" id="btn-close-menu">
            <i data-lucide="x"></i>
          </button>
        </div>
        <ul class="mobile-nav-list">
          <li><a href="/" class="mobile-nav-link">Home</a></li>
          <li><a href="/gerador" class="mobile-nav-link">Gerador</a></li>
          <li><a href="/galeria" class="mobile-nav-link">Galeria</a></li>
          <li><a href="/sobre" class="mobile-nav-link">Sobre</a></li>
        </ul>
        <div class="mobile-menu-footer">
          <p>Balela Trunfo © 2026</p>
        </div>
      </div>
    </div>
    `;

    // Initialize icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Logic for Mobile Menu
    const menuToggle = header.querySelector('#menu-toggle');
    const closeMenu = header.querySelector('#btn-close-menu');
    const mobileMenu = header.querySelector('#mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            document.body.style.overflow = 'hidden'; // Prevent scroll
        });
    }

    if (closeMenu && mobileMenu) {
        closeMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    }

    // Close menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // Mark active link
    const currentPath = window.location.pathname;
    const navLinks = header.querySelectorAll('.nav-link, .mobile-nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '/' && href === '/index')) {
            link.classList.add('active');
        }
    });
}
