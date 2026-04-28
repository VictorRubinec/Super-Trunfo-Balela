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
        <div class="header-icon-container">
            <i data-lucide="layers"></i>
        </div>
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
        <a href="/recrutamento" class="btn btn-primary btn-sm">
            <i data-lucide="user-plus"></i>
            <span>Recrutamento</span>
        </a>
      </div>
    </div>
    `;

    // Initialize icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Mark active link
    const currentPath = window.location.pathname;
    const navLinks = header.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath || 
           (currentPath === '/' && link.getAttribute('href') === '/index')) {
            link.classList.add('active');
        }
    });
}
