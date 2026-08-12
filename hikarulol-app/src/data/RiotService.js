// Riot API (summoner) servisi - hata korumalı
const RIOT_API_KEY =
  'RGAPI-a3389ca2-49b9-4f29-875d-797bc558fd13';

export const PLATFORMS = {
  TR1: { code: 'tr1', cluster: 'europe', name: 'TR' },
  EUW1: { code: 'euw1', cluster: 'europe', name: 'EUW' },
  EUNE1: { code: 'eune1', cluster: 'europe', name: 'EUNE' },
  NA1: { code: 'na1', cluster: 'americas', name: 'NA' },
  BR1: { code: 'br1', cluster: 'americas', name: 'BR' },
  LA1: { code: 'la1', cluster: 'americas', name: 'LAN' },
  LA2: { code: 'la2', cluster: 'americas', name: 'LAS' },
  KR: { code: 'kr', cluster: 'asia', name: 'KR' },
  JP1: { code: 'jp1', cluster: 'asia', name: 'JP' },
  OCE1: { code: 'oce1', cluster: 'sea', name: 'OCE' },
  RU: { code: 'ru', cluster: 'europe', name: 'RU' },
};

export async function searchSummoner(gameName, tagLine, platformCode = 'tr1') {
  const platform = PLATFORMS[platformCode] || PLATFORMS.TR1;

  if (!gameName?.trim() || !tagLine?.trim()) {
    throw new Error('Oyuncu adı ve etiket boş olamaz');
  }

  const accountUrl = `https://${platform.cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
    gameName.trim()
  )}/${encodeURIComponent(tagLine.trim())}?api_key=${RIOT_API_KEY}`;

  const accountRes = await fetch(accountUrl);
  if (!accountRes.ok) {
    if (accountRes.status === 404) {
      throw new Error(`"${gameName}#${tagLine}" adlı oyuncu bulunamadı. Riot ID ve bölgeyi kontrol edin.`);
    }
    if (accountRes.status === 403) {
      throw new Error('API anahtarı geçersiz veya süresi dolmuş. Riot Development Key 24 saatte bir yenilenir. https://developer.riotgames.com adresinden yeni key alın.');
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

export function getProfileIconURL(version, iconId) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
}
