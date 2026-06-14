const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { exec } = require('child_process');

const app  = express();
const PORT = 3001;

const DATA_DIR   = path.join(__dirname, '..', 'data');
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const PRODUCTS_FILE    = path.join(DATA_DIR, 'products.json');
const FORMATIONS_FILE  = path.join(DATA_DIR, 'formations.json');
const CATEGORIES_FILE  = path.join(DATA_DIR, 'categories.json');

/* Multer — image upload */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename:    (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, Date.now() + '-' + safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

app.use(express.json());
app.use(express.static(__dirname));           /* serve admin/index.html */
app.use('/images', express.static(IMAGES_DIR));

/* ---- helpers ---- */
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}
function uid() {
  return 'p' + Date.now() + Math.random().toString(36).slice(2, 6);
}

/* =================== PRODUCTS API =================== */

app.get('/api/products', (req, res) => {
  res.json(readJSON(PRODUCTS_FILE));
});

app.post('/api/products', upload.single('image'), (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const body = req.body;
  const coverFile = req.file ? req.file.filename : (body.image || '');
  const product = {
    id:          uid(),
    name:        body.name || '',
    category:    body.category || 'accessoires',
    description: body.description || '',
    price:       body.price ? Number(body.price) : null,
    icon:        body.icon || '✨',
    image:       coverFile,
    images:      coverFile ? [coverFile] : []
  };
  products.push(product);
  writeJSON(PRODUCTS_FILE, products);
  res.json(product);
});

app.put('/api/products/:id', upload.single('image'), (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const body = req.body;
  products[idx] = {
    ...products[idx],
    name:        body.name        ?? products[idx].name,
    category:    body.category    ?? products[idx].category,
    description: body.description ?? products[idx].description,
    price:       body.price !== undefined ? (body.price ? Number(body.price) : null) : products[idx].price,
    icon:        body.icon        ?? products[idx].icon,
    image:       req.file ? req.file.filename : (body.image ?? products[idx].image)
  };
  writeJSON(PRODUCTS_FILE, products);
  res.json(products[idx]);
});

/* Upload additional images to a product's gallery */
app.post('/api/products/:id/images', upload.array('images', 20), (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (!products[idx].images) products[idx].images = [];
  const newFiles = (req.files || []).map(f => f.filename);
  products[idx].images = [...products[idx].images, ...newFiles];
  if (!products[idx].image && newFiles.length > 0) products[idx].image = newFiles[0];
  writeJSON(PRODUCTS_FILE, products);
  res.json(products[idx]);
});

/* Remove one image from a product's gallery */
app.delete('/api/products/:id/images/:filename', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  products[idx].images = (products[idx].images || []).filter(f => f !== req.params.filename);
  if (products[idx].image === req.params.filename) {
    products[idx].image = products[idx].images[0] || '';
  }
  writeJSON(PRODUCTS_FILE, products);
  res.json(products[idx]);
});

app.delete('/api/products/:id', (req, res) => {
  let products = readJSON(PRODUCTS_FILE);
  products = products.filter(p => p.id !== req.params.id);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ ok: true });
});

/* =================== FORMATIONS API =================== */

app.get('/api/formations', (req, res) => {
  res.json(readJSON(FORMATIONS_FILE));
});

app.post('/api/formations', (req, res) => {
  const formations = readJSON(FORMATIONS_FILE);
  const f = { id: uid(), ...req.body };
  if (!f.slides) f.slides = [];
  formations.push(f);
  writeJSON(FORMATIONS_FILE, formations);
  res.json(f);
});

app.put('/api/formations/:id', (req, res) => {
  const formations = readJSON(FORMATIONS_FILE);
  const idx = formations.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  formations[idx] = { ...formations[idx], ...req.body };
  writeJSON(FORMATIONS_FILE, formations);
  res.json(formations[idx]);
});

app.delete('/api/formations/:id', (req, res) => {
  let formations = readJSON(FORMATIONS_FILE);
  formations = formations.filter(f => f.id !== req.params.id);
  writeJSON(FORMATIONS_FILE, formations);
  res.json({ ok: true });
});

/* =================== CATEGORIES API =================== */

app.get('/api/categories', (req, res) => {
  res.json(readJSON(CATEGORIES_FILE));
});

app.put('/api/categories/:key', upload.single('image'), (req, res) => {
  const categories = readJSON(CATEGORIES_FILE);
  const idx = categories.findIndex(c => c.key === req.params.key);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (req.file) categories[idx].image = req.file.filename;
  if (req.body.image === '') categories[idx].image = '';
  writeJSON(CATEGORIES_FILE, categories);
  res.json(categories[idx]);
});

/* =================== IMAGES API =================== */

app.get('/api/images', (req, res) => {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(f));
  res.json(files);
});

app.delete('/api/images/:filename', (req, res) => {
  const file = path.join(IMAGES_DIR, req.params.filename);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ ok: true });
});

/* =================== GIT PUSH API =================== */

const REPO_DIR = path.join(__dirname, '..');

app.post('/api/git/push', (req, res) => {
  const message = (req.body && req.body.message) || 'Mise à jour produits et images';
  const safeMsg = message.replace(/"/g, "'");
  const cmd = `git add -A && git commit -m "${safeMsg}" && git push`;
  exec(cmd, { cwd: REPO_DIR, shell: true }, (err, stdout, stderr) => {
    const output = (stdout + stderr).trim();
    const nothingToCommit = output.includes('nothing to commit') || output.includes('nothing added');
    if (err && !nothingToCommit) {
      return res.status(500).json({ ok: false, error: stderr || err.message });
    }
    res.json({ ok: true, output: nothingToCommit ? 'Rien à commiter — site déjà à jour.' : output });
  });
});

/* ---- Start ---- */
app.listen(PORT, () => {
  console.log(`\n✅  Dashboard Admin — Resin by Dounia`);
  console.log(`👉  Ouvrir : http://localhost:${PORT}\n`);
});
