# Valera Mermer Granit — Hosting'e Yükleme Rehberi

Bu klasör tamamen statik bir site (HTML/CSS/JS) — build adımı, sunucu tarafı kod veya veritabanı gerektirmiyor. Herhangi bir hosting'e (cPanel/FTP, Netlify, Vercel, Cloudflare Pages, GitHub Pages vb.) doğrudan yüklenebilir.

## 1) Yükleme

Bu klasördeki **tüm dosya ve klasörleri** hosting'inizin site kök dizinine kopyalayın:
- cPanel/paylaşımlı hosting: genelde `public_html/` (bazılarında `www/` veya `htdocs/`)
- Netlify/Vercel: bu klasörü sürükle-bırak ya da "deploy" edin, build command'a gerek yok, publish directory = bu klasörün kendisi
- `index.html` mutlaka kök dizinde olmalı (alt klasörde değil), aksi halde ana sayfa açılmaz

Klasör yapısı:
```
index.html, urunler.html, urun.html, iletisim.html, projeler.html
robots.txt, sitemap.xml
css/  (style.css, tailwind.css)
js/   (products.js, i18n.js, main.js, render.js)
assets/ (logo, hero görseli, ürün fotoğrafları)
```

## 2) Domain bağlandıktan sonra yapılacaklar

- **`robots.txt`** ve **`sitemap.xml`** içindeki `https://www.valeramermergranit.com` adresini gerçek domaininizle değiştirin (2 dosyada da geçiyor).
- Hosting'inizde **SSL/HTTPS**'in aktif olduğunu kontrol edin (çoğu hosting ücretsiz Let's Encrypt sertifikası otomatik sağlıyor — cPanel'de "AutoSSL" veya benzeri bir seçenek olur).
- `www` ve `www` olmayan (`valeramermergranit.com` / `www.valeramermergranit.com`) versiyonlardan birini hosting panelinizden yönlendirme (redirect) ile birleştirin — SEO için önemli.

## 3) İletişim formu (formsubmit.co)

Site canlıya çıkıp **ilk** teklif formu gönderildiğinde, formsubmit.co `aliubeydullaherdogan@gmail.com` adresine bir **onay e-postası** gönderir. O e-postadaki linke tıklanmadan form aktif olmaz — siteyi yayına almadan önce bir kere test formu göndermenizi ve o onayı geçmenizi öneririm.

## 4) Sık güncellenecek yerler

- **Telefon / e-posta / adres**: `js/main.js` dosyasının en üstündeki `VALERA` objesi (`phone`, `email`, `address`).
- **Ürünler** (ekleme/çıkarma/düzenleme): `js/products.js` — her ürün bir obje, `slug`, `name_tr`/`name_en`, `type` (`mermer`/`granit`), `origin`, `description_tr`/`description_en`, `image` (dosya yolu `assets/urun-gorselleri/...`), `featured` (ana sayfada öne çıkan 6 üründen biri mi). Yeni bir görsel eklerken dosyayı `assets/urun-gorselleri/` klasörüne koyup yolunu buraya yazmanız yeterli.
- **Hero görseli**: `assets/hero-fabrika-gorseli.jpg` — aynı isimle üzerine yeni bir görsel koyarsanız otomatik güncellenir.

## 5) Yayına almadan önce hızlı kontrol listesi

- [ ] `robots.txt` / `sitemap.xml` içindeki domain gerçek domaininizle değiştirildi
- [ ] Tüm sayfalar açılıyor: Ana Sayfa, Ürünler, bir ürün detayı, İletişim, Projeler
- [ ] WhatsApp butonları doğru numaraya gidiyor (+90 535 915 89 66)
- [ ] İletişim formu test edildi ve formsubmit.co onayı geçildi
- [ ] Google Haritalar gömülü haritası doğru adresi gösteriyor
- [ ] Mobilde (telefon) menü, TR/EN dil değiştirici ve tüm butonlar çalışıyor
