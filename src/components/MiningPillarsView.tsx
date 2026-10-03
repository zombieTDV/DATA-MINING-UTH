import { useState, useEffect, type FC } from 'react';
import type {
  AssociationRulesResponse,
  ClustersResponse,
  GraphResponse,
  TrendsResponse,
  ScatterPointItem,
} from '../api/types';
import {
  fetchAssociationRules,
  fetchClusters,
  fetchGraph,
  fetchTrends,
} from '../api/client';

export const MiningPillarsView: FC = () => {
  const [activePillar, setActivePillar] = useState<1 | 2 | 3 | 4>(1);

  // Pillar 1 state
  const [rulesData, setRulesData] = useState<AssociationRulesResponse | null>(null);
  const [liftThreshold, setLiftThreshold] = useState<number>(1.2);
  const [ruleSearch, setRuleSearch] = useState<string>('');

  // Pillar 2 state
  const [clustersData, setClustersData] = useState<ClustersResponse | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ScatterPointItem | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);

  // Pillar 3 state
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [authorSearch, setAuthorSearch] = useState<string>('');

  // Pillar 4 state
  const [trendsData, setTrendsData] = useState<TrendsResponse | null>(null);
  const [anomalySearch, setAnomalySearch] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      fetchAssociationRules(),
      fetchClusters(),
      fetchGraph(),
      fetchTrends(),
    ])
      .then(([rules, clusters, graph, trends]) => {
        setRulesData(rules);
        setClustersData(clusters);
        setGraphData(graph);
        setTrendsData(trends);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg-card-shell)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '3px',
      }}>
        <div style={{
          background: 'var(--bg-card-core)',
          borderRadius: 'calc(var(--radius-md) - 2px)',
          padding: '36px',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ color: 'var(--accent-silver)', fontWeight: 800 }}>
            [ MINING ENGINE ] LOADING 4 CORE PILLARS FROM GOLD LAKEHOUSE...
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Executing FP-Growth rules, K-Means PCA projection, NetworkX centrality, and Isolation Forest
          </span>
        </div>
      </div>
    );
  }

  // Cluster colors mapping
  const clusterColors = [
    'var(--accent-silver)',
    'var(--accent-bronze)',
    'var(--accent-emerald)',
    'var(--accent-violet)',
    'var(--accent-cyan)',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 4 PILLARS SUB-NAVIGATION TABS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '8px',
      }}>
        {[
          { id: 1, code: '01', title: 'ASSOCIATION RULES', desc: 'FP-Growth / Co-occurrence' },
          { id: 2, code: '02', title: 'TOPIC CLUSTERING', desc: 'K-Means & DBSCAN (2D)' },
          { id: 3, code: '03', title: 'GRAPH MINING', desc: 'Co-authorship & PageRank' },
          { id: 4, code: '04', title: 'TREND & ANOMALY', desc: 'Isolation Forest & Velocity' },
        ].map((p) => {
          const isActive = activePillar === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActivePillar(p.id as 1 | 2 | 3 | 4)}
              style={{
                background: isActive ? 'var(--text-primary)' : 'var(--bg-surface)',
                color: isActive ? 'var(--bg-surface)' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                boxShadow: isActive ? 'var(--card-shadow)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                fontSize: '10px',
                fontWeight: 800,
                color: isActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
              }}>
                [ PILLAR {p.code} ]
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: 800,
                marginTop: '3px',
                color: isActive ? 'var(--bg-surface)' : 'var(--text-primary)',
              }}>
                {p.title}
              </div>
              <div style={{
                fontSize: '10px',
                marginTop: '2px',
                color: isActive ? 'var(--bg-card-shell)' : 'var(--text-muted)',
              }}>
                {p.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* PILLAR 1: ASSOCIATION RULES (FP-GROWTH)                             */}
      {/* =================================================================== */}
      {activePillar === 1 && rulesData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Controls Bar & Lift Slider */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            padding: '14px 18px',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                [ PATTERN EXTRACTION : FP-GROWTH ASSOCIATION RULES ]
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Mined across {rulesData.summary.total_transactions.toLocaleString()} paper baskets | Min Support: {rulesData.summary.min_support_used}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {/* Category Search Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>SEARCH:</span>
                <input
                  type="text"
                  placeholder="e.g. cs.AI, cs.LG..."
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  style={{
                    background: 'var(--bg-card-shell)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    width: '130px'
                  }}
                />
              </div>

              {/* Lift Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>FILTER MIN LIFT:</span>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={liftThreshold}
                  onChange={(e) => setLiftThreshold(parseFloat(e.target.value))}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent-silver)' }}
                />
                <span style={{ fontWeight: 800, color: 'var(--accent-bronze)', minWidth: '45px' }}>
                  &gt;= {liftThreshold.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Rules Doppelrand Table */}
          <div style={{
            background: 'var(--bg-card-shell)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div style={{
              background: 'var(--bg-card-core)',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              overflowX: 'auto',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-shell)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>RULE ANTECEDENTS (IF)</th>
                    <th style={{ padding: '10px 14px' }}>CONSEQUENTS (THEN)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>SUPPORT</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>CONFIDENCE</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--accent-bronze)' }}>LIFT RATIO</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>LEVERAGE</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>CONVICTION</th>
                  </tr>
                </thead>
                <tbody>
                  {rulesData.rules
                    .filter((r) => {
                      const matchLift = r.lift >= liftThreshold;
                      const matchSearch = !ruleSearch ||
                        r.antecedents.some(a => a.toLowerCase().includes(ruleSearch.toLowerCase())) ||
                        r.consequents.some(c => c.toLowerCase().includes(ruleSearch.toLowerCase()));
                      return matchLift && matchSearch;
                    })
                    .map((rule, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            background: 'rgba(96, 165, 250, 0.12)',
                            color: 'var(--accent-silver)',
                            border: '1px solid var(--border-subtle)',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            fontWeight: 700,
                          }}>
                            {rule.antecedents.join(', ')}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--accent-emerald)',
                            border: '1px solid var(--border-subtle)',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            fontWeight: 700,
                          }}>
                            {rule.consequents.join(', ')}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {(rule.support * 100).toFixed(1)}%
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {(rule.confidence * 100).toFixed(1)}%
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--accent-bronze)' }}>
                          {rule.lift.toFixed(2)}x
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {rule.leverage.toFixed(3)}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {rule.conviction.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PILLAR 2: TOPIC CLUSTERING (K-MEANS & DBSCAN 2D)                     */}
      {/* =================================================================== */}
      {activePillar === 2 && clustersData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Validity Metrics Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                SILHOUETTE SCORE
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {clustersData.validity_metrics.silhouette_score.toFixed(3)}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Good Separation (&gt; 0.30)
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                DAVIES-BOULDIN INDEX
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-silver)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {clustersData.validity_metrics.davies_bouldin_index.toFixed(2)}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Compact Clusters (&lt; 1.50)
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                CALINSKI-HARABASZ
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-bronze)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {clustersData.validity_metrics.calinski_harabasz_index.toFixed(1)}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                High Variance Ratio
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                OPTIMAL K &amp; NOISE
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                K={clustersData.summary.optimal_k} / {(clustersData.summary.dbscan_noise_ratio * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                DBSCAN Noise Filtered
              </div>
            </div>
          </div>

          {/* Interactive 2D Latent Vector Projection Scatter Plot */}
          <div style={{
            background: 'var(--bg-card-shell)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div style={{
              background: 'var(--bg-card-core)',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    2D PCA LATENT PROJECTION (768-DIM TO 2D HYPER-PLANE)
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Hover data points to inspect paper titles, categories, and cluster affinities
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {clustersData.cluster_profiles.map((cp, idx) => {
                    const isClusterActive = selectedCluster === cp.cluster_id;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCluster(isClusterActive ? null : cp.cluster_id)}
                        style={{
                          background: isClusterActive ? 'var(--bg-surface)' : 'transparent',
                          border: isClusterActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '10.5px',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title={`Click to ${isClusterActive ? 'show all clusters' : `isolate Cluster ${cp.cluster_id}`}`}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: clusterColors[idx % clusterColors.length] }} />
                        <span style={{ color: isClusterActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isClusterActive ? 800 : 500 }}>
                          C{cp.cluster_id} ({cp.percentage.toFixed(0)}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scatter Canvas Box */}
              <div style={{
                position: 'relative',
                height: '320px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="100%" height="100%" viewBox="-35 -35 70 70">
                  {/* Axis Crosshairs */}
                  <line x1="-35" y1="0" x2="35" y2="0" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 1" />
                  <line x1="0" y1="-35" x2="0" y2="35" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 1" />

                  {/* Scatter Points */}
                  {clustersData.scatter_2d.map((pt, idx) => {
                    const isHovered = hoveredPoint?.paper_id === pt.paper_id;
                    const isDimmed = selectedCluster !== null && pt.cluster !== selectedCluster;
                    const ptColor = clusterColors[pt.cluster % clusterColors.length];
                    return (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 2.8 : isDimmed ? 1.0 : 1.6}
                        fill={ptColor}
                        opacity={isDimmed ? 0.15 : 0.95}
                        stroke={isHovered ? '#ffffff' : 'none'}
                        strokeWidth={0.6}
                        style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    );
                  })}
                </svg>

                {/* Hover Tooltip Overlay */}
                {hoveredPoint && (
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    right: '12px',
                    background: 'var(--bg-card-core)',
                    border: '1px solid var(--border-highlight)',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    boxShadow: 'var(--card-shadow)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      <strong style={{ color: 'var(--accent-silver)' }}>[{hoveredPoint.paper_id}]</strong>{' '}
                      <span style={{ color: 'var(--text-primary)' }}>{hoveredPoint.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>CAT: {hoveredPoint.category}</span>
                      <span style={{ color: clusterColors[hoveredPoint.cluster % clusterColors.length], fontWeight: 800 }}>
                        CLUSTER {hoveredPoint.cluster}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PILLAR 3: GRAPH MINING (CO-AUTHORSHIP & PAGERANK)                   */}
      {/* =================================================================== */}
      {activePillar === 3 && graphData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Network Summary Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>TOTAL AUTHORS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {graphData.network_summary.total_authors.toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>COLLABORATIONS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-silver)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {graphData.network_summary.total_collaborations.toLocaleString()}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>NETWORK DENSITY</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {graphData.network_summary.network_density.toExponential(2)}
              </div>
            </div>
            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>LOUVAIN COMMUNITIES</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {graphData.network_summary.total_communities_detected}
              </div>
            </div>
          </div>

          {/* Controls Bar & Author Search */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            padding: '12px 18px',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                [ TOP INFLUENCERS : PAGERANK CENTRALITY LEADERBOARD ]
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Ranking scientists by recursive citation authority and co-authorship degree
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>FILTER AUTHOR:</span>
              <input
                type="text"
                placeholder="e.g. Yoshua, Hinton, Smith..."
                value={authorSearch}
                onChange={(e) => setAuthorSearch(e.target.value)}
                style={{
                  background: 'var(--bg-card-shell)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  width: '180px'
                }}
              />
              {authorSearch && (
                <button
                  type="button"
                  onClick={() => setAuthorSearch('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px'
                  }}
                >
                  [CLEAR]
                </button>
              )}
            </div>
          </div>

          {/* Top Influencers PageRank Table */}
          <div style={{
            background: 'var(--bg-card-shell)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div style={{
              background: 'var(--bg-card-core)',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              overflowX: 'auto',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-shell)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>SCIENTIST AUTHOR</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--accent-silver)' }}>PAGERANK CENTRALITY</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>DEGREE CENTRALITY</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>INDEXED PAPERS</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>LOUVAIN COMMUNITY</th>
                  </tr>
                </thead>
                <tbody>
                  {graphData.top_influencers
                    .filter((auth) => !authorSearch || auth.author.toLowerCase().includes(authorSearch.toLowerCase()))
                    .map((auth, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          #{idx + 1} {auth.author}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--accent-silver)' }}>
                          {auth.pagerank.toFixed(5)}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-primary)' }}>
                          {auth.degree} links
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                          {auth.paper_count}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>
                          Community #{auth.community_id}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PILLAR 4: TREND VELOCITY & ANOMALY DETECTION (ISOLATION FOREST)     */}
      {/* =================================================================== */}
      {activePillar === 4 && trendsData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Anomaly & Trend Summary Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>TOTAL CORPUS ANALYZED</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {trendsData.summary.total_papers_analyzed.toLocaleString()}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                ArXiv Lakehouse Full Set
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>DETECTED ANOMALIES</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {trendsData.summary.total_anomalies_detected}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Multi-Feature Outliers
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>CONTAMINATION RATE</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-bronze)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {(trendsData.summary.anomaly_rate * 100).toFixed(2)}%
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Isolation Forest Criterion
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '14px 18px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>TRACKED SECTORS</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {trendsData.summary.tracked_categories_velocity}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Active Research Categories
              </div>
            </div>
          </div>

          {/* Trend Velocity Grid */}
          <div style={{
            background: 'var(--bg-card-shell)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div style={{
              background: 'var(--bg-card-core)',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              padding: '20px',
            }}>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  QUARTERLY CATEGORY GROWTH VELOCITY &amp; MOMENTUM
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Quarter-over-Quarter paper acceleration dynamics
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '10px',
              }}>
                {trendsData.trend_velocity.map((tv, idx) => {
                  const isAcc = tv.momentum === 'ACCELERATING';
                  const isSteady = tv.momentum === 'STEADY';
                  const chipColor = isAcc ? 'var(--accent-emerald)' : isSteady ? 'var(--accent-silver)' : 'var(--accent-bronze)';
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-card-shell)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          {tv.category}
                        </span>
                        <span style={{
                          fontSize: '9.5px',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: 800,
                          background: `${chipColor}1a`,
                          color: chipColor,
                          border: `1px solid ${chipColor}40`,
                        }}>
                          {tv.momentum}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>QOQ GROWTH:</span>
                        <strong style={{ color: tv.growth_rate_pct >= 0 ? 'var(--accent-emerald)' : 'var(--accent-bronze)' }}>
                          {tv.growth_rate_pct >= 0 ? '+' : ''}{tv.growth_rate_pct.toFixed(1)}%
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span>TOTAL PAPERS:</span>
                        <span>{tv.all_time_papers.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Isolation Forest Anomalies Table */}
          <div style={{
            background: 'var(--bg-card-shell)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <div style={{
              background: 'var(--bg-card-core)',
              borderRadius: 'calc(var(--radius-md) - 2px)',
              overflowX: 'auto',
            }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    STRUCTURAL ANOMALIES DETECTED (ISOLATION FOREST)
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Papers deviating sharply from normative multi-feature distributions
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>SEARCH ANOMALY:</span>
                  <input
                    type="text"
                    placeholder="Search title, ID, outlier reason..."
                    value={anomalySearch}
                    onChange={(e) => setAnomalySearch(e.target.value)}
                    style={{
                      background: 'var(--bg-card-shell)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                      width: '200px'
                    }}
                  />
                  {anomalySearch && (
                    <button
                      type="button"
                      onClick={() => setAnomalySearch('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px'
                      }}
                    >
                      [CLEAR]
                    </button>
                  )}
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-shell)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>PAPER ID</th>
                    <th style={{ padding: '10px 14px' }}>TITLE</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>MATH FORMULAS</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>WORD COUNT</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>ANOMALY SCORE</th>
                    <th style={{ padding: '10px 14px' }}>OUTLIER RATIONALE</th>
                  </tr>
                </thead>
                <tbody>
                  {trendsData.anomalies
                    .filter((anom) => {
                      if (!anomalySearch) return true;
                      const q = anomalySearch.toLowerCase();
                      return (
                        anom.paper_id.toLowerCase().includes(q) ||
                        anom.title.toLowerCase().includes(q) ||
                        (anom.primary_category && anom.primary_category.toLowerCase().includes(q)) ||
                        anom.outlier_reasons.some((r) => r.toLowerCase().includes(q))
                      );
                    })
                    .map((anom, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--accent-silver)', fontWeight: 700 }}>
                          {anom.paper_id}
                        </td>
                        <td style={{ padding: '10px 14px', maxWidth: '320px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {anom.title}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-bronze)' }}>
                          {anom.math_count.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {anom.word_count.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--accent-red)', fontFamily: 'var(--font-mono)' }}>
                              {anom.anomaly_score.toFixed(3)}
                            </span>
                            <span style={{
                              fontSize: '9px',
                              fontFamily: 'var(--font-mono)',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              fontWeight: 700,
                              letterSpacing: '0.04em'
                            }}>
                              OUTLIER
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {anom.outlier_reasons.map((r, ri) => (
                              <span
                                key={ri}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: 'var(--accent-red)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                }}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
