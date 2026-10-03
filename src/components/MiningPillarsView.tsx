import { useState, useEffect, useMemo, type FC } from 'react';
import type {
  AssociationRulesResponse,
  ClustersResponse,
  GraphResponse,
  TrendsResponse,
  ScatterPointItem,
  GraphNodeItem,
} from '../api/types';
import {
  fetchAssociationRules,
  fetchClusters,
  fetchGraph,
  fetchTrends,
} from '../api/client';
import { useToast } from '../context/ToastContext';

export const MiningPillarsView: FC = () => {
  const [activePillar, setActivePillar] = useState<1 | 2 | 3 | 4>(1);

  // Pillar 1 state
  const [rulesData, setRulesData] = useState<AssociationRulesResponse | null>(null);
  const [liftThreshold, setLiftThreshold] = useState<number>(1.2);
  const [ruleSearch, setRuleSearch] = useState<string>('');
  const [rulesSortKey, setRulesSortKey] = useState<'lift' | 'confidence' | 'support' | 'leverage'>('lift');
  const [rulesSortOrder, setRulesSortOrder] = useState<'desc' | 'asc'>('desc');

  // Pillar 2 state
  const [clustersData, setClustersData] = useState<ClustersResponse | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ScatterPointItem | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [scatterZoom, setScatterZoom] = useState<number>(1);

  // Pillar 3 state
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [authorSearch, setAuthorSearch] = useState<string>('');
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNodeItem | null>(null);
  const [influencerSortKey, setInfluencerSortKey] = useState<'pagerank' | 'degree' | 'paper_count'>('pagerank');
  const [influencerSortOrder, setInfluencerSortOrder] = useState<'desc' | 'asc'>('desc');

  // Pillar 4 state
  const [trendsData, setTrendsData] = useState<TrendsResponse | null>(null);
  const [anomalySearch, setAnomalySearch] = useState<string>('');
  const [anomalySortKey, setAnomalySortKey] = useState<'score' | 'math' | 'words'>('score');
  const [anomalySortOrder, setAnomalySortOrder] = useState<'asc' | 'desc'>('asc');

  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

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

  // Universal Data Exporter (Task 3.6)
  const exportData = (rows: object[], filename: string, format: 'csv' | 'json') => {
    if (!rows || rows.length === 0) {
      showToast({ type: 'warning', message: 'No records available to export' });
      return;
    }
    let blob: Blob;
    if (format === 'csv') {
      const keys = Object.keys(rows[0]);
      const csvContent = [
        keys.join(','),
        ...rows.map((r) =>
          keys
            .map((k) => {
              const val = (r as Record<string, unknown>)[k];
              if (Array.isArray(val)) return `"${val.join('; ')}"`;
              if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
              return val;
            })
            .join(',')
        ),
      ].join('\n');
      blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } else {
      blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({
      type: 'success',
      message: `Exported ${rows.length} rows to ${filename}.${format}`,
      duration: 3000,
    });
  };

  // Cluster colors mapping
  const clusterColors = useMemo(
    () => [
      'var(--accent-silver)',
      'var(--accent-bronze)',
      'var(--accent-emerald)',
      'var(--accent-violet)',
      'var(--accent-cyan)',
    ],
    []
  );

  // Cluster Centroids calculation (Task 3.5)
  const clusterCentroids = useMemo(() => {
    if (!clustersData?.scatter_2d) return [];
    const sums = new Map<number, { sumX: number; sumY: number; count: number }>();
    clustersData.scatter_2d.forEach((pt) => {
      const cur = sums.get(pt.cluster) || { sumX: 0, sumY: 0, count: 0 };
      cur.sumX += pt.x;
      cur.sumY += pt.y;
      cur.count += 1;
      sums.set(pt.cluster, cur);
    });
    return Array.from(sums.entries()).map(([cluster, val]) => ({
      cluster,
      x: val.sumX / val.count,
      y: val.sumY / val.count,
    }));
  }, [clustersData]);

  // Pillar 3: Force-directed / Community Graph Layout (Task 3.4)
  const graphLayout = useMemo(() => {
    if (!graphData?.graph_export?.nodes) {
      return { positions: new Map<string, { x: number; y: number; node: GraphNodeItem }>(), topLinks: [] };
    }
    const nodes = graphData.graph_export.nodes.slice(0, 32);
    const positions = new Map<string, { x: number; y: number; node: GraphNodeItem }>();
    const total = nodes.length;

    nodes.forEach((n, idx) => {
      const baseAngle = (idx / total) * 2 * Math.PI;
      const commOffset = (n.community % 4) * (Math.PI / 8);
      const angle = baseAngle + commOffset;
      const radius = 35 + (1 - Math.min(0.9, n.pagerank * 80)) * 60;
      positions.set(n.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        node: n,
      });
    });

    const nodeIds = new Set(nodes.map((n) => n.id));
    const topLinks = graphData.graph_export.links.filter(
      (l) => nodeIds.has(l.source) && nodeIds.has(l.target)
    );

    return { positions, topLinks };
  }, [graphData]);

  // Filtered & Sorted FP-Growth Rules
  const filteredAndSortedRules = useMemo(() => {
    if (!rulesData?.rules) return [];
    const list = rulesData.rules.filter((r) => {
      const matchLift = r.lift >= liftThreshold;
      const matchSearch =
        !ruleSearch ||
        r.antecedents.some((a) => a.toLowerCase().includes(ruleSearch.toLowerCase())) ||
        r.consequents.some((c) => c.toLowerCase().includes(ruleSearch.toLowerCase()));
      return matchLift && matchSearch;
    });

    return list.sort((a, b) => {
      const mult = rulesSortOrder === 'desc' ? -1 : 1;
      return (a[rulesSortKey] - b[rulesSortKey]) * mult;
    });
  }, [rulesData, liftThreshold, ruleSearch, rulesSortKey, rulesSortOrder]);

  // Filtered & Sorted PageRank Influencers
  const filteredAndSortedInfluencers = useMemo(() => {
    if (!graphData?.top_influencers) return [];
    const list = graphData.top_influencers.filter(
      (auth) => !authorSearch || auth.author.toLowerCase().includes(authorSearch.toLowerCase())
    );

    return list.sort((a, b) => {
      const mult = influencerSortOrder === 'desc' ? -1 : 1;
      return (a[influencerSortKey] - b[influencerSortKey]) * mult;
    });
  }, [graphData, authorSearch, influencerSortKey, influencerSortOrder]);

  // Filtered & Sorted Anomalies
  const filteredAndSortedAnomalies = useMemo(() => {
    if (!trendsData?.anomalies) return [];
    const q = anomalySearch.toLowerCase();
    const list = trendsData.anomalies.filter((anom) => {
      if (!q) return true;
      return (
        anom.paper_id.toLowerCase().includes(q) ||
        anom.title.toLowerCase().includes(q) ||
        (anom.primary_category && anom.primary_category.toLowerCase().includes(q)) ||
        anom.outlier_reasons.some((r) => r.toLowerCase().includes(q))
      );
    });

    return list.sort((a, b) => {
      const mult = anomalySortOrder === 'desc' ? -1 : 1;
      if (anomalySortKey === 'score') return (a.anomaly_score - b.anomaly_score) * mult;
      if (anomalySortKey === 'math') return (a.math_count - b.math_count) * mult;
      return (a.word_count - b.word_count) * mult;
    });
  }, [trendsData, anomalySearch, anomalySortKey, anomalySortOrder]);

  // Structured Skeleton Loading Screen (Task 4.5)
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Nav tabs skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-shimmer" style={{ height: '62px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        {/* Metric cards skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-shimmer" style={{ height: '110px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        {/* Table/Canvas skeleton */}
        <div className="skeleton-shimmer" style={{ height: '360px', borderRadius: 'var(--radius-md)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 4 PILLARS SUB-NAVIGATION TABS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '8px',
        }}
      >
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
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: isActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
                }}
              >
                [ PILLAR {p.code} ]
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  marginTop: '3px',
                  color: isActive ? 'var(--bg-surface)' : 'var(--text-primary)',
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  marginTop: '2px',
                  color: isActive ? 'var(--bg-card-shell)' : 'var(--text-muted)',
                }}
              >
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-surface)',
              padding: '14px 18px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
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
                    width: '130px',
                  }}
                />
              </div>

              {/* Lift Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>MIN LIFT:</span>
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

              {/* Data Export Buttons (Task 3.6) */}
              <div style={{ display: 'flex', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                <button
                  type="button"
                  onClick={() => exportData(filteredAndSortedRules, `fp_growth_rules_lift_${liftThreshold}`, 'csv')}
                  style={{
                    background: 'var(--bg-card-shell)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    padding: '4px 8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                  title="Download filtered rules as CSV"
                >
                  [EXPORT CSV]
                </button>
                <button
                  type="button"
                  onClick={() => exportData(filteredAndSortedRules, `fp_growth_rules_lift_${liftThreshold}`, 'json')}
                  style={{
                    background: 'var(--bg-card-shell)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    padding: '4px 8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                  title="Download filtered rules as JSON"
                >
                  [JSON]
                </button>
              </div>
            </div>
          </div>

          {/* Rules Doppelrand Table with Sorting (Task 3.3) */}
          <div
            style={{
              background: 'var(--bg-card-shell)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card-core)',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-shell)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>RULE ANTECEDENTS (IF)</th>
                    <th style={{ padding: '10px 14px' }}>CONSEQUENTS (THEN)</th>
                    <th
                      style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer' }}
                      onClick={() => {
                        setRulesSortKey('support');
                        setRulesSortOrder(rulesSortKey === 'support' && rulesSortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      title="Sort by Support"
                    >
                      SUPPORT {rulesSortKey === 'support' ? (rulesSortOrder === 'desc' ? '▼' : '▲') : ''}
                    </th>
                    <th
                      style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer' }}
                      onClick={() => {
                        setRulesSortKey('confidence');
                        setRulesSortOrder(rulesSortKey === 'confidence' && rulesSortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      title="Sort by Confidence"
                    >
                      CONFIDENCE {rulesSortKey === 'confidence' ? (rulesSortOrder === 'desc' ? '▼' : '▲') : ''}
                    </th>
                    <th
                      style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--accent-bronze)', cursor: 'pointer' }}
                      onClick={() => {
                        setRulesSortKey('lift');
                        setRulesSortOrder(rulesSortKey === 'lift' && rulesSortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      title="Sort by Lift Ratio"
                    >
                      LIFT RATIO {rulesSortKey === 'lift' ? (rulesSortOrder === 'desc' ? '▼' : '▲') : ''}
                    </th>
                    <th
                      style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer' }}
                      onClick={() => {
                        setRulesSortKey('leverage');
                        setRulesSortOrder(rulesSortKey === 'leverage' && rulesSortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      title="Sort by Leverage"
                    >
                      LEVERAGE {rulesSortKey === 'leverage' ? (rulesSortOrder === 'desc' ? '▼' : '▲') : ''}
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>CONVICTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedRules.map((rule, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            background: 'rgba(96, 165, 250, 0.12)',
                            color: 'var(--accent-silver)',
                            border: '1px solid var(--border-subtle)',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            fontWeight: 700,
                          }}
                        >
                          {rule.antecedents.join(', ')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--accent-emerald)',
                            border: '1px solid var(--border-subtle)',
                            padding: '3px 8px',
                            borderRadius: '3px',
                            fontWeight: 700,
                          }}
                        >
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
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
          <div
            style={{
              background: 'var(--bg-card-shell)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card-core)',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    2D PCA LATENT PROJECTION (768-DIM TO 2D HYPER-PLANE)
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Centroids marked by (+). Click clusters to isolate affinities
                  </span>
                </div>

                {/* Zoom Controls & Cluster Filters (Task 3.5) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Zoom buttons */}
                  <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setScatterZoom((z) => Math.min(2.5, z + 0.25))}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 800 }}
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setScatterZoom((z) => Math.max(0.75, z - 0.25))}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 800 }}
                      title="Zoom Out"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setScatterZoom(1)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-silver)', padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '10px' }}
                      title="Reset Zoom"
                    >
                      1X
                    </button>
                  </div>

                  {/* Cluster Pills */}
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
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
                            transition: 'all 0.15s ease',
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
              </div>

              {/* Scatter Canvas Box with Dynamic Zoom */}
              <div
                style={{
                  position: 'relative',
                  height: '340px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(() => {
                  const size = 70 / scatterZoom;
                  const min = -size / 2;
                  return (
                    <svg width="100%" height="100%" viewBox={`${min} ${min} ${size} ${size}`}>
                      {/* Axis Crosshairs */}
                      <line x1={min} y1="0" x2={-min} y2="0" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 1" />
                      <line x1="0" y1={min} x2="0" y2={-min} stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="1 1" />

                      {/* Cluster Centroids Markers (+) */}
                      {clusterCentroids.map((c) => {
                        const isDimmed = selectedCluster !== null && c.cluster !== selectedCluster;
                        return (
                          <g key={`centroid-${c.cluster}`} opacity={isDimmed ? 0.2 : 0.9}>
                            <line x1={c.x - 2} y1={c.y} x2={c.x + 2} y2={c.y} stroke={clusterColors[c.cluster % clusterColors.length]} strokeWidth={1} />
                            <line x1={c.x} y1={c.y - 2} x2={c.x} y2={c.y + 2} stroke={clusterColors[c.cluster % clusterColors.length]} strokeWidth={1} />
                            <text
                              x={c.x + 2.5}
                              y={c.y - 2.5}
                              fill={clusterColors[c.cluster % clusterColors.length]}
                              fontSize="3px"
                              fontFamily="var(--font-mono)"
                              fontWeight={800}
                            >
                              C{c.cluster}
                            </text>
                          </g>
                        );
                      })}

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
                            r={isHovered ? 2.8 / scatterZoom : isDimmed ? 1.0 / scatterZoom : 1.6 / scatterZoom}
                            fill={ptColor}
                            opacity={isDimmed ? 0.15 : 0.95}
                            stroke={isHovered ? '#ffffff' : 'none'}
                            strokeWidth={0.6 / scatterZoom}
                            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        );
                      })}
                    </svg>
                  );
                })()}

                {/* Hover Tooltip Overlay */}
                {hoveredPoint && (
                  <div
                    style={{
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
                    }}
                  >
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
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

          {/* Interactive Author Collaboration Network Graph (Task 3.4) */}
          <div
            style={{
              background: 'var(--bg-card-shell)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card-core)',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    CO-AUTHORSHIP FORCE NETWORK (LOUVAIN COMMUNITY CLUSTERING)
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Node radius ~ PageRank centrality. Links reflect joint paper publications. Click node to inspect details.
                  </span>
                </div>

                {selectedGraphNode && (
                  <button
                    type="button"
                    onClick={() => setSelectedGraphNode(null)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-muted)',
                      borderRadius: '3px',
                      color: 'var(--accent-silver)',
                      padding: '2px 8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      cursor: 'pointer',
                    }}
                  >
                    [CLEAR SELECTION]
                  </button>
                )}
              </div>

              {/* Network Graph SVG Canvas */}
              <div
                style={{
                  height: '280px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <svg width="100%" height="100%" viewBox="-120 -120 240 240">
                  {/* Concentric distance reference rings */}
                  <circle cx="0" cy="0" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="2 2" />
                  <circle cx="0" cy="0" r="95" fill="none" stroke="var(--border-subtle)" strokeWidth="0.5" strokeDasharray="2 2" />

                  {/* Collaboration Links */}
                  {graphLayout.topLinks.map((link, idx) => {
                    const src = graphLayout.positions.get(link.source);
                    const tgt = graphLayout.positions.get(link.target);
                    if (!src || !tgt) return null;
                    const isHighlighted =
                      selectedGraphNode &&
                      (selectedGraphNode.id === link.source || selectedGraphNode.id === link.target);
                    return (
                      <line
                        key={idx}
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={isHighlighted ? 'var(--accent-silver)' : 'var(--border-subtle)'}
                        strokeWidth={isHighlighted ? 1.4 : Math.min(2, Math.max(0.6, link.weight * 0.4))}
                        strokeOpacity={isHighlighted ? 0.95 : 0.35}
                      />
                    );
                  })}

                  {/* Author Nodes */}
                  {Array.from(graphLayout.positions.values()).map(({ x, y, node }) => {
                    const isSelected = selectedGraphNode?.id === node.id;
                    const color = clusterColors[node.community % clusterColors.length];
                    const radius = Math.max(3.8, Math.min(8.5, node.pagerank * 140 + 3.8));
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${x}, ${y})`}
                        onClick={() => setSelectedGraphNode(isSelected ? null : node)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          r={radius}
                          fill={color}
                          stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.2)'}
                          strokeWidth={isSelected ? 1.6 : 0.6}
                          opacity={0.92}
                        />
                        {isSelected && (
                          <text
                            y={-radius - 3}
                            textAnchor="middle"
                            fill="var(--text-primary)"
                            fontSize="6.5px"
                            fontFamily="var(--font-mono)"
                            fontWeight={800}
                          >
                            {node.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Selected Node Details Drawer */}
                {selectedGraphNode && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      right: '10px',
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
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedGraphNode.label}</strong>{' '}
                      <span style={{ color: 'var(--text-muted)' }}>({selectedGraphNode.paper_count} papers)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ color: 'var(--accent-silver)' }}>
                        PAGERANK: {selectedGraphNode.pagerank.toFixed(5)}
                      </span>
                      <span style={{ color: 'var(--accent-emerald)' }}>
                        DEGREE: {selectedGraphNode.degree} links
                      </span>
                      <span style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>
                        COMMUNITY #{selectedGraphNode.community}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls Bar & Author Search */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-surface)',
              padding: '12px 18px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                [ TOP INFLUENCERS : PAGERANK CENTRALITY LEADERBOARD ]
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Ranking scientists by recursive citation authority and co-authorship degree
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', flexWrap: 'wrap' }}>
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
                  width: '180px',
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
                    fontSize: '11px',
                  }}
                >
                  [CLEAR]
                </button>
              )}

              {/* Export Buttons (Task 3.6) */}
              <button
                type="button"
                onClick={() => exportData(filteredAndSortedInfluencers, 'top_influencers_pagerank', 'csv')}
                style={{
                  background: 'var(--bg-card-shell)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  padding: '4px 8px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '10.5px',
                }}
              >
                [EXPORT CSV]
              </button>
              <button
                type="button"
                onClick={() => exportData(filteredAndSortedInfluencers, 'top_influencers_pagerank', 'json')}
                style={{
                  background: 'var(--bg-card-shell)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '3px',
                  padding: '4px 8px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '10.5px',
                }}
              >
                [JSON]
              </button>
            </div>
          </div>

          {/* Top Influencers PageRank Table with Column Sorting (Task 3.3) */}
          <div
            style={{
              background: 'var(--bg-card-shell)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card-core)',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-shell)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>SCIENTIST AUTHOR</th>
                    <th
                      style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--accent-silver)', cursor: 'pointer' }}
                      onClick={() => {
                        setInfluencerSortKey('pagerank');
                        setInfluencerSortOrder(influencerSortKey === 'pagerank' && influencerSortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      title="Sort by PageRank"
                    >
                      PAGERANK {influencerSortKey === 'pagerank' ? (influencerSortOrder === 'desc' ? '▼' : '▲') : ''}
                    </th>
                    <th
                      style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer' }}
                      onClick={() => {
                        setInfluencerSortKey('degree');
                        setInfluencerSortOrder(influencerSortKey === 'degree' && influencerSortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      title="Sort by Degree Centrality"
                    >
                      DEGREE {influencerSortKey === 'degree' ? (influencerSortOrder === 'desc' ? '▼' : '▲') : ''}
                    </th>
                    <th
                      style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer' }}
                      onClick={() => {
                        setInfluencerSortKey('paper_count');
                        setInfluencerSortOrder(influencerSortKey === 'paper_count' && influencerSortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      title="Sort by Paper Count"
                    >
                      PAPERS {influencerSortKey === 'paper_count' ? (influencerSortOrder === 'desc' ? '▼' : '▲') : ''}
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>LOUVAIN COMMUNITY</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedInfluencers.map((auth, idx) => (
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
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
          <div
            style={{
              background: 'var(--bg-card-shell)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card-core)',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                padding: '20px',
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  QUARTERLY CATEGORY GROWTH VELOCITY &amp; MOMENTUM
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Quarter-over-Quarter paper acceleration dynamics
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '10px',
                }}
              >
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
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontFamily: 'var(--font-mono)',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: 800,
                            background: `${chipColor}1a`,
                            color: chipColor,
                            border: `1px solid ${chipColor}40`,
                          }}
                        >
                          {tv.momentum}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>QOQ GROWTH:</span>
                        <strong style={{ color: tv.growth_rate_pct >= 0 ? 'var(--accent-emerald)' : 'var(--accent-bronze)' }}>
                          {tv.growth_rate_pct >= 0 ? '+' : ''}
                          {tv.growth_rate_pct.toFixed(1)}%
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
          <div
            style={{
              background: 'var(--bg-card-shell)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div
              style={{
                background: 'var(--bg-card-core)',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                overflowX: 'auto',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    STRUCTURAL ANOMALIES DETECTED (ISOLATION FOREST)
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Papers deviating sharply from normative multi-feature distributions
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>SEARCH ANOMALY:</span>
                  <input
                    type="text"
                    placeholder="Search title, ID, reason..."
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
                      width: '180px',
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
                        fontSize: '11px',
                      }}
                    >
                      [CLEAR]
                    </button>
                  )}

                  {/* Export Buttons (Task 3.6) */}
                  <button
                    type="button"
                    onClick={() => exportData(filteredAndSortedAnomalies, 'structural_anomalies_isolation_forest', 'csv')}
                    style={{
                      background: 'var(--bg-card-shell)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '3px',
                      padding: '4px 8px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '10.5px',
                    }}
                  >
                    [EXPORT CSV]
                  </button>
                  <button
                    type="button"
                    onClick={() => exportData(filteredAndSortedAnomalies, 'structural_anomalies_isolation_forest', 'json')}
                    style={{
                      background: 'var(--bg-card-shell)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '3px',
                      padding: '4px 8px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '10.5px',
                    }}
                  >
                    [JSON]
                  </button>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-shell)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>PAPER ID</th>
                    <th style={{ padding: '10px 14px' }}>TITLE</th>
                    <th
                      style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer' }}
                      onClick={() => {
                        setAnomalySortKey('math');
                        setAnomalySortOrder(anomalySortKey === 'math' && anomalySortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      title="Sort by Math Formulas"
                    >
                      MATH FORMULAS {anomalySortKey === 'math' ? (anomalySortOrder === 'desc' ? '▼' : '▲') : ''}
                    </th>
                    <th
                      style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer' }}
                      onClick={() => {
                        setAnomalySortKey('words');
                        setAnomalySortOrder(anomalySortKey === 'words' && anomalySortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      title="Sort by Word Count"
                    >
                      WORD COUNT {anomalySortKey === 'words' ? (anomalySortOrder === 'desc' ? '▼' : '▲') : ''}
                    </th>
                    <th
                      style={{ padding: '10px 14px', textAlign: 'right', cursor: 'pointer' }}
                      onClick={() => {
                        setAnomalySortKey('score');
                        setAnomalySortOrder(anomalySortKey === 'score' && anomalySortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      title="Sort by Anomaly Score"
                    >
                      ANOMALY SCORE {anomalySortKey === 'score' ? (anomalySortOrder === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th style={{ padding: '10px 14px' }}>OUTLIER RATIONALE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedAnomalies.map((anom, idx) => (
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
                          <span
                            style={{
                              fontSize: '9px',
                              fontFamily: 'var(--font-mono)',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                            }}
                          >
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
