// Veri servisi - Data Dragon (Riot) + Community Dragon
// API key gerektirmez, tamamen ücretsiz

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com/cdn';
const DDRAGON_API = 'https://ddragon.leagueoflegends.com/api';
const CDRAGON_RAW = 'https://raw.communitydragon.org/latest';

const memCache = new Map();
const CACHE_TTL = 1000 * 60 * 60;

async function fetchJSON(url) {
  const cached = memCache.get(url);
  if (cached && Date.now() - cached.t < CACHE_TTL) return cached.data;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  memCache.set(url, { data, t: Date.now() });
  return data;
}

async function fetchText(url) {
  const cached = memCache.get(url);
  if (cached && Date.now() - cached.t < CACHE_TTL) return cached.data;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  memCache.set(url, { data: text, t: Date.now() });
  return text;
}

export async function getLatestVersion() {
  const v = await fetchJSON(`${DDRAGON_API}/versions.json`);
  return v[0];
}

// Community Dragon tier/play rate verisi (gerçek meta)
export async function getCdragonMetaStats() {
  try {
    const js = await fetchText(
      `${CDRAGON_RAW}/plugins/rcp-fe-lol-champion-statistics/global/default/rcp-fe-lol-champion-statistics.js`
    );
    const match = js.match(/JSON\.parse\('(\{[\s\S]*?\})'\)/);
    if (!match) throw new Error('Parse error');
    return JSON.parse(match[1]);
  } catch (e) {
    return null;
  }
}

export async function getAllChampions(version, locale = 'en_US') {
  const data = await fetchJSON(
    `${DDRAGON_BASE}/${version}/data/${locale}/champion.json`
  );
  return Object.values(data.data).map((c) => ({
    id: c.id,
    key: c.key,
    name: c.name,
    title: c.title,
    tags: c.tags || [],
    partype: c.partype,
    stats: c.stats || {},
    image: c.image,
    blurb: c.blurb,
  }));
}

export async function getChampionDetail(id, version, locale = 'en_US') {
  const data = await fetchJSON(
    `${DDRAGON_BASE}/${version}/data/${locale}/champion/${id}.json`
  );
  return Object.values(data.data)[0];
}

export async function getAllItems(version, locale = 'en_US') {
  const data = await fetchJSON(
    `${DDRAGON_BASE}/${version}/data/${locale}/item.json`
  );
  return Object.entries(data.data).map(([id, item]) => ({
    id,
    name: item.name,
    description: item.description,
    plaintext: item.plaintext,
    gold: item.gold || {},
    image: item.image,
    tags: item.tags || [],
    stats: item.stats || {},
    maps: item.maps || {},
    depth: item.depth,
    into: item.into || [],
    from: item.from || [],
  }));
}

export async function getAllRunes(version, locale = 'en_US') {
  return fetchJSON(
    `${DDRAGON_BASE}/${version}/data/${locale}/runesReforged.json`
  );
}

export async function getSummonerSpells(version, locale = 'en_US') {
  const data = await fetchJSON(
    `${DDRAGON_BASE}/${version}/data/${locale}/summoner.json`
  );
  return Object.values(data.data);
}

export const ImgURL = {
  champion: (version, fullName) => `${DDRAGON_BASE}/${version}/img/champion/${fullName}`,
  item: (version, fullName) => `${DDRAGON_BASE}/${version}/img/item/${fullName}`,
  spell: (version, fullName) => `${DDRAGON_BASE}/${version}/img/spell/${fullName}`,
  passive: (version, fullName) => `${DDRAGON_BASE}/${version}/img/passive/${fullName}`,
  profileIcon: (version, iconId) =>
    `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`,
  rune: (path) => `${CDRAGON_RAW}/${path}`,
};
