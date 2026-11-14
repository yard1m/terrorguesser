"use strict";

/* TerrorGuesser: one clue-ladder engine, three sections, two languages. */

const GAME_LEN = 10;
const MAX_GUESSES = 3;
const POINTS = [500, 400, 300, 200, 100];
const CLUE_COUNT = 4;
const BONUS_MAX = 250;
const IP_BASE = "https://ws-public.interpol.int/notices/v1/red";

/* ---------------- language ---------------- */
const T = {
  en: {
    "nav.record": "Record", "nav.sources": "Sources", "nav.back": "← All sections", "nav.codex": "Codex", "nav.back2": "← Back",
    "codex.kicker": "Every organisation in the game", "codex.title": "The Codex",
    "codex.lede": "What each group was, what it wanted and what it did. In the Türkiye section the labels are the Turkish state's; in the Interpol section they come from the charges written by the countries that issued the notices.",
    "codex.tab.turkey": "Türkiye", "codex.tab.global": "Global", "codex.tab.interpol": "Interpol charges",
    "codex.count": "{n} people in the game", "codex.bucket": "Easy mode groups it under: {b}", "codex.members": "In the game: {m}",
    "codex.ipnote": "When a notice lists several charges, the first category in this list that matches wins.", "codex.attacks": "{n} attacks in the game", "codex.tab.lone": "Lone attackers", "sec.lone.desc": "Shooters and bombers who acted alone, with no organisation. Guess the ideology: neo-Nazi, jihadist, anti-government and more.", "sec.lone.meta": "{n} attacks · {k} ideologies",
    "mode.codex": "Read about the organisations first →", "v.codex": "More in the Codex", "game.whatAre": "What are these groups? Open the Codex", "game.whatCats": "What do these categories cover?", "game.whatIdeo": "What do these ideologies mean? Open the Codex", "game.info": "About this organisation",
    "home.kicker": "A guessing game built on public wanted lists",
    "hud.file": "File", "hud.score": "Score", "hud.streak": "Streak", "stamp.ok": "Identified", "stamp.bad": "Unresolved",
    "home.lede": "Every face here comes from a public record: Turkey's terror-wanted list, the history of political violence, or Interpol's red notices. Look at the photo and name the group. If you're stuck, open a clue, but each one costs points.",
    "sec.turkey.desc": "People on the Interior Ministry's terror-wanted list.",
    "sec.turkey.meta": "{n} people · list of {d}",
    "sec.global.title": "Global",
    "sec.global.desc": "Members of historical organisations, from Narodnaya Volya in 1881 to the Islamic State.",
    "sec.global.meta": "{n} people · {k} organisations",
    "sec.interpol.desc": "Live red notices. Here you guess the charge, not the group.",
    "sec.interpol.meta": "Live from interpol.int",
    "mode.points": "Up to {n} points a file",
    "rules.base": "Ten files a game, three guesses each. A wrong guess opens the next clue.",
    "rules.bonus": "If you name the group before the birthplace is shown, you get a bonus: mark the birthplace on a map for up to 250 extra points.",
    "rules.keys": "Keys: 1–6 to answer, H for a clue, Enter for the next file.",
    "game.hidden": "Not shown yet",
    "game.hint": "Show the next clue", "game.noHint": "All clues are shown",
    "game.left": "{n} guesses left", "game.left1": "1 guess left", "game.left0": "No guesses left",
    "game.file": "File {n}",
    "game.loading": "Loading photo…", "game.noPhoto": "Photo unavailable",
    "hud": "File <b>{i}</b> of {n} · <b>{s}</b> points · streak <b>{k}</b>",
    "v.right0": "Correct, from the photo alone.", "v.right": "Correct, with {n} clues.", "v.right1": "Correct, with one clue.", "v.wrong": "Not this time.",
    "v.next": "Next file", "v.results": "See results",
    "v.charge": "The category comes from the charge as the requesting country wrote it:",
    "bonus.q": "Bonus: where was this person born?", "bonus.how": "Click the map.",
    "bonus.skip": "Skip the bonus", "bonus.res": "{km} km away · <b>+{p}</b>",
    "err.title": "The file couldn't be loaded.", "err.ip": "Interpol's servers didn't answer. They sometimes block traffic for a while. Try again in a minute, or play another section.", "err.gen": "Something went wrong while loading this file.", "err.back": "Back to sections",
    "end.kicker": "Results · {s}", "end.score": "{n} points",
    "end.line": "{ok} of {n} correct. Your best here is {b} points.",
    "end.byAnswer": "By answer", "end.mistakes": "Mistakes", "end.thisGame": "This game",
    "end.slip": "You said <em>{w}</em>; it was <em>{t}</em>", "end.noSlips": "No wrong guesses.",
    "end.again": "Play again", "end.switch": "Change section", "end.th.answer": "Answer", "end.th.got": "Correct",
    "stats.title": "Your record", "stats.reset": "Reset", "stats.none": "Finish a game and your accuracy will show up here.",
    "stats.games": "{g} games · longest streak {s}", "stats.best": "best {b}",
    "footer": "Everyone here is accused, not convicted, unless the record says otherwise. Organisation labels are those of the issuing authorities. Photos load from their original sources and are not stored on this site.",
    "about": `<h2>Sources</h2>
      <h3>Türkiye</h3><p>The Interior Ministry's public <a href="https://www.terorarananlar.pol.tr/tarananlar" target="_blank" rel="noopener">terror-wanted list</a>, covering the red, orange, yellow and grey lists. Some labels are disputed. Turkey designates the Gülen movement ("FETÖ/PDY") a terrorist organisation, but most other countries do not. People without a photo are left out.</p>
      <h3>Global</h3><p>A hand-picked list of documented members of historical organisations, with photos from Wikimedia Commons and dates from Wikidata. It includes only people who are dead, were convicted, or openly admitted their role. Every match was checked against its Wikipedia article. Lone-actor mass shooters are left out: they belong to no organisation, and galleries of their faces are what their admirers circulate.</p>
      <h3>Interpol</h3><p>Red notices are requests to find and provisionally arrest someone. They are not convictions. Notices are fetched live from Interpol, a few per game, and each charge is sorted into a category by keyword. Most notices have nothing to do with terrorism.</p>
      <p class="small">Maps: Natural Earth, tr-geojson, turkey-cities-districts-json.</p>`,
  },
  tr: {
    "nav.record": "Geçmiş", "nav.sources": "Kaynaklar", "nav.back": "← Tüm bölümler", "nav.codex": "Kodeks", "nav.back2": "← Geri",
    "codex.kicker": "Oyundaki tüm örgütler", "codex.title": "Kodeks",
    "codex.lede": "Her örgütün ne olduğu, ne istediği ve ne yaptığı. Türkiye bölümündeki nitelendirmeler Türk devletine aittir; Interpol bölümündekiler ise bültenleri yayımlayan ülkelerin yazdığı suçlamalardan gelir.",
    "codex.tab.turkey": "Türkiye", "codex.tab.global": "Dünya", "codex.tab.interpol": "Interpol suçlamaları",
    "codex.count": "Oyunda {n} kişi", "codex.bucket": "Kolay modda şu başlık altında: {b}", "codex.members": "Oyunda: {m}",
    "codex.ipnote": "Bir bültende birden fazla suçlama varsa, bu listede ilk eşleşen kategori geçerli olur.", "codex.attacks": "Oyunda {n} saldırı", "codex.tab.lone": "Yalnız saldırganlar", "sec.lone.desc": "Örgütü olmadan tek başına saldıran tetikçiler ve bombacılar. İdeolojiyi tahmin et: neo-Nazi, cihatçı, devlet karşıtı ve dahası.", "sec.lone.meta": "{n} saldırı · {k} ideoloji",
    "mode.codex": "Önce örgütleri oku →", "v.codex": "Kodeks'te daha fazlası", "game.whatAre": "Bu örgütler ne? Kodeks'i aç", "game.whatCats": "Bu kategoriler neyi kapsıyor?", "game.whatIdeo": "Bu ideolojiler ne anlama geliyor? Kodeks'i aç", "game.info": "Bu örgüt hakkında",
    "home.kicker": "Kamuya açık aranan listeleri üzerine bir tahmin oyunu",
    "hud.file": "Dosya", "hud.score": "Puan", "hud.streak": "Seri", "stamp.ok": "Teşhis edildi", "stamp.bad": "Çözülemedi",
    "home.lede": "Buradaki her yüz kamuya açık bir kayıttan geliyor: Türkiye'nin terörden arananlar listesi, siyasi şiddetin tarihi ya da Interpol'ün kırmızı bültenleri. Fotoğrafa bak ve örgütü söyle. Takılırsan bir ipucu aç, ama her ipucu puan götürür.",
    "sec.turkey.desc": "İçişleri Bakanlığı'nın terörden arananlar listesindeki kişiler.",
    "sec.turkey.meta": "{n} kişi · {d} tarihli liste",
    "sec.global.title": "Dünya",
    "sec.global.desc": "1881'deki Narodnaya Volya'dan İslam Devleti'ne, tarihteki örgütlerin üyeleri.",
    "sec.global.meta": "{n} kişi · {k} örgüt",
    "sec.interpol.desc": "Canlı kırmızı bültenler. Burada örgütü değil, suçlamayı tahmin ediyorsun.",
    "sec.interpol.meta": "interpol.int'ten canlı",
    "mode.points": "Dosya başına en fazla {n} puan",
    "rules.base": "Oyun başına on dosya, her dosyada üç tahmin. Yanlış tahmin bir sonraki ipucunu açar.",
    "rules.bonus": "Doğum yeri gösterilmeden örgütü bilirsen bonus kazanırsın: doğum yerini haritada işaretle, 250 puana kadar ek puan al.",
    "rules.keys": "Kısayollar: cevap için 1–6, ipucu için H, sonraki dosya için Enter.",
    "game.hidden": "Henüz gösterilmedi",
    "game.hint": "Sonraki ipucunu göster", "game.noHint": "Tüm ipuçları açık",
    "game.left": "{n} tahmin kaldı", "game.left1": "1 tahmin kaldı", "game.left0": "Tahmin hakkı kalmadı",
    "game.file": "Dosya {n}",
    "game.loading": "Fotoğraf yükleniyor…", "game.noPhoto": "Fotoğraf yok",
    "hud": "Dosya <b>{i}</b>/{n} · <b>{s}</b> puan · seri <b>{k}</b>",
    "v.right0": "Doğru, yalnızca fotoğraftan.", "v.right": "Doğru, {n} ipucuyla.", "v.wrong": "Bu sefer olmadı.",
    "v.next": "Sonraki dosya", "v.results": "Sonuçları gör",
    "v.charge": "Kategori, talep eden ülkenin yazdığı suçlama metninden çıkarıldı:",
    "bonus.q": "Bonus: bu kişi nerede doğdu?", "bonus.how": "Haritaya tıkla.",
    "bonus.skip": "Bonusu geç", "bonus.res": "{km} km uzakta · <b>+{p}</b>",
    "err.title": "Dosya yüklenemedi.", "err.ip": "Interpol'ün sunucuları yanıt vermedi. Bazen bir süreliğine trafiği engelliyorlar. Bir dakika sonra tekrar dene ya da başka bir bölüm oyna.", "err.gen": "Dosya yüklenirken bir sorun çıktı.", "err.back": "Bölümlere dön",
    "end.kicker": "Sonuçlar · {s}", "end.score": "{n} puan",
    "end.line": "{n} dosyadan {ok} doğru. Bu bölümdeki en iyi skorun {b} puan.",
    "end.byAnswer": "Cevaplara göre", "end.mistakes": "Hatalar", "end.thisGame": "Bu oyun",
    "end.slip": "<em>{w}</em> dedin; doğrusu <em>{t}</em>", "end.noSlips": "Hiç yanlış tahmin yok.",
    "end.again": "Tekrar oyna", "end.switch": "Bölüm değiştir", "end.th.answer": "Cevap", "end.th.got": "Doğru",
    "stats.title": "Geçmişin", "stats.reset": "Sıfırla", "stats.none": "Bir oyunu bitirdiğinde doğruluk oranın burada görünecek.",
    "stats.games": "{g} oyun · en uzun seri {s}", "stats.best": "en iyi {b}",
    "footer": "Kayıt aksini söylemedikçe buradaki herkes hüküm giymiş değil, suçlanan kişidir. Örgüt adları, kaydı yayımlayan makamlara aittir. Fotoğraflar kendi kaynaklarından yüklenir, bu sitede saklanmaz.",
    "about": `<h2>Kaynaklar</h2>
      <h3>Türkiye</h3><p>İçişleri Bakanlığı'nın kamuya açık <a href="https://www.terorarananlar.pol.tr/tarananlar" target="_blank" rel="noopener">terörden arananlar listesi</a> (kırmızı, turuncu, sarı ve gri listeler). Bazı nitelendirmeler tartışmalıdır: Türkiye Gülen hareketini ("FETÖ/PDY") terör örgütü olarak tanır, çoğu ülke tanımaz. Fotoğrafı olmayan kişiler oyuna alınmadı.</p>
      <h3>Dünya</h3><p>Tarihteki örgütlerin belgelenmiş üyelerinden elle seçilmiş bir liste. Fotoğraflar Wikimedia Commons'tan, tarihler Wikidata'dan. Yalnızca ölmüş, hüküm giymiş ya da rolünü açıkça kabul etmiş kişiler var. Her eşleşme Wikipedia maddesiyle kontrol edildi. Tek başına katliam yapan saldırganlar bilerek dışarıda bırakıldı: bir örgütleri yok ve yüzlerinden oluşan galeriler, hayranlarının elden ele dolaştırdığı şey.</p>
      <h3>Interpol</h3><p>Kırmızı bültenler, bir kişinin bulunup geçici olarak tutuklanması talebidir; mahkûmiyet değildir. Bültenler oyun başına birkaç tane olmak üzere Interpol'den canlı çekilir ve her suçlama anahtar kelimelerle bir kategoriye ayrılır. Bültenlerin çoğunun terörle ilgisi yoktur.</p>
      <p class="small">Haritalar: Natural Earth, tr-geojson, turkey-cities-districts-json.</p>`,
  },
};
let LANG = (() => { try { const s = localStorage.getItem("tg.lang"); if (s === "tr" || s === "en") return s; } catch { /* no storage */ } return (navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "en"; })();
const t = (k, v = {}) => (T[LANG][k] ?? T.en[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? "");
const L = (en, tr) => (LANG === "tr" && tr ? tr : en);

/* ---------------- helpers ---------------- */
const $ = (id) => document.getElementById(id);
const fold = (s) => (s || "").replace(/İ/g, "I").replace(/ı/g, "i").normalize("NFKD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
const fmt = (n) => Number(n).toLocaleString(LANG === "tr" ? "tr-TR" : "en-US");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rand = (n) => Math.floor(Math.random() * n);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const regionCache = {};
const country = (code) => {
  if (!code) return "?";
  try { regionCache[LANG] ||= new Intl.DisplayNames([LANG], { type: "region" }); return regionCache[LANG].of(code) || code; } catch { return code; }
};
const flag = (c) => (c && /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map((x) => 127397 + x.charCodeAt(0))) : "");
const flagged = (c) => `<span class="flag">${flag(c)}</span>${esc(country(c))}`;
const store = {
  get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* no storage */ } },
};
const STATS_KEY = "terrorguesser.stats.v2";
const loadStats = () => store.get(STATS_KEY, null) || { games: 0, best: {}, bestStreak: 0, keys: {} };
function km(lat1, lon1, lat2, lon2) {
  const r = (d) => (d * Math.PI) / 180, R = 6371;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* ---------------- maps ---------------- */
const MAPS = { turkey: null, world: null };
const PROJ = {
  turkey: {
    get m() { return MAPS.turkey.meta; },
    xy(lat, lon) { const m = this.m; return [(lon - m.lon0) * m.kx * m.scale, (m.lat0 - lat) * m.scale]; },
    ll(x, y) { const m = this.m; return [m.lat0 - y / m.scale, x / (m.kx * m.scale) + m.lon0]; },
    base(hitProv) { return MAPS.turkey.provinces.map((p) => `<path d="${p.d}"${hitProv && fold(p.name) === fold(hitProv) ? ' class="hit"' : ""}/>`).join(""); },
    scaleKm: 110,
  },
  world: {
    get m() { return MAPS.world.meta; },
    xy(lat, lon) { const m = this.m; return [(lon - m.lon0) * m.scale, (m.lat0 - lat) * m.scale]; },
    ll(x, y) { const m = this.m; return [m.lat0 - y / m.scale, x / m.scale + m.lon0]; },
    base() { return `<path d="${MAPS.world.d}"/>`; },
    scaleKm: 900,
  },
};
function mapSvg(kind, b, withMarker = true) {
  const P = PROJ[kind]; if (!MAPS[kind]) return "";
  const { width: w, height: h } = P.m;
  let mark = "", note = "";
  if (b && b.lat != null && withMarker) {
    const [x, y] = P.xy(b.lat, b.lon);
    if (x >= 0 && x <= w && y >= 0 && y <= h) mark = `<circle class="ring" cx="${x}" cy="${y}" r="6"/><circle class="dot" cx="${x}" cy="${y}" r="4"/>`;
    else if (b.abroad) note = LANG === "tr" ? "Türkiye dışında doğmuş" : "Born outside Turkey";
  } else if (withMarker && b?.ambiguous) note = (LANG === "tr" ? "Bu adda birden fazla ilçe var: " : "More than one district has this name: ") + b.ambiguous.map(esc).join(", ");
  else if (withMarker) note = LANG === "tr" ? "Haritada işaretlenemedi (köy ya da belirsiz yer adı)" : "Not marked on the map (a village or an unclear place name)";
  return `<svg viewBox="0 0 ${w} ${h}" role="img">${P.base(withMarker ? b?.prov : null)}${mark}</svg>${note ? `<p class="map-note">${note}</p>` : ""}`;
}

/* ================= Section: Türkiye ================= */
const TR_BUCKETS = [
  { id: "pkk", en: "PKK/KCK" }, { id: "feto", en: "FETÖ/PDY" }, { id: "dhkpc", en: "DHKP-C" },
  { id: "deas", en: "DEAŞ (ISIS)", tr: "DEAŞ (IŞİD)" }, { id: "left", en: "Other left-wing groups", tr: "Diğer sol örgütler" }, { id: "islamist", en: "Other Islamist groups", tr: "Diğer İslamcı örgütler" },
];
const TR_FAMILIES = [
  { en: "Kurdish armed movement", tr: "Kürt silahlı hareketi", orgs: ["pkk"] },
  { en: "Gülen movement", tr: "Gülen hareketi", orgs: ["feto"] },
  { en: "Far left", tr: "Sol örgütler", orgs: ["dhkpc", "mlkp", "mkp", "tkpml", "tkpmlk", "dkp", "tikb", "mlspb", "tkepl", "thkpc", "dk"] },
  { en: "Jihadist and Islamist", tr: "Cihatçı ve İslamcı", orgs: ["deas", "alqaeda", "hts", "hizbullah", "tevhid"] },
];
const TR_ORG_TR = { deas: "DEAŞ (IŞİD)", alqaeda: "El Kaide", hizbullah: "Hizbullah (Türk)", dk: "Devrimci Karargâh" };
const TR_DESC = {
  pkk: ["The Kurdistan Workers' Party and its umbrella structure, the Kurdistan Communities Union. Founded in 1978, it has fought an armed insurgency against the Turkish state since 1984. Turkey, the US and the EU list it as a terrorist organisation. In 2025 it announced it would disband and give up its weapons.", "Kürdistan İşçi Partisi ve çatı yapılanması Kürdistan Topluluklar Birliği. 1978'de kuruldu, 1984'ten beri Türk devletine karşı silahlı mücadele yürütüyor. Türkiye, ABD ve AB tarafından terör örgütü olarak tanınıyor. 2025'te kendini feshedip silah bırakacağını açıkladı."],
  feto: ["Turkey's name for the Gülen movement, the religious network of the cleric Fethullah Gülen. Ankara holds it responsible for the July 2016 coup attempt and lists it as a terrorist organisation. Most other countries, including the US and EU members, do not.", "Türkiye'nin, vaiz Fethullah Gülen'in dini yapılanması Gülen hareketine verdiği ad. Ankara, Temmuz 2016 darbe girişiminden bu yapıyı sorumlu tutuyor ve terör örgütü olarak tanıyor. ABD ve AB ülkeleri dahil çoğu ülke ise tanımıyor."],
  dhkpc: ["The Revolutionary People's Liberation Party-Front, a Marxist-Leninist group that grew out of Devrimci Sol in 1994. It is known for assassinations and suicide bombings, including the 2013 attack on the US embassy in Ankara.", "Devrimci Halk Kurtuluş Partisi-Cephesi; 1994'te Devrimci Sol'dan doğan Marksist-Leninist örgüt. 2013'teki ABD Ankara Büyükelçiliği saldırısı dahil suikast ve intihar saldırılarıyla biliniyor."],
  deas: ["DEAŞ is the Turkish acronym for the Islamic State. The group carried out several mass-casualty attacks in Turkey, including the 2015 Ankara station bombing and the 2017 Reina nightclub attack.", "DEAŞ, İslam Devleti'nin (IŞİD) Arapça kısaltmasından gelen Türkçe adı. Örgüt Türkiye'de 2015 Ankara Garı ve 2017 Reina saldırıları dahil çok sayıda katliam gerçekleştirdi."],
  mlkp: ["The Marxist-Leninist Communist Party, formed in 1994 when several radical-left groups merged. Its armed units have also fought in northern Syria.", "Marksist Leninist Komünist Parti; 1994'te radikal sol grupların birleşmesiyle kuruldu. Silahlı birimleri Kuzey Suriye'de de savaştı."],
  mkp: ["The Maoist Communist Party, a Maoist group in the TKP/ML tradition. Its armed wing is the People's Liberation Army (HKO).", "Maoist Komünist Parti; TKP/ML geleneğinden gelen Maoist örgüt. Silahlı kanadı Halk Kurtuluş Ordusu (HKO)."],
  tkpml: ["The Communist Party of Turkey/Marxist-Leninist, founded in 1972 by İbrahim Kaypakkaya. A Maoist party whose armed wing is TİKKO.", "Türkiye Komünist Partisi/Marksist-Leninist; 1972'de İbrahim Kaypakkaya tarafından kuruldu. Silahlı kanadı TİKKO olan Maoist parti."],
  tkpmlk: ["TKP/ML Konferans, a faction that broke away from the TKP/ML tradition after splits in the 1990s.", "TKP/ML Konferans; 1990'lardaki bölünmelerin ardından TKP/ML geleneğinden ayrılan bir hizip."],
  dkp: ["The Revolutionary Communist Party and its armed formation BÖG (United Freedom Forces), a small Marxist group that has fought alongside Kurdish forces in Syria.", "Devrimci Komünist Parti ve silahlı yapılanması BÖG (Birleşik Özgürlük Güçleri); Suriye'de Kürt güçleriyle birlikte savaşan küçük Marksist grup."],
  tikb: ["The Revolutionary Communist Union of Turkey, a small Marxist-Leninist organisation founded in 1979.", "Türkiye İhtilalci Komünistler Birliği; 1979'da kurulan küçük Marksist-Leninist örgüt."],
  mlspb: ["The Marxist-Leninist Armed Propaganda Unit, a far-left urban guerrilla group of the late 1970s and 1980s.", "Marksist-Leninist Silahlı Propaganda Birliği; 1970'lerin sonu ve 1980'lerde etkin bir şehir gerillası grubu."],
  tkepl: ["The Communist Labour Party of Turkey/Leninist, a small Marxist-Leninist party.", "Türkiye Komünist Emek Partisi/Leninist; küçük bir Marksist-Leninist parti."],
  thkpc: ["The People's Liberation Party-Front of Turkey, the 1970s urban guerrilla movement around Mahir Çayan. Many later left-wing groups trace their roots to it.", "Türkiye Halk Kurtuluş Partisi-Cephesi; Mahir Çayan çevresinde 1970'lerde ortaya çıkan şehir gerillası hareketi. Sonraki pek çok sol örgüt köklerini buna dayandırır."],
  dk: ["Revolutionary Headquarters, a small left-wing armed group active in the late 2000s.", "Devrimci Karargâh; 2000'lerin sonunda etkin küçük bir sol silahlı grup."],
  alqaeda: ["Al-Qaeda, the global jihadist network founded by Osama bin Laden. Its cells carried out the 2003 Istanbul bombings.", "El Kaide; Usame bin Ladin'in kurduğu küresel cihatçı ağ. Hücreleri 2003 İstanbul saldırılarını gerçekleştirdi."],
  hts: ["Hay'at Tahrir al-Sham, a Syrian Islamist alliance that grew out of al-Qaeda's Syrian branch, the al-Nusra Front. Turkey listed it as a terrorist organisation in 2018.", "Heyet Tahrir el-Şam; El Kaide'nin Suriye kolu Nusra Cephesi'nden doğan İslamcı ittifak. Türkiye 2018'de terör örgütü olarak tanıdı."],
  hizbullah: ["Turkish Hizbullah, a Kurdish Sunni Islamist armed group active mainly in the 1990s in south-east Turkey. It has no connection to Lebanon's Hezbollah.", "Türk Hizbullahı; çoğunlukla 1990'larda Güneydoğu'da etkin olan Kürt Sünni İslamcı silahlı örgüt. Lübnan Hizbullahı ile bağlantısı yoktur."],
  tevhid: ["Tevhid-Selam / Kudüs Ordusu, an Islamist network held responsible for killings of secular journalists and academics in Turkey in the 1990s.", "Tevhid-Selam / Kudüs Ordusu; 1990'larda laik gazeteci ve akademisyenlere yönelik suikastlerden sorumlu tutulan İslamcı yapılanma."],
};
const TIERS = { red: ["Red list (highest)", "Kırmızı liste (en üst)"], orange: ["Orange list", "Turuncu liste"], yellow: ["Yellow list", "Sarı liste"], grey: ["Grey list (lowest)", "Gri liste (en alt)"] };
const tier = (l) => L(...TIERS[l]);

const turkey = {
  id: "turkey", map: "turkey", data: null,
  title: () => "Türkiye",
  lede: () => L("Faces from the Interior Ministry's terror-wanted list. Name the organisation each person is listed under.", "İçişleri Bakanlığı'nın terörden arananlar listesinden yüzler. Her kişinin hangi örgüt adına arandığını bul."),
  modes: () => [
    { id: "easy", name: L("Easy", "Kolay"), desc: L("Six choices: the four largest groups, plus other left-wing and other Islamist groups.", "Altı seçenek: en büyük dört örgüt, diğer sol örgütler ve diğer İslamcı örgütler."), max: 500 },
    { id: "hard", name: L("Hard", "Zor"), desc: L("All 18 organisations on the list.", "Listedeki 18 örgütün hepsi."), max: 1000 },
  ],
  rules: () => [L("Each group comes up once or twice a game, so always guessing the biggest one won't work.", "Her örgüt bir oyunda bir ya da iki kez çıkar; hep en büyük örgütü söylemek işe yaramaz.")],
  question: () => L("Which organisation?", "Hangi örgüt?"),
  clueLabels: () => [L("Born", "Doğum yılı"), L("Birthplace", "Doğum yeri"), L("Name", "Ad"), L("List", "Liste")],
  async load() {
    if (this.data) return;
    const [d, m] = await Promise.all([fetch("data/people.json").then((r) => r.json()), MAPS.turkey || fetch("data/provinces.json").then((r) => r.json())]);
    this.data = d; MAPS.turkey = m;
  },
  key: (p, mode) => (mode === "easy" ? p.e : p.o),
  name(k, mode) {
    if (mode === "easy") { const b = TR_BUCKETS.find((x) => x.id === k); return b ? L(b.en, b.tr) : k; }
    return L(this.data.orgs[k]?.name ?? k, TR_ORG_TR[k]);
  },
  pools(mode) { const p = {}; for (const x of this.data.people) (p[this.key(x, mode)] ||= []).push(x); return p; },
  deck(mode) {
    const pools = this.pools(mode), keys = Object.keys(pools);
    if (mode === "easy") return shuffle(shuffle(keys.slice()).concat(shuffle(keys.slice()).slice(0, GAME_LEN - keys.length))).slice(0, GAME_LEN);
    const w = keys.map((k) => Math.sqrt(pools[k].length)), tot = w.reduce((a, b) => a + b, 0), deck = [], cnt = {};
    while (deck.length < GAME_LEN) {
      let r = Math.random() * tot, i = 0; while (i < keys.length - 1 && r > w[i]) { r -= w[i]; i++; }
      if ((cnt[keys[i]] || 0) < 3) { cnt[keys[i]] = (cnt[keys[i]] || 0) + 1; deck.push(keys[i]); }
    }
    return deck;
  },
  async draw(key, mode, used) {
    const pool = ((this._p ||= {})[mode] ||= this.pools(mode))[key] || this.data.people;
    const c = pool.filter((p) => !used.has("t" + p.id));
    const p = c[rand(c.length)] || pool[rand(pool.length)];
    return { uid: "t" + p.id, img: p.img, raw: p, fileNo: p.id, geo: p.b?.lat != null ? p.b : null };
  },
  answers(mode) {
    if (mode === "easy") {
      const n = {}; for (const p of this.data.people) n[p.e] = (n[p.e] || 0) + 1;
      return { list: TR_BUCKETS.map((b) => ({ key: b.id, label: L(b.en, b.tr), sub: fmt(n[b.id] || 0) })) };
    }
    return { groups: TR_FAMILIES.map((f) => ({ label: L(f.en, f.tr), items: f.orgs.filter((o) => this.data.orgs[o]?.count).map((o) => ({ key: o, label: this.name(o, "hard") })) })) };
  },
  clues(c) {
    const p = c.raw;
    return [
      p.y ? `${p.y} <span class="dim">· ${L("about", "yaklaşık")} ${new Date().getFullYear() - p.y} ${L("years old", "yaşında")}</span>` : "?",
      esc(p.b?.place || "?"), esc(p.n),
      `<span class="tier-dot tier-${p.l}"></span>${esc(tier(p.l))}`,
    ];
  },
  mapFor(c) { return mapSvg("turkey", c.raw.b); },
  verdict(c, mode) {
    const p = c.raw, org = this.data.orgs[p.o], oname = this.name(p.o, "hard");
    const bucket = mode === "easy" && (p.e === "left" || p.e === "islamist") ? `${this.name(p.e, "easy")}: ` : "";
    return {
      title: bucket + oname, desc: L(...(TR_DESC[p.o] || ["", ""])),
      meta: `${p.n} · ${p.y || "?"} · ${c.bonus === "pending" ? "…" : p.b?.place || "?"} · ${tier(p.l)} · ${L(`${fmt(org.count)} people listed under ${oname}`, `${oname} adına aranan ${fmt(org.count)} kişi`)}`,
      links: [[L("The list", "Liste"), "https://www.terorarananlar.pol.tr/tarananlar"]],
    };
  },
  thumb(c) { return this.name(c.raw.o, "hard"); },
};

/* ================= Section: Global ================= */
const GL_TR = {
  ira: ["Geçici IRA / INLA", "Kuzey İrlanda'daki 'Troubles' döneminin (1969–1998) İrlanda cumhuriyetçi paramiliter örgütleri. İngiliz yönetimini sona erdirmek için İrlanda'da ve Britanya'da bombalı ve silahlı saldırılar düzenlediler."],
  eta: ["ETA", "Euskadi Ta Askatasuna; 1968'den 2018'deki feshine kadar İspanya ve Fransa'da 800'den fazla kişiyi öldüren Bask ayrılıkçı örgütü."],
  raf: ["Kızıl Ordu Fraksiyonu (RAF)", "Baader-Meinhof Grubu olarak da bilinen, 1970–1998 arasında etkin Batı Alman aşırı sol şehir gerillası. İş dünyası ve devlet temsilcilerini kaçırması ve öldürmesiyle tanındı. Müttefiki 2 Haziran Hareketi de bu başlıkta."],
  br: ["Kızıl Tugaylar", "İtalya'nın 'Kurşun Yılları'nın Marksist-Leninist örgütü. En çok 1978'de eski başbakan Aldo Moro'yu kaçırıp öldürmesiyle bilinir."],
  jra: ["Japon Kızıl Ordusu", "Filistinli gruplarla ittifak kuran Japon komünist militanlar. 1972 Lod Havalimanı katliamını, bir dizi uçak kaçırmayı ve büyükelçilik baskınını gerçekleştirdiler."],
  aq: ["El Kaide", "Usame bin Ladin'in 1988'de kurduğu küresel cihatçı ağ; 1998 ABD büyükelçilikleri saldırılarından ve 11 Eylül 2001 saldırılarından sorumlu. AQAP ve Irak El Kaidesi gibi kolları da bu başlıkta."],
  isis: ["İslam Devleti (IŞİD)", "2014'te Irak ve Suriye'de 'hilafet' ilan eden, Paris (2015) ve Brüksel (2016) dahil dünya çapında saldırılar yöneten ya da bunlara ilham veren cihatçı örgüt."],
  aum: ["Aum Shinrikyo", "Üyeleri 1995'te Tokyo metrosunda sarin gazı salarak 14 kişiyi öldüren ve binlercesini yaralayan Japon kıyamet tarikatı."],
  pal: ["FHKC / Kara Eylül / Ebu Nidal", "1960'lardan 1990'lara uçak kaçırmaları, 1972 Münih Olimpiyatları katliamını ve uluslararası suikastları gerçekleştiren Filistinli militan gruplar."],
  sl: ["Aydınlık Yol", "Sendero Luminoso; Peru'da 1980'den itibaren devletle savaşında on binlerce kişinin ölümüne yol açan Maoist isyan hareketi."],
  farc: ["FARC", "Kolombiya Devrimci Silahlı Kuvvetleri; 2016'daki barış anlaşmasına kadar adam kaçırma ve uyuşturucu ticaretiyle finanse edilen Marksist gerilla ordusu (1964–2016)."],
  ltte: ["Tamil Kaplanları (LTTE)", "Tamil Eelam Kurtuluş Kaplanları; Sri Lanka'da (1976–2009) intihar saldırılarını yaygınlaştıran ve Hindistan Başbakanı Rajiv Gandhi'ye suikast düzenleyen ayrılıkçı ordu."],
  wu: ["Weather Underground", "Vietnam Savaşı'nı protesto etmek için devlet binalarını bombalayan ABD'li radikal sol grup (1969–1977)."],
  nv: ["Narodnaya Volya", "'Halkın İradesi'; 1881'de Çar II. Aleksandr'a suikast düzenleyen 19. yüzyıl Rus devrimci örgütü."],
  yb: ["Genç Bosna / Kara El", "Sırp gizli örgütü Kara El'in silahlandırdığı Bosnalı Sırp devrimciler. 1914'te Arşidük Franz Ferdinand'a düzenledikleri suikast Birinci Dünya Savaşı'nı tetikledi."],
  far: ["Neo-faşist hücreler", "İtalya ve Almanya'daki aşırı sağ terör grupları."],
  loyal: ["Ulster sadıkları (UVF, UDA, LVF)", "Kuzey İrlanda'da 'Troubles' döneminde çoğu Katolik sivil olmak üzere yüzlerce kişiyi öldüren İngiliz yanlısı paramiliter gruplar."],
  pkk: ["PKK (tarihî kadro)", "1978'de Abdullah Öcalan tarafından kurulan ve 1984'te Türkiye'ye karşı silahlı kampanya başlatan Kürdistan İşçi Partisi. Öcalan 1999'da yakalandı ve ağırlaştırılmış müebbet cezası çekiyor."],
  asala: ["ASALA / JCAG", "1975'ten 1980'lerin ortasına kadar onlarca Türk diplomata suikast düzenleyen, 1982 Esenboğa Havalimanı saldırısı ve 1983 Orly bombalaması dahil Avrupa'da ve Türkiye'de saldırılar gerçekleştiren Ermeni militan örgütler."],
  eoka: ["EOKA", "Kıbrıs'ın Yunanistan'a bağlanması için İngiliz yönetimine karşı savaşan Rum gerilla örgütü (1955–59). Devamı olan EOKA-B, 1974 darbesinde rol oynadı."],
  khalistan: ["Babbar Khalsa", "Bağımsız bir Halistan için savaşan Sih ayrılıkçı örgüt; 329 kişinin öldüğü 1985 Air India 182 sefer bombalamasından sorumlu."],
  chechen: ["Çeçen ve Kafkas cihatçıları", "Çeçen savaşlarının ve sonraki Kafkasya Emirliği'nin silahlı grupları; 2002 Moskova tiyatro baskını ve 2004 Beslan okul katliamının arkasındaydılar."],
  imro: ["İç Makedonya Devrimci Örgütü", "1920'ler ve 30'larda Balkanlar'da suikastler düzenleyen, 1934'te Yugoslavya Kralı Aleksandar'ı Marsilya'da öldüren örgüt."],
  irgun: ["Irgun / Lehi", "İngiliz Mandası Filistini'nde (1930'lar–1948) İngiliz ve Arap hedeflere bombalı saldırılar ve suikastler düzenleyen, 1946 King David Oteli bombalamasını gerçekleştiren Siyonist yeraltı örgütleri."],
  sr: ["SR Savaş Örgütü", "Rusya Sosyalist Devrimci Partisi'nin terör kanadı (1902–1911); bakanlara ve bir grandüke suikast düzenledi."],
  anarch: ["Anarşist 'eylemle propaganda'", "1880'lerden 1910'lara bombalama ve suikastlarla devrimi tetiklemeye çalışan anarşistler; bir Fransız cumhurbaşkanını, bir İtalyan kralını, bir Avusturya imparatoriçesini ve bir ABD başkanını öldürdüler."],
  plpac: ["Prima Linea / PAC", "Kurşun Yılları'nın daha küçük İtalyan silahlı sol grupları; Prima Linea ve Komünizm İçin Silahlı Proleterler dahil."],
  ad: ["Action Directe", "Renault'nun başı Georges Besse'yi ve üst düzey bir savunma yetkilisini öldüren Fransız aşırı sol grubu (1979–1987)."],
  n17: ["17 Kasım", "1975–2002 arasında ABD, İngiliz ve Türk diplomatlar dahil 23 kişiyi öldüren ve 27 yıl boyunca çözülemeyen Yunan Marksist örgütü."],
  bla: ["Kara Kurtuluş Ordusu", "Polis memurlarını öldüren ve 1981 Brink's soygunu dahil soygunlar gerçekleştiren ABD'li siyah milliyetçi yeraltı örgütü (1970–1981)."],
  sla: ["Symbionese Kurtuluş Ordusu", "Oakland'da bir okul müdürünü öldürmesi ve varis Patty Hearst'ü kaçırmasıyla bilinen küçük ABD'li radikal grup (1973–75)."],
  turkleft: ["Türkiye devrimci solu (1970'ler)", "1970'lerin Türkiye'sinde adam kaçırma, banka soygunu ve öldürmelerin arkasındaki silahlı sol örgütler (THKO, THKP-C, TKP/ML ve Dev-Sol); kurucularından birçoğu öldürüldü ya da idam edildi."],
  mrta: ["MRTA (Túpac Amaru)", "1996'da Lima'daki Japon büyükelçisinin konutunu basıp 72 rehineyi dört ay tutan Perulu Marksist gerillalar."],
  eln: ["ELN", "1964'te kurulan, kurtuluş teolojisinden etkilenen Kolombiya Ulusal Kurtuluş Ordusu."],
  m19: ["M-19", "1985'te Adalet Sarayı'nı basması yaklaşık 100 kişinin ölümüyle sonuçlanan, daha sonra siyasi partiye dönüşen Kolombiyalı şehir gerillası hareketi (1970–1990)."],
  ji: ["Cemaah İslamiye", "El Kaide bağlantılı Güneydoğu Asya cihatçı ağı; 202 kişinin öldüğü 2002 Bali bombalamalarından sorumlu."],
  boko: ["Boko Haram", "Toplu katliamları ve 2014'te Chibok'tan 276 kız öğrenciyi kaçırmasıyla bilinen Nijeryalı cihatçı örgüt."],
  shabaab: ["Eş-Şebab", "El Kaide müttefiki Somalili cihatçı örgüt; 2013 Nairobi Westgate saldırısı ve 2017 Mogadişu kamyon bombalamasının arkasında."],
  let: ["Leşker-i Tayyibe", "166 kişinin öldüğü 2008 Mumbai saldırılarının arkasındaki Pakistan merkezli cihatçı örgüt."],
  ttp: ["Pakistan Talibanı (TTP)", "Pakistan devletine karşı savaşan militan grupların ittifakı; 2014 Peşaver okul katliamından sorumlu."],
  gia: ["GIA / İslami Mağrip El Kaidesi", "1990'ların Cezayir iç savaşındaki cihatçı gruplar ve onların ardılı İslami Mağrip El Kaidesi."],
  eij: ["Mısır İslami Cihad / Cemaat-i İslamiye", "1981'de Cumhurbaşkanı Enver Sedat'a suikast düzenleyen ve 1997 Luksor katliamını gerçekleştiren Mısırlı militan gruplar."],
  abusayyaf: ["Ebu Seyyaf", "Adam kaçırma ve kafa kesmeleriyle, 116 kişinin öldüğü 2004 SuperFerry 14 bombalamasıyla bilinen Filipinli cihatçı örgüt."],
  hezb: ["Hizbullah", "İran destekli Lübnanlı Şii hareket ve milis; 1983 Beyrut kışla bombalamaları ve 1994 Buenos Aires AMIA saldırısıyla ilişkilendirilir. ABD, AB (askerî kanadını) ve başkaları terör örgütü olarak tanır."],
  hamas: ["Hamas", "Silahlı kanadı 1990'lar ve 2000'lerde intihar saldırıları ile 7 Ekim 2023 İsrail saldırısını gerçekleştiren Filistinli İslamcı hareket. ABD, AB ve İngiltere terör örgütü olarak tanır; Türkiye ve birçok başka ülke tanımaz."],
  pij: ["Filistin İslami Cihad", "1981'de kurulan, İsrail'deki intihar saldırılarıyla bilinen İran destekli Filistinli militan örgüt."],
  manson: ["Manson Ailesi", "Charles Manson'ın liderliğindeki komün ve tarikat; üyeleri 1969'da kıyamet niteliğinde bir ırk savaşı başlatmayı umarak aktris Sharon Tate dahil dokuz kişiyi öldürdü."],
  temple: ["Halkın Tapınağı", "Jim Jones'un tarikatı; üyeleri 1978'de Guyana'da ABD Kongre üyesi Leo Ryan'ı öldürdü, ardından Jonestown'da 900'den fazla kişi toplu cinayet-intiharla öldü."],
  kkk: ["Ku Klux Klan", "Üyeleri ABD sivil haklar hareketine karşı bombalı saldırılar ve cinayetler işleyen beyaz üstünlükçü hareket; dört kız çocuğunu öldüren 1963 Birmingham kilise bombalaması gibi."],
};
const GL_FAMILIES = [
  { en: "Separatist and nationalist", tr: "Ayrılıkçı ve milliyetçi", orgs: ["ira", "loyal", "eta", "pkk", "asala", "eoka", "ltte", "khalistan", "chechen", "yb", "imro", "irgun"] },
  { en: "Revolutionary left and anarchist", tr: "Devrimci sol ve anarşist", orgs: ["nv", "sr", "anarch", "raf", "br", "plpac", "ad", "n17", "jra", "wu", "bla", "sla", "turkleft", "sl", "mrta", "farc", "eln", "m19"] },
  { en: "Jihadist and Islamist", tr: "Cihatçı ve İslamcı", orgs: ["aq", "isis", "ji", "boko", "shabaab", "let", "ttp", "gia", "eij", "abusayyaf", "hezb", "hamas", "pij"] },
  { en: "Palestinian secular factions", tr: "Filistinli laik gruplar", orgs: ["pal"] },
  { en: "Violent cults", tr: "Şiddet içeren tarikatlar", orgs: ["aum", "manson", "temple"] },
  { en: "Far right", tr: "Aşırı sağ", orgs: ["kkk", "far"] },
];
const global = {
  id: "global", map: "world", data: null,
  title: () => L("Global", "Dünya"),
  lede: () => L("Documented members of historical organisations, from 19th-century Russian revolutionaries to the Islamic State. Name the organisation.", "19. yüzyıl Rus devrimcilerinden İslam Devleti'ne, tarihteki örgütlerin belgelenmiş üyeleri. Örgütü bul."),
  modes: () => [
    { id: "easy", name: L("Easy", "Kolay"), desc: L("Six choices each time: the right organisation and five others.", "Her seferinde altı seçenek: doğru örgüt ve beş başka örgüt."), max: 500 },
    { id: "hard", name: L("Hard", "Zor"), desc: L("Every organisation, every time.", "Her seferinde tüm örgütler."), max: 1000 },
  ],
  rules: () => [L("Each game has ten different organisations.", "Her oyunda on farklı örgüt çıkar.")],
  question: () => L("Which organisation?", "Hangi örgüt?"),
  clueLabels: () => [L("Lived", "Yaşadığı yıllar"), L("Birthplace", "Doğum yeri"), L("Nationality", "Uyruk"), L("Name", "Ad")],
  async load() {
    if (this.data) return;
    const [d, m] = await Promise.all([fetch("data/global.json").then((r) => r.json()), MAPS.world || fetch("data/world.json").then((r) => r.json())]);
    this.data = d; MAPS.world = m;
  },
  live() { return Object.keys(this.data.orgs).filter((k) => this.data.orgs[k].count); },
  key: (p) => p.o,
  name(k) { return L(this.data.orgs[k]?.name ?? k, GL_TR[k]?.[0]); },
  deck() { return shuffle(this.live()).slice(0, GAME_LEN); },
  async draw(key, mode, used) {
    const c = this.data.people.filter((p) => p.o === key && !used.has("g" + p.id));
    const p = c[rand(c.length)] || this.data.people.filter((x) => x.o === key)[0];
    return { uid: "g" + p.id, img: p.img, raw: p, fileNo: p.id, geo: p.b?.lat != null ? p.b : null };
  },
  answers(mode, c) {
    const live = this.live();
    if (mode === "easy") {
      const opts = shuffle([c.raw.o, ...shuffle(live.filter((k) => k !== c.raw.o)).slice(0, 5)]);
      return { list: opts.map((k) => ({ key: k, label: this.name(k) })) };
    }
    return { groups: GL_FAMILIES.map((f) => ({ label: L(f.en, f.tr), items: f.orgs.filter((o) => live.includes(o)).map((o) => ({ key: o, label: this.name(o) })) })) };
  },
  clues(c) {
    const p = c.raw;
    const life = p.y ? `${p.y}–${p.d ?? (new Date().getFullYear() - p.y > 105 ? "?" : "")}${p.d ? "" : (new Date().getFullYear() - p.y > 105 ? "" : ` <span class="dim">(${L("living", "hayatta")})</span>`)}` : "?";
    return [life, esc(L(p.b?.place, p.place_tr) || "?"), esc(L(p.nat, p.nat_tr) || "?"), esc(p.n)];
  },
  mapFor(c) { return mapSvg("world", c.raw.b); },
  verdict(c) {
    const p = c.raw, org = this.data.orgs[p.o], links = [];
    if (p.wiki) links.push(["Wikipedia", "https://en.wikipedia.org/wiki/" + encodeURIComponent(p.wiki.replace(/ /g, "_"))]);
    if (p.file) links.push([L("Photo source", "Fotoğraf kaynağı"), "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(p.file.replace(/ /g, "_"))]);
    return { title: this.name(p.o), desc: L(org.desc, GL_TR[p.o]?.[1]), meta: `${p.n} · ${p.y ?? "?"}–${p.d ?? ""} · ${c.bonus === "pending" ? "…" : L(p.b?.place, p.place_tr) || "?"}`, links };
  },
  thumb(c) { return this.name(c.raw.o); },
};

/* ================= Section: Interpol ================= */
const IP_CATS = [
  { id: "terror", en: "Terrorism", tr: "Terör", re: /terror|террор|extremis|экстрем|armed formation|вооруж[её]нн\S* формирован|jihad|UAPA|unlawful activities|daesh|isis\b|al.?qa[ie]da/i },
  { id: "homicide", en: "Homicide", tr: "Kasten öldürme", re: /murder|homicid|meurtre|assassinat|asesinat|omicidio|убийств|manslaughter|feminicid|femicid|\bkilling/i },
  { id: "sexual", en: "Sexual offences", tr: "Cinsel suçlar", re: /rape|sexual|\bviol\b|viols?\s|agression sexuelle|abuso sexual|violaci[oó]n|изнасил|pornogra|indecent|estupro/i },
  { id: "drugs", en: "Drug trafficking", tr: "Uyuşturucu kaçakçılığı", re: /drug|narcot|stup[ée]fiant|estupefac|cocain|hero[iï]n|наркот|psychotrop|cannabis|marijuana|methamphet/i },
  { id: "fraud", en: "Fraud and money laundering", tr: "Dolandırıcılık ve kara para", re: /fraud|escroquer|estafa|blanchi|launder|lavado|corrupt|embezzl|d[ée]tournement|malversaci|мошен|tax evasion|fraude|forgery|faux|counterfeit|bribe/i },
  { id: "violent", en: "Violence and organised crime", tr: "Şiddet ve organize suç", re: /robbery|vol .{0,12}arm|\brobo\b|kidnap|enl[eè]vement|secuestro|extortion|extorsi|firearm|weapon|\barmes?\b|armas|criminal organi[sz]|organi[sz]ed crim|association de malfaiteurs|asociaci[oó]n il[ií]cita|concierto para delinquir|грабеж|разбой|похищ|assault|lesiones|violence/i },
];
const IP_DESC = {
  terror: ["Membership of a terrorist organisation, financing terrorism, or planning and carrying out attacks. Rare among red notices.", "Terör örgütü üyeliği, terörün finansmanı ya da saldırı planlama ve gerçekleştirme. Kırmızı bültenlerde nadirdir."],
  homicide: ["Murder, attempted murder and manslaughter.", "Kasten öldürme, öldürmeye teşebbüs ve taksirle öldürme."],
  sexual: ["Rape, sexual abuse of children and child sexual abuse material.", "Tecavüz, çocukların cinsel istismarı ve çocuk istismarı içerikleri."],
  drugs: ["Trafficking, producing or importing narcotics.", "Uyuşturucu kaçakçılığı, üretimi ya da ithali."],
  fraud: ["Fraud, money laundering, embezzlement, corruption and forgery.", "Dolandırıcılık, kara para aklama, zimmet, yolsuzluk ve sahtecilik."],
  violent: ["Robbery, kidnapping, extortion, weapons offences and membership of a criminal organisation.", "Soygun, adam kaçırma, şantaj, silah suçları ve suç örgütü üyeliği."],
};
const classify = (aw) => { const s = aw.map((w) => `${w.c} ${w.t}`).join(" \n "); return IP_CATS.find((c) => c.re.test(s))?.id || null; };
const interpol = {
  id: "interpol", map: null, data: true, lists: {},
  title: () => "Interpol",
  lede: () => L("Live red notices from Interpol's public database. Guess what each person is wanted for. Each file is fetched when you open it.", "Interpol'ün kamuya açık veri tabanından canlı kırmızı bültenler. Kişinin ne için arandığını tahmin et. Her dosya açtığın anda çekilir."),
  modes: () => [{ id: "live", name: L("Start", "Başla"), desc: L("Six charge categories. Terrorism is one of them, but most red notices are about ordinary serious crime.", "Altı suçlama kategorisi. Terör bunlardan biri, ama kırmızı bültenlerin çoğu sıradan ağır suçlarla ilgili."), max: 500 }],
  rules: () => [L("Notices are fetched live, so the first file can take a few seconds.", "Bültenler canlı çekildiği için ilk dosya birkaç saniye sürebilir."), L("A red notice is a request to find and arrest someone, not a conviction.", "Kırmızı bülten bir kişinin bulunup tutuklanması talebidir, mahkûmiyet değildir.")],
  question: () => L("What is this person wanted for?", "Bu kişi ne için aranıyor?"),
  clueLabels: () => [L("Age and sex", "Yaş ve cinsiyet"), L("Born in", "Doğduğu ülke"), L("Wanted by", "Arayan ülke"), L("Name", "Ad")],
  async load() {},
  key: (p) => p.cat,
  name(k) { const c = IP_CATS.find((x) => x.id === k); return c ? L(c.en, c.tr) : k; },
  deck: () => null,
  async json(url) {
    for (let i = 0; i < 3; i++) {
      try { const r = await fetch(url); if (r.ok) return await r.json(); if (r.status === 404) return null; } catch { /* retry */ }
      await sleep(700 * (i + 1));
    }
    throw new Error("Interpol unreachable");
  },
  async draw(_k, _m, used) {
    for (let a = 0; a < 14; a++) {
      const age = 20 + rand(50);
      const list = this.lists[age] ||= (await this.json(`${IP_BASE}?ageMin=${age}&ageMax=${age}&resultPerPage=160`))?._embedded?.notices || [];
      const fresh = list.filter((n) => !used.has("i" + n.entity_id) && n._links?.thumbnail);
      if (!fresh.length) continue;
      const n = fresh[rand(fresh.length)]; used.add("i" + n.entity_id);
      const slug = n.entity_id.replace("/", "-");
      const d = await this.json(`${IP_BASE}/${slug}`); if (!d) continue;
      const aw = (d.arrest_warrants || []).map((w) => ({ c: w.charge || "", t: w.charge_translation || "", by: w.issuing_country_id }));
      const cat = classify(aw); if (!cat) continue;
      let img = d._links?.thumbnail?.href;
      try { const im = await this.json(`${IP_BASE}/${slug}/images`); img = im?._embedded?.images?.[0]?._links?.self?.href || img; } catch { /* thumbnail */ }
      return { uid: "i" + n.entity_id, img: [img], fileNo: n.entity_id, geo: null, raw: { id: n.entity_id, slug, f: d.forename, n: d.name, dob: d.date_of_birth, sex: d.sex_id, nat: d.nationalities || [], cob: d.country_of_birth_id, aw, cat } };
    }
    throw new Error("No usable notice");
  },
  answers() { return { list: IP_CATS.map((c) => ({ key: c.id, label: L(c.en, c.tr) })) }; },
  clues(c) {
    const p = c.raw, age = p.dob ? new Date().getFullYear() - Number(String(p.dob).slice(0, 4)) : "?";
    const sex = { M: L("man", "erkek"), F: L("woman", "kadın") }[p.sex] || "?";
    const by = [...new Set(p.aw.map((w) => w.by).filter(Boolean))];
    const nat = p.nat.length && !(p.nat.length === 1 && p.nat[0] === p.cob) ? ` <span class="dim">· ${L("citizen of", "vatandaşlığı:")} ${p.nat.map((x) => esc(country(x))).join(", ")}</span>` : "";
    return [`${age}, ${sex}`, (p.cob ? flagged(p.cob) : "?") + nat, by.length ? by.map(flagged).join(", ") : "?", esc([p.f, p.n].filter(Boolean).join(" "))];
  },
  mapFor: () => "",
  verdict(c) {
    const p = c.raw;
    const charge = p.aw.map((w) => (w.t && w.t !== w.c ? `${w.c}\n(${w.t})` : w.c)).join("\n\n").slice(0, 1400);
    return { title: this.name(p.cat), desc: t("v.charge"), charge, meta: `${[p.f, p.n].filter(Boolean).join(" ")} · ${p.dob || "?"} · ${p.id}`, links: [[L("The notice on interpol.int", "interpol.int'teki bülten"), "https://www.interpol.int/How-we-work/Notices/Red-Notices/View-Red-Notices#" + p.slug]] };
  },
  thumb(c) { return this.name(c.raw.cat); },
};

/* ================= Section: Lone attackers ================= */
const lone = {
  id: "lone", map: "world", data: null,
  title: () => L("Lone attackers", "Yalnız saldırganlar"),
  lede: () => L("Shooters, bombers and attackers who acted alone or in pairs, with no organisation behind them. Guess the ideology that drove them.", "Arkasında bir örgüt olmadan tek başına ya da iki kişiyle saldıran tetikçiler ve bombacılar. Onları harekete geçiren ideolojiyi tahmin et."),
  modes: () => [
    { id: "easy", name: L("Easy", "Kolay"), desc: L("Six ideologies, each coming up once or twice a game.", "Altı ideoloji; her biri bir oyunda bir ya da iki kez çıkar."), max: 500 },
  ],
  rules: () => [L("Clues: year, place on a map, the target, and finally the attacker's name.", "İpuçları: yıl, haritada yer, hedef ve en son saldırganın adı.")],
  question: () => L("What ideology drove this attack?", "Bu saldırının arkasında hangi ideoloji vardı?"),
  clueLabels: () => [L("Year", "Yıl"), L("Place", "Yer"), L("Target", "Hedef"), L("Attacker", "Saldırgan")],
  async load() {
    if (this.data) return;
    const [d, m] = await Promise.all([fetch("data/lone.json").then((r) => r.json()), MAPS.world || fetch("data/world.json").then((r) => r.json())]);
    this.data = d; MAPS.world = m;
  },
  live() { return Object.keys(this.data.orgs).filter((k) => this.data.orgs[k].count); },
  key: (p) => p.o,
  name(k) { const o = this.data.orgs[k]; return o ? L(o.name, o.name_tr) : k; },
  deck() {
    const keys = this.live(), twice = keys.filter((k) => this.data.orgs[k].count > 1);  // no repeats from one-file ideologies
    return shuffle(shuffle(keys.slice()).concat(shuffle(twice.slice()).slice(0, GAME_LEN - keys.length))).slice(0, GAME_LEN);
  },
  async draw(key, mode, used) {
    const pool = this.data.people.filter((p) => p.o === key);
    const c = pool.filter((p) => !used.has("l" + p.id));
    const withPhoto = c.filter((p) => p.img);
    // Prefer files with a photo three times out of four, so the photo-less ones still come up.
    const from = withPhoto.length && Math.random() < 0.75 ? withPhoto : c;
    const p = from[rand(from.length)] || pool[rand(pool.length)];
    return { uid: "l" + p.id, img: p.img ? [p.img] : [], raw: p, fileNo: p.id, geo: null, card: !p.img };
  },
  answers() { return { list: this.live().map((k) => ({ key: k, label: this.name(k) })) }; },
  method(c) { const m = this.data.methods[c.raw.m]; return m ? L(m.en, m.tr) : ""; },
  clues(c) {
    const p = c.raw;
    return [String(p.y), esc(L(p.place, p.place_tr)), esc(L(p.target, p.target_tr)), esc(p.who)];
  },
  mapFor(c) { return mapSvg("world", c.raw.b); },
  verdict(c) {
    const p = c.raw, o = this.data.orgs[p.o];
    const killed = p.killed === 0 ? L("No one was killed", "Kimse ölmedi") : L(`${p.killed} people killed`, `${p.killed} kişi öldü`);
    return {
      title: this.name(p.o), desc: L(o.desc, o.desc_tr),
      meta: `${L(p.attack, p.attack_tr)} · ${p.y} · ${L(p.place, p.place_tr)} · ${killed}`,
      links: [["Wikipedia", "https://en.wikipedia.org/w/index.php?search=" + encodeURIComponent(p.attack)]].concat(p.file ? [[L("Photo", "Fotoğraf"), p.file]] : []),
    };
  },
  thumb(c) { return this.name(c.raw.o); },
};

const SECTIONS = { turkey, global, interpol, lone };

/* ================= engine ================= */
const S = { sec: null, mode: null, deck: null, used: new Set(), round: 0, score: 0, streak: 0, cur: null, history: [], next: null, token: 0, error: false };
const pointsFor = (n) => POINTS[Math.min(n, CLUE_COUNT)] * (S.mode === "hard" ? 2 : 1);
const SCREENS = ["homeScreen", "modeScreen", "gameScreen", "endScreen", "codexScreen"];
const screen = () => SCREENS.find((s) => !$(s).hidden);
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
const rn = (i) => `<span class="rn">${ROMAN[i] || i + 1}</span>`;

function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
  if (id !== "gameScreen") closeDrawer();
  $("hud").hidden = id !== "gameScreen";
  document.body.dataset.screen = id;
  window.scrollTo({ top: 0 });
}

function applyStatic() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === LANG));
  if (turkey.data) $("metaTurkey").textContent = t("sec.turkey.meta", { n: fmt(turkey.data.people.length), d: turkey.data.generated });
  if (global.data) $("metaGlobal").textContent = t("sec.global.meta", { n: fmt(global.data.people.length), k: global.live().length });
  if (lone.data) $("metaLone").textContent = t("sec.lone.meta", { n: fmt(lone.data.people.length), k: lone.live().length });
}

function renderMode() {
  const sec = S.sec;
  $("modeTitle").textContent = sec.title();
  $("modeLede").textContent = sec.lede();
  $("modes").innerHTML = sec.modes().map((m, i) => `<button class="mode-row" data-mode="${m.id}"><span class="mode-name">${rn(i)}${esc(m.name)}</span><span class="mode-desc">${esc(m.desc)}</span><span class="mode-pts">${esc(t("mode.points", { n: fmt(m.max) }))}</span></button>`).join("");
  $("modes").querySelectorAll(".mode-row").forEach((b) => b.addEventListener("click", () => startGame(b.dataset.mode)));
  const rules = [t("rules.base"), ...sec.rules()];
  if (sec.map) rules.push(t("rules.bonus"));
  $("modeRules").innerHTML = rules.map((r) => `<li>${esc(r)}</li>`).join("") + `<li class="keys">${esc(t("rules.keys"))}</li>`;
}

function openSection(id) {
  S.sec = SECTIONS[id];
  renderMode();
  show("modeScreen");
  S.sec.load().catch(() => { $("modeLede").textContent = t("err.gen"); });
}

async function startGame(mode) {
  try { await S.sec.load(); } catch { return; }
  Object.assign(S, { mode, used: new Set(), round: 0, score: 0, streak: 0, history: [], next: null, token: S.token + 1, cur: null, error: false });
  S.deck = S.sec.deck(mode);
  show("gameScreen");
  nextCase();
}

function renderHud() {
  const it = (l, v) => `<span class="hud-item"><span class="hud-label">${esc(t(l))}</span>${v}</span>`;
  $("hud").innerHTML = it("hud.file", `${S.round}/${GAME_LEN}`) + it("hud.score", fmt(S.score)) + it("hud.streak", S.streak);
}

function queueNext() {
  if (S.round >= GAME_LEN) { S.next = null; return; }
  const p = S.sec.draw(S.deck ? S.deck[S.round] : null, S.mode, S.used);
  p.then((c) => { if (!c.img?.[0]) return; const im = new Image(); im.referrerPolicy = "no-referrer"; im.src = c.img[0]; }).catch(() => {});
  S.next = p;
}

async function nextCase() {
  if (S.cur && S.cur.bonus === "pending") S.cur.bonus = "skipped";
  if (S.round >= GAME_LEN) return endGame();
  const token = S.token;
  S.round++; S.cur = null; S.error = false;
  renderHud();
  $("verdict").hidden = true;
  $("answers").innerHTML = "";
  $("question").textContent = S.sec.question(S.mode);
  $("openDrawer").textContent = t(S.sec.id === "interpol" ? "game.whatCats" : S.sec.id === "lone" ? "game.whatIdeo" : "game.whatAre");
  S.sec.clueLabels().forEach((l, i) => { $("clueLabel" + i).innerHTML = rn(i) + esc(l); });
  document.querySelectorAll(".clue").forEach((el, i) => { el.className = "clue hidden"; $("clueVal" + i).textContent = t("game.hidden"); });
  $("mapWrap").innerHTML = "";
  $("hintBtn").hidden = true;
  $("photo").classList.add("loading"); $("photo").removeAttribute("src");
  $("photoLoading").hidden = false; $("photoLoading").textContent = t("game.loading");
  $("caseNo").textContent = ""; $("guessesLeft").innerHTML = ""; $("stamp").hidden = true;

  let c;
  try { c = await (S.next || S.sec.draw(S.deck ? S.deck[S.round - 1] : null, S.mode, S.used)); }
  catch { if (token === S.token) { S.error = true; renderError(); } return; }
  if (token !== S.token) return;
  S.used.add(c.uid);
  S.cur = { ...c, clues: 0, guesses: 0, wrong: [], done: false, imgIdx: 0, truth: S.sec.key(c.raw, S.mode), bonus: null, bonusPts: 0, opts: null };
  S.cur.opts = S.sec.answers(S.mode, S.cur);
  queueNext();
  loadPhoto();
  renderCase(false);
}

function renderError() {
  $("photoLoading").textContent = t("game.noPhoto");
  const v = $("verdict"); v.hidden = false; v.className = "verdict miss";
  $("verdictResult").textContent = ""; $("verdictPoints").textContent = "";
  $("verdictOrg").textContent = t("err.title");
  $("verdictDesc").textContent = S.sec.id === "interpol" ? t("err.ip") : t("err.gen");
  $("verdictCharge").hidden = true; $("verdictMeta").textContent = ""; $("verdictLinks").innerHTML = ""; $("bonus").hidden = true; $("skipBonus").hidden = true;
  $("nextBtn").textContent = t("err.back");
}

function loadPhoto() {
  const img = $("photo"), c = S.cur;
  const card = $("attackCard");
  if (c.card) {
    img.hidden = true; $("photoLoading").hidden = true; card.hidden = false;
    card.innerHTML = `<svg class="card-sigil" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="30" class="thin"/><path d="M50 8 L86 71 H14 Z" class="thin"/><circle cx="50" cy="52" r="5" class="fill"/></svg><span class="card-kicker">${esc(L("No photograph", "Fotoğraf yok"))}</span><span class="card-method">${esc(S.sec.method(c))}</span>`;
    return;
  }
  img.hidden = false; card.hidden = true;
  img.onload = () => { img.classList.remove("loading"); $("photoLoading").hidden = true; };
  img.onerror = () => {
    c.imgIdx++;
    if (c.imgIdx < c.img.length) { img.src = c.img[c.imgIdx]; return; }
    if (S.sec.method) { c.card = true; c.img = []; loadPhoto(); return; }  // lone: fall back to the method emblem
    if (!c.done && !c.clues && !c.guesses) { S.round--; S.next = null; nextCase(); } else $("photoLoading").textContent = t("game.noPhoto");
  };
  img.src = c.img[0];
}

function clueOpen(i) { const c = S.cur; return i < c.clues || (c.done && !(i === 1 && c.bonus === "pending")); }

function renderCase(fresh) {
  const c = S.cur;
  $("caseNo").textContent = t("game.file", { n: String(c.fileNo).replace("/", "-") });
  const left = MAX_GUESSES - c.guesses;
  $("guessesLeft").innerHTML = Array.from({ length: MAX_GUESSES }, (_, i) => `<i class="${i < c.guesses ? "used" : ""}"></i>`).join("");
  $("guessesLeft").title = left === 1 ? t("game.left1") : t("game.left", { n: left });
  const st = $("stamp");
  st.hidden = !c.done;
  if (c.done) { st.className = `stamp ${c.correct ? "ok" : "bad"}`; st.textContent = t(c.correct ? "stamp.ok" : "stamp.bad"); }
  renderClues(fresh);
  renderAnswers();
  if (c.done) renderVerdict();
}

function renderClues(fresh) {
  const c = S.cur, vals = S.sec.clues(c);
  document.querySelectorAll(".clue").forEach((el, i) => {
    const open = clueOpen(i);
    el.className = "clue" + (open ? "" : " hidden") + (open && fresh === i ? " fresh" : "");
    $("clueVal" + i).innerHTML = open ? vals[i] : esc(t("game.hidden"));
  });
  $("mapWrap").innerHTML = clueOpen(1) ? S.sec.mapFor(c) : "";
  const hb = $("hintBtn"), can = !c.done && c.clues < CLUE_COUNT;
  hb.hidden = c.done;
  hb.disabled = !can;
  hb.innerHTML = can ? `${esc(t("game.hint"))}<span class="cost">−${pointsFor(c.clues) - pointsFor(c.clues + 1)}</span>` : esc(t("game.noHint"));
}

function renderAnswers() {
  const c = S.cur, box = $("answers"), spec = c.opts;
  const mk = (it, i) => {
    const st = c.wrong.includes(it.key) ? " wrong" : c.done ? (it.key === c.truth ? " right" : " faded") : "";
    return `<button class="ans${st}" data-key="${esc(it.key)}"${c.done || c.wrong.includes(it.key) ? " disabled" : ""}>${esc(it.label)}${it.sub ? `<span class="sub">${esc(it.sub)}</span>` : ""}<span class="icon-q" data-info="${esc(it.key)}" title="${esc(t("game.info"))}" role="button" aria-label="${esc(t("game.info"))}">i</span>${i != null ? `<span class="key">${i}</span>` : ""}</button>`;
  };
  // relabel in the current language (options were drawn once per case)
  const relabel = (it) => ({ ...it, label: S.sec.name(it.key, S.mode) });
  if (spec.list) { box.className = "answers"; box.innerHTML = spec.list.map((it, i) => mk(relabel(it), i + 1)).join(""); }
  else {
    box.className = "answers many";
    box.innerHTML = S.sec.answers(S.mode, c).groups.filter((g) => g.items.length).map((g) => `<div class="family"><h4>${esc(g.label)}</h4><div class="family-row">${g.items.map((it) => mk(it, null)).join("")}</div></div>`).join("");
  }
  box.querySelectorAll(".ans").forEach((b) => b.addEventListener("click", (e) => {
    const info = e.target.closest(".icon-q");
    if (info) { e.stopPropagation(); openDrawer(info.dataset.info); return; }
    guess(b.dataset.key, b);
  }));
}

document.addEventListener("click", (e) => {
  const info = e.target.closest(".ans:disabled .icon-q");
  if (info) { e.stopPropagation(); openDrawer(info.dataset.info); }
}, true);

function revealClue() { const c = S.cur; if (!c || c.done || c.clues >= CLUE_COUNT) return; c.clues++; renderClues(c.clues - 1); }

function guess(key, btn) {
  const c = S.cur; if (!c || c.done || btn.disabled) return;
  c.guesses++;
  if (key === c.truth) return finish(true);
  c.wrong.push(key);
  if (c.guesses >= MAX_GUESSES) return finish(false);
  c.clues = Math.min(CLUE_COUNT, c.clues + 1);
  renderCase(c.clues - 1);
  const b = $("answers").querySelector(`[data-key="${CSS.escape(key)}"]`); if (b) { b.classList.add("nudge"); }
}

function finish(correct) {
  const c = S.cur;
  c.done = true; c.correct = correct;
  c.pts = correct ? pointsFor(c.clues) : 0;
  S.score += c.pts; S.streak = correct ? S.streak + 1 : 0;
  c.bonus = correct && c.geo && S.sec.map && c.clues < 2 ? "pending" : null;
  S.history.push(c);
  renderHud();
  renderCase(null);
  $("verdict").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderVerdict() {
  const c = S.cur, v = S.sec.verdict(c, S.mode), box = $("verdict");
  box.hidden = false; box.className = "verdict" + (c.correct ? "" : " miss");
  $("verdictResult").textContent = c.correct ? (c.clues === 0 ? t("v.right0") : c.clues === 1 && T[LANG]["v.right1"] ? t("v.right1") : t("v.right", { n: c.clues })) : t("v.wrong");
  $("verdictPoints").textContent = `+${fmt(c.pts)}`;
  $("verdictOrg").textContent = v.title;
  $("verdictDesc").textContent = v.desc || "";
  $("verdictCharge").hidden = !v.charge; $("verdictCharge").textContent = v.charge || "";
  $("verdictMeta").textContent = v.meta || "";
  $("verdictLinks").innerHTML = (v.links || []).map(([a, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(a)}</a>`).join("") + `<button class="link" id="verdictCodex">${esc(t("v.codex"))}</button>`;
  $("verdictCodex").addEventListener("click", () => openDrawer(S.sec.id === "interpol" ? c.raw.cat : c.raw.o));
  $("nextBtn").textContent = S.round >= GAME_LEN ? t("v.results") : t("v.next");
  renderBonus();
}

function renderBonus() {
  const c = S.cur, box = $("bonus");
  if (!c.bonus) { box.hidden = true; $("skipBonus").hidden = true; return; }
  box.hidden = false;
  $("bonusQ").innerHTML = `${esc(t("bonus.q"))}<span class="dim">${c.bonus === "pending" ? esc(t("bonus.how")) : ""}</span>`;
  const kind = S.sec.map, P = PROJ[kind];
  const wrap = $("bonusMap");
  wrap.innerHTML = mapSvg(kind, c.geo, false);
  wrap.className = "bonus-map" + (c.bonus === "pending" ? "" : " done");
  $("skipBonus").hidden = c.bonus !== "pending";
  $("skipBonus").textContent = t("bonus.skip");
  $("bonusResult").innerHTML = "";
  const svg = wrap.querySelector("svg");
  if (c.bonus === "done") drawBonus(svg, P, c);
  if (c.bonus === "pending") {
    svg.addEventListener("click", (e) => {
      if (c.bonus !== "pending") return;
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const [lat, lon] = P.ll(p.x, p.y);
      c.guessLL = [lat, lon];
      c.dist = km(lat, lon, c.geo.lat, c.geo.lon);
      c.bonusPts = Math.round(BONUS_MAX * Math.exp(-c.dist / P.scaleKm));
      c.bonus = "done";
      S.score += c.bonusPts; renderHud();
      renderClues(null);
      renderVerdict();
    });
  }
}

function drawBonus(svg, P, c) {
  const [gx, gy] = P.xy(...c.guessLL), [tx, ty] = P.xy(c.geo.lat, c.geo.lon);
  svg.insertAdjacentHTML("beforeend", `<line class="line" x1="${gx}" y1="${gy}" x2="${tx}" y2="${ty}"/><circle class="guess" cx="${gx}" cy="${gy}" r="4"/><circle class="ring" cx="${tx}" cy="${ty}" r="6"/><circle class="dot" cx="${tx}" cy="${ty}" r="4"/>`);
  $("bonusResult").innerHTML = t("bonus.res", { km: fmt(Math.round(c.dist)), p: fmt(c.bonusPts) });
}

function skipBonus() { const c = S.cur; if (c?.bonus !== "pending") return; c.bonus = "skipped"; renderClues(null); renderVerdict(); }

/* ---------------- end ---------------- */
function saveStats() {
  const slot = `${S.sec.id}:${S.mode}`, st = loadStats();
  st.games++; st.best[slot] = Math.max(st.best[slot] || 0, S.score);
  const keys = (st.keys[slot] ||= {});
  let run = 0, best = 0;
  for (const h of S.history) { const k = (keys[h.truth] ||= { seen: 0, ok: 0 }); k.seen++; if (h.correct) k.ok++; run = h.correct ? run + 1 : 0; best = Math.max(best, run); }
  st.bestStreak = Math.max(st.bestStreak || 0, best);
  store.set(STATS_KEY, st);
}

function endGame() { saveStats(); renderEnd(); show("endScreen"); }

function renderEnd() {
  const sec = S.sec, slot = `${sec.id}:${S.mode}`, st = loadStats();
  const ok = S.history.filter((h) => h.correct).length, nm = (k) => sec.name(k, S.mode);
  const modeName = sec.modes().length > 1 ? " · " + sec.modes().find((m) => m.id === S.mode).name : "";
  $("endKicker").textContent = t("end.kicker", { s: sec.title() + modeName });
  $("endScore").textContent = t("end.score", { n: fmt(S.score) });
  $("endLine").textContent = t("end.line", { ok, n: GAME_LEN, b: fmt(st.best[slot] || S.score) });
  const per = {};
  for (const h of S.history) { const r = (per[h.truth] ||= { seen: 0, ok: 0 }); r.seen++; if (h.correct) r.ok++; }
  $("endTable").innerHTML = `<tr><th>${esc(t("end.th.answer"))}</th><th class="num">${esc(t("end.th.got"))}</th></tr>` + Object.entries(per).sort((a, b) => b[1].seen - a[1].seen).map(([k, r]) => `<tr><td>${esc(nm(k))}</td><td class="num">${r.ok}/${r.seen}</td></tr>`).join("");
  const slips = []; for (const h of S.history) for (const w of h.wrong) slips.push([h.truth, w]);
  $("endSlips").innerHTML = slips.length ? slips.slice(0, 6).map(([tr, w]) => `<li>${t("end.slip", { w: esc(nm(w)), t: esc(nm(tr)) })}</li>`).join("") : `<li>${esc(t("end.noSlips"))}</li>`;
  $("endStrip").innerHTML = S.history.map((h) => `<figure class="${h.correct ? "ok" : ""}">${h.card ? `<div class="strip-card">${esc(String(h.raw.y))}</div>` : `<img src="${esc(h.img[h.imgIdx] || h.img[0])}" alt="" referrerpolicy="no-referrer" loading="lazy">`}<figcaption>${esc(sec.thumb(h))}</figcaption></figure>`).join("");
}

function renderStats() {
  const st = loadStats();
  if (!st.games) { $("statsBody").innerHTML = `<p>${esc(t("stats.none"))}</p>`; return; }
  let html = `<p>${esc(t("stats.games", { g: st.games, s: st.bestStreak || 0 }))}</p>`;
  for (const [slot, keys] of Object.entries(st.keys)) {
    const [sid, mode] = slot.split(":"), sec = SECTIONS[sid];
    if (!sec || (sid !== "interpol" && !sec.data)) continue;
    const mname = sec.modes().find((m) => m.id === mode)?.name || "";
    html += `<h3>${esc(sec.title())}${sec.modes().length > 1 ? " · " + esc(mname) : ""} · ${esc(t("stats.best", { b: fmt(st.best[slot] || 0) }))}</h3><table class="tally">${Object.entries(keys).sort((a, b) => b[1].seen - a[1].seen).map(([k, r]) => `<tr><td>${esc(sec.name(k, mode))}</td><td class="num">${r.ok}/${r.seen}</td></tr>`).join("")}</table>`;
  }
  $("statsBody").innerHTML = html;
}

/* ---------------- codex ---------------- */
const CX = { tab: "turkey", prev: "homeScreen", focus: null };
async function openCodex(tab, focus) {
  const cur = screen();
  if (cur !== "codexScreen") CX.prev = cur || "homeScreen";
  CX.tab = tab || CX.tab; CX.focus = focus || null;
  await Promise.allSettled([turkey.load(), global.load(), lone.load()]);
  renderCodex();
  show("codexScreen");
  if (CX.focus) {
    const el = document.getElementById(`cx-${CX.tab}-${CX.focus}`);
    if (el) { el.classList.add("focus"); setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60); }
  }
}
function renderCodex() {
  document.querySelectorAll("#codexTabs [data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === CX.tab));
  $("codexBody").innerHTML = codexHTML(CX.tab, "cx");
}
function codexHTML(tab, prefix) {
  const CXT = { tab };
  const entry = (id, i, name, desc, meta, extra = "") => `<article class="entry" id="${prefix}-${CXT.tab}-${id}"><span class="entry-num">${ROMAN[i] || i + 1}</span><div><h3>${esc(name)}</h3><p>${esc(desc)}</p>${meta ? `<p class="entry-meta">${esc(meta)}</p>` : ""}${extra}</div></article>`;
  let html = "", n = 0;
  if (CXT.tab === "turkey" && turkey.data) {
    for (const f of TR_FAMILIES) {
      const orgs = f.orgs.filter((o) => turkey.data.orgs[o]?.count);
      if (!orgs.length) continue;
      html += `<section class="codex-family"><h2>${esc(L(f.en, f.tr))}</h2>`;
      for (const o of orgs) {
        const org = turkey.data.orgs[o];
        const b = org.bucket === "left" || org.bucket === "islamist" ? ` · ${t("codex.bucket", { b: turkey.name(org.bucket, "easy") })}` : "";
        html += entry(o, n++, turkey.name(o, "hard"), L(...(TR_DESC[o] || ["", ""])), t("codex.count", { n: fmt(org.count) }) + b);
      }
      html += "</section>";
    }
  } else if (CXT.tab === "global" && global.data) {
    const live = global.live();
    for (const f of GL_FAMILIES) {
      const orgs = f.orgs.filter((o) => live.includes(o));
      if (!orgs.length) continue;
      html += `<section class="codex-family"><h2>${esc(L(f.en, f.tr))}</h2>`;
      for (const o of orgs) {
        const org = global.data.orgs[o];
        const members = global.data.people.filter((p) => p.o === o).map((p) => p.n);
        html += entry(o, n++, global.name(o), L(org.desc, GL_TR[o]?.[1]), t("codex.count", { n: fmt(org.count) }), `<p class="entry-members">${esc(t("codex.members", { m: members.join(", ") }))}</p>`);
      }
      html += "</section>";
    }
  } else if (CXT.tab === "lone" && lone.data) {
    html += `<section class="codex-family">`;
    lone.live().forEach((k) => {
      const o = lone.data.orgs[k];
      const attacks = lone.data.people.filter((p) => p.o === k).map((p) => `${L(p.attack, p.attack_tr)} (${p.y})`);
      html += entry(k, n++, lone.name(k), L(o.desc, o.desc_tr), t("codex.attacks", { n: fmt(o.count) }), `<p class="entry-members">${esc(attacks.join(" · "))}</p>`);
    });
    html += `</section>`;
  } else if (CXT.tab === "interpol") {
    html += `<section class="codex-family">`;
    IP_CATS.forEach((c) => { html += entry(c.id, n++, L(c.en, c.tr), L(...IP_DESC[c.id]), ""); });
    html += `</section><p class="codex-note">${esc(t("codex.ipnote"))}</p>`;
  }
  return html;
}

/* in-game drawer */
const BUCKET_ANCHOR = { left: "mlkp", islamist: "alqaeda" };
function openDrawer(focus) {
  if (!S.sec) return;
  $("drawerBody").innerHTML = codexHTML(S.sec.id, "dx");
  document.body.classList.add("drawer-open");
  $("drawer").setAttribute("aria-hidden", "false");
  $("drawerBody").scrollTop = 0;
  const key = BUCKET_ANCHOR[focus] || focus;
  if (key) {
    const el = document.getElementById(`dx-${S.sec.id}-${key}`);
    if (el) { el.classList.add("focus"); setTimeout(() => { const body = $("drawerBody"); body.scrollTo({ top: body.scrollTop + el.getBoundingClientRect().top - body.getBoundingClientRect().top - 10, behavior: "smooth" }); }, 120); }
  }
}
function closeDrawer() { document.body.classList.remove("drawer-open"); $("drawer").setAttribute("aria-hidden", "true"); }
const drawerOpen = () => document.body.classList.contains("drawer-open");

function drawOrnaments() {
  const svg = `<svg viewBox="0 0 340 14" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="ornFade" x1="0" x2="1"><stop offset="0" stop-color="#3a3530" stop-opacity="0"/><stop offset=".5" stop-color="#3a3530"/><stop offset="1" stop-color="#3a3530" stop-opacity="0"/></linearGradient></defs><line class="o-line" x1="0" y1="7" x2="340" y2="7"/><path d="M148 7 L156 2 L164 7 L156 12 Z" fill="#060607"/><path d="M176 7 L184 2 L192 7 L184 12 Z" fill="#060607"/><circle cx="170" cy="7" r="4.5" fill="#060607"/><circle class="o-dot" cx="170" cy="7" r="1.8"/><circle class="o-dot" cx="138" cy="7" r="1"/><circle class="o-dot" cx="202" cy="7" r="1"/></svg>`;
  document.querySelectorAll(".orn").forEach((el) => { el.innerHTML = svg; });
  const g = document.querySelector(".bg-sigil .ticks");
  if (g) {
    let s = "";
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2, r1 = 178, r2 = i % 8 === 0 ? 160 : 170;
      s += `<line x1="${200 + r1 * Math.cos(a)}" y1="${200 + r1 * Math.sin(a)}" x2="${200 + r2 * Math.cos(a)}" y2="${200 + r2 * Math.sin(a)}"/>`;
    }
    g.innerHTML = s;
  }
}

/* ---------------- language switch ---------------- */
function setLang(l) {
  LANG = l; try { localStorage.setItem("tg.lang", l); } catch { /* no storage */ }
  applyStatic();
  const s = screen();
  if (s === "modeScreen") renderMode();
  if (s === "gameScreen") {
    renderHud();
    $("question").textContent = S.sec.question(S.mode);
    $("openDrawer").textContent = t(S.sec.id === "interpol" ? "game.whatCats" : S.sec.id === "lone" ? "game.whatIdeo" : "game.whatAre");
    S.sec.clueLabels().forEach((x, i) => { $("clueLabel" + i).innerHTML = rn(i) + esc(x); });
    if (drawerOpen()) openDrawer();
    if (S.error) renderError(); else if (S.cur) renderCase(null);
  }
  if (s === "endScreen") renderEnd();
  if (s === "codexScreen") renderCodex();
  if ($("statsDlg").open) renderStats();
}

/* ---------------- wiring ---------------- */
document.querySelectorAll(".section-row").forEach((b) => b.addEventListener("click", () => openSection(b.dataset.section)));
document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
$("backHome").addEventListener("click", () => show("homeScreen"));
$("hintBtn").addEventListener("click", revealClue);
$("nextBtn").addEventListener("click", () => { if (S.error) { S.token++; show("homeScreen"); } else nextCase(); });
$("skipBonus").addEventListener("click", skipBonus);
$("againBtn").addEventListener("click", () => startGame(S.mode));
$("switchBtn").addEventListener("click", () => show("homeScreen"));
$("homeLink").addEventListener("click", (e) => { e.preventDefault(); S.token++; show("homeScreen"); });
$("aboutBtn").addEventListener("click", () => $("aboutDlg").showModal());
$("codexBtn").addEventListener("click", () => { if (screen() === "gameScreen") return openDrawer(); openCodex(screen() === "codexScreen" ? CX.tab : (S.sec?.id || "turkey")); });
$("openDrawer").addEventListener("click", () => openDrawer());
$("drawerClose").addEventListener("click", closeDrawer);
$("drawerVeil").addEventListener("click", closeDrawer);
$("modeCodex").addEventListener("click", () => openCodex(S.sec.id));
$("codexBack").addEventListener("click", () => show(CX.prev || "homeScreen"));
document.querySelectorAll("#codexTabs [data-tab]").forEach((b) => b.addEventListener("click", () => { CX.tab = b.dataset.tab; CX.focus = null; renderCodex(); }));
$("statsBtn").addEventListener("click", () => { renderStats(); $("statsDlg").showModal(); });
$("resetStats").addEventListener("click", () => { try { localStorage.removeItem(STATS_KEY); } catch { /* ignore */ } renderStats(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawerOpen()) { closeDrawer(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector("dialog[open]") || drawerOpen()) return;
  if (screen() === "endScreen" && e.key === "Enter") { e.preventDefault(); startGame(S.mode); return; }
  if (screen() !== "gameScreen") return;
  if (e.key === "Enter" && !$("verdict").hidden) { e.preventDefault(); $("nextBtn").click(); return; }
  const c = S.cur; if (!c || c.done) return;
  if (e.key === "h" || e.key === "H") return revealClue();
  if (/^[1-9]$/.test(e.key) && c.opts.list) { const b = $("answers").querySelectorAll(".ans")[Number(e.key) - 1]; if (b && !b.disabled) guess(b.dataset.key, b); }
});

(() => {
  const g = document.querySelector(".hero-sigil .ticks"); if (!g) return;
  let s = "";
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2, r1 = 172, r2 = i % 6 === 0 ? 156 : 165;
    s += `<line x1="${200 + r1 * Math.cos(a)}" y1="${200 + r1 * Math.sin(a)}" x2="${200 + r2 * Math.cos(a)}" y2="${200 + r2 * Math.sin(a)}"/>`;
  }
  g.innerHTML = s;
})();

drawOrnaments();
document.body.dataset.screen = "homeScreen";
applyStatic();
Promise.allSettled([turkey.load(), global.load(), lone.load()]).then(applyStatic);
