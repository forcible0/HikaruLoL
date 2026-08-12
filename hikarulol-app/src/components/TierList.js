import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { computeTier } from '../data/buildData';

export default function TierList({ champions, version }) {
  const [roleFilter, setRoleFilter] = useState('all');
  const navigate = useNavigate();

  const TAG_TO_ROLES = {
    top: ['Fighter', 'Tank'],
    jungle: ['Fighter', 'Assassin', 'Tank'],
    middle: ['Mage', 'Assassin'],
    bottom: ['Marksman'],
    support: ['Support', 'Mage', 'Tank'],
  };

  const rows = useMemo(() => {
    const tiered = champions
      .map((c) => ({ ...c, ...computeTier(c) }))
      .filter((c) => {
        if (roleFilter === 'all') return true;
        const allowed = TAG_TO_ROLES[roleFilter] || [];
        return c.tags.some((t) => allowed.includes(t));
      });

    // Role tahmini
    const roleOf = (c) => {
      const options = [];
      c.tags.forEach((t) => {
        Object.entries(TAG_TO_ROLES).forEach(([r, tags]) => {
          if (tags.includes(t)) options.push(r);
        });
      });
      const unique = [...new Set(options)];
      const idx = c.key.charCodeAt(0) % Math.max(unique.length, 1);
      return unique[idx] || 'middle';
    };

    return tiered
      .map((c) => ({ ...c, role: roleOf(c) }))
      .sort((a, b) => {
        const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4, F: 5 };
        if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
        return parseFloat(b.winRate) - parseFloat(a.winRate);
      });
  }, [champions, roleFilter]);

  return (
    <div className="tierlist-page">
      <h2 style={{ marginBottom: 16, fontSize: 20, fontWeight: 700 }}>
        Tier Listesi - Patch {version}
      </h2>
      <div className="champions-toolbar">
        <div className="role-filter">
          {['all', 'top', 'jungle', 'middle', 'bottom', 'support'].map((r) => (
            <button
              key={r}
              className={'role-btn' + (roleFilter === r ? ' active' : '')}
              onClick={() => setRoleFilter(r)}
            >
              {r === 'all' ? 'Tümü' : r.toUpperCase()}
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
          <div>Games</div>
        </div>
        {rows.map((c, idx) => (
          <div key={c.id} className="tierlist-row" onClick={() => navigate(`/champions/${c.id}`)}>
            <div className="tierlist-rank">{idx + 1}</div>
            <div className="tierlist-champ">
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`}
                alt={c.name}
              />
              <div>
                <div className="tierlist-champ-name">{c.name}</div>
                <div className="tierlist-role">{c.role}</div>
              </div>
            </div>
            <div className="tierlist-stat">
              <span className="tier-cell" style={{ background: `var(--tier-${c.tier.toLowerCase()})` }}>
                {c.tier}
              </span>
            </div>
            <div className="tierlist-stat winrate">{c.winRate}%</div>
            <div className="tierlist-stat pickrate">{c.pickRate}%</div>
            <div className="tierlist-stat">{c.banRate}%</div>
            <div className="tierlist-stat">{c.games.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
