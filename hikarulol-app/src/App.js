import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ChampionsList from './components/ChampionsList';
import TierList from './components/TierList';
import ChampionDetail from './components/ChampionDetail';
import SummonerSearch from './components/SummonerSearch';
import { getLatestVersion, getAllChampions, getAllItems, getAllRunes, getSummonerSpells } from './data/DataService';
import { buildTierList } from './data/MetaService';
import MOCK_CHAMPIONS from './data/mockData';

export default function App() {
  const [champions, setChampions] = useState([]);
  const [tieredChampions, setTieredChampions] = useState([]);
  const [items, setItems] = useState([]);
  const [runes, setRunes] = useState([]);
  const [spells, setSpells] = useState([]);
  const [version, setVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadProgress(10);
        // 1. Patch versiyonu
        let ver = '14.1.1';
        try {
          ver = await getLatestVersion();
        } catch (e) {
          console.warn('Version fetch failed, using fallback');
        }
        if (cancelled) return;
        setVersion(ver);
        setLoadProgress(25);

        // 2. Şampiyonlar
        let champList = [];
        try {
          champList = await getAllChampions(ver);
        } catch (e) {
          console.warn('Champions fetch failed, using mock data');
          champList = MOCK_CHAMPIONS;
        }
        if (cancelled) return;
        setChampions(champList);
        setLoadProgress(50);

        // 3. Item, rün, spell - paralel
        const [itemsData, runesData, spellsData] = await Promise.all([
          getAllItems(ver).catch(() => []),
          getAllRunes(ver).catch(() => []),
          getSummonerSpells(ver).catch(() => []),
        ]);
        if (cancelled) return;
        setItems(itemsData);
        setRunes(runesData);
        setSpells(spellsData);
        setLoadProgress(75);

        // 4. Tier listesi (meta stats'tan)
        const tiered = await buildTierList(champList);
        if (cancelled) return;
        setTieredChampions(tiered);
        setLoadProgress(100);
        setLoading(false);
      } catch (e) {
        console.error('Load error:', e);
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
          <div style={{ color: 'var(--text-muted)' }}>Şampiyon verileri yükleniyor...</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            Data Dragon'dan çekiliyor
          </div>
          <div className="progress" style={{
            width: 240, height: 6, background: 'var(--border)',
            borderRadius: 3, overflow: 'hidden', marginTop: 8,
          }}>
            <div style={{
              width: `${loadProgress}%`, height: '100%',
              background: 'var(--accent-blue)',
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="loading">
          <div style={{ fontSize: 64 }}>⚠️</div>
          <div style={{ color: 'var(--accent-red)', fontSize: 18, fontWeight: 700 }}>
            Veri yüklenemedi
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 500, textAlign: 'center' }}>
            {error}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
            İnternet bağlantınızı kontrol edin. PC'de çalıştırıyorsanız antivirüs/firewall'ı kontrol edin.
          </div>
          <button
            className="role-btn active"
            style={{ marginTop: 16, padding: '10px 20px' }}
            onClick={() => window.location.reload()}
          >
            🔄 Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header champions={champions} version={version} />
      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              <ChampionsList
                champions={tieredChampions.length > 0 ? tieredChampions : champions}
                version={version}
              />
            }
          />
          <Route
            path="/tierlist"
            element={<TierList champions={tieredChampions} version={version} />}
          />
          <Route
            path="/aram"
            element={
              <ChampionsList
                champions={tieredChampions.length > 0 ? tieredChampions : champions}
                version={version}
              />
            }
          />
          <Route
            path="/champions/:id"
            element={
              <ChampionDetail
                champions={champions}
                items={items}
                runes={runes}
                spells={spells}
                version={version}
              />
            }
          />
          <Route path="/search" element={<SummonerSearch version={version} />} />
        </Routes>
      </main>
    </div>
  );
}
