import React, { useState } from 'react';
import { searchSummoner, PLATFORMS, getLatestVersion } from '../data/communityDragon';

export default function SummonerSearch() {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [platform, setPlatform] = useState('tr1');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(null);

  React.useEffect(() => {
    getLatestVersion().then(setVersion).catch(() => {});
  }, []);

  const onSearch = async () => {
    if (!gameName.trim() || !tagLine.trim()) {
      setError('Oyuncu adı ve etiket gerekli');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await searchSummoner(gameName, tagLine, platform);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="champions-page" style={{ maxWidth: 800 }}>
      <h2 style={{ marginBottom: 16, fontSize: 20, fontWeight: 700 }}>Oyuncu Ara</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>
        Riot ID (GameName #TagLine) ile oyuncu profili arayın. Örnek: <strong>Faker</strong> + <strong>KR1</strong>
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="search-input"
          placeholder="Oyuncu adı"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          style={{ flex: 2, padding: '10px 12px' }}
        />
        <span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>#</span>
        <input
          className="search-input"
          placeholder="Tag"
          value={tagLine}
          onChange={(e) => setTagLine(e.target.value)}
          style={{ flex: 1, padding: '10px 12px' }}
        />
        <select
          className="search-input"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          style={{ flex: 1, padding: '10px 12px' }}
        >
          {Object.values(PLATFORMS).map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
        <button
          className="role-btn active"
          onClick={onSearch}
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          {loading ? 'Aranıyor...' : 'Ara'}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: 'rgba(231, 76, 60, 0.1)', border: '1px solid var(--accent-red)', borderRadius: 6, color: 'var(--accent-red)', marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="summoner-result">
          <div className="summoner-profile">
            <img
              className="summoner-icon"
              src={version
                ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${result.summoner.iconId}.png`
                : 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/1.png'
              }
              alt="icon"
              onError={(e) => { e.target.src = 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/1.png'; }}
            />
            <div className="summoner-info">
              <h2>{result.account.gameName} <span style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 500 }}>#{result.account.tagLine}</span></h2>
              <div className="summoner-level">Seviye {result.summoner.level} • {result.platform}</div>
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            ✓ Profil bilgileri başarıyla alındı.<br/>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Not: Riot API ücretsiz tier'da sadece hesap ve summoner bilgisi sağlar.
              Rank, maç geçmişi ve lig bilgisi için uygulama geliştirici onayı gerekir.
            </span>
          </div>
        </div>
      )}

      {!result && !error && !loading && (
        <div className="empty">
          <div className="empty-icon">🔎</div>
          <div>Yukarıdaki forma bir oyuncu adı ve etiket girip aratabilirsiniz</div>
        </div>
      )}
    </div>
  );
}
