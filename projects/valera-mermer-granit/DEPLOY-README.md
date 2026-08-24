# Valera Mermer Granit — Hosting'e Yükleme Rehberi

Bu klasör statik bir site (HTML/CSS/JS) — sunucu tarafı kod veya PHP/MySQL gerektirmiyor. Ürünler, teklif talepleri ve ziyaret istatistikleri için **Supabase** (ücretsiz, bulut tabanlı Postgres) kullanılıyor. Herhangi bir hosting'e (cPanel/FTP, Netlify, Vercel, Cloudflare Pages vb.) doğrudan yüklenebilir; tek şart `sql/` klasörünü **yüklememek** (aşağıda açıklanıyor).

## 1) Yükleme

Bu klasördeki **`sql/` klasörü hariç tüm dosya ve klasörleri** hosting'inizin site kök dizinine kopyalayın:
- cPanel/paylaşımlı hosting: genelde `public_html/` (bazılarında `www/` veya `htdocs/`)
- Netlify/Vercel: bu klasörü sürükle-bırak ya da "deploy" edin, build command'a gerek yok, publish directory = bu klasörün kendisi
- `index.html` mutlaka kök dizinde olmalı (alt klasörde değil), aksi halde ana sayfa açılmaz
- **`sql/supabase-setup.sql` hosting'e yüklenmez** — bu dosya yalnızca aşağıdaki Adım 2'de Supabase'in kendi SQL Editor'üne bir kerelik yapıştırılır. (`.htaccess` bu klasörü zaten engelliyor, ama en temizi hiç yüklememek.)

Klasör yapısı:
```
index.html, urunler.html, urun.html, iletisim.html, projeler.html
admin/  (yönetim paneli — bkz. Adım 3)
robots.txt, sitemap.xml, .htaccess
css/  (style.css, tailwind.css)
js/   (supabase-config.js, products-remote.js, i18n.js, main.js, render.js, analytics.js, vendor/supabase.js)
assets/ (logo, hero görseli, ürün fotoğrafları)
sql/  (SADECE Supabase SQL Editor'e yapıştırılır, hosting'e YÜKLENMEZ)
```

## 2) Supabase kurulumu (ürünler / talepler / istatistikler için)

1. [supabase.com](https://supabase.com) üzerinden ücretsiz bir hesap açıp yeni bir proje oluşturun (bölge olarak Avrupa'ya yakın bir bölge seçmeniz önerilir).
2. Proje panelinde soldaki menüden **SQL Editor**'ü açın, "New query" deyin, bu klasördeki `sql/supabase-setup.sql` dosyasının **tüm içeriğini** yapıştırıp **Run**'a basın. Bu tek adım: `products`, `leads`, `pageviews` tablolarını, güvenlik kurallarını (RLS) ve ürün görselleri için bir Storage bucket'ı oluşturur, ayrıca mevcut 15 ürünü otomatik doldurur.
3. Soldaki **Project Settings > API** sayfasına gidin, **Project URL** ve **anon / public key** değerlerini kopyalayın.
4. Bu klasördeki `js/supabase-config.js` dosyasını açıp bu iki değeri yapıştırın:
   ```js
   const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...';
   ```
   (`anon` anahtarı gizli değildir, tarayıcıda görünmesi normaldir — asıl güvenlik veritabanındaki RLS kurallarındadır, 2. adımda otomatik kuruldu.)
5. Soldaki **Authentication > Users** sayfasından **Add user** ile kendinize bir yönetici hesabı oluşturun (e-posta + şifre). Bu, `admin/` panelinde giriş yapmak için kullanacağınız hesap.
6. `js/supabase-config.js` dosyasını güncelledikten sonra siteyi (Adım 1'deki gibi) hosting'e yükleyin/yeniden yükleyin.

## 3) Yönetim Paneli (`admin/`)

- Adres: `https://siteniz.com/admin/login.html`
- Adım 2.5'te oluşturduğunuz e-posta/şifre ile giriş yapın.
- **Ana Sayfa (`admin/index.html`)**: bugün/son 7 gün ziyaret sayısı, okunmamış talep sayısı, toplam ürün sayısı.
- **Ürünler (`admin/urunler.html`)**: ürün listesi, öne çıkan (featured) işaretleme, silme; **Yeni Ürün / Düzenle (`admin/urun-form.html`)**: ürün ekleme/düzenleme, görsel yükleme (otomatik olarak Supabase Storage'a yüklenir).
- **Talepler (`admin/talepler.html`)**: iletişim formundan gelen teklif talepleri, "Okundu" / "Yanıtlandı" durumu.
- Panel girişi olmayan kullanıcıları otomatik olarak `login.html`'e yönlendirir — `admin/` klasörü herkese açık olsa da, veriye erişim Supabase Auth + RLS ile korunur.

## 4) Google Analytics (GA4) — opsiyonel

1. [analytics.google.com](https://analytics.google.com) üzerinden ücretsiz bir GA4 "Property" oluşturup bir **Measurement ID** alın (`G-` ile başlar).
2. `js/analytics.js` dosyasındaki `GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';` satırını gerçek ID'nizle değiştirin. Bu satır placeholder kaldığı sürece GA4 hiçbir şey yüklemez (site performansını etkilemez).

## 5) Domain bağlandıktan sonra yapılacaklar

- **`robots.txt`** ve **`sitemap.xml`** içindeki `https://www.valeramermergranit.com` adresini gerçek domaininizle değiştirin (2 dosyada da geçiyor).
- Hosting'inizde **SSL/HTTPS**'in aktif olduğunu kontrol edin (çoğu hosting ücretsiz Let's Encrypt sertifikası otomatik sağlıyor — cPanel'de "AutoSSL" veya benzeri bir seçenek olur).
- `www` ve `www` olmayan (`valeramermergranit.com` / `www.valeramermergranit.com`) versiyonlardan birini hosting panelinizden yönlendirme (redirect) ile birleştirin — SEO için önemli.

## 6) İletişim formu (formsubmit.co + Supabase)

Site canlıya çıkıp **ilk** teklif formu gönderildiğinde, formsubmit.co `aliubeydullaherdogan@gmail.com` adresine bir **onay e-postası** gönderir. O e-postadaki linke tıklanmadan form aktif olmaz — siteyi yayına almadan önce bir kere test formu göndermenizi ve o onayı geçmenizi öneririm. Form gönderildiğinde talep aynı anda Supabase'deki `leads` tablosuna da kaydedilir ve `admin/talepler.html` sayfasında görünür.

## 7) Sık güncellenecek yerler

- **Telefon / e-posta / adres**: `js/main.js` dosyasının en üstündeki `VALERA` objesi (`phone`, `email`, `address`).
- **Ürünler** (ekleme/çıkarma/düzenleme): artık `js/products.js` değil, `admin/urunler.html` ve `admin/urun-form.html` üzerinden Supabase'e kaydediliyor — bkz. Adım 3.
- **Hero görseli**: `assets/hero-fabrika-gorseli.jpg` — aynı isimle üzerine yeni bir görsel koyarsanız otomatik güncellenir.

## 8) Yayına almadan önce hızlı kontrol listesi

- [ ] `robots.txt` / `sitemap.xml` içindeki domain gerçek domaininizle değiştirildi
- [ ] `sql/supabase-setup.sql` Supabase SQL Editor'de çalıştırıldı, `js/supabase-config.js` gerçek URL/anon key ile dolduruldu
- [ ] Supabase Authentication'da bir yönetici hesabı oluşturuldu, `admin/login.html`'den giriş test edildi
- [ ] Tüm sayfalar açılıyor: Ana Sayfa, Ürünler, bir ürün detayı, İletişim, Projeler
- [ ] Ürünler sayfasında Supabase'den gelen ürünler görünüyor (boşsa Adım 2'yi kontrol edin)
- [ ] WhatsApp butonları doğru numaraya gidiyor (+90 535 915 89 66)
- [ ] İletişim formu test edildi, formsubmit.co onayı geçildi ve talep `admin/talepler.html`'de göründü
- [ ] Google Haritalar gömülü haritası doğru adresi gösteriyor
- [ ] Mobilde (telefon) menü, TR/EN dil değiştirici ve tüm butonlar çalışıyor
- [ ] (Opsiyonel) GA4 Measurement ID `js/analytics.js`'e eklendi
