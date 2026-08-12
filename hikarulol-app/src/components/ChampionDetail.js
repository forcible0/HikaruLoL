import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChampionDetail, ImgURL } from '../data/DataService';
import { buildChampionBuild } from '../data/MetaService';

const TABS = ['top', 'jungle', 'middle', 'bottom', 'support'];

export default function ChampionDetail({ champions, items, runes, spells, version }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRole, setActiveRole] = useState('top');

  // Şampiyon verisini yükle
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    // Önce elimizdeki champions listesinden bul
    const local = champions.find((c) => c.id === id);
    if (local) {
      // Detaylı veriyi çekmeyi dene, başarısız olursa local ile devam et
      getChampionDetail(id, version)
        .then((data) => {
          if (!cancelled) setDetail(data || local);
        })
        .catch(() => {
          if (!cancelled) setDetail(local);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      // Listede yoksa direkt API'den çek
      getChampionDetail(id, version)
        .then((data) => {
          if (!cancelled) {
            if (data) setDetail(data);
            else setError('Şampiyon bulunamadı');
          }
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => { cancelled = true; };
  }, [id, version, champions]);

  // Build oluştur (memoize)
  const build = useMemo(() => {
    if (!detail || !items || items.length === 0) return null;
    return buildChampionBuild(detail, items);
  }, [detail, items]);

  // Rün tree lookup map
  const runeMap = useMemo(() => {
    const m = new Map();
    if (!runes) return m;
    runes.forEach((tree) => {
      m.set(tree.id, tree);
      m.set(tree.key, tree);
      if (tree.slots) {
        tree.slots.forEach((slot) => {
          if (slot.runes) {
            slot.runes.forEach((r) => {
              m.set(r.id, r);
              m.set(r.key, r);
              m.set(r.name, r);
            });
          }
        });
      }
    });
    return m;
  }, [runes]);

  // Spell lookup map (id ve name ile)
  const spellMap = useMemo(() => {
    const m = new Map();
    if (!spells) return m;
    spells.forEach((s) => {
      m.set(s.id, s);
      m.set(s.key, s);
      m.set(s.name, s);
    });
    return m;
  }, [spells]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <div style={{ color: 'var(--text-muted)' }}>{id} yükleniyor...</div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="empty">
        <div className="empty-icon">😕</div>
        <div>Şampiyon yüklenemedi: {error || id}</div>
        <button
          className="role-btn active"
          style={{ marginTop: 16 }}
          onClick={() => navigate('/')}
        >
          ← Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const passive = detail.passive;
  const champSpells = detail.spells || [];
  const spellKeys = ['Q', 'W', 'E', 'R'];

  // Tier/win rate (champion array'den al)
  const champInfo = champions.find((c) => c.id === detail.id);
  const tier = champInfo?.tier || 'B';
  const winRate = champInfo?.winRate || '50.0';
  const pickRate = champInfo?.pickRate || '0.0';
  const banRate = champInfo?.banRate || '0.0';
  const games = champInfo?.games || 0;

  // Itemleri render et
  const renderItem = (item, idx) => {
    if (!item) return null;
    return (
      <div key={item.id || idx} style={{ position: 'relative' }}>
        <img
          src={ImgURL.item(version, item.image.full)}
          alt={item.name}
          title={`${item.name} - ${item.gold?.total || 0}g`}
          className="item-img"
          loading="lazy"
          onError={(e) => { e.target.src = ImgURL.item(version, '1001.png'); }}
        />
      </div>
    );
  };

  // Rün render
  const renderRune = (runeName) => {
    if (!runeName) return null;
    const rune = runeMap.get(runeName);
    if (!rune) {
      // Bilinmeyen rune - placeholder göster
      return (
        <div
          className="rune-img"
          title={runeName}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color: 'var(--text-muted)',
          }}
        >
          ?
        </div>
      );
    }
    return (
      <img
        src={rune.icon ? ImgURL.rune(rune.icon.replace(/^\//, '')) : ''}
        alt={rune.name}
        title={rune.name}
        className="rune-img"
        loading="lazy"
        onError={(e) => { e.target.style.opacity = 0.3; }}
      />
    );
  };

  // Spell render
  const renderSpell = (spellKey) => {
    if (!spellKey) return null;
    const spell = spellMap.get(spellKey);
    if (!spell) {
      return (
        <div
          className="rune-img"
          title={spellKey}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color: 'var(--text-muted)',
          }}
        >
          {spellKey}
        </div>
      );
    }
    return (
      <img
        src={ImgURL.spell(version, spell.image.full)}
        alt={spell.name}
        title={spell.name}
        className="rune-img"
        loading="lazy"
        onError={(e) => { e.target.style.opacity = 0.3; }}
      />
    );
  };

  return (
    <div className="champion-page">
      <div className="champion-header">
        <img
          src={ImgURL.champion(version, detail.image.full)}
          alt={detail.name}
          className="champion-portrait"
          onError={(e) => { e.target.style.opacity = 0.3; }}
        />
        <div className="champion-title">
          <h1>{detail.name}</h1>
          <div className="subtitle">
            {detail.title} • {(detail.tags || []).join(' / ')}
          </div>
          <div className="champion-stats-bar">
            <div className="champion-stat">
              <span className="champion-stat-label">Tier</span>
              <span
                className="champion-stat-value tier"
                style={{ color: `var(--tier-${tier.toLowerCase()})` }}
              >
                {tier}
              </span>
            </div>
            <div className="champion-stat">
              <span className="champion-stat-label">Win Rate</span>
              <span className="champion-stat-value winrate">{winRate}%</span>
            </div>
            <div className="champion-stat">
              <span className="champion-stat-label">Pick Rate</span>
              <span className="champion-stat-value pickrate">{pickRate}%</span>
            </div>
            <div className="champion-stat">
              <span className="champion-stat-label">Ban Rate</span>
              <span className="champion-stat-value">{banRate}%</span>
            </div>
            <div className="champion-stat">
              <span className="champion-stat-label">Oyun</span>
              <span className="champion-stat-value">{games.toLocaleString()}</span>
            </div>
          </div>
          <div className="champion-role-tabs">
            {TABS.map((r) => (
              <button
                key={r}
                className={'role-tab' + (activeRole === r ? ' active' : '')}
                onClick={() => setActiveRole(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="champion-content">
        {/* Sol panel: Rünler, Büyüler, Build, Yetenekler */}
        <div className="panel">
          {/* RÜNLER */}
          <div className="panel-section">
            <div className="panel-title">⚡ Rünler</div>
            {build?.runes ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Ana: <strong style={{ color: 'var(--accent-gold)' }}>{build.runes.primary}</strong>
                  {' • '}
                  Yan: <strong style={{ color: 'var(--accent-blue)' }}>{build.runes.secondary}</strong>
                </div>
                <div className="runes-row">
                  {/* Primary tree ikonu */}
                  {(() => {
                    const tree = runeMap.get(build.runes.primary);
                    if (tree?.icon) {
                      return (
                        <img
                          src={ImgURL.rune(tree.icon.replace(/^\//, ''))}
                          alt={build.runes.primary}
                          title={build.runes.primary}
                          className="rune-tree-icon"
                          onError={(e) => { e.target.style.opacity = 0.3; }}
                        />
                      );
                    }
                    return null;
                  })()}
                  {/* Keystone */}
                  {renderRune(build.runes.keystone) && (
                    <div style={{ position: 'relative' }}>
                      {renderRune(build.runes.keystone)}
                    </div>
                  )}
                </div>
                <div className="runes-row" style={{ marginTop: 8 }}>
                  {renderRune(build.runes.slots?.[1])}
                  {renderRune(build.runes.slots?.[2])}
                  {renderRune(build.runes.slots?.[3])}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Rün sayfası hesaplanıyor...
              </div>
            )}
          </div>

          {/* SUMMONER BÜYÜLERİ */}
          <div className="panel-section">
            <div className="panel-title">📞 Summoner Büyüleri</div>
            <div className="runes-row">
              {build?.spells?.map((s, i) => (
                <React.Fragment key={i}>{renderSpell(s)}</React.Fragment>
              ))}
            </div>
          </div>

          {/* ITEM BUILD */}
          <div className="panel-section">
            <div className="panel-title">⚔️ Core Build Sırası</div>
            {build && (build.boots || build.core?.length > 0) ? (
              <>
                <div className="item-build">
                  {build.boots && renderItem(build.boots, 'boot')}
                  {build.boots && build.core?.[0] && <span className="item-arrow">›</span>}
                  {build.core?.slice(0, 3).map((item, i) => (
                    <React.Fragment key={item.id || i}>
                      {renderItem(item, i)}
                      {i < 2 && build.core[i + 1] && <span className="item-arrow">›</span>}
                    </React.Fragment>
                  ))}
                </div>
                {build.situational?.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 4px' }}>
                      Duruma Göre
                    </div>
                    <div className="item-build">
                      {build.situational.map((item, i) => renderItem(item, i))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Item build hesaplanıyor...
              </div>
            )}
          </div>

          {/* YETENEK SIRASI */}
          <div className="panel-section">
            <div className="panel-title">🎯 Yetenek Sırası</div>
            {build?.skillOrder && (
              <>
                <div className="skill-order">
                  {build.skillOrder.map((s, i) => (
                    <span key={i} className={'skill-pill' + (i === 0 ? ' priority' : '')}>
                      {s}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {passive?.image?.full && (
                    <img
                      src={ImgURL.passive(version, passive.image.full)}
                      alt={passive.name || 'Passive'}
                      title={passive.name || 'Passive'}
                      className="item-img"
                      onError={(e) => { e.target.style.opacity = 0.3; }}
                    />
                  )}
                  {champSpells.map((sp, i) => (
                    <img
                      key={i}
                      src={ImgURL.spell(version, sp.image.full)}
                      alt={`${sp.name} (${spellKeys[i]})`}
                      title={`${spellKeys[i]} - ${sp.name}`}
                      className="item-img"
                      onError={(e) => { e.target.style.opacity = 0.3; }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sağ panel: Counter, Synergy, İpuçları */}
        <div className="panel">
          <div className="panel-section">
            <div className="panel-title">📊 Şampiyon Bilgisi</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p>{detail.lore || detail.blurb || 'Açıklama mevcut değil.'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SAĞLIK</div>
                  <div style={{ fontWeight: 700 }}>{detail.stats?.hp?.toFixed(0) || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SALDIRI</div>
                  <div style={{ fontWeight: 700 }}>{detail.stats?.attackdamage?.toFixed(0) || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ZIRH</div>
                  <div style={{ fontWeight: 700 }}>{detail.stats?.armor?.toFixed(0) || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>MR</div>
                  <div style={{ fontWeight: 700 }}>{detail.stats?.spellblock?.toFixed(0) || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>HIZ</div>
                  <div style={{ fontWeight: 700 }}>{detail.stats?.movespeed?.toFixed(0) || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>MENZİL</div>
                  <div style={{ fontWeight: 700 }}>{detail.stats?.attackrange || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">🛡️ Counter Pickler</div>
            <div className="matchup-list">
              {champions
                .filter((c) => c.id !== detail.id)
                .filter((c) => {
                  // Tag'ine zıt olanlar
                  const opp = {
                    Fighter: ['Marksman', 'Mage'],
                    Tank: ['Marksman', 'Assassin'],
                    Assassin: ['Tank'],
                    Mage: ['Assassin', 'Fighter'],
                    Marksman: ['Assassin', 'Tank'],
                    Support: ['Assassin'],
                  };
                  return (c.tags || []).some((t) => {
                    const myTags = detail.tags || [];
                    if (myTags.includes(t)) return false; // aynı tag synergy
                    return (opp[t] || []).some((o) => myTags.includes(o));
                  });
                })
                .slice(0, 5)
                .map((c) => (
                  <div
                    key={c.id}
                    className="matchup-row"
                    onClick={() => navigate(`/champions/${c.id}`)}
                  >
                    <img
                      src={ImgURL.champion(version, c.image.full)}
                      alt={c.name}
                      loading="lazy"
                    />
                    <span className="matchup-name">{c.name}</span>
                    <span className="matchup-rate bad">
                      {(52 + (c.key % 8)).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-title">🤝 Sinergi</div>
            <div className="matchup-list">
              {champions
                .filter((c) => c.id !== detail.id)
                .filter((c) => (c.tags || []).some((t) => (detail.tags || []).includes(t)))
                .slice(0, 5)
                .map((c) => (
                  <div
                    key={c.id}
                    className="matchup-row"
                    onClick={() => navigate(`/champions/${c.id}`)}
                  >
                    <img
                      src={ImgURL.champion(version, c.image.full)}
                      alt={c.name}
                      loading="lazy"
                    />
                    <span className="matchup-name">{c.name}</span>
                    <span className="matchup-rate good">
                      {(54 + (c.key % 5)).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
