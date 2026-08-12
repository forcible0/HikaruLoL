import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImgURL } from '../data/DataService';

const ROLE_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'top', label: 'TOP' },
  { id: 'jungle', label: 'JNG' },
  { id: 'middle', label: 'MID' },
  { id: 'bottom', label: 'BOT' },
  { id: 'support', label: 'SUP' },
];

const TAG_TO_ROLES = {
  top: ['Fighter', 'Tank'],
  jungle: ['Fighter', 'Assassin', 'Tank'],
  middle: ['Mage', 'Assassin'],
  bottom: ['Marksman'],
  support: ['Support', 'Mage', 'Tank'],
};

export default function TierList({ champions, version }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const navigate = useNavigate();

  const rows = useMemo(() => {
    if (!champions || champions.length === 0) return [];
    let filtered = champions;

    if (roleFilter !== 'all') {
      const allowed = TAG_TO_ROLES[roleFilter] || [];
      filtered = filtered.filter((c) => (c.tags || []).some((t) => allowed.includes(t)));
    }

    return [...filtered].sort((a, b) => {
      const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4, F: 5 };
      const ta = tierOrder[a.tier] ?? 9;
      const tb = tierOrder[b.tier] ?? 9;
      if (ta !== tb) return ta - tb;
      return parseFloat(b.winRate || 0) - parseFloat(a.winRate || 0);
    });
  }, [champions, roleFilter]);

  return (
    <div className="tierlist-page">
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Tier Listesi</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Patch {version} • {rows.length} şampiyon
        </span>
      </div>
      <div className="champions-toolbar">
        <div className="role-filter">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r.id}
              className={'role-btn' + (roleFilter === r.id ? ' active' : '')}
              onClick={() => setRoleFilter(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="tierlist-table">
        <div className="tierlist-header">
          <div>#</div>
          <div>Şampiyon</div>
          <div>Tier</div>
          <div>Win %</div>
          <div>Pick %</div>
          <div>Ban %</div>
          <div>Rol</div>
        </div>
        {rows.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}>
            <div className="empty-icon">🔍</div>
            Bu rolde şampiyon bulunamadı
          </div>
        ) : (
          rows.map((c, idx) => (
            <div
              key={c.id}
              className="tierlist-row"
              onClick={() => navigate(`/champions/${c.id}`)}
            >
              <div className="tierlist-rank">{idx + 1}</div>
              <div className="tierlist-champ">
                <img
                  src={ImgURL.champion(version, c.image.full)}
                  alt={c.name}
                  loading="lazy"
                />
                <div>
                  <div className="tierlist-champ-name">{c.name}</div>
                  <div className="tierlist-role">{c.title}</div>
                </div>
              </div>
              <div className="tierlist-stat">
                <span
                  className="tier-cell"
                  style={{ background: `var(--tier-${(c.tier || 'F').toLowerCase()})` }}
                >
                  {c.tier}
                </span>
              </div>
              <div className="tierlist-stat winrate">{c.winRate}%</div>
              <div className="tierlist-stat pickrate">{c.pickRate}%</div>
              <div className="tierlist-stat">{c.banRate}%</div>
              <div className="tierlist-stat" style={{ textTransform: 'uppercase', fontSize: 12 }}>
                {c.role}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
