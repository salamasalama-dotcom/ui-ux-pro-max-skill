const PRODUCTS = [
  {
    "slug": "afyon-seker",
    "name_tr": "Afyon Şeker Mermer",
    "name_en": "Afyon Sugar Marble",
    "type": "mermer",
    "origin": "Afyon, Türkiye",
    "description_tr": "Sıcak beyaz zemin üzerinde altın-gri damarlanma. İç mekan zemin ve duvar kaplamalarında tercih edilen klasik bir Türk mermeridir.",
    "description_en": "Warm white base with gold-grey veining. A classic Turkish marble favored for interior floor and wall cladding.",
    "image": "assets/urun-gorselleri/afyon-seker.jpg",
    "featured": true
  },
  {
    "slug": "marmara-beyaz",
    "name_tr": "Marmara Beyaz Mermer",
    "name_en": "Marmara White Marble",
    "type": "mermer",
    "origin": "Marmara, Türkiye",
    "description_tr": "Marmara Adası'ndan çıkarılan, ince gri damarlı, saf beyaz zemine sahip zamansız bir mermer türüdür.",
    "description_en": "Quarried from Marmara Island, a timeless marble with a pure white base and fine grey veining.",
    "image": "assets/urun-gorselleri/marmara-beyaz.jpg",
    "featured": false
  },
  {
    "slug": "elazig-visne",
    "name_tr": "Elazığ Vişne Mermer",
    "name_en": "Elazig Cherry Marble",
    "type": "mermer",
    "origin": "Elazığ, Türkiye",
    "description_tr": "Koyu vişne zemin üzerinde beyaz damarlanmalarıyla dikkat çeken, güçlü karakterli bir mermer.",
    "description_en": "A striking marble with white veining across a deep cherry-red base, known for its bold character.",
    "image": "assets/urun-gorselleri/elazig-visne.jpg",
    "featured": true
  },
  {
    "slug": "denizli-traverten",
    "name_tr": "Denizli Traverten",
    "name_en": "Denizli Travertine",
    "type": "mermer",
    "origin": "Denizli, Türkiye",
    "description_tr": "Doğal gözenekli dokusuyla sıcak bej tonlarında, dış ve iç mekan kaplamalarında yaygın kullanılan traverten.",
    "description_en": "A warm beige travertine with a natural porous texture, widely used for interior and exterior cladding.",
    "image": "assets/urun-gorselleri/denizli-traverten.jpg",
    "featured": true
  },
  {
    "slug": "kaplan-postu",
    "name_tr": "Kaplan Postu Mermer",
    "name_en": "Tiger Skin Marble",
    "type": "mermer",
    "origin": "Türkiye",
    "description_tr": "Adını desenindeki kahverengi-altın leke motiflerinden alan, güçlü görsel etkiye sahip özel bir mermer.",
    "description_en": "Named for its brown-gold blotch pattern, a distinctive marble with strong visual character.",
    "image": "assets/urun-gorselleri/kaplan-postu.jpg",
    "featured": false
  },
  {
    "slug": "milas-leylak",
    "name_tr": "Milas Leylak Mermer",
    "name_en": "Milas Lilac Marble",
    "type": "mermer",
    "origin": "Milas, Türkiye",
    "description_tr": "Yumuşak leylak-gri tonlarında, zarif damarlanmaya sahip, özellikle iç mekan projelerinde tercih edilen mermer.",
    "description_en": "Soft lilac-grey tones with elegant veining, favored for refined interior projects.",
    "image": "assets/urun-gorselleri/milas-leylak.jpg",
    "featured": false
  },
  {
    "slug": "ege-bordo",
    "name_tr": "Ege Bordo Mermer",
    "name_en": "Aegean Bordeaux Marble",
    "type": "mermer",
    "origin": "Ege Bölgesi, Türkiye",
    "description_tr": "Koyu bordo zemin üzerinde beyaz damarlarla öne çıkan, gösterişli mekanlar için güçlü bir seçim.",
    "description_en": "A dramatic marble with white veining over a deep bordeaux base, a bold choice for statement spaces.",
    "image": "assets/urun-gorselleri/ege-bordo.jpg",
    "featured": false
  },
  {
    "slug": "burdur-bej",
    "name_tr": "Burdur Bej Mermer",
    "name_en": "Burdur Beige Marble",
    "type": "mermer",
    "origin": "Burdur, Türkiye",
    "description_tr": "Homojen sıcak bej tonu ve ince damarlanmasıyla her tarza uyum sağlayan çok yönlü bir mermer.",
    "description_en": "A versatile marble with a warm, homogenous beige tone and fine veining that suits any style.",
    "image": "assets/urun-gorselleri/burdur-bej.jpg",
    "featured": false
  },
  {
    "slug": "nero-marquina",
    "name_tr": "Nero Marquina Mermer",
    "name_en": "Nero Marquina Marble",
    "type": "mermer",
    "origin": "İthal",
    "description_tr": "Derin siyah zemin üzerinde keskin beyaz damarlarla kontrast yaratan, ithal premium bir mermer.",
    "description_en": "An imported premium marble creating striking contrast with sharp white veining over a deep black base.",
    "image": "assets/urun-gorselleri/nero-marquina.jpg",
    "featured": false
  },
  {
    "slug": "absolute-black",
    "name_tr": "Absolute Black Granit",
    "name_en": "Absolute Black Granite",
    "type": "granit",
    "origin": "İthal",
    "description_tr": "Pürüzsüz, homojen siyah yüzeyiyle mutfak tezgahı ve modern iç mekanlarda en çok tercih edilen granit.",
    "description_en": "A smooth, uniform black granite, the top choice for kitchen countertops and modern interiors.",
    "image": "assets/urun-gorselleri/absolute-black.jpg",
    "featured": true
  },
  {
    "slug": "blue-pearl",
    "name_tr": "Blue Pearl Granit",
    "name_en": "Blue Pearl Granite",
    "type": "granit",
    "origin": "İthal",
    "description_tr": "Koyu lacivert zemin üzerinde parıldayan mavi kristal parçacıklarıyla lüks bir görünüm sunan granit.",
    "description_en": "A luxurious granite with shimmering blue crystal flecks over a deep navy base.",
    "image": "assets/urun-gorselleri/blue-pearl.jpg",
    "featured": false
  },
  {
    "slug": "tan-brown",
    "name_tr": "Tan Brown Granit",
    "name_en": "Tan Brown Granite",
    "type": "granit",
    "origin": "İthal",
    "description_tr": "Kahverengi zemin üzerinde siyah ve bej benekleriyle sıcak, doğal bir doku sunan granit.",
    "description_en": "A warm, natural-textured granite with black and beige speckles over a brown base.",
    "image": "assets/urun-gorselleri/tan-brown.jpg",
    "featured": false
  },
  {
    "slug": "kashmir-white",
    "name_tr": "Kashmir White Granit",
    "name_en": "Kashmir White Granite",
    "type": "granit",
    "origin": "İthal",
    "description_tr": "Açık krem zemin üzerinde bordo ve siyah beneklerle canlı bir doku sunan popüler granit türü.",
    "description_en": "A popular granite with a lively texture of burgundy and black speckles over a light cream base.",
    "image": "assets/urun-gorselleri/kashmir-white.jpg",
    "featured": true
  },
  {
    "slug": "steel-grey",
    "name_tr": "Steel Grey Granit",
    "name_en": "Steel Grey Granite",
    "type": "granit",
    "origin": "İthal",
    "description_tr": "Homojen gri tonuyla endüstriyel ve modern projelerde sıkça tercih edilen zarif bir granit.",
    "description_en": "An elegant granite with a uniform grey tone, often chosen for industrial and modern projects.",
    "image": "assets/urun-gorselleri/steel-grey.jpg",
    "featured": false
  },
  {
    "slug": "baltic-brown",
    "name_tr": "Baltic Brown Granit",
    "name_en": "Baltic Brown Granite",
    "type": "granit",
    "origin": "İthal",
    "description_tr": "Karakteristik yuvarlak desenleriyle tanınan, kahverengi tonlarında etkileyici bir granit türü.",
    "description_en": "Known for its distinctive orbicular pattern, a striking granite in rich brown tones.",
    "image": "assets/urun-gorselleri/baltic-brown.jpg",
    "featured": true
  }
];
