import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import ChampionsList from './components/ChampionsList';
import TierList from './components/TierList';
import ChampionDetail from './components/ChampionDetail';
import SummonerSearch from './components/SummonerSearch';
import { getAllChampions, getLatestVersion } from './data/communityDragon';

export default function App() {
  const [champions, setChampions] = useState([]);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ver = await getLatestVersion();
        const data = await getAllChampions('en_US');
        if (cancelled) return;
        setVersion(ver);
        // Versiyonu da image URL'leri için saklayalım
        setChampions(data.champions.map((c) => ({ ...c, version: ver })));
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
          <div style={{ color: 'var(--text-muted)' }}>Şampiyon verileri yükleniyor...</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Bu ilk açılışta birkaç saniye sürebilir</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="loading">
          <div className="empty-icon" style={{ fontSize: 64 }}>⚠️</div>
          <div style={{ color: 'var(--accent-red)', fontSize: 16 }}>Veri yüklenemedi</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 500, textAlign: 'center' }}>
            {error}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 12 }}>
            İnternet bağlantınızı kontrol edip sayfayı yenileyin.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header champions={champions} version={version} />
      <main className="main" key={location.pathname}>
        <Routes>
          <Route path="/" element={<ChampionsList champions={champions} version={version} />} />
          <Route path="/tierlist" element={<TierList champions={champions} version={version} />} />
          <Route path="/aram" element={<ChampionsList champions={champions} version={version} />} />
          <Route path="/champions/:id" element={<ChampionDetail champions={champions} version={version} />} />
          <Route path="/search" element={<SummonerSearch />} />
        </Routes>
      </main>
    </div>
  );
}
