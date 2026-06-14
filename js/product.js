/* === Product Detail Page === */
let currentProduct = null;

function getImages(product) {
  if (product.images && product.images.length > 0) return product.images;
  if (product.image) return [product.image];
  return [];
}

function goBack() {
  const ref = document.referrer;
  if (ref && ref.includes('catalogue')) {
    history.back();
  } else {
    window.location.href = 'catalogue.html';
  }
}

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = 'catalogue.html'; return; }

  const res = await fetch('data/products.json');
  const products = await res.json();
  currentProduct = products.find(p => p.id === id);
  if (!currentProduct) { window.location.href = 'catalogue.html'; return; }

  renderProduct(currentProduct);
  document.title = currentProduct.name + ' — Resin by Dounia';
}

function renderProduct(product) {
  document.getElementById('detail-name').textContent = product.name;
  document.getElementById('detail-category').textContent = t('cat.' + product.category);
  document.getElementById('detail-desc').textContent = product.description || '';
  document.getElementById('detail-price').textContent = product.price ? product.price + ' MAD' : '';

  const images = getImages(product);
  const mainWrap = document.getElementById('gallery-main');

  if (images.length === 0) {
    document.getElementById('gallery-placeholder').textContent = product.icon || '✨';
  } else {
    mainWrap.innerHTML = `<img id="main-img" src="images/${images[0]}" alt="${product.name}">`;
    if (images.length > 1) renderThumbs(images);
  }

  document.getElementById('product-detail').style.display = '';
}

function renderThumbs(images) {
  const wrap = document.getElementById('gallery-thumbs');
  wrap.innerHTML = images.map((img, i) => `
    <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="changeImage('${img}', this)">
      <img src="images/${img}" alt="" loading="lazy">
    </div>
  `).join('');
}

function changeImage(filename, thumbEl) {
  const mainImg = document.getElementById('main-img');
  if (!mainImg) return;
  mainImg.style.opacity = '0';
  setTimeout(() => {
    mainImg.src = 'images/' + filename;
    mainImg.style.opacity = '1';
  }, 150);
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}

function openOrderModal() {
  if (!currentProduct) return;
  const message = t('order.message_intro') + '• ' + currentProduct.name + t('order.message_outro');
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

function onLangChange() {
  if (currentProduct) {
    document.getElementById('detail-category').textContent = t('cat.' + currentProduct.category);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProduct();
  const modal = document.getElementById('order-modal');
  modal.addEventListener('click', e => {
    if (e.target === modal) closeOrderModal();
  });
});
