function productName(p) {
  return getLang() === 'en' ? p.name_en : p.name_tr;
}
function productDesc(p) {
  return getLang() === 'en' ? p.description_en : p.description_tr;
}
function productTypeLabel(p) {
  return p.type === 'granit' ? t('filter.granite') : t('filter.marble');
}

function productCardHTML(p) {
  return `
    <div class="stone-card group relative reveal">
      <a href="urun.html?slug=${p.slug}" class="absolute inset-0 z-10" aria-label="${productName(p)}"></a>
      <img src="${p.image}" alt="${productName(p)}" class="stone-card-img w-full h-full" loading="lazy">
      <div class="stone-card-overlay"></div>
      <div class="absolute top-4 left-4 z-0">
        <span class="stone-tag">${productTypeLabel(p)}</span>
      </div>
      <div class="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between gap-3 z-0">
        <div>
          <h3 class="font-display text-lg text-[var(--paper)] leading-tight">${productName(p)}</h3>
          <p class="eyebrow-soft mt-1" style="color:rgba(245,242,236,.55)">${p.origin}</p>
        </div>
        <a href="${waLink(productWaMessage(p))}" target="_blank" rel="noopener noreferrer"
           class="btn btn-gold btn-sm shrink-0 relative z-20">${t('card.quote')}</a>
      </div>
    </div>`;
}

function renderGrid(containerId, products) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = products.map(productCardHTML).join('');
  initReveal();
}

function renderFeatured() {
  const featured = PRODUCTS.filter((p) => p.featured);
  renderGrid('featured-grid', featured);
}

function renderCatalog(filter) {
  const list = filter && filter !== 'all' ? PRODUCTS.filter((p) => p.type === filter) : PRODUCTS;
  renderGrid('catalog-grid', list);
}

function findProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug);
}

function renderDetail() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  const product = findProduct(slug) || PRODUCTS[0];
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = val;
  };

  document.title = `${productName(product)} — Valera Mermer Granit`;
  set('detail-image', '');
  const img = document.getElementById('detail-image');
  if (img) {
    img.src = product.image;
    img.alt = productName(product);
  }
  set('detail-type', productTypeLabel(product));
  set('detail-name', productName(product));
  set('detail-origin-value', product.origin);
  set('detail-desc', productDesc(product));

  const waBtn = document.getElementById('detail-wa-btn');
  if (waBtn) {
    waBtn.href = waLink(productWaMessage(product));
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
  }

  const similar = PRODUCTS.filter((p) => p.type === product.type && p.slug !== product.slug).slice(0, 4);
  renderGrid('similar-grid', similar);
}

document.addEventListener('langchange', () => {
  if (document.getElementById('featured-grid')) renderFeatured();
  if (document.getElementById('catalog-grid')) {
    const active = document.querySelector('.filter-tab.active');
    renderCatalog(active ? active.getAttribute('data-filter') : 'all');
  }
  if (document.getElementById('detail-name')) renderDetail();
});
