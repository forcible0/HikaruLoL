import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ImgURL } from '../data/DataService';

export default function Header({ champions, version }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  const filtered = query.trim().length > 0 && champions
    ? champions
        .filter((c) =>
          (c.name || '').toLowerCase().includes(query.toLowerCase()) ||
          (c.id || '').toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onPick = (id) => {
    setQuery('');
    setShowResults(false);
    navigate(`/champions/${id}`);
  };

  return (
    <header className="header">
      <NavLink to="/" className="header-logo">HikaruLoL</NavLink>
      <nav className="header-nav">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Şampiyonlar
        </NavLink>
        <NavLink to="/tierlist" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Tier Listesi
        </NavLink>
        <NavLink to="/aram" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          ARAM
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Oyuncu Ara
        </NavLink>
      </nav>
      <div className="header-search" ref={wrapRef}>
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Şampiyon ara..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
        />
        {showResults && filtered.length > 0 && (
          <div className="search-results">
            {filtered.map((c) => (
              <div key={c.id} className="search-result-item" onClick={() => onPick(c.id)}>
                <img
                  src={ImgURL.champion(version, c.image.full)}
                  alt={c.name}
                  loading="lazy"
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {showResults && query.length > 0 && filtered.length === 0 && (
          <div className="search-results">
            <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
              "{query}" ile eşleşen şampiyon yok
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
