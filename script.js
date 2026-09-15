const surahs = [
"الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"
];

let currentSurah = 1;
let currentSurahName = surahs[0];
let currentAyahs = [];
let fontSize = Number(localStorage.getItem("quranFontSize")) || 25;
const sectionIds = ["home","reader","favorites","quranSearch","prayerTimes","azkar","tafsir","settings"];

function $(id) { return document.getElementById(id); }

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));
}

function escapeAttribute(value) {
  return String(value ?? "").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\n/g," ");
}

function hideAllSections() {
  sectionIds.forEach(id => { const el = $(id); if (el) { el.hidden = true; el.classList.remove("active-section"); } });
}

function showSection(id) {
  hideAllSections();
  const el = $(id);
  if (el) { el.hidden = false; el.classList.add("active-section"); }
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderSurahs(list = surahs) {
  const container = $("surahList");
  if (!container) return;
  if (!list.length) { container.innerHTML = '<div class="empty">لم يتم العثور على سورة.</div>'; return; }
  container.innerHTML = list.map(name => {
    const number = surahs.indexOf(name) + 1;
    return `<button class="surah-card" style="text-align:right;width:100%;" onclick="openSurah(${number},'${escapeAttribute(name)}')">
      <span class="surah-number">${number}</span><h3>${escapeHTML(name)}</h3><p>سورة ${escapeHTML(name)}</p>
    </button>`;
  }).join("");
}

function searchSurahs() {
  const value = ($("searchInput")?.value || "").trim();
  renderSurahs(value ? surahs.filter(name => name.includes(value)) : surahs);
}

function showHome() { showSection("home"); renderSurahs(); showLastReading(); }
function showSurahs() { showSection("home"); renderSurahs(); $("searchInput")?.focus(); }
function showFavorites() { showSection("favorites"); renderFavorites(); }
function showQuranSearch() { showSection("quranSearch"); $("quranSearchInput")?.focus(); }
function showPrayerTimes() { showSection("prayerTimes"); }
function showAzkar() { showSection("azkar"); renderAzkar(); }
function showTafsir() { showSection("tafsir"); }
function showSettings() { showSection("settings"); }

async function openSurah(number, name = surahs[number - 1]) {
  currentSurah = number;
  currentSurahName = name;
  showSection("reader");
  $("surahTitle").textContent = `سورة ${name}`;
  $("quranText").innerHTML = '<div class="loading">🔄 جاري تحميل السورة...</div>';
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${number}/quran-uthmani`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.data?.ayahs) throw new Error("بيانات غير صحيحة");
    currentAyahs = data.data.ayahs;
    $("quranText").innerHTML = currentAyahs.map(ayah => `
      <div class="ayah" id="ayah-${ayah.numberInSurah}">
        <span class="ayah-text">${escapeHTML(ayah.text)} <span class="ayah-number">۝${ayah.numberInSurah}</span></span>
        <div class="ayah-buttons">
          <button onclick="saveLastPosition(${number},${ayah.numberInSurah})">🔖 حفظ الموضع</button>
          <button onclick="toggleFavorite(${number},${ayah.numberInSurah},'${escapeAttribute(ayah.text)}')">⭐ المفضلة</button>
          <button onclick="copyAyah('${escapeAttribute(ayah.text)}')">📋 نسخ</button>
          <button onclick="shareAyah('${escapeAttribute(name)}',${ayah.numberInSurah},'${escapeAttribute(ayah.text)}')">📤 مشاركة</button>
        </div>
      </div>`).join("");
    applyFontSize();
    setAudio(number);
  } catch (error) {
    console.error(error);
    $("quranText").innerHTML = '<div class="error">تعذر تحميل السورة. تأكد من اتصال الإنترنت ثم حاول مرة أخرى.</div>';
  }
}

function setAudio(number) {
  const audio = $("quranAudio");
  if (!audio) return;
  audio.src = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${number}.mp3`;
  audio.load();
}
function playCurrentSurah() { const audio = $("quranAudio"); if (audio) audio.play().catch(console.error); }
function pauseAudio() { const audio = $("quranAudio"); if (audio) audio.pause(); }

function saveLastPosition(surah, ayah) {
  localStorage.setItem("lastPosition", JSON.stringify({surah, ayah}));
  showLastReading();
  alert("🔖 تم حفظ موضع القراءة");
}
function showLastReading() {
  const box = $("lastReading");
  if (!box) return;
  const raw = localStorage.getItem("lastPosition");
  if (!raw) { box.innerHTML = "<strong>🔖 آخر قراءة</strong><p class=\"muted\">لم تحفظ موضع قراءة بعد.</p>"; return; }
  try {
    const data = JSON.parse(raw);
    const name = surahs[data.surah - 1];
    if (!name) throw new Error("invalid");
    box.innerHTML = `<strong>🔖 آخر موضع قراءة</strong><p>سورة ${escapeHTML(name)} — الآية ${data.ayah}</p><button onclick="openSurah(${data.surah},'${escapeAttribute(name)}')">متابعة القراءة</button>`;
  } catch { localStorage.removeItem("lastPosition"); box.innerHTML = "<strong>🔖 آخر قراءة</strong><p class=\"muted\">لم تحفظ موضع قراءة بعد.</p>"; }
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem("favorites") || "[]"); } catch { return []; }
}
function toggleFavorite(surah, ayah, text) {
  let favorites = getFavorites();
  const exists = favorites.some(item => item.surah === surah && item.ayah === ayah);
  if (exists) favorites = favorites.filter(item => !(item.surah === surah && item.ayah === ayah));
  else favorites.push({surah, ayah, text});
  localStorage.setItem("favorites", JSON.stringify(favorites));
  alert(exists ? "تم حذف الآية من المفضلة" : "⭐ تمت إضافة الآية للمفضلة");
}
function renderFavorites() {
  const container = $("favoritesList");
  if (!container) return;
  const favorites = getFavorites();
  if (!favorites.length) { container.innerHTML = '<div class="card empty">لا توجد آيات في المفضلة.</div>'; return; }
  container.innerHTML = favorites.map((item,index) => {
    const name = surahs[item.surah - 1] || "غير معروفة";
    return `<div class="card">
      <h3 style="color:var(--green)">سورة ${escapeHTML(name)} — الآية ${item.ayah}</h3>
      <p class="quran-text" style="font-size:22px">${escapeHTML(item.text)}</p>
      <div class="favorite-actions">
        <button onclick="openSurah(${item.surah},'${escapeAttribute(name)}')">📖 فتح السورة</button>
        <button onclick="copyAyah('${escapeAttribute(item.text)}')">📋 نسخ</button>
        <button onclick="removeFavorite(${index})">🗑️ حذف</button>
      </div>
    </div>`;
  }).join("");
}
function removeFavorite(index) {
  const favorites = getFavorites();
  favorites.splice(index,1);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
}

async function copyAyah(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert("📋 تم نسخ الآية");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text; document.body.appendChild(textarea); textarea.select(); document.execCommand("copy"); textarea.remove();
    alert("📋 تم نسخ الآية");
  }
}
async function shareAyah(surah, ayah, text) {
  const content = `سورة ${surah}\nالآية ${ayah}\n\n${text}`;
  if (navigator.share) { try { await navigator.share({title:"آية من القرآن الكريم", text:content}); } catch(e) {} }
  else await copyAyah(content);
}

function applyFontSize() { const el = $("quranText"); if (el) el.style.fontSize = `${fontSize}px`; }
function changeFontSize(amount) { fontSize = Math.max(16, Math.min(50, fontSize + amount)); localStorage.setItem("quranFontSize", fontSize); applyFontSize(); }
function resetFontSize() { fontSize = 25; localStorage.setItem("quranFontSize", fontSize); applyFontSize(); }

async function searchQuran() {
  const keyword = ($("quranSearchInput")?.value || "").trim();
  const results = $("quranSearchResults");
  if (!results) return;
  if (!keyword) { results.innerHTML = '<div class="empty">اكتب كلمة للبحث.</div>'; return; }
  results.innerHTML = '<div class="loading">🔄 جاري البحث...</div>';
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(keyword)}/all/quran-uthmani`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const matches = data.data?.matches || [];
    if (!matches.length) { results.innerHTML = '<div class="empty">لم يتم العثور على نتائج.</div>'; return; }
    results.innerHTML = matches.map(match => `
      <div class="search-result">
        <h3>${escapeHTML(match.surah?.name || "سورة")} — الآية ${match.numberInSurah}</h3>
        <p>${escapeHTML(match.text)}</p>
        <button onclick="openSurah(${match.surah.number},'${escapeAttribute(match.surah.name)}')">📖 فتح السورة</button>
      </div>`).join("");
  } catch (error) {
    console.error(error);
    results.innerHTML = '<div class="error">تعذر تنفيذ البحث. تأكد من اتصال الإنترنت.</div>';
  }
}

async function loadPrayerTimes() {
  const city = ($("prayerCity")?.value || "").trim();
  const country = ($("prayerCountry")?.value || "").trim();
  const result = $("prayerResult");
  if (!result) return;
  if (!city || !country) { result.innerHTML = '<div class="empty">أدخل المدينة والدولة.</div>'; return; }
  result.innerHTML = '<div class="loading">🔄 جاري تحميل المواقيت...</div>';
  const now = new Date();
  const date = `${String(now.getDate()).padStart(2,"0")}-${String(now.getMonth()+1).padStart(2,"0")}-${now.getFullYear()}`;
  try {
    const url = `https://api.aladhan.com/v1/timingsByAddress/${date}?address=${encodeURIComponent(`${city}, ${country}`)}&method=4`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const t = data.data?.timings;
    if (!t) throw new Error("no timings");
    const prayers = [["الفجر",t.Fajr],["الشروق",t.Sunrise],["الظهر",t.Dhuhr],["العصر",t.Asr],["المغرب",t.Maghrib],["العشاء",t.Isha]];
    result.innerHTML = prayers.map(([name,time]) => `<div class="prayer-card"><h3>${name}</h3><div class="prayer-time">${escapeHTML(time)}</div></div>`).join("");
  } catch (error) {
    console.error(error);
    result.innerHTML = '<div class="error">تعذر تحميل مواقيت الصلاة. تحقق من المدينة والدولة واتصال الإنترنت.</div>';
  }
}

const azkarData = [
  {title:"الاستغفار", text:"أستغفر الله وأتوب إليه", count:100},
  {title:"التسبيح", text:"سبحان الله وبحمده", count:100},
  {title:"الحمد", text:"الحمد لله", count:33},
  {title:"التوحيد", text:"لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", count:10},
  {title:"الصلاة على النبي ﷺ", text:"اللهم صل وسلم على نبينا محمد", count:10}
];
function renderAzkar() {
  const container = $("azkarList");
  if (!container) return;
  container.innerHTML = azkarData.map((z,i) => `<article class="zikr-card">
    <h3>${escapeHTML(z.title)}</h3><div class="zikr-text">${escapeHTML(z.text)}</div>
    <div class="zikr-footer"><button onclick="countZikr(${i})">🔢 تسبيح</button><span class="counter" id="zikrCounter${i}">0</span><span class="muted">المقترح: ${z.count}</span></div>
  </article>`).join("");
}
function countZikr(index) {
  const el = $(`zikrCounter${index}`); if (!el) return;
  let value = Number(el.textContent) + 1; if (value > azkarData[index].count) value = 0; el.textContent = value;
}

async function loadTafsir() {
  const surah = Number($("tafsirSurah")?.value);
  const ayah = Number($("tafsirAyah")?.value);
  const result = $("tafsirResult");
  if (!result) return;
  if (!surah || !ayah || surah < 1 || surah > 114 || ayah < 1) { result.innerHTML = '<div class="empty">أدخل رقم السورة والآية بشكل صحيح.</div>'; return; }
  result.innerHTML = '<div class="loading">🔄 جاري تحميل الآية والتفسير...</div>';
  try {
    const [ayahResponse, tafsirResponse] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/quran-uthmani`),
      fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.muyassar`)
    ]);
    if (!ayahResponse.ok || !tafsirResponse.ok) throw new Error("API error");
    const ayahData = await ayahResponse.json();
    const tafsirData = await tafsirResponse.json();
    const ayahText = ayahData.data?.text;
    const tafsirText = tafsirData.data?.text;
    if (!ayahText || !tafsirText) throw new Error("missing data");
    result.innerHTML = `<div class="tafsir-card"><h3>سورة ${escapeHTML(ayahData.data.surah?.name || surah)} — الآية ${ayah}</h3><div class="tafsir-ayah">${escapeHTML(ayahText)}</div><h3>📚 التفسير الميسر</h3><div class="tafsir-text">${escapeHTML(tafsirText)}</div></div>`;
  } catch (error) {
    console.error(error);
    result.innerHTML = '<div class="error">تعذر تحميل التفسير. قد تكون طبعة التفسير غير متاحة مؤقتًا.</div>';
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "true" : "false");
}
function loadDarkMode() { if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark"); }
function clearAppData() {
  if (!confirm("هل أنت متأكد من حذف جميع البيانات المحفوظة؟")) return;
  ["favorites","lastPosition","quranFontSize","darkMode"].forEach(key => localStorage.removeItem(key));
  location.reload();
}

function initializeApp() {
  loadDarkMode();
  renderSurahs();
  showLastReading();
  applyFontSize();
}

document.addEventListener("DOMContentLoaded", initializeApp);
