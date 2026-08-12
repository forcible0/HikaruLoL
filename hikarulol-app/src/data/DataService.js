// Merkezi veri servisi - birden fazla kaynaktan paralel olarak veri çeker
// Kaynaklar (öncelik sırasıyla):
//   1. Data Dragon (Riot) - ddragon.leagueoflegends.com
//   2. Community Dragon - raw.communitydragon.org
// Hepsi ücretsiz ve API key gerektirmez.

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com/cdn';
const DDRAGON_API = 'https://ddragon.leagueoflegends.com/api';
const CDRAGON_RAW = 'https://raw.communitydragon.org/latest';

// Cache
const memCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 saat

async function fetchJSON(url, options = {}) {
  const cached = memCache.get(url);
  if (cached && Date.now() - cached.t < CACHE_TTL) {
    return cached.data;
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }
  const data = await res.json();
  memCache.set(url, { data, t: Date.now() });
  return data;
}

async function fetchText(url) {
  const cached = memCache.get(url);
  if (cached && Date.now() - cached.t < CACHE_TTL) {
    return cached.data;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const text = await res.text();
  memCache.set(url, { data: text, t: Date.now() });
  return text;
}

async function fetchSafe(promiseFactory, fallback = null) {
  try {
    return await promiseFactory();
  } catch (e) {
    console.warn('[DataService] Fetch failed:', e.message);
    return fallback;
  }
}

// En son patch versiyonu
export async function getLatestVersion() {
  return fetchJSON(`${DDRAGON_API}/versions.json`).then((v) => v[0]);
}

// Community Dragon'ın tier/play rate verisi (gerçek Riot meta verisi)
// Bu dosya, oyun client'ının kullandığı, canlı meta verisini içerir
export async function getCdragonMetaStats() {
  try {
    const js = await fetchText(
      `${CDRAGON_RAW}/plugins/rcp-fe-lol-champion-statistics/global/default/rcp-fe-lol-champion-statistics.js`
    );
    // JS içindeki JSON.parse('...') kısmını çıkar
    // Format: ...e.exports=JSON.parse('{"SUPPORT":{"12":0.01945,...')
    const match = js.match(/JSON\.parse\('(\{[\s\S]*?\})'\)/);
    if (!match) throw new Error('Meta stats parse edilemedi');
    return JSON.parse(match[1]);
  } catch (e) {
    console.warn('[DataService] cdragon meta stats alınamadı:', e.message);
    return null;
  }
}

// Tüm şampiyonlar - Data Dragon'dan (her zaman çalışır)
export async function getAllChampions(version, locale = 'en_US') {
  const data = await fetchJSON(
    `${DDRAGON_BASE}/${version}/data/${locale}/champion.json`
  );
  return Object.values(data.data).map((c) => ({
    id: c.id, // 'Aatrox'
    key: c.key, // '266'
    name: c.name,
    title: c.title,
    tags: c.tags,
    partype: c.partype,
    stats: c.stats,
    image: c.image,
    blurb: c.blurb,
  }));
}

// Tek şampiyon detayı
export async function getChampionDetail(id, version, locale = 'en_US') {
  const data = await fetchJSON(
    `${DDRAGON_BASE}/${version}/data/${locale}/champion/${id}.json`
  );
  return Object.values(data.data)[0];
}

// Tüm itemler
export async function getAllItems(version, locale = 'en_US') {
  const data = await fetchJSON(
    `${DDRAGON_BASE}/${version}/data/${locale}/item.json`
  );
  return Object.entries(data.data).map(([id, item]) => ({
    id,
    name: item.name,
    description: item.description,
    plaintext: item.plaintext,
    gold: item.gold,
    image: item.image,
    tags: item.tags || [],
    stats: item.stats || {},
    maps: item.maps || {},
    depth: item.depth,
    into: item.into || [],
    from: item.from || [],
  }));
}

// Tüm rünler (Data Dragon)
export async function getAllRunes(version, locale = 'en_US') {
  return fetchJSON(
    `${DDRAGON_BASE}/${version}/data/${locale}/runesReforged.json`
  );
}

// Tüm summoner spelller
export async function getSummonerSpells(version, locale = 'en_US') {
  const data = await fetchJSON(
    `${DDRAGON_BASE}/${version}/data/${locale}/summoner.json`
  );
  return Object.values(data.data);
}

// URL yardımcıları
export const ImgURL = {
  champion: (version, fullName) => `${DDRAGON_BASE}/${version}/img/champion/${fullName}`,
  item: (version, fullName) => `${DDRAGON_BASE}/${version}/img/item/${fullName}`,
  spell: (version, fullName) => `${DDRAGON_BASE}/${version}/img/spell/${fullName}`,
  passive: (version, fullName) => `${DDRAGON_BASE}/${version}/img/passive/${fullName}`,
  profileIcon: (version, iconId) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`,
  rune: (path) => `${CDRAGON_RAW}/${path}`,
};

// Şampiyon adından ID'ye eşleme (API'de ID number, ddragon'da key string)
export function aliasToKey(championName) {
  return championName.replace(/[^a-zA-Z0-9]/g, '');
}

export function getDataDragonLocale(lang) {
  const map = {
    en: 'en_US',
    tr: 'tr_TR',
    de: 'de_DE',
    fr: 'fr_FR',
    es: 'es_ES',
    it: 'it_IT',
    ja: 'ja_JP',
    ko: 'ko_KR',
    pt: 'pt_BR',
    ru: 'ru_RU',
    zh: 'zh_CN',
  };
  return map[lang] || 'en_US';
}
