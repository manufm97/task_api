// TaskAPI Homepage JavaScript

// Initialize Material Design components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', initialTheme);
    updateThemeIcon(initialTheme);
    forceNavColor(initialTheme);

    var sidenavElems = document.querySelectorAll('.sidenav');
    M.Sidenav.init(sidenavElems, {
        edge: 'left',
        draggable: true
    });

    var tooltipElems = document.querySelectorAll('.tooltipped');
    M.Tooltip.init(tooltipElems);

    var dropdownElems = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(dropdownElems);

    initSmoothScrolling();
    initScrollEffects();
    initEntranceAnimations();
});

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
    forceNavColor(theme);
}

function forceNavColor(theme) {
    const nav = document.querySelector('nav');
    if (nav) {
        nav.style.setProperty('background-color', theme === 'dark' ? '#0d47a1' : '', 'important');
    }
    const footer = document.querySelector('footer.page-footer');
    if (footer) {
        footer.style.setProperty('background-color', theme === 'dark' ? '#0d47a1' : '', 'important');
    }
}

function updateThemeIcon(theme) {
    const btn = document.querySelector('.theme-toggle .material-icons');
    if (btn) {
        btn.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just a hash
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                // Close mobile sidenav if open
                const sidenavInstance = M.Sidenav.getInstance(document.querySelector('.sidenav'));
                if (sidenavInstance && sidenavInstance.isOpen) {
                    sidenavInstance.close();
                }
                
                // Smooth scroll to target
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without triggering scroll
                setTimeout(() => {
                    history.pushState(null, null, href);
                }, 100);
            }
        });
    });
}

// Add scroll effects for navbar
function initScrollEffects() {
    const navbar = document.querySelector('nav');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add shadow to navbar when scrolling
        if (scrollTop > 50) {
            navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Initialize entrance animations
function initEntranceAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe cards and sections
    const animatedElements = document.querySelectorAll('.card, .section');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Function to show API documentation
function showApiDocs() {
    const modalContent = `
        <div id="api-docs-modal" class="modal modal-fixed-footer">
            <div class="modal-content">
                <h4><i class="material-icons left">api</i>Documentación de la API</h4>
                <div class="docs-content">
                    <div class="row">
                        <div class="col s12">
                            <h5>Endpoints Principales</h5>
                            <div class="collection">
                                <div class="collection-item">
                                    <span class="badge green white-text">GET</span>
                                    <strong>/api/tasks</strong><br>
                                    <span class="grey-text">Obtener todas las tareas</span>
                                </div>
                                <div class="collection-item">
                                    <span class="badge blue white-text">POST</span>
                                    <strong>/api/tasks</strong><br>
                                    <span class="grey-text">Crear una nueva tarea</span>
                                </div>
                                <div class="collection-item">
                                    <span class="badge orange white-text">PUT</span>
                                    <strong>/api/tasks/:guid</strong><br>
                                    <span class="grey-text">Actualizar una tarea específica</span>
                                </div>
                                <div class="collection-item">
                                    <span class="badge red white-text">DELETE</span>
                                    <strong>/api/tasks/:guid</strong><br>
                                    <span class="grey-text">Eliminar una tarea específica</span>
                                </div>
                            </div>
                            
                            <h5>Autenticación</h5>
                            <p>La API utiliza JWT (JSON Web Tokens) para autenticación. Incluye el token en el header:</p>
                            <div class="grey lighten-4" style="padding: 15px; border-radius: 4px; margin: 15px 0;">
                                <code>Authorization: Bearer &lt;tu-jwt-token&gt;</code>
                            </div>
                            
                            <h5>Ejemplo de Respuesta</h5>
                            <div class="grey lighten-4" style="padding: 15px; border-radius: 4px; margin: 15px 0;">
                                <pre><code>{
  "id": 1,
  "title": "Ejemplo de tarea",
  "description": "Descripción de la tarea",
  "completed": false,
  "created_at": "2025-06-17T15:30:00Z",
  "updated_at": "2025-06-17T15:30:00Z"
}</code></pre>
                            </div>
                            
                            <div class="row">
                                <div class="col s12 m6">
                                    <div class="card blue-grey lighten-5">
                                        <div class="card-content">
                                            <span class="card-title">Base URL</span>
                                            <code>http://localhost:3000/api</code>
                                        </div>
                                    </div>
                                </div>
                                <div class="col s12 m6">
                                    <div class="card blue-grey lighten-5">
                                        <div class="card-content">
                                            <span class="card-title">Versión</span>
                                            <code>v1.0.0</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <a href="#!" class="modal-close btn blue waves-effect waves-light">
                    <i class="material-icons left">close</i>Cerrar
                </a>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('api-docs-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    const modal = document.getElementById('api-docs-modal');
    const modalInstance = M.Modal.init(modal, {
        dismissible: true,
        opacity: 0.7,
        onOpenStart: function() {
            document.body.classList.add('modal-open');
        },
        onCloseEnd: function() {
            document.body.classList.remove('modal-open');
        }
    });
    
    modalInstance.open();
}

// Function to show README modal with rendered markdown
async function showReadmeModal() {
    const modalEl = document.getElementById('readme-modal');
    const contentEl = document.getElementById('readme-content');
    
    if (!modalEl) return;
    
    let modalInstance = M.Modal.getInstance(modalEl);
    if (!modalInstance) {
        modalInstance = M.Modal.init(modalEl, {
            dismissible: true,
            opacity: 0.7
        });
    }
    
    modalInstance.options.onOpenStart = function() {
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = '0';
        
        var modalContent = modalEl.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.overflow = 'hidden';
            modalContent.style.padding = '0';
        }
    };
    modalInstance.options.onCloseEnd = function() {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    };
    
    contentEl.innerHTML = `
        <div class="center-align" style="padding: 40px;">
            <div class="preloader-wrapper big active">
                <div class="spinner-layer spinner-blue">
                    <div class="circle-clipper left"><div class="circle"></div></div>
                </div>
                <div class="spinner-layer spinner-red">
                    <div class="circle-clipper left"><div class="circle"></div></div>
                </div>
                <div class="spinner-layer spinner-yellow">
                    <div class="circle-clipper left"><div class="circle"></div></div>
                </div>
                <div class="spinner-layer spinner-green">
                    <div class="circle-clipper left"><div class="circle"></div></div>
                </div>
            </div>
            <p class="grey-text">Cargando README...</p>
        </div>
    `;
    
    modalInstance.open();
    
    try {
        const response = await fetch('/api/readme');
        if (!response.ok) throw new Error('No se pudo cargar el README');
        
        const markdown = await response.text();
        const html = marked.parse(markdown);
        
        contentEl.innerHTML = `<div class="readme-rendered">${html}</div>`;
        
        contentEl.querySelectorAll('a').forEach(link => {
            link.setAttribute('target', '_blank');
        });
    } catch (error) {
        contentEl.innerHTML = `
            <div class="center-align" style="padding: 40px;">
                <i class="material-icons large red-text">error_outline</i>
                <h5 class="red-text">Error al cargar el README</h5>
                <p class="grey-text">${error.message}</p>
                <a href="README.md" target="_blank" class="btn blue waves-effect waves-light">
                    <i class="material-icons left">launch</i>Abrir en nueva pestaña
                </a>
            </div>
        `;
    }
}

// Add click animation to buttons
function addButtonClickEffect() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Add CSS for ripple effect
const rippleCSS = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;

// Add ripple CSS to head
const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Initialize button click effects
addButtonClickEffect();

// Add loading animation for documentation links
function showLoadingAnimation(button) {
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="material-icons left rotating">refresh</i>Cargando...';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
    }, 1500);
}

// Add rotating animation CSS
const rotatingCSS = `
    .rotating {
        animation: rotate 1s linear infinite;
    }
    
    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;

const rotatingStyle = document.createElement('style');
rotatingStyle.textContent = rotatingCSS;
document.head.appendChild(rotatingStyle);

// Toast notifications for user feedback
function showToast(message, duration = 3000) {
    M.toast({
        html: message,
        displayLength: duration,
        classes: 'blue darken-2'
    });
}

// Add welcome message
setTimeout(() => {
    showToast('¡Bienvenido a TaskAPI! Explora la documentación para comenzar.');
}, 2000);

