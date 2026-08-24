-- Valera Mermer Granit — Supabase kurulum betiği
-- Supabase projenizde: SQL Editor -> New query -> bu dosyanın TAMAMINI yapıştırıp Run edin.
-- Tek seferlik bir kurulumdur; tabloları, güvenlik kurallarını (RLS) ve
-- mevcut 15 ürünü otomatik olarak oluşturur.

-- 1) Tablolar --------------------------------------------------------------

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_tr text not null,
  name_en text not null,
  type text not null check (type in ('mermer','granit')),
  origin text,
  description_tr text,
  description_en text,
  image text not null,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  product_interest text,
  message text,
  status text not null default 'new' check (status in ('new','read','replied')),
  created_at timestamptz not null default now()
);

create table if not exists pageviews (
  id bigint generated always as identity primary key,
  path text not null,
  visited_at timestamptz not null default now()
);

-- 2) Row Level Security ------------------------------------------------------
-- anon key her yerde herkese açık olduğu için gerçek güvenlik burada, RLS
-- kurallarında sağlanıyor: ziyaretçiler sadece ürünleri okuyabilir ve
-- talep/pageview EKLEYEBİLİR; sadece giriş yapmış (admin) kullanıcı
-- ürünleri değiştirebilir ve talepleri/istatistikleri okuyabilir.

alter table products enable row level security;
alter table leads enable row level security;
alter table pageviews enable row level security;

drop policy if exists "public read products" on products;
create policy "public read products" on products for select using (true);

drop policy if exists "auth insert products" on products;
create policy "auth insert products" on products for insert with check (auth.role() = 'authenticated');

drop policy if exists "auth update products" on products;
create policy "auth update products" on products for update using (auth.role() = 'authenticated');

drop policy if exists "auth delete products" on products;
create policy "auth delete products" on products for delete using (auth.role() = 'authenticated');

drop policy if exists "public insert leads" on leads;
create policy "public insert leads" on leads for insert with check (true);

drop policy if exists "auth read leads" on leads;
create policy "auth read leads" on leads for select using (auth.role() = 'authenticated');

drop policy if exists "auth update leads" on leads;
create policy "auth update leads" on leads for update using (auth.role() = 'authenticated');

drop policy if exists "public insert pageviews" on pageviews;
create policy "public insert pageviews" on pageviews for insert with check (true);

drop policy if exists "auth read pageviews" on pageviews;
create policy "auth read pageviews" on pageviews for select using (auth.role() = 'authenticated');

-- 3) Ürün görselleri için Storage bucket -------------------------------------

insert into storage.buckets (id, name, public)
values ('urun-gorselleri', 'urun-gorselleri', true)
on conflict (id) do nothing;

drop policy if exists "public read urun-gorselleri" on storage.objects;
create policy "public read urun-gorselleri" on storage.objects
  for select using (bucket_id = 'urun-gorselleri');

drop policy if exists "auth upload urun-gorselleri" on storage.objects;
create policy "auth upload urun-gorselleri" on storage.objects
  for insert with check (bucket_id = 'urun-gorselleri' and auth.role() = 'authenticated');

drop policy if exists "auth update urun-gorselleri" on storage.objects;
create policy "auth update urun-gorselleri" on storage.objects
  for update using (bucket_id = 'urun-gorselleri' and auth.role() = 'authenticated');

drop policy if exists "auth delete urun-gorselleri" on storage.objects;
create policy "auth delete urun-gorselleri" on storage.objects
  for delete using (bucket_id = 'urun-gorselleri' and auth.role() = 'authenticated');

-- 4) Mevcut 15 ürünü aktar ----------------------------------------------------

insert into products (slug, name_tr, name_en, type, origin, description_tr, description_en, image, featured, sort_order) values
('afyon-seker', 'Afyon Şeker Mermer', 'Afyon Sugar Marble', 'mermer', 'Afyon, Türkiye', 'Sıcak beyaz zemin üzerinde altın-gri damarlanma. İç mekan zemin ve duvar kaplamalarında tercih edilen klasik bir Türk mermeridir.', 'Warm white base with gold-grey veining. A classic Turkish marble favored for interior floor and wall cladding.', 'assets/urun-gorselleri/afyon-seker.jpg', true, 1),
('marmara-beyaz', 'Marmara Beyaz Mermer', 'Marmara White Marble', 'mermer', 'Marmara, Türkiye', 'Marmara Adası''ndan çıkarılan, ince gri damarlı, saf beyaz zemine sahip zamansız bir mermer türüdür.', 'Quarried from Marmara Island, a timeless marble with a pure white base and fine grey veining.', 'assets/urun-gorselleri/marmara-beyaz.jpg', false, 2),
('elazig-visne', 'Elazığ Vişne Mermer', 'Elazig Cherry Marble', 'mermer', 'Elazığ, Türkiye', 'Koyu vişne zemin üzerinde beyaz damarlanmalarıyla dikkat çeken, güçlü karakterli bir mermer.', 'A striking marble with white veining across a deep cherry-red base, known for its bold character.', 'assets/urun-gorselleri/elazig-visne.jpg', true, 3),
('denizli-traverten', 'Denizli Traverten', 'Denizli Travertine', 'mermer', 'Denizli, Türkiye', 'Doğal gözenekli dokusuyla sıcak bej tonlarında, dış ve iç mekan kaplamalarında yaygın kullanılan traverten.', 'A warm beige travertine with a natural porous texture, widely used for interior and exterior cladding.', 'assets/urun-gorselleri/denizli-traverten.jpg', true, 4),
('kaplan-postu', 'Kaplan Postu Mermer', 'Tiger Skin Marble', 'mermer', 'Türkiye', 'Adını desenindeki kahverengi-altın leke motiflerinden alan, güçlü görsel etkiye sahip özel bir mermer.', 'Named for its brown-gold blotch pattern, a distinctive marble with strong visual character.', 'assets/urun-gorselleri/kaplan-postu.jpg', false, 5),
('milas-leylak', 'Milas Leylak Mermer', 'Milas Lilac Marble', 'mermer', 'Milas, Türkiye', 'Yumuşak leylak-gri tonlarında, zarif damarlanmaya sahip, özellikle iç mekan projelerinde tercih edilen mermer.', 'Soft lilac-grey tones with elegant veining, favored for refined interior projects.', 'assets/urun-gorselleri/milas-leylak.jpg', false, 6),
('ege-bordo', 'Ege Bordo Mermer', 'Aegean Bordeaux Marble', 'mermer', 'Ege Bölgesi, Türkiye', 'Koyu bordo zemin üzerinde beyaz damarlarla öne çıkan, gösterişli mekanlar için güçlü bir seçim.', 'A dramatic marble with white veining over a deep bordeaux base, a bold choice for statement spaces.', 'assets/urun-gorselleri/ege-bordo.jpg', false, 7),
('burdur-bej', 'Burdur Bej Mermer', 'Burdur Beige Marble', 'mermer', 'Burdur, Türkiye', 'Homojen sıcak bej tonu ve ince damarlanmasıyla her tarza uyum sağlayan çok yönlü bir mermer.', 'A versatile marble with a warm, homogenous beige tone and fine veining that suits any style.', 'assets/urun-gorselleri/burdur-bej.jpg', false, 8),
('nero-marquina', 'Nero Marquina Mermer', 'Nero Marquina Marble', 'mermer', 'İthal', 'Derin siyah zemin üzerinde keskin beyaz damarlarla kontrast yaratan, ithal premium bir mermer.', 'An imported premium marble creating striking contrast with sharp white veining over a deep black base.', 'assets/urun-gorselleri/nero-marquina.jpg', false, 9),
('absolute-black', 'Absolute Black Granit', 'Absolute Black Granite', 'granit', 'İthal', 'Pürüzsüz, homojen siyah yüzeyiyle mutfak tezgahı ve modern iç mekanlarda en çok tercih edilen granit.', 'A smooth, uniform black granite, the top choice for kitchen countertops and modern interiors.', 'assets/urun-gorselleri/absolute-black.jpg', true, 10),
('blue-pearl', 'Blue Pearl Granit', 'Blue Pearl Granite', 'granit', 'İthal', 'Koyu lacivert zemin üzerinde parıldayan mavi kristal parçacıklarıyla lüks bir görünüm sunan granit.', 'A luxurious granite with shimmering blue crystal flecks over a deep navy base.', 'assets/urun-gorselleri/blue-pearl.jpg', false, 11),
('tan-brown', 'Tan Brown Granit', 'Tan Brown Granite', 'granit', 'İthal', 'Kahverengi zemin üzerinde siyah ve bej benekleriyle sıcak, doğal bir doku sunan granit.', 'A warm, natural-textured granite with black and beige speckles over a brown base.', 'assets/urun-gorselleri/tan-brown.jpg', false, 12),
('kashmir-white', 'Kashmir White Granit', 'Kashmir White Granite', 'granit', 'İthal', 'Açık krem zemin üzerinde bordo ve siyah beneklerle canlı bir doku sunan popüler granit türü.', 'A popular granite with a lively texture of burgundy and black speckles over a light cream base.', 'assets/urun-gorselleri/kashmir-white.jpg', true, 13),
('steel-grey', 'Steel Grey Granit', 'Steel Grey Granite', 'granit', 'İthal', 'Homojen gri tonuyla endüstriyel ve modern projelerde sıkça tercih edilen zarif bir granit.', 'An elegant granite with a uniform grey tone, often chosen for industrial and modern projects.', 'assets/urun-gorselleri/steel-grey.jpg', false, 14),
('baltic-brown', 'Baltic Brown Granit', 'Baltic Brown Granite', 'granit', 'İthal', 'Karakteristik yuvarlak desenleriyle tanınan, kahverengi tonlarında etkileyici bir granit türü.', 'Known for its distinctive orbicular pattern, a striking granite in rich brown tones.', 'assets/urun-gorselleri/baltic-brown.jpg', true, 15)
on conflict (slug) do nothing;
