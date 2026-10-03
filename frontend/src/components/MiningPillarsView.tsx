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

  // Pillar 2 state
  const [clustersData, setClustersData] = useState<ClustersResponse | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ScatterPointItem | null>(null);

  // Pillar 3 state
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);

  // Pillar 4 state
  const [trendsData, setTrendsData] = useState<TrendsResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
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
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '32px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
        [ MINING ENGINE ] LOADING 4 CORE PILLARS FROM GOLD LAKEHOUSE...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
        [ ERROR ] FAILED TO LOAD MINING PILLARS: {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Pillar Navigation Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1px',
          background: 'var(--border-subtle)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => setActivePillar(1)}
          style={{
            background: activePillar === 1 ? 'var(--text-primary)' : 'var(--bg-surface)',
            color: activePillar === 1 ? 'var(--bg-canvas)' : 'var(--text-secondary)',
            padding: '14px 16px',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ fontSize: '10px', opacity: 0.7 }}>[ PILLAR 01 ]</div>
          <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px' }}>ASSOCIATION RULES</div>
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>FP-Growth / Co-occurrence</div>
        </button>

        <button
          onClick={() => setActivePillar(2)}
          style={{
            background: activePillar === 2 ? 'var(--text-primary)' : 'var(--bg-surface)',
            color: activePillar === 2 ? 'var(--bg-canvas)' : 'var(--text-secondary)',
            padding: '14px 16px',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ fontSize: '10px', opacity: 0.7 }}>[ PILLAR 02 ]</div>
          <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px' }}>TOPIC CLUSTERING</div>
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>K-Means & DBSCAN (2D)</div>
        </button>

        <button
          onClick={() => setActivePillar(3)}
          style={{
            background: activePillar === 3 ? 'var(--text-primary)' : 'var(--bg-surface)',
            color: activePillar === 3 ? 'var(--bg-canvas)' : 'var(--text-secondary)',
            padding: '14px 16px',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ fontSize: '10px', opacity: 0.7 }}>[ PILLAR 03 ]</div>
          <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px' }}>GRAPH MINING</div>
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>Co-authorship & PageRank</div>
        </button>

        <button
          onClick={() => setActivePillar(4)}
          style={{
            background: activePillar === 4 ? 'var(--text-primary)' : 'var(--bg-surface)',
            color: activePillar === 4 ? 'var(--bg-canvas)' : 'var(--text-secondary)',
            padding: '14px 16px',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ fontSize: '10px', opacity: 0.7 }}>[ PILLAR 04 ]</div>
          <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px' }}>TREND & ANOMALY</div>
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>Isolation Forest & Velocity</div>
        </button>
      </div>

      {/* =================================================================== */}
      {/* PILLAR 1: ASSOCIATION RULES                                         */}
      {/* =================================================================== */}
      {activePillar === 1 && rulesData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '16px 20px', border: '1px solid var(--border-subtle)' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                [ PATTERN EXTRACTION // FP-GROWTH ASSOCIATION RULES ]
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                Mined across {rulesData.summary.total_transactions} paper baskets | Min Support: {rulesData.summary.min_support_used}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <span>FILTER MIN LIFT:</span>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.1"
                value={liftThreshold}
                onChange={(e) => setLiftThreshold(parseFloat(e.target.value))}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 800, color: '#ef4444' }}>&ge; {liftThreshold.toFixed(1)}</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>RULE ANTECEDENTS (IF)</th>
                  <th style={{ padding: '12px 16px' }}>CONSEQUENTS (THEN)</th>
                  <th style={{ padding: '12px 16px' }}>SUPPORT</th>
                  <th style={{ padding: '12px 16px' }}>CONFIDENCE</th>
                  <th style={{ padding: '12px 16px', color: '#ef4444' }}>LIFT RATIO</th>
                  <th style={{ padding: '12px 16px' }}>LEVERAGE</th>
                </tr>
              </thead>
              <tbody>
                {rulesData.rules
                  .filter((r) => r.lift >= liftThreshold)
                  .map((rule, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>
                        {rule.antecedents.map((a) => a.replace('cat:', '').replace('tag:', '')).join(' + ')}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#3b82f6', fontWeight: 700 }}>
                        &rarr; {rule.consequents.map((c) => c.replace('cat:', '').replace('tag:', '')).join(' + ')}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                        {(rule.support * 100).toFixed(2)}%
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                        {(rule.confidence * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: '10px 16px', color: '#ef4444', fontWeight: 800, fontSize: '12px' }}>
                        {rule.lift.toFixed(3)}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                        {rule.leverage.toFixed(4)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PILLAR 2: TOPIC CLUSTERING & 2D SCATTER PLOT                        */}
      {/* =================================================================== */}
      {activePillar === 2 && clustersData && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* 2D Vector Scatter Plot */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                [ 2D VECTOR MANIFOLD // TRUNCATED SVD PROJECTION ]
              </h3>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                SAMPLE: {clustersData.scatter_2d.length} EMBEDDINGS (768-D)
              </span>
            </div>

            {/* SVG Canvas Scatter Plot */}
            <div style={{ width: '100%', height: '360px', background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="-1.2 -1.2 2.4 2.4" style={{ overflow: 'visible' }}>
                {/* Center Crosshairs */}
                <line x1="-1.2" y1="0" x2="1.2" y2="0" stroke="var(--border-subtle)" strokeWidth="0.01" />
                <line x1="0" y1="-1.2" x2="0" y2="1.2" stroke="var(--border-subtle)" strokeWidth="0.01" />

                {/* Data Points */}
                {clustersData.scatter_2d.map((pt, i) => {
                  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                  const color = colors[pt.cluster % colors.length];
                  return (
                    <circle
                      key={i}
                      cx={pt.x * 2.2}
                      cy={pt.y * 2.2}
                      r="0.02"
                      fill={color}
                      opacity={hoveredPoint?.paper_id === pt.paper_id ? 1.0 : 0.75}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    right: '12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    zIndex: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6', fontWeight: 700 }}>
                    <span>PAPER: {hoveredPoint.paper_id}</span>
                    <span>CLUSTER {hoveredPoint.cluster} [{hoveredPoint.category}]</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', marginTop: '2px', fontWeight: 600 }}>
                    {hoveredPoint.title}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cluster Validity & Profiles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Validity Gauges */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '16px 20px', fontFamily: 'var(--font-mono)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>[ VALIDITY // CLUSTER QUALITY ]</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px', textAlign: 'center' }}>
                <div style={{ border: '1px solid var(--border-subtle)', padding: '8px 2px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>SILHOUETTE</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '2px' }}>
                    {clustersData.validity_metrics.silhouette_score}
                  </div>
                </div>
                <div style={{ border: '1px solid var(--border-subtle)', padding: '8px 2px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>DAVIES-B.</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                    {clustersData.validity_metrics.davies_bouldin_index}
                  </div>
                </div>
                <div style={{ border: '1px solid var(--border-subtle)', padding: '8px 2px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>CALINSKI-H.</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>
                    {clustersData.validity_metrics.calinski_harabasz_index}
                  </div>
                </div>
              </div>
            </div>

            {/* Dominant Cluster Profiles */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '16px 20px', flex: 1, overflowY: 'auto', maxHeight: '250px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                [ TOPIC TAXONOMY // CLUSTERS ]
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {clustersData.cluster_profiles.map((c) => (
                  <div key={c.cluster_id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>CLUSTER #{c.cluster_id}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{c.size} papers ({c.percentage}%)</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#3b82f6', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      {c.dominant_categories.map((d) => `${d.category} (${d.count})`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PILLAR 3: GRAPH MINING (CO-AUTHORSHIP & PAGERANK)                   */}
      {/* =================================================================== */}
      {activePillar === 3 && graphData && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Top PageRank Hubs */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                [ INFLUENCE CENTRALITY // PAGERANK RANKING ]
              </h3>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {graphData.network_summary.total_authors.toLocaleString()} AUTHORS | {graphData.network_summary.total_collaborations.toLocaleString()} EDGES
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>RANK</th>
                    <th style={{ padding: '8px 12px' }}>AUTHOR</th>
                    <th style={{ padding: '8px 12px' }}>PAGERANK</th>
                    <th style={{ padding: '8px 12px' }}>COLLABORATORS</th>
                    <th style={{ padding: '8px 12px' }}>PAPERS</th>
                  </tr>
                </thead>
                <tbody>
                  {graphData.top_influencers.slice(0, 12).map((inf, idx) => (
                    <tr key={inf.author} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: idx < 3 ? '#ef4444' : 'var(--text-secondary)' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {inf.author}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--accent-emerald)', fontWeight: 800 }}>
                        {inf.pagerank.toFixed(6)}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#3b82f6' }}>
                        {inf.degree} connections
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                        {inf.paper_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Communities Summary */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>
              [ LABS & COMMUNITIES // LOUVAIN MODULARITY ]
            </h3>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              FOUND {graphData.network_summary.total_communities_detected} RESEARCH LAB CLUSTERS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {graphData.communities.map((comm) => (
                <div key={comm.community_id} style={{ border: '1px solid var(--border-subtle)', padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                    <span style={{ color: '#f59e0b' }}>COMMUNITY #{comm.community_id}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{comm.total_members} members</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {comm.representative_authors.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PILLAR 4: TREND VELOCITY & ANOMALIES                                */}
      {/* =================================================================== */}
      {activePillar === 4 && trendsData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Trend Velocity */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>
              [ RESEARCH VELOCITY // TEMPORAL GROWTH MOMENTUM ]
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {trendsData.trend_velocity.map((trend) => (
                <div key={trend.category} style={{ border: '1px solid var(--border-subtle)', padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {trend.category}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        fontWeight: 800,
                        background:
                          trend.momentum === 'ACCELERATING'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : trend.momentum === 'COOLING'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                        color:
                          trend.momentum === 'ACCELERATING'
                            ? 'var(--accent-emerald)'
                            : trend.momentum === 'COOLING'
                            ? '#ef4444'
                            : '#3b82f6',
                      }}
                    >
                      {trend.momentum} ({trend.growth_rate_pct > 0 ? `+${trend.growth_rate_pct}%` : `${trend.growth_rate_pct}%`})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    <span>Recent: {trend.recent_quarter_papers} papers</span>
                    <span>Previous: {trend.previous_quarter_papers} papers</span>
                    <span>All-time: {trend.all_time_papers}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anomaly Outliers (Isolation Forest) */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '20px', maxHeight: '500px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                [ NOVELTY DETECTOR // ISOLATION FOREST ANOMALIES ]
              </h3>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ef4444', fontWeight: 700 }}>
                {trendsData.summary.total_anomalies_detected} OUTLIERS
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {trendsData.anomalies.slice(0, 8).map((paper) => (
                <div key={paper.paper_id} style={{ border: '1px solid var(--border-subtle)', padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>ID: {paper.paper_id}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Score: {paper.anomaly_score}</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {paper.title}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    {paper.outlier_reasons.map((r, i) => (
                      <span key={i} style={{ background: 'var(--border-subtle)', padding: '2px 6px', fontSize: '10px', color: '#f59e0b' }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
