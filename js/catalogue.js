/* === Catalogue === */
let products = [];
let selectedProducts = new Set();
let activeCategory = 'all';

const CATEGORIES = [
  { key: 'all' },
  { key: 'pack_fiancailles' },
  { key: 'conservation_fleurs' },
  { key: 'accessoires' },
  { key: 'deco_murale' },
  { key: 'art_table' },
  { key: 'baby' },
];

async function loadProducts() {
  const res = await fetch('data/products.json');
  products = await res.json();

  /* Pre-select category from URL param */
  const urlCat = new URLSearchParams(window.location.search).get('cat');
  if (urlCat) activeCategory = urlCat;

  renderFilters();
  renderProducts();
}

function renderFilters() {
  const bar = document.getElementById('category-filter');
  if (!bar) return;
  bar.innerHTML = CATEGORIES.map(c => `
    <button class="filter-btn ${activeCategory === c.key ? 'active' : ''}"
      onclick="setCategory('${c.key}')" data-i18n="cat.${c.key}">
      ${t('cat.' + c.key)}
    </button>
  `).join('');
}

function setCategory(key) {
  activeCategory = key;
  renderFilters();
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const filtered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:var(--color-text-light);text-align:center;padding:3rem;grid-column:1/-1">Aucun produit dans cette catégorie pour l\'instant.</p>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const checked = selectedProducts.has(p.id);
    const coverImg = (p.images && p.images.length > 0) ? p.images[0] : p.image;
    const imgHtml = coverImg
      ? `<img src="images/${coverImg}" alt="${p.name}" loading="lazy">`
      : `<div class="product-img-placeholder">${p.icon || '🌿'}</div>`;

    return `
    <div class="product-card ${checked ? 'selected' : ''}" id="card-${p.id}" onclick="goToProduct('${p.id}')">
      <div class="product-checkbox-wrap" onclick="event.stopPropagation()">
        <input type="checkbox" class="product-checkbox" id="chk-${p.id}"
          ${checked ? 'checked' : ''} onchange="toggleProduct('${p.id}')">
      </div>
      <div class="product-img-wrap">${imgHtml}</div>
      <div class="product-info">
        <div class="product-category">${t('cat.' + p.category)}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description || ''}</div>
        ${p.price ? `<div class="product-price">${p.price} MAD</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function toggleProduct(id) {
  const card = document.getElementById('card-' + id);
  if (selectedProducts.has(id)) {
    selectedProducts.delete(id);
    card.classList.remove('selected');
  } else {
    selectedProducts.add(id);
    card.classList.add('selected');
  }
  updateOrderBar();
}

function updateOrderBar() {
  const bar = document.getElementById('order-bar');
  const count = document.getElementById('order-count');
  if (!bar) return;
  if (selectedProducts.size > 0) {
    bar.classList.add('visible');
    count.textContent = selectedProducts.size;
  } else {
    bar.classList.remove('visible');
  }
}

function goToProduct(id) {
  window.location.href = 'product?id=' + id;
}

function openOrderModal() {
  const selected = products.filter(p => selectedProducts.has(p.id));
  const list = selected.map(p => `• ${p.name}`).join('\n');
  const message = t('order.message_intro') + list + t('order.message_outro');

  document.getElementById('modal-message').textContent = message;
  document.getElementById('order-modal').classList.add('open');
  document.getElementById('copy-feedback').classList.remove('show');
}

function closeOrderModal() {
  document.getElementById('order-modal').classList.remove('open');
}

function copyMessage() {
  const msg = document.getElementById('modal-message').textContent;
  navigator.clipboard.writeText(msg).then(() => {
    document.getElementById('copy-feedback').classList.add('show');
  });
}

function openInstagram() {
  window.open('https://ig.me/m/resinbydounia', '_blank');
}

/* Close modal on backdrop click */
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  document.getElementById('order-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('order-modal')) closeOrderModal();
  });
});

/* Re-render labels on language change */
function onLangChange() {
  renderFilters();
  renderProducts();
}
