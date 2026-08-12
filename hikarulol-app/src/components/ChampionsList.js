import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImgURL } from '../data/DataService';

const ROLES = [
  { id: 'all', name: 'Tümü' },
  { id: 'top', name: 'Top' },
  { id: 'jungle', name: 'Jng' },
  { id: 'middle', name: 'Mid' },
  { id: 'bottom', name: 'ADC' },
  { id: 'support', name: 'Sup' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const TAG_TO_ROLES = {
  top: ['Fighter', 'Tank'],
  jungle: ['Fighter', 'Assassin', 'Tank'],
  middle: ['Mage', 'Assassin'],
  bottom: ['Marksman'],
  support: ['Support', 'Mage', 'Tank'],
};

export default function ChampionsList({ champions, version }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [letterFilter, setLetterFilter] = useState('all');
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!champions || champions.length === 0) return [];
    return champions
      .filter((c) => {
        if (roleFilter === 'all') return true;
        const allowed = TAG_TO_ROLES[roleFilter] || [];
        return (c.tags || []).some((t) => allowed.includes(t));
      })
      .filter((c) => letterFilter === 'all' || c.name?.[0]?.toUpperCase() === letterFilter)
      .sort((a, b) => {
        const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4, F: 5 };
        const ta = tierOrder[a.tier] ?? 9;
        const tb = tierOrder[b.tier] ?? 9;
        if (ta !== tb) return ta - tb;
        return parseFloat(b.winRate || 0) - parseFloat(a.winRate || 0);
      });
  }, [champions, roleFilter, letterFilter]);

  if (!champions || champions.length === 0) {
    return <div className="empty">Şampiyon verisi yüklenemedi</div>;
  }

  return (
    <div className="champions-page">
      <div className="champions-toolbar">
        <div className="role-filter">
          {ROLES.map((r) => (
            <button
              key={r.id}
              className={'role-btn' + (roleFilter === r.id ? ' active' : '')}
              onClick={() => setRoleFilter(r.id)}
            >
              {r.name}
            </button>
          ))}
        </div>
        <select
          className="search-input"
          value={letterFilter}
          onChange={(e) => setLetterFilter(e.target.value)}
          style={{ width: 120, padding: '6px 10px' }}
        >
          <option value="all">A-Z</option>
          {ALPHABET.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>
          {filtered.length} şampiyon
        </div>
      </div>

      <div className="champions-list">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="champion-card"
            onClick={() => navigate(`/champions/${c.id}`)}
            title={`${c.name} - ${c.title}`}
          >
            <img
              src={ImgURL.champion(version, c.image.full)}
              alt={c.name}
              loading="lazy"
              onError={(e) => { e.target.style.opacity = 0.3; }}
            />
            {c.tier && (
              <span
                className="tier-badge"
                style={{ background: `var(--tier-${c.tier.toLowerCase()})` }}
              >
                {c.tier}
              </span>
            )}
            <div className="champion-card-name">{c.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
