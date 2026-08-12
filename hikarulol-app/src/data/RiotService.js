// Riot API (summoner) servisi - hata korumalı versiyon
const RIOT_API_KEY =
  process.env.REACT_APP_RIOT_API_KEY ||
  'RGAPI-a3389ca2-49b9-4f29-875d-797bc558fd13';

export const PLATFORMS = {
  TR1: { code: 'tr1', region: 'europe', name: 'TR', cluster: 'europe' },
  EUW1: { code: 'euw1', region: 'europe', name: 'EUW', cluster: 'europe' },
  EUNE1: { code: 'eune1', region: 'europe', name: 'EUNE', cluster: 'europe' },
  NA1: { code: 'na1', region: 'americas', name: 'NA', cluster: 'americas' },
  BR1: { code: 'br1', region: 'americas', name: 'BR', cluster: 'americas' },
  LA1: { code: 'la1', region: 'americas', name: 'LAN', cluster: 'americas' },
  LA2: { code: 'la2', region: 'americas', name: 'LAS', cluster: 'americas' },
  KR: { code: 'kr', region: 'asia', name: 'KR', cluster: 'asia' },
  JP1: { code: 'jp1', region: 'asia', name: 'JP', cluster: 'asia' },
  OCE1: { code: 'oce1', region: 'sea', name: 'OCE', cluster: 'sea' },
  RU: { code: 'ru', region: 'europe', name: 'RU', cluster: 'europe' },
};

export async function searchSummoner(gameName, tagLine, platformCode = 'tr1') {
  const platform = PLATFORMS[platformCode] || PLATFORMS.TR1;

  if (!gameName?.trim() || !tagLine?.trim()) {
    throw new Error('Oyuncu adı ve etiket boş olamaz');
  }

  // 1. Riot ID (Account-v1) - regional cluster
  const accountUrl = `https://${platform.cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName.trim()
  )}/${encodeURIComponent(tagLine.trim())}?api_key=${RIOT_API_KEY}`;

  const accountRes = await fetch(accountUrl);
  if (!accountRes.ok) {
    if (accountRes.status === 404) {
      throw new Error(
        `"${gameName}#${tagLine}" adlı oyuncu bulunamadı. Riot ID ve bölgeyi kontrol edin.`
      );
    }
    if (accountRes.status === 403) {
      throw new Error(
        'API anahtarı geçersiz veya süresi dolmuş. Riot Development Key 24 saatte bir yenilenir. https://developer.riotgames.com adresinden yeni key alın.'
      );
    }
    if (accountRes.status === 429) {
      throw new Error('Rate limit aşıldı. Lütfen birkaç saniye sonra tekrar deneyin.');
    }
    if (accountRes.status === 401) {
      throw new Error('API anahtarı reddedildi. Key kontrolü gerekli.');
    }
    throw new Error(`Riot API hatası: HTTP ${accountRes.status}`);
  }

  const account = await accountRes.json();

  // 2. Summoner (Summoner-v4) - platform
  const summonerUrl = `https://${platform.code}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}?api_key=${RIOT_API_KEY}`;
  const summonerRes = await fetch(summonerUrl);
  if (!summonerRes.ok) {
    throw new Error(`Summoner bilgisi alınamadı: HTTP ${summonerRes.status}`);
  }
  const summoner = await summonerRes.json();

  return {
    account: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      puuid: account.puuid,
    },
    summoner: {
      id: summoner.id,
      puuid: summoner.puuid,
      name: summoner.name,
      level: summoner.summonerLevel,
      iconId: summoner.profileIconId,
    },
    platform: platform.name,
  };
}

// Oyuncu son 5 maçını çek (opsiyonel)
export async function getRecentMatches(puuid, platformCode, count = 5) {
  const platform = PLATFORMS[platformCode] || PLATFORMS.TR1;
  const url = `https://${platform.cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}&api_key=${RIOT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 403) return []; // production key gerekli
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export function getProfileIconURL(version, iconId) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
}
