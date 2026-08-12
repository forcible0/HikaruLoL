import React, { useState, useEffect } from 'react';
import { searchSummoner, PLATFORMS, getProfileIconURL } from '../data/RiotService';

export default function SummonerSearch({ version }) {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [platform, setPlatform] = useState('TR1');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyStatus, setKeyStatus] = useState('unknown'); // valid | invalid | unknown

  useEffect(() => {
    setError(null);
    setResult(null);
  }, [platform]);

  const onSearch = async () => {
    if (!gameName.trim() || !tagLine.trim()) {
      setError('Oyuncu adı ve etiket boş olamaz');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setKeyStatus('unknown');
    try {
      const data = await searchSummoner(gameName, tagLine, platform);
      setResult(data);
      setKeyStatus('valid');
    } catch (e) {
      setError(e.message);
      if (e.message.includes('API anahtarı') || e.message.includes('geçersiz') || e.message.includes('süresi dolmuş') || e.message.includes('reddedildi')) {
        setKeyStatus('invalid');
      } else if (e.message.includes('bulunamadı')) {
        setKeyStatus('valid'); // key çalışıyor, sadece oyuncu yok
      } else if (e.message.includes('Rate limit')) {
        setKeyStatus('rate-limited');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="champions-page" style={{ maxWidth: 800 }}>
      <h2 style={{ marginBottom: 8, fontSize: 22, fontWeight: 800 }}>Oyuncu Ara</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: 13 }}>
        Riot ID (GameName#TagLine) ile oyuncu profili arayın.
        Örnek: <strong>Faker</strong> + <strong>KR1</strong>
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="search-input"
          placeholder="Oyuncu adı"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          style={{ flex: '2 1 200px', padding: '10px 12px' }}
        />
        <span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>#</span>
        <input
          className="search-input"
          placeholder="Tag"
          value={tagLine}
          onChange={(e) => setTagLine(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          style={{ flex: '1 1 100px', padding: '10px 12px' }}
        />
        <select
          className="search-input"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          style={{ flex: '1 1 120px', padding: '10px 12px' }}
        >
          {Object.values(PLATFORMS).map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
        <button
          className="role-btn active"
          onClick={onSearch}
          disabled={loading}
          style={{ padding: '10px 20px', minWidth: 100 }}
        >
          {loading ? '⏳' : '🔍 Ara'}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            background: keyStatus === 'invalid' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(243, 156, 18, 0.1)',
            border: '1px solid ' + (keyStatus === 'invalid' ? 'var(--accent-red)' : 'var(--accent-gold)'),
            borderRadius: 6,
            color: keyStatus === 'invalid' ? 'var(--accent-red)' : 'var(--accent-gold)',
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {keyStatus === 'invalid' && '🔑 '}
          {keyStatus === 'rate-limited' && '⏱️ '}
          {keyStatus === 'valid' && '🔍 '}
          {error}
        </div>
      )}

      {result && (
        <div className="summoner-result">
          <div className="summoner-profile">
            <img
              className="summoner-icon"
              src={getProfileIconURL(version, result.summoner.iconId)}
              alt="icon"
              onError={(e) => { e.target.src = getProfileIconURL(version, 1); }}
            />
            <div className="summoner-info">
              <h2>
                {result.account.gameName}{' '}
                <span style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 500 }}>
                  #{result.account.tagLine}
                </span>
              </h2>
              <div className="summoner-level">
                Seviye {result.summoner.level} • {result.platform}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: 14,
              background: 'var(--bg-primary)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            <div>✓ Profil bilgileri başarıyla alındı.</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
              <strong>Not:</strong> Riot Development API anahtarı 24 saatte bir yenilenir ve yalnızca hesap + summoner bilgisi sağlar. Rank, lig ve maç geçmişi için{' '}
              <a
                href="https://developer.riotgames.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-blue)', textDecoration: 'underline' }}
              >
                Production Key
              </a>{' '}
              başvurusu gerekir.
            </div>
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
