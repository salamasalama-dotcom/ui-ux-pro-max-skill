/* ============================================================================
   Klinik.OS live surface: page logic.

   The whole page is one console driven by a single value: `now`, the clinic
   clock, in seconds since midnight. Scroll position maps to clinic time
   through a piecewise schedule (each act owns a stretch of the working day),
   and every panel computes its own state from that one number plus the data
   arrays below. Nothing is hardcoded as a rendered string, so the counters,
   the summary and the alert stack cannot disagree with the appointment book.

   The data is a demonstration clinic. It is labelled as such in the status bar
   and in the panel footer, and no business outcome is claimed anywhere.

   The engine (scrollcraft.js) is untouched. Everything bespoke here reads
   scroll through one rAF loop, exactly as the engine does, and publishes
   `data-sc-verify-state` so the verification harness can see rendered state
   that lives outside the engine's own devices.
   ========================================================================== */

(function () {
  "use strict";

  var REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var S = function (h, m, s) { return h * 3600 + m * 60 + (s || 0); };
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var hhmm = function (t) { t = Math.round(t); return pad(Math.floor(t / 3600)) + ":" + pad(Math.floor(t / 60) % 60); };
  var hhmmss = function (t) { t = Math.round(t); return hhmm(t) + ":" + pad(t % 60); };
  var tr = function (n) { return String(n).replace(".", ","); };

  /* ======================================================= demonstration ==
     One Thursday at one clinic. */

  var CLINIC = {
    name: "Meridyen Ağız ve Diş Sağlığı Polikliniği",
    shortName: "Meridyen",
    place: "Kadıköy, İstanbul",
    day: "Perşembe"
  };

  var DAY_OPEN = S(8, 0), DAY_CLOSE = S(19, 0);

  /* Three conversations the assistant handled. The first one is the thread
     shown in the inbox; all three are counted. */
  var CONVERSATIONS = [
    {
      id: "knv-1", who: "Zeynep Arslan", channel: "WhatsApp", open: true,
      msgs: [
        { t: S(8, 12, 4),  dir: "in",  text: "Merhaba, şeffaf plak tedavisi ne kadar sürüyor?" },
        { t: S(8, 12, 13), dir: "out", text: "Ortalama 8 ila 14 ay sürüyor. Süre, diş sıralamasındaki kaymanın miktarına göre değişiyor. Muayenede hekimimiz size net bir plan çıkarıyor.", src: "Tedavi rehberi · Ortodonti" },
        { t: S(8, 12, 51), dir: "in",  text: "Ücret aralığı nedir?" },
        { t: S(8, 13, 2),  dir: "out", text: "Klinik fiyat listemizde şeffaf plak tedavisi 42.000 TL'den başlıyor. Kesin tutar muayeneden sonra belirleniyor.", src: "Fiyat listesi · 2026 Q1" },
        { t: S(8, 13, 40), dir: "in",  text: "Bu hafta muayene için yeriniz var mı?" },
        { t: S(8, 13, 47), dir: "out", text: "Perşembe 14:00'te Dr. Sinan Yalçın için uygun bir yer var. Ayırayım mı?", src: "Takvim · canlı uygunluk" },
        { t: S(8, 14, 20), dir: "in",  text: "Olur, ayırın." },
        { t: S(8, 14, 28), dir: "out", text: "Randevunuz oluşturuldu. Perşembe 14:00, Dr. Sinan Yalçın. Bir gün önce hatırlatma göndereceğim.", src: "Randevu kaydı · APT-4471" }
      ]
    },
    {
      id: "knv-2", who: "Mert Doğan", channel: "WhatsApp", open: false,
      msgs: [
        { t: S(12, 40, 10), dir: "in",  text: "Yarınki randevuma gelemeyeceğim." },
        { t: S(12, 40, 16), dir: "out", text: "Anlıyorum. İptal mi edeyim, yoksa başka bir saate mi alayım?" },
        { t: S(12, 41, 2),  dir: "in",  text: "Başka saate alalım." },
        { t: S(12, 41, 11), dir: "out", text: "Cuma 10:30 ve Pazartesi 16:00 uygun. Hangisi olsun?" },
        { t: S(12, 42, 30), dir: "in",  text: "Cuma 10:30 olsun." },
        { t: S(12, 42, 37), dir: "out", text: "Randevunuz Cuma 10:30'a alındı. Resepsiyona da not düştüm." }
      ]
    },
    {
      id: "knv-3", who: "Hakan Ürgüplü", channel: "SMS", open: false,
      msgs: [
        { t: S(14, 32, 0),  dir: "out", text: "Bugün 14:15 randevunuza gelemediğinizi görüyorum. Yeni bir saat ayarlayalım mı?" },
        { t: S(15, 18, 40), dir: "in",  text: "Evet, unuttum. Yarın olur mu?" },
        { t: S(15, 18, 45), dir: "out", text: "Yarın 11:30 ve 15:45 uygun." },
        { t: S(15, 19, 20), dir: "in",  text: "11:30." },
        { t: S(15, 19, 32), dir: "out", text: "Yarın 11:30 için kaydınızı aldım." },
        { t: S(15, 22, 10), dir: "in",  text: "Adres neydi?" },
        { t: S(15, 22, 18), dir: "out", text: "Caferağa Mahallesi, Moda Caddesi. Klinik girişi sokak seviyesinde." },
        { t: S(15, 23, 0),  dir: "in",  text: "Teşekkürler." },
        { t: S(15, 23, 9),  dir: "out", text: "Rica ederim. Yarın 11:30'da görüşmek üzere." }
      ]
    }
  ];

  /* The appointment book. `created` is when the row came into existence, which
     is what lets the 14:00 slot appear mid-scroll with its provenance. */
  var BOOK = [
    { t: S(9, 30),  title: "Kontrol muayenesi", who: "Elif Karataş",  dr: "Dr. Sinan Yalçın",   created: S(7, 0),      arrived: S(9, 28) },
    { t: S(10, 15), title: "Dolgu",             who: "Burak Şentürk", dr: "Dr. Ayla Demirtaş",  created: S(7, 0),      arrived: S(10, 12) },
    { t: S(11, 0),  title: "İlk görüşme",       who: "Mert Doğan",    dr: "Dr. Sinan Yalçın",   created: S(7, 0),      arrived: S(10, 57) },
    { t: S(12, 0),  title: "Öğle bloğu",        block: true },
    { t: S(14, 0),  title: "Muayene",           who: "Zeynep Arslan", dr: "Dr. Sinan Yalçın",   created: S(8, 14, 28), arrived: S(13, 56), origin: "asistan · APT-4471" },
    { t: S(14, 15), title: "Takip randevusu",   who: "Hakan Ürgüplü", dr: "Dr. Ayla Demirtaş",  created: S(7, 0),      missed:  S(14, 30) },
    { t: S(15, 15), title: "Diş taşı temizliği",who: "Cem Aydın",     dr: "Dr. Ayla Demirtaş",  created: S(7, 0),      arrived: S(15, 11) },
    { t: S(16, 30), title: "Yeni hasta danışma",who: "Selin Kaya",    dr: "Dr. Ayla Demirtaş",  created: S(11, 5),     arrived: S(16, 26) }
  ];

  var FLOWS = [
    { name: "Randevu hatırlatması", chain: ["randevudan 24 sa önce", "hasta onayı var", "mesaj gönder"], last: S(9, 2),   note: "4 alıcı" },
    { name: "Gelmedi kurtarma",     chain: ["randevu +15 dk, geliş yok", "aynı hafta boş slot var", "yeni saat öner"], last: S(14, 32), note: "1 randevu" },
    { name: "Takip çağrısı",        chain: ["tedavi bitiminden 7 gün sonra", "takip planlanmamış", "hatırlat"], last: S(11, 15), note: "2 hasta" },
    { name: "İç bildirim",          chain: ["iptal geldi", "randevuya 24 sa'den az", "resepsiyonu uyar"], last: S(12, 41), note: "1 bildirim" },
    { name: "Boş slot doldurma",    chain: ["iptal sonrası boş slot", "bekleme listesi dolu", "sıradakine teklif et"], last: S(12, 44), note: "1 teklif" },
    { name: "Günlük özet",          chain: ["gün sonu 17:15", "koşulsuz", "özeti üret ve gönder"], last: S(17, 15), note: "1 rapor" }
  ];

  var ALERTS = [
    { t: S(9, 2),   text: "Yarının 4 randevusu için hatırlatma gönderildi." },
    { t: S(11, 38), text: "Dr. Ayla Demirtaş'ın yarınki takviminde 2 boş slot kaldı." },
    { t: S(12, 41), text: "Mert Doğan yarınki randevusunu Cuma 10:30'a taşıdı." },
    { t: S(14, 32), text: "Hakan Ürgüplü 14:15 randevusuna <b>gelmedi</b>. Kurtarma akışı başlatıldı.", flag: true },
    { t: S(15, 24), text: "Kurtarma tamamlandı. Hakan Ürgüplü yarın 11:30'a alındı." },
    { t: S(16, 34), text: "Selin Kaya ilk görüşmeye geldi. Tedavi planı bekliyor." },
    { t: S(17, 12), text: "Yarın sabahki randevular için hatırlatmalar kuyruğa alındı." },
    { t: S(17, 15), text: "Günlük özet üretiliyor." },
    { t: S(17, 44), text: "Günlük özet hazır. Klinik sahibine gönderildi." }
  ];

  /* The permission layer, as two real traces of the same pipeline. */
  var TRACES = {
    allow: {
      label: "İzin verildi",
      caption: "08:14:20 · Zeynep Arslan · \"Olur, ayırın.\"",
      steps: [
        { name: "Mesaj alındı",       payload: "kanal=whatsapp gonderen=+90 5** *** 41 20 metin=\"Olur, ayırın.\"" },
        { name: "Niyet çözümlendi",   payload: "arac=<u>randevu.olustur</u> hekim=sinan.yalcin slot=14:00 sure=30dk" },
        { name: "İzin kontrolü",      payload: "rol=ai:asistan kapsam=<u>randevu.yaz</u> kiracı=meridyen sonuc=<u>izin verildi</u>" },
        { name: "Deterministik akış", payload: "slot kilidi alındı · çakışma kontrolü geçti · hasta kaydı eşleşti" },
        { name: "Veritabanı",         payload: "appointments +1 satır (kiracı=meridyen) ref=<u>APT-4471</u>" },
        { name: "Denetim kaydı",      payload: "aktor=ai:asistan islem=appointment.create sonuc=ok ref=APT-4471" }
      ]
    },
    deny: {
      label: "Reddedildi",
      caption: "16:07:11 · adı gizlenmiş hasta · \"Kaydımı tamamen silin.\"",
      steps: [
        { name: "Mesaj alındı",       payload: "kanal=whatsapp gonderen=+90 5** *** 08 74 metin=\"Kaydımı tamamen silin.\"" },
        { name: "Niyet çözümlendi",   payload: "arac=<s>hasta.kaydi.sil</s> hasta=PAT-2210" },
        { name: "İzin kontrolü",      payload: "rol=ai:asistan kapsam=<s>hasta.sil</s> sonuc=<s>reddedildi</s>", halt: true },
        { name: "Deterministik akış", payload: "çalıştırılmadı" },
        { name: "Veritabanı",         payload: "yazma yok · okuma yok" },
        { name: "Denetim kaydı",      payload: "aktor=ai:asistan islem=patient.delete sonuc=denied · <u>insan onayına yönlendirildi</u>" }
      ]
    }
  };

  var PERMS = ["randevu.oku", "randevu.yaz", "hasta.oku", "hasta.yaz", "hasta.sil", "rapor.oku", "ayar.yaz", "denetim.oku"];
  var ROLES = [
    { id: "sahip", name: "Klinik sahibi", note: "tam yetki", perms: PERMS.slice() },
    { id: "hekim", name: "Hekim", note: "kendi hastaları", perms: ["randevu.oku", "randevu.yaz", "hasta.oku", "hasta.yaz", "rapor.oku"] },
    { id: "resepsiyon", name: "Resepsiyon", note: "takvim ve iletişim", perms: ["randevu.oku", "randevu.yaz", "hasta.oku"] },
    { id: "asistan", name: "AI asistan", note: "resepsiyondan geniş değil", perms: ["randevu.oku", "randevu.yaz", "hasta.oku"] }
  ];

  var SPECS = [
    ["Kiracı izolasyonu", "Her klinik kendi veri alanında çalışır. Kiracı kimliği taşımayan sorgu çalıştırılmaz."],
    ["Denetim kaydı", "Kayıt değiştiren her işlem aktör, zaman ve gerekçe ile yazılır. Yapay zekâ işlemleri ayrıca işaretlenir."],
    ["Şifreleme", "Aktarımda TLS, durağan veride hassas alanlar için alan bazlı şifreleme."],
    ["En az yetki", "Her rol yalnızca işini yapacak kadar yetki alır. Yetki genişletmek insan onayına bağlıdır."],
    ["İnsan onayı", "Silme, kayıt birleştirme ve toplu gönderim otomatik çalıştırılmaz."],
    ["Yedekleme ve geri dönüş", "Günlük yedek, noktadan geri dönüş ve düzenli geri yükleme tatbikatı."],
    ["Veri saklama", "Saklama süresini klinik tanımlar. Süre dolduğunda kayıt otomatik olarak arşivlenir."],
    ["KVKK", "Üretime geçmeden önce KVKK uyum değerlendirmesi yapılır. Bu sayfa bir uyum beyanı değildir."]
  ];

  /* The stamps the day rail collects. */
  var STAMPS = [
    { t: S(8, 12),  label: "İlk mesaj geldi" },
    { t: S(8, 14),  label: "Randevu oluşturuldu · 14:00" },
    { t: S(9, 2),   label: "Hatırlatmalar gönderildi" },
    { t: S(9, 28),  label: "Elif Karataş geldi" },
    { t: S(10, 57), label: "Mert Doğan geldi" },
    { t: S(12, 41), label: "İptal yeniden planlandı" },
    { t: S(13, 56), label: "Zeynep Arslan geldi" },
    { t: S(14, 30), label: "14:15 randevusuna gelinmedi", flag: true },
    { t: S(15, 24), label: "Kurtarma tamamlandı" },
    { t: S(16, 26), label: "Selin Kaya geldi" },
    { t: S(17, 45), label: "Günlük özet üretildi" }
  ];

  /* ============================================================ derived == */

  var appts = BOOK.filter(function (r) { return !r.block; });
  var planned = appts.length;
  var arrived = appts.filter(function (r) { return r.arrived; }).length;
  var missed = appts.filter(function (r) { return r.missed; }).length;
  var byAssistant = appts.filter(function (r) { return r.origin; }).length;
  var lastArrival = appts.reduce(function (m, r) { return r.arrived && r.arrived > m ? r.arrived : m; }, 0);

  var allMsgs = CONVERSATIONS.reduce(function (a, c) { return a.concat(c.msgs); }, []);
  var replies = allMsgs.filter(function (m) { return m.dir === "out"; }).length;

  /* Mean first-response time, measured across every reply that actually
     answers an inbound message in the same conversation. */
  var lat = [];
  CONVERSATIONS.forEach(function (c) {
    for (var i = 1; i < c.msgs.length; i++) {
      if (c.msgs[i].dir === "out" && c.msgs[i - 1].dir === "in") lat.push(c.msgs[i].t - c.msgs[i - 1].t);
    }
  });
  var meanLat = lat.length ? lat.reduce(function (a, b) { return a + b; }, 0) / lat.length : 0;

  var perDoctor = {};
  appts.forEach(function (r) { perDoctor[r.dr] = (perDoctor[r.dr] || 0) + 1; });
  var doctorRank = Object.keys(perDoctor).sort(function (a, b) { return perDoctor[b] - perDoctor[a]; });

  var recovered = appts.filter(function (r) { return r.missed; }).length; // one, rebooked next day

  /* The daily summary is assembled from the numbers above, never written out. */
  var SUMMARY = [
    { t: S(17, 15), html: "Bugün <b>" + planned + "</b> randevu planlandı, <b>" + arrived + "</b> hasta geldi, <b>" + missed + "</b> randevu boşa çıktı." },
    { t: S(17, 22), html: "Boşa çıkan randevu aynı gün kurtarıldı ve yarın 11:30'a alındı." },
    { t: S(17, 29), html: "Asistan <b>" + CONVERSATIONS.length + "</b> konuşmada <b>" + replies + "</b> yanıt verdi. Ortalama ilk yanıt süresi <b>" + tr(meanLat.toFixed(1)) + " saniye</b>." },
    { t: S(17, 36), html: doctorRank.map(function (d) { return d + " <b>" + perDoctor[d] + "</b>"; }).join(", ") + " randevu gördü." },
    { t: S(17, 43), html: "Öneri: 12:00 ile 13:00 arası bugün bloklu. Bloğu 30 dakika kısaltmak günde bir kontrol randevusu daha açar." }
  ];

  /* ================================================== the clinic clock === */
  /* Each act owns a stretch of the working day. Scroll position inside the act
     maps linearly onto that stretch, so the clock is continuous and monotonic
     across the whole page. */
  var SCHEDULE = [
    { id: "act-gelen",     t0: S(8, 12, 6), t1: S(8, 15, 10) },
    { id: "act-yetki",     t0: S(8, 15, 10), t1: S(8, 55) },
    { id: "act-randevu",   t0: S(8, 55),  t1: S(14, 20) },
    { id: "act-otomasyon", t0: S(14, 20), t1: S(15, 30) },
    { id: "act-panel",     t0: S(15, 30), t1: S(17, 55) },
    { id: "act-guvenlik",  t0: S(17, 55), t1: S(18, 20) },
    { id: "act-kurulum",   t0: S(18, 20), t1: S(18, 40) }
  ];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  var segs = [];
  function measure() {
    var max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    segs = SCHEDULE.map(function (s) {
      var node = document.getElementById(s.id);
      if (!node) return null;
      var r = node.getBoundingClientRect();
      var top = r.top + scrollY;
      /* A pinned act is only STUCK for (height - viewport); the rest of its box
         is the slide-off, during which its stage is leaving the screen. Ending
         the act's clinic window at the end of its pinned travel keeps the whole
         working day playing out while the surface it belongs to is still held.
         Otherwise the last third of every act's time, the daily summary
         included, happens against a stage already on its way out. */
      var pinned = node.getAttribute("data-sc-act") !== "flow";
      var end = top + r.height - (pinned ? innerHeight : 0);
      return { id: s.id, node: node, t0: s.t0, t1: s.t1, top: top, bottom: Math.max(end, top + 1) };
    }).filter(Boolean);
    if (segs.length) {
      segs[0].top = 0;
      segs[segs.length - 1].bottom = max;
      for (var i = 1; i < segs.length; i++) segs[i].top = segs[i - 1].bottom;
      for (i = 0; i < segs.length; i++) if (segs[i].bottom <= segs[i].top) segs[i].bottom = segs[i].top + 1;
    }
    return max;
  }

  function scrollToTime(t) {
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (t <= s.t1 || i === segs.length - 1) {
        var local = clamp((t - s.t0) / Math.max(s.t1 - s.t0, 1), 0, 1);
        return s.top + local * Math.max(s.bottom - s.top, 1);
      }
    }
    return 0;
  }

  function timeAt(y) {
    if (!segs.length) return SCHEDULE[0].t0;
    if (y <= segs[0].top) return segs[0].t0;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (y < s.bottom || i === segs.length - 1) {
        var local = clamp((y - s.top) / Math.max(s.bottom - s.top, 1), 0, 1);
        return s.t0 + local * (s.t1 - s.t0);
      }
    }
    return segs[segs.length - 1].t1;
  }

  function segIndexAt(y) {
    for (var i = 0; i < segs.length; i++) if (y < segs[i].bottom || i === segs.length - 1) return i;
    return 0;
  }

  /* ================================================================ DOM == */

  var railTrack, railHand, railCount, clockEl;
  var threadBody, threadMeta, srcBody, bookBody, alertBody, summaryBody;

  function buildStatic() {
    /* --- sidebar module list doubles as navigation --- */
    var nav = $(".k-nav");
    SCHEDULE.forEach(function (s, i) {
      var link = el("a");
      link.href = "#" + s.id;
      link.dataset.seg = String(i);
      /* The index is a visual marker only: without aria-hidden a screen
         reader announces the link as "01Gelen kutusu". */
      link.innerHTML = '<em aria-hidden="true">' + pad(i + 1) + "</em>" + NAV_LABELS[i];
      nav.appendChild(link);
    });

    /* --- the day rail --- */
    railTrack = $(".k-rail__track");
    for (var hr = 9; hr <= 18; hr++) {
      var tick = el("i", "k-tick" + (hr % 2 ? "" : " k-tick--major"));
      tick.style.setProperty("--pos", ((S(hr, 0) - DAY_OPEN) / (DAY_CLOSE - DAY_OPEN)).toFixed(4));
      if (hr % 2 === 0) tick.dataset.h = pad(hr);
      railTrack.appendChild(tick);
    }
    STAMPS.forEach(function (st, i) {
      var pos = (st.t - DAY_OPEN) / (DAY_CLOSE - DAY_OPEN);
      var node = el("div", "k-stamp" + (st.flag ? " k-stamp--flag" : ""));
      node.style.setProperty("--pos", pos.toFixed(4));
      node.dataset.t = String(st.t);
      var b = el("button");
      b.type = "button";
      b.setAttribute("aria-label", hhmm(st.t) + " · " + st.label);
      b.addEventListener("click", function () {
        scrollTo({ top: scrollToTime(st.t + 30), behavior: REDUCE ? "auto" : "smooth" });
      });
      node.appendChild(b);
      node.appendChild(el("span", "k-stamp__tip", hhmm(st.t) + " · " + st.label));
      railTrack.appendChild(node);
    });
    railHand = $(".k-rail__hand");
    railCount = $(".k-rail__count");
    clockEl = $(".k-status__clock b");

    /* --- act 1 --- */
    threadBody = $(".k-thread .k-panel__body");
    threadMeta = $(".k-thread .k-meta");
    srcBody = $(".k-src .k-panel__body");

    /* --- act 2, the permission traces --- */
    var tabs = $(".k-tabs");
    ["allow", "deny"].forEach(function (key, i) {
      var b = el("button", "k-tab", TRACES[key].label);
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.setAttribute("aria-controls", "trace-panel");
      b.id = "tab-" + key;
      b.addEventListener("click", function () { showTrace(key); });
      tabs.appendChild(b);
    });
    showTrace("allow");

    /* --- act 3 --- */
    bookBody = $(".k-book .k-panel__body");

    /* --- act 4 --- */
    var flows = $(".k-flows");
    FLOWS.forEach(function (f) {
      var card = el("article", "k-flow");
      card.appendChild(el("h3", null, f.name));
      var chain = el("div", "k-flow__chain");
      f.chain.forEach(function (c) { chain.appendChild(el("span", null, c)); });
      card.appendChild(chain);
      card.appendChild(el("p", "k-flow__last", "son çalışma " + hhmm(f.last) + " · " + f.note));
      flows.appendChild(card);
    });

    /* --- act 5 --- */
    alertBody = $(".k-alerts .k-panel__body");
    summaryBody = $(".k-summary .k-panel__body ul");
    SUMMARY.forEach(function (line) {
      var li = el("li", null, line.html);
      li.dataset.t = String(line.t);
      summaryBody.appendChild(li);
    });
    /* Counter targets are computed, then written to the engine's attributes
       before mount. No figure on this page is typed by hand. */
    setCount("fig-planned", planned);
    setCount("fig-arrived", arrived);
    setCount("fig-missed", missed);
    setCount("fig-replies", replies);
    $("#fig-planned-note").textContent = byAssistant + " tanesi asistan tarafından oluşturuldu";
    $("#fig-arrived-note").textContent = "son geliş " + hhmm(lastArrival);
    $("#fig-missed-note").textContent = recovered + " tanesi aynı gün kurtarıldı";
    $("#fig-replies-note").textContent = "ortalama ilk yanıt " + tr(meanLat.toFixed(1)) + " sn";

    /* --- act 6 --- */
    var rl = $(".k-rolelist");
    ROLES.forEach(function (role, i) {
      var b = el("button", null, role.name + "<i>" + role.note + "</i>");
      b.type = "button";
      b.setAttribute("aria-pressed", i === ROLES.length - 1 ? "true" : "false");
      b.addEventListener("click", function () { showRole(role.id); });
      b.dataset.role = role.id;
      rl.appendChild(b);
    });
    showRole("asistan");

    var specs = $(".k-specs");
    SPECS.forEach(function (s) {
      var d = el("div", "k-spec");
      d.appendChild(el("b", null, s[0]));
      d.appendChild(el("span", null, s[1]));
      specs.appendChild(d);
    });

    /* --- act 7 --- */
    wireForm();
  }

  var NAV_LABELS = ["Gelen kutusu", "Yetki katmanı", "Randevu defteri", "Otomasyon", "Panel", "Güvenlik", "Kurulum"];

  function setCount(id, value) {
    var node = document.getElementById(id);
    node.setAttribute("data-sc-count", "0 " + value);
    node.textContent = "0";
  }

  function showTrace(key) {
    var T = TRACES[key];
    $$(".k-tab").forEach(function (b) { b.setAttribute("aria-selected", String(b.id === "tab-" + key)); });
    $("#trace-caption").textContent = T.caption;
    var list = $(".k-trace");
    list.innerHTML = "";
    T.steps.forEach(function (s, i) {
      var li = el("li");
      if (s.halt) li.dataset.halt = "true";
      li.appendChild(el("span", "k-step", pad(i + 1)));
      li.appendChild(el("span", "k-stage-name", s.name));
      li.appendChild(el("span", "k-payload", s.payload));
      list.appendChild(li);
    });
  }

  function showRole(id) {
    var role = ROLES.filter(function (r) { return r.id === id; })[0];
    $$(".k-rolelist button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.role === id)); });
    var grid = $(".k-perm");
    grid.innerHTML = "";
    PERMS.forEach(function (p) {
      var on = role.perms.indexOf(p) > -1;
      var d = el("div");
      d.dataset.on = String(on);
      d.appendChild(el("code", null, p));
      d.appendChild(el("span", "k-chip " + (on ? "k-chip--ok" : "k-chip--idle"), on ? "açık" : "kapalı"));
      grid.appendChild(d);
    });
    $("#role-note").textContent = role.name + " rolü " + role.perms.length + " yetkiye sahip, " +
      (PERMS.length - role.perms.length) + " yetkiye kapalı.";
  }

  function wireForm() {
    var form = $(".k-form");
    var out = $(".k-out");
    function render() {
      var name = ($("#f-name").value || "").trim();
      var docs = clamp(parseInt($("#f-doctors").value, 10) || 1, 1, 40);
      var chans = $$("input[name=kanal]:checked").map(function (i) { return i.value; });
      var flows = 2 + chans.length;
      out.innerHTML = name
        ? "<b>" + escapeHtml(name) + "</b> için " + docs + " hekimli takvim, " +
          (chans.length ? chans.join(" ve ") + " kanalı" : "kanal seçilmedi") +
          ", " + flows + " otomasyon ve " + ROLES.length + " rol hazırlanacak.<br>Kurulum tek oturumda tamamlanır."
        : "Klinik adını yazın, kurulumun ne içereceğini burada gösterelim.";
    }
    form.addEventListener("input", render);
    form.addEventListener("submit", function (e) { e.preventDefault(); render(); $("#f-name").focus(); });
    render();
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ========================================================= renderers == */

  var last = { now: "", thread: "", src: null, book: "", alerts: "", summary: "", clock: "", nav: -1 };

  function renderThread(now) {
    var c = CONVERSATIONS[0];
    var shown = c.msgs.filter(function (m) { return m.t <= now; });
    var next = c.msgs[shown.length];
    /* The assistant is "typing" between an inbound message and its reply. */
    var typing = !!(shown.length && next && next.dir === "out" && now < next.t);
    var key = shown.length + "|" + (typing ? 1 : 0);
    if (key === last.thread) return key;
    last.thread = key;

    threadBody.innerHTML = "";
    if (!shown.length) {
      threadBody.appendChild(el("p", "k-src--empty", "Bugün henüz mesaj gelmedi."));
    }
    shown.forEach(function (m) {
      var b = el("div", "k-msg" + (m.dir === "out" ? " k-msg--out" : ""));
      b.appendChild(el("p", null, escapeHtml(m.text)));
      b.appendChild(el("time", null, hhmmss(m.t) + (m.dir === "out" ? " · asistan" : " · " + c.who)));
      threadBody.appendChild(b);
    });
    if (typing) {
      var t = el("div", "k-msg k-msg--out");
      var dots = el("div", "k-typing", "<i></i><i></i><i></i>");
      dots.setAttribute("aria-label", "Asistan yanıt yazıyor");
      t.appendChild(dots);
      threadBody.appendChild(t);
    }
    threadBody.scrollTop = threadBody.scrollHeight;
    threadMeta.textContent = shown.length + " mesaj";
    return key;
  }

  function renderSources(now) {
    var used = [];
    CONVERSATIONS[0].msgs.forEach(function (m) {
      if (m.dir === "out" && m.src && m.t <= now && used.indexOf(m.src) < 0) used.push(m.src);
    });
    var key = used.join("|");
    if (key === last.src) return;
    last.src = key;
    srcBody.innerHTML = "";
    if (!used.length) {
      srcBody.appendChild(el("p", "k-src--empty", "Asistan henüz bir kaynağa başvurmadı. Yanıt verdiğinde kullandığı kayıt burada listelenir."));
      return;
    }
    var ul = el("ul");
    used.forEach(function (u) {
      var parts = u.split(" · ");
      var li = el("li");
      li.appendChild(el("b", null, parts[0]));
      li.appendChild(el("span", null, parts[1] || ""));
      ul.appendChild(li);
    });
    srcBody.appendChild(ul);
  }

  function renderBook(now) {
    var states = BOOK.map(function (r) {
      if (r.block) return "b";
      if (r.missed && now >= r.missed) return "x";
      if (r.arrived && now >= r.arrived) return "g";
      if (now >= r.created) return "p";
      return "e";
    });
    var key = states.join("");
    if (key === last.book) return key;
    last.book = key;

    bookBody.innerHTML = "";
    BOOK.forEach(function (r, i) {
      var st = states[i];
      var row = el("div", "k-slot" + (st === "b" ? " k-slot--block" : "") + (st === "e" ? " k-slot--empty" : ""));
      if (st === "p" && r.origin && now - r.created < 600) row.className += " k-slot--fresh";
      row.appendChild(el("span", "k-slot__t", hhmm(r.t)));

      var who = el("span", "k-slot__who");
      if (st === "b") who.innerHTML = r.title;
      else if (st === "e") who.textContent = "boş slot";
      else {
        who.innerHTML = escapeHtml(r.who) + "<i>" + escapeHtml(r.title) +
          (r.origin ? " · <span class=\"k-prov\">" + escapeHtml(r.origin) + "</span>" : "") + "</i>";
      }
      row.appendChild(who);
      row.appendChild(el("span", "k-slot__dr", st === "b" || st === "e" ? "" : r.dr));

      var stat = el("span", "k-slot__st");
      if (st === "g") stat.appendChild(el("span", "k-chip k-chip--ok", "geldi"));
      else if (st === "x") stat.appendChild(el("span", "k-chip k-chip--warn", "gelmedi"));
      else if (st === "p") stat.appendChild(el("span", "k-chip k-chip--idle", "planlandı"));
      else if (st === "b") stat.appendChild(el("span", "k-chip k-chip--idle", "kapalı"));
      row.appendChild(stat);
      bookBody.appendChild(row);
    });
    var open = states.filter(function (s) { return s === "e"; }).length;
    var filled = states.filter(function (s) { return s === "p" || s === "g" || s === "x"; }).length;
    $(".k-book .k-meta").textContent = filled + " dolu · " + open + " boş";
    return key;
  }

  function renderAlerts(now) {
    var shown = ALERTS.filter(function (a) { return a.t <= now; }).reverse();
    var key = String(shown.length);
    if (key === last.alerts) return key;
    last.alerts = key;
    alertBody.innerHTML = "";
    if (!shown.length) {
      alertBody.appendChild(el("p", "k-alert__none", "Bugün için bekleyen uyarı yok."));
      return key;
    }
    shown.forEach(function (a) {
      var row = el("div", "k-alert" + (a.flag ? " k-alert--flag" : ""));
      row.appendChild(el("time", null, hhmm(a.t)));
      row.appendChild(el("p", null, a.text));
      alertBody.appendChild(row);
    });
    return key;
  }

  function renderSummary(now) {
    var n = 0;
    $$("li", summaryBody).forEach(function (li) {
      var on = now >= parseInt(li.dataset.t, 10);
      if (on) n++;
      li.classList.toggle("is-on", on);
    });
    var key = String(n);
    if (key !== last.summary) {
      last.summary = key;
      $(".k-summary .k-meta").textContent = n ? n + "/" + SUMMARY.length + " satır" : "17:15'te üretilir";
      $(".k-summary .k-empty").hidden = n > 0;
    }
    return key;
  }

  function renderRail(now) {
    var pos = clamp((now - DAY_OPEN) / (DAY_CLOSE - DAY_OPEN), 0, 1);
    railTrack.style.setProperty("--k-now", pos.toFixed(4));
    railHand.firstElementChild.textContent = hhmm(now);
    var n = 0;
    $$(".k-stamp", railTrack).forEach(function (s) {
      if (now >= parseInt(s.dataset.t, 10)) { s.classList.add("is-on"); }
      if (s.classList.contains("is-on")) n++;
    });
    railCount.textContent = String(n);
    railTrack.setAttribute("aria-valuenow", String(Math.round(now / 60)));
    railTrack.setAttribute("aria-valuetext", hhmm(now) + ", " + n + " kayıt");
  }

  function renderNow(now) {
    var pl = 0, ar = 0, ms = 0;
    appts.forEach(function (r) {
      if (now >= r.created) pl++;
      if (r.arrived && now >= r.arrived) ar++;
      if (r.missed && now >= r.missed) ms++;
    });
    var key = pl + "/" + ar + "/" + ms;
    if (key === last.now) return;
    last.now = key;
    $("#now-planned").textContent = pl;
    $("#now-arrived").textContent = ar;
    $("#now-missed").textContent = ms;
  }

  function renderClock(now) {
    var k = hhmm(now);
    if (k === last.clock) return;
    last.clock = k;
    clockEl.textContent = k;
  }

  function renderNav(idx) {
    if (idx === last.nav) return;
    last.nav = idx;
    $$(".k-nav a").forEach(function (a) {
      a.setAttribute("aria-current", String(parseInt(a.dataset.seg, 10) === idx));
    });
  }

  /* ================================================== the loop and drag == */

  var dragging = false;

  function frame() {
    var y = scrollY;
    var now = timeAt(y);
    var idx = segIndexAt(y);

    renderClock(now);
    renderNow(now);
    renderRail(now);
    renderNav(idx);

    var kThread = renderThread(now);
    renderSources(now);
    var kBook = renderBook(now);
    var kAlerts = renderAlerts(now);
    var kSummary = renderSummary(now);

    /* Publish rendered state so the verification harness can see a timeline
       that lives outside the engine's own devices. These are rendered values,
       not scroll progress. */
    setVerify("act-gelen", "msg:" + kThread);
    setVerify("act-randevu", "book:" + kBook);
    setVerify("act-panel", "alerts:" + kAlerts + "|sum:" + kSummary + "|clock:" + hhmm(now));

    requestAnimationFrame(frame);
  }

  var vcache = {};
  function setVerify(id, value) {
    if (vcache[id] === value) return;
    vcache[id] = value;
    var n = document.getElementById(id);
    if (n) n.setAttribute("data-sc-verify-state", value);
  }

  function wireRailDrag() {
    var track = railTrack;
    function fromEvent(e) {
      var r = track.getBoundingClientRect();
      var horizontal = r.width > r.height;
      var f = horizontal
        ? (e.clientX - r.left) / Math.max(r.width, 1)
        : (e.clientY - r.top) / Math.max(r.height, 1);
      return DAY_OPEN + clamp(f, 0, 1) * (DAY_CLOSE - DAY_OPEN);
    }
    function move(e) {
      if (!dragging) return;
      e.preventDefault();
      scrollTo({ top: scrollToTime(fromEvent(e)), behavior: "instant" });
    }
    track.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".k-stamp")) return;
      dragging = true;
      track.setPointerCapture(e.pointerId);
      move(e);
    });
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", function (e) {
      dragging = false;
      try { track.releasePointerCapture(e.pointerId); } catch (err) {}
    });
    track.addEventListener("pointercancel", function () { dragging = false; });

    track.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 3600 : 900;
      var now = timeAt(scrollY), next = null;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = now - step;
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") next = now + step;
      else if (e.key === "Home") next = DAY_OPEN;
      else if (e.key === "End") next = DAY_CLOSE;
      if (next === null) return;
      e.preventDefault();
      scrollTo({ top: scrollToTime(clamp(next, DAY_OPEN, DAY_CLOSE)), behavior: "instant" });
    });
  }

  /* A pinned act holds one viewport for its whole span, so the engine's
     focusin recentring cannot help a control inside one. The close act uses a
     greet-and-hold cue so its form is lit for the whole act, and this parks
     the page at the act's start if focus arrives from outside it. */
  function wireFocusPark() {
    var close = document.getElementById("act-kurulum");
    close.addEventListener("focusin", function () {
      var r = close.getBoundingClientRect();
      if (r.top > innerHeight * 0.5) scrollTo({ top: close.offsetTop, behavior: "instant" });
    });
  }

  /* ================================================================ go == */

  function boot() {
    buildStatic();
    measure();
    wireRailDrag();
    wireFocusPark();

    /* Mount the engine only after the computed counter targets are in the DOM,
       because it reads data-sc-count once at mount. */
    ScrollCraft.mount(document.body);

    addEventListener("resize", function () { measure(); }, { passive: true });
    addEventListener("load", function () { measure(); dispatchEvent(new Event("resize")); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); });

    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
