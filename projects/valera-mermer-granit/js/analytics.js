(function () {
  // Google Analytics 4 — analytics.google.com'da ücretsiz bir "GA4 Property"
  // oluşturup Measurement ID'nizi (G- ile başlar) aşağıya yapıştırın.
  var GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
  }

  // Basit dahili ziyaret sayacı (admin panelindeki "bugün/bu hafta" özeti için).
  if (window.supabaseClient) {
    supabaseClient.from('pageviews').insert({ path: location.pathname }).then(function () {}, function () {});
  }
})();
