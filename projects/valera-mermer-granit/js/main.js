const VALERA = {
  phone: '905359158966',
  phoneDisplay: '+90 535 915 89 66',
  email: 'aliubeydullaherdogan@gmail.com',
  address: 'Tırnova Mah. Hastane Cad. No:7/A, Gönen/Balıkesir',
  mapsQuery: 'Tırnova Mah. Hastane Cad. No:7/A, Gönen/Balıkesir',
};

function waLink(message) {
  const msg = message || t('wa.defaultmsg');
  return `https://wa.me/${VALERA.phone}?text=${encodeURIComponent(msg)}`;
}

function productWaMessage(product) {
  const lang = getLang();
  const name = lang === 'en' ? product.name_en : product.name_tr;
  return lang === 'en'
    ? `Hello, I'd like a quote for ${name}.`
    : `Merhaba, ${name} hakkında teklif almak istiyorum.`;
}

function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const menuBtn = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('is-open');
      menuBtn.setAttribute(
        'aria-expanded',
        mobileMenu.classList.contains('is-open') ? 'true' : 'false'
      );
    });
    mobileMenu.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => mobileMenu.classList.remove('is-open'))
    );
  }
}

function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || els.length === 0) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach((el) => io.observe(el));
}

function initWaLinks() {
  document.querySelectorAll('[data-wa]').forEach((el) => {
    el.setAttribute('href', waLink());
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  });
}

function initFooterYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

function initContactFields() {
  document.querySelectorAll('[data-phone-href]').forEach((el) =>
    el.setAttribute('href', `tel:+${VALERA.phone}`)
  );
  document.querySelectorAll('[data-phone-text]').forEach((el) => {
    el.textContent = VALERA.phoneDisplay;
  });
  document.querySelectorAll('[data-email-href]').forEach((el) =>
    el.setAttribute('href', `mailto:${VALERA.email}`)
  );
  document.querySelectorAll('[data-email-text]').forEach((el) => {
    el.textContent = VALERA.email;
  });
  document.querySelectorAll('[data-address-text]').forEach((el) => {
    el.textContent = VALERA.address;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initReveal();
  initWaLinks();
  initFooterYear();
  initContactFields();
});

document.addEventListener('langchange', () => {
  initWaLinks();
});
