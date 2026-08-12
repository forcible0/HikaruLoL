import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChampionDetail, getAllItems, getAllRunes, getSummonerSpells, getSpellIconURL, getItemIconURL, getRuneIconURL, getPassiveIconURL } from '../data/communityDragon';
import { generateBuildData } from '../data/buildData';

export default function ChampionDetail({ champions, version }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [championData, setChampionData] = useState(null);
  const [buildData, setBuildData] = useState(null);
  const [items, setItems] = useState([]);
  const [runes, setRunes] = useState([]);
  const [spells, setSpells] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [detail, itemsData, runesData, spellsData] = await Promise.all([
          getChampionDetail(id),
          getAllItems(),
          getAllRunes(),
          getSummonerSpells(),
        ]);
        if (cancelled) return;
        setChampionData(detail.champion);
        setItems(itemsData.items);
        setRunes(runesData);
        setSpells(spellsData);

        // Build oluştur
        const basicChamp = {
          id: detail.champion.id,
          key: detail.champion.key,
          name: detail.champion.name,
          tags: detail.champion.tags,
          stats: detail.champion.stats,
        };
        const build = await generateBuildData(basicChamp, itemsData.items, champions);
        if (!cancelled) setBuildData(build);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, champions]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <div style={{ color: 'var(--text-muted)' }}>Şampiyon yükleniyor...</div>
      </div>
    );
  }

  if (!championData || !buildData) {
    return <div className="empty"><div className="empty-icon">😕</div>Şampiyon bulunamadı</div>;
  }

  const passive = championData.passive;
  const champSpells = championData.spells || [];
  const spellKeys = ['Q', 'W', 'E', 'R'];

  // Item ID → object map
  const itemMap = useMemo(() => {
    const m = new Map();
    items.forEach((i) => m.set(i.id, i));
    return m;
  }, [items]);

  // Rune tree map
  const runeTreeById = useMemo(() => {
    const m = new Map();
    runes.forEach((tree) => {
      m.set(tree.id, tree);
      tree.slots.forEach((slot) => {
        slot.runes.forEach((r) => m.set(r.id, r));
      });
    });
    return m;
  }, [runes]);

  const renderItem = (item) => {
    if (!item) return null;
    return (
      <img
        key={item.id}
        src={getItemIconURL(version, item.image.full)}
        alt={item.name}
        title={item.name}
        className="item-img"
      />
    );
  };

  const renderRune = (runeId) => {
    const rune = runeTreeById.get(runeId);
    if (!rune) return null;
    return (
      <img
        src={getRuneIconURL(rune.icon)}
        alt={rune.name}
        title={rune.name}
        className="rune-img"
      />
    );
  };

  return (
    <div className="champion-page">
      <div className="champion-header">
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championData.image.full}`}
          alt={championData.name}
          className="champion-portrait"
        />
        <div className="champion-title">
          <h1>{championData.name}</h1>
          <div className="subtitle">{championData.title} • {championData.tags.join(', ')}</div>
          <div className="champion-stats-bar">
            <div className="champion-stat">
              <span className="champion-stat-label">Tier</span>
              <span className="champion-stat-value tier" style={{ color: `var(--tier-${buildData.tier.tier.toLowerCase()})` }}>
                {buildData.tier.tier}
              </span>
            </div>
            <div className="champion-stat">
              <span className="champion-stat-label">Win Rate</span>
              <span className="champion-stat-value winrate">{buildData.tier.winRate}%</span>
            </div>
            <div className="champion-stat">
              <span className="champion-stat-label">Pick Rate</span>
              <span className="champion-stat-value pickrate">{buildData.tier.pickRate}%</span>
            </div>
            <div className="champion-stat">
              <span className="champion-stat-label">Ban Rate</span>
              <span className="champion-stat-value">{buildData.tier.banRate}%</span>
            </div>
            <div className="champion-stat">
              <span className="champion-stat-label">Oyun</span>
              <span className="champion-stat-value">{buildData.tier.games.toLocaleString()}</span>
            </div>
          </div>
          <div className="champion-role-tabs">
            {['top', 'jungle', 'middle', 'bottom', 'support'].map((r) => (
              <button
                key={r}
                className={'role-tab' + (buildData.role === r ? ' active' : '')}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="champion-content">
        {/* Sol panel - Rünler ve Build */}
        <div className="panel">
          <div className="panel-section">
            <div className="panel-title">⚡ Rünler</div>
            <div className="runes-row">
              {/* Ana ağaç */}
              {runes.find((t) => t.id === buildData.runes.primary) && (
                <img
                  src={getRuneIconURL(runes.find((t) => t.id === buildData.runes.primary).icon)}
                  alt={buildData.runes.primary}
                  title={buildData.runes.primary}
                  className="rune-tree-icon"
                />
              )}
              {/* Keystone */}
              {(() => {
                const primaryTree = runes.find((t) => t.id === buildData.runes.primary);
                if (!primaryTree) return null;
                const keystone = primaryTree.slots[0].runes.find((r) => r.name === buildData.runes.keystonePick) || primaryTree.slots[0].runes[0];
                return (
                  <img
                    src={getRuneIconURL(keystone.icon)}
                    alt={keystone.name}
                    title={keystone.name}
                    className="rune-img keystone"
                  />
                );
              })()}
              {/* Minor runes */}
              {[1, 2, 3].map((slotIdx) => {
                const tree = runes.find((t) => t.id === buildData.runes.primary);
                if (!tree || !tree.slots[slotIdx]) return null;
                return tree.slots[slotIdx].runes.slice(0, 3).map((r) => (
                  <img
                    key={r.id}
                    src={getRuneIconURL(r.icon)}
                    alt={r.name}
                    title={r.name}
                    className="rune-img"
                  />
                ));
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              İkincil: {buildData.runes.primary === 'Precision' ? 'Resolve' : 'Precision'}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">📞 Summoner Büyüleri</div>
            <div className="runes-row">
              {buildData.spells.map((s) => {
                const spell = spells.find((sp) => sp.name === s || sp.key === s);
                if (!spell) return null;
                return (
                  <img
                    key={spell.id}
                    src={getSpellIconURL(version, spell.image.full)}
                    alt={spell.name}
                    title={spell.name}
                    className="rune-img"
                  />
                );
              })}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">⚔️ Core Build Sırası</div>
            <div className="item-build">
              {renderItem(buildData.items.boots)}
              <span className="item-arrow">›</span>
              {buildData.items.core.slice(0, 3).map((item, i) => (
                <React.Fragment key={item.id}>
                  {renderItem(item)}
                  {i < 2 && buildData.items.core[i + 1] && <span className="item-arrow">›</span>}
                </React.Fragment>
              ))}
            </div>
            <div className="item-build">
              {buildData.items.situational.map((item) => renderItem(item))}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">🎯 Yetenek Sırası</div>
            <div className="skill-order">
              {buildData.skillOrder.map((s, i) => (
                <span key={i} className={'skill-pill' + (i === 0 ? ' priority' : '')}>{s}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
              {passive && (
                <img
                  src={getPassiveIconURL(version, passive.image.full)}
                  alt={passive.name}
                  title={passive.name}
                  className="item-img"
                />
              )}
              {champSpells.map((sp, i) => (
                <img
                  key={i}
                  src={getSpellIconURL(version, sp.image.full)}
                  alt={`${sp.name} (${spellKeys[i]})`}
                  title={`${spellKeys[i]} - ${sp.name}`}
                  className="item-img"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sağ panel - Counter, Synergy */}
        <div className="panel">
          <div className="panel-section">
            <div className="panel-title">🛡️ Counter Pickler</div>
            <div className="matchup-list">
              {buildData.counters.map((c, i) => (
                <div key={c.id} className="matchup-row" onClick={() => navigate(`/champions/${c.id}`)}>
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`}
                    alt={c.name}
                  />
                  <span className="matchup-name">{c.name}</span>
                  <span className="matchup-rate bad">{(55 + i).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">🤝 Sinergi</div>
            <div className="matchup-list">
              {buildData.synergies.map((c, i) => (
                <div key={c.id} className="matchup-row" onClick={() => navigate(`/champions/${c.id}`)}>
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`}
                    alt={c.name}
                  />
                  <span className="matchup-name">{c.name}</span>
                  <span className="matchup-rate good">{(52 + i).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
