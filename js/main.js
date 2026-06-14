/* === Navigation === */
function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

function closeMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
}

/* Mark active nav link */
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
});

/* === Home: Categories preview === */
async function loadCategoriesPreview() {
  const grid = document.getElementById('categories-preview-grid');
  if (!grid) return;

  let categories;
  try {
    const res = await fetch('data/categories.json');
    categories = await res.json();
  } catch {
    categories = [
      { key: 'pack_fiancailles',    icon: '💍', image: '' },
      { key: 'conservation_fleurs', icon: '🌸', image: '' },
      { key: 'accessoires',         icon: '✨', image: '' },
      { key: 'deco_murale',         icon: '🖼️', image: '' },
      { key: 'art_table',           icon: '🕯️', image: '' },
    ];
  }

  grid.innerHTML = categories.map(c => {
    const hasImg = !!c.image;
    const style  = hasImg ? `style="background-image:url('images/${c.image}')"` : '';
    const cls    = hasImg ? '' : 'no-img';
    return `
      <a class="category-card ${cls}" href="catalogue.html?cat=${c.key}" ${style}>
        <div class="cat-overlay"></div>
        <div class="cat-inner">
          <div class="cat-icon">${c.icon}</div>
          <h3 data-i18n="cat.${c.key}">${t('cat.' + c.key)}</h3>
        </div>
      </a>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', loadCategoriesPreview);
