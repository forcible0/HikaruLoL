// Community Dragon / Data Dragon'dan veri çekme
// API key gerektirmez. Ücretsiz statik veri.

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';
const DDRAGON_CDN = 'https://ddragon.leagueoflegends.com/cdn';

// Cache'leme - aynı patch için tekrar istek atılmasın
const cache = new Map();

async function fetchJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.ok ? '200' : res.status} - ${url}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

// En son patch versiyonunu al
export async function getLatestVersion() {
  const versions = await fetchJSON(`${DDRAGON_BASE}/api/versions.json`);
  return versions[0];
}

// Tüm şampiyonları getir
export async function getAllChampions(locale = 'en_US') {
  const version = await getLatestVersion();
  const data = await fetchJSON(`${DDRAGON_CDN}/${version}/data/${locale}/champion.json`);
  return {
    version,
    champions: Object.values(data.data).map((c) => ({
      id: c.id,
      key: c.key,
      name: c.name,
      title: c.title,
      tags: c.tags, // ['Fighter', 'Tank']
      partype: c.partype,
      stats: c.stats,
      image: {
        full: c.image.full,
        sprite: c.image.sprite,
      },
      version: c.version,
    })),
  };
}

// Tek şampiyonun detaylı verisi
export async function getChampionDetail(championId, locale = 'en_US') {
  const version = await getLatestVersion();
  const data = await fetchJSON(
    `${DDRAGON_CDN}/${version}/data/${locale}/champion/${championId}.json`
  );
  const champ = Object.values(data.data)[0];
  return { version, champion: champ };
}

// Tüm itemleri getir
export async function getAllItems(locale = 'en_US') {
  const version = await getLatestVersion();
  const data = await fetchJSON(`${DDRAGON_CDN}/${version}/data/${locale}/item.json`);
  return {
    version,
    items: Object.entries(data.data).map(([id, item]) => ({
      id,
      name: item.name,
      description: item.description,
      plaintext: item.plaintext,
      gold: item.gold,
      image: item.image,
      tags: item.tags,
      stats: item.stats,
      maps: item.maps,
      depth: item.depth,
    })),
  };
}

// Tüm rünleri getir
export async function getAllRunes(locale = 'en_US') {
  const version = await getLatestVersion();
  // Runes reforged artık Community Dragon'da
  const cdragonUrl = `https://raw.githubusercontent.com/CommunityDragon/Data/latest/lol-game-data/assets/${locale.toLowerCase()}/runesReforged.json`;
  try {
    const data = await fetchJSON(cdragonUrl);
    return data;
  } catch (e) {
    // Fallback - ddragon üzerinden
    return [];
  }
}

// Tüm summoner spellleri getir
export async function getSummonerSpells(locale = 'en_US') {
  const version = await getLatestVersion();
  const data = await fetchJSON(
    `${DDRAGON_CDN}/${version}/data/${locale}/summoner.json`
  );
  return Object.values(data.data);
}

// Görsel URL'i oluştur
export function getChampionIconURL(version, fullImageName) {
  return `${DDRAGON_CDN}/${version}/img/champion/${fullImageName}`;
}

export function getItemIconURL(version, imageName) {
  return `${DDRAGON_CDN}/${version}/img/item/${imageName}`;
}

export function getRuneIconURL(runeIconPath) {
  // cdragon path: perk-images/Styles/Precision/...
  return `https://raw.githubusercontent.com/CommunityDragon/Data/latest/lol-game-data/${runeIconPath}`;
}

export function getSpellIconURL(version, imageName) {
  return `${DDRAGON_CDN}/${version}/img/spell/${imageName}`;
}

export function getPassiveIconURL(version, imageName) {
  return `${DDRAGON_CDN}/${version}/img/passive/${imageName}`;
}

// Sık kullanılan API key'ler (sadece opsiyonel Riot API özellikleri için)
const RIOT_API_KEY = 'RGAPI-a3389ca2-49b9-4f29-875d-797bc558fd13';

// Platform route'ları
export const PLATFORMS = {
  NA1: { code: 'na1', region: 'americas', name: 'NA' },
  EUW1: { code: 'euw1', region: 'europe', name: 'EUW' },
  EUNE1: { code: 'eune1', region: 'europe', name: 'EUNE' },
  KR: { code: 'kr', region: 'asia', name: 'KR' },
  BR1: { code: 'br1', region: 'americas', name: 'BR' },
  JP1: { code: 'jp1', region: 'asia', name: 'JP' },
  RU: { code: 'ru', region: 'europe', name: 'RU' },
  OCE1: { code: 'oce1', region: 'sea', name: 'OCE' },
  TR1: { code: 'tr1', region: 'europe', name: 'TR' },
  LA1: { code: 'la1', region: 'americas', name: 'LAN' },
  LA2: { code: 'la2', region: 'americas', name: 'LAS' },
};

// Oyuncu arama (Riot API kullanır, opsiyonel)
export async function searchSummoner(gameName, tagLine, platformCode = 'tr1') {
  const platform = Object.values(PLATFORMS).find((p) => p.code === platformCode);
  if (!platform) throw new Error('Geçersiz platform');

  const accountUrl = `https://${platform.region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?api_key=${RIOT_API_KEY}`;
  const accountRes = await fetch(accountUrl);
  if (!accountRes.ok) {
    if (accountRes.status === 404) throw new Error('Summoner bulunamadı');
    if (accountRes.status === 403) throw new Error('API key geçersiz veya süresi dolmuş');
    throw new Error(`HTTP ${accountRes.status}`);
  }
  const account = await accountRes.json();

  const summonerUrl = `https://${platform.code}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}?api_key=${RIOT_API_KEY}`;
  const summonerRes = await fetch(summonerUrl);
  if (!summonerRes.ok) throw new Error(`HTTP ${summonerRes.status}`);
  const summoner = await summonerRes.json();

  return {
    account: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      puuid: account.puuid,
    },
    summoner: {
      id: summoner.id,
      name: summoner.name,
      level: summoner.summonerLevel,
      iconId: summoner.profileIconId,
    },
    platform: platform.name,
  };
}
