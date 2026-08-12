import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { computeTier } from '../data/buildData';

const ROLES = [
  { id: 'all', name: 'Tümü', color: '#6b7585', icon: 'ALL' },
  { id: 'top', name: 'Top', color: 'var(--role-top)', icon: 'TOP' },
  { id: 'jungle', name: 'Jungle', color: 'var(--role-jungle)', icon: 'JNG' },
  { id: 'middle', name: 'Mid', color: 'var(--role-mid)', icon: 'MID' },
  { id: 'bottom', name: 'ADC', color: 'var(--role-bot)', icon: 'BOT' },
  { id: 'support', name: 'Sup', color: 'var(--role-support)', icon: 'SUP' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function ChampionsList({ champions, version }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [letterFilter, setLetterFilter] = useState('all');
  const navigate = useNavigate();

  // Her şampiyon için tier hesapla (memoize)
  const tiered = useMemo(() => {
    return champions.map((c) => ({ ...c, ...computeTier(c) }));
  }, [champions]);

  // Role filterleme (tag'lere göre tahmin)
  const TAG_TO_ROLES = {
    top: ['Fighter', 'Tank'],
    jungle: ['Fighter', 'Assassin', 'Tank'],
    middle: ['Mage', 'Assassin'],
    bottom: ['Marksman'],
    support: ['Support', 'Mage', 'Tank'],
  };

  const filtered = tiered
    .filter((c) => {
      if (roleFilter === 'all') return true;
      const allowed = TAG_TO_ROLES[roleFilter] || [];
      return c.tags.some((t) => allowed.includes(t));
    })
    .filter((c) => letterFilter === 'all' || c.name[0].toUpperCase() === letterFilter)
    .sort((a, b) => {
      const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4, F: 5 };
      if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
      return parseFloat(b.winRate) - parseFloat(a.winRate);
    });

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
              <span
                className="role-icon"
                style={{ background: r.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800 }}
              >
                {r.icon}
              </span>
              {r.name}
            </button>
          ))}
        </div>
        <select
          className="role-btn"
          value={letterFilter}
          onChange={(e) => setLetterFilter(e.target.value)}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '6px 10px' }}
        >
          <option value="all">Tüm harfler</option>
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
              src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`}
              alt={c.name}
              loading="lazy"
            />
            <span
              className="tier-badge"
              style={{ background: `var(--tier-${c.tier.toLowerCase()})` }}
            >
              {c.tier}
            </span>
            <div className="champion-card-name">{c.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
