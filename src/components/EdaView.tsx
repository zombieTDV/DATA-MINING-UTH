import { useState, useEffect, useMemo, type FC } from 'react';
import type { EdaResponse } from '../api/types';
import { fetchEdaSummary } from '../api/client';

export const EdaView: FC = () => {
  const [data, setData] = useState<EdaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [authorSort, setAuthorSort] = useState<'rank' | 'papers_desc' | 'papers_asc' | 'name'>('rank');
  const [categorySort, setCategorySort] = useState<'pct_desc' | 'pct_asc' | 'formulas_desc' | 'name'>('pct_desc');
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<{ catA: string; catB: string; count: number } | null>(null);

  useEffect(() => {
    fetchEdaSummary()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Sorted Categories
  const sortedCategories = useMemo(() => {
    if (!data?.category_distribution) return [];
    const list = [...data.category_distribution];
    switch (categorySort) {
      case 'pct_asc':
        return list.sort((a, b) => a.percentage - b.percentage);
      case 'formulas_desc':
        return list.sort((a, b) => b.total_math_formulas - a.total_math_formulas);
      case 'name':
        return list.sort((a, b) => a.category.localeCompare(b.category));
      case 'pct_desc':
      default:
        return list.sort((a, b) => b.percentage - a.percentage);
    }
  }, [data, categorySort]);

  // Sorted Authors
  const sortedAuthors = useMemo(() => {
    if (!data?.top_authors) return [];
    const list = data.top_authors.map((a, i) => ({ ...a, originalRank: i + 1 }));
    switch (authorSort) {
      case 'papers_desc':
        return list.sort((a, b) => b.paper_count - a.paper_count);
      case 'papers_asc':
        return list.sort((a, b) => a.paper_count - b.paper_count);
      case 'name':
        return list.sort((a, b) => a.author.localeCompare(b.author));
      case 'rank':
      default:
        return list;
    }
  }, [data, authorSort]);

  // Co-occurrence Matrix Construction (Task 3.2)
  const heatmapData = useMemo(() => {
    if (!data?.category_cooccurrence) return null;
    const raw = data.category_cooccurrence;
    const catSet = new Set<string>();
    raw.forEach((r) => {
      catSet.add(r.category_a);
      catSet.add(r.category_b);
    });
    const categories = Array.from(catSet).slice(0, 6); // Top 6 core categories for optimal grid readability
    let maxCount = 1;
    const pairMap = new Map<string, number>();

    raw.forEach((r) => {
      const k1 = `${r.category_a}|${r.category_b}`;
      const k2 = `${r.category_b}|${r.category_a}`;
      pairMap.set(k1, r.cooccurrence_count);
      pairMap.set(k2, r.cooccurrence_count);
      if (r.cooccurrence_count > maxCount) maxCount = r.cooccurrence_count;
    });

    return { categories, pairMap, maxCount };
  }, [data]);

  // Max Category Percentage for Proportional Distribution Bars
  const maxCategoryPercentage = useMemo(() => {
    if (!data?.category_distribution || data.category_distribution.length === 0) return 1;
    return Math.max(...data.category_distribution.map((c) => c.percentage));
  }, [data]);

  // Structured Skeleton Loading Screen (Task 4.5)
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Skeleton */}
        <div className="skeleton-shimmer" style={{ height: '56px', borderRadius: 'var(--radius-md)' }} />
        {/* 4 KPI Cards Skeletons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-shimmer" style={{ height: '120px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        {/* Split Panels Skeletons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
          <div className="skeleton-shimmer" style={{ height: '420px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton-shimmer" style={{ height: '420px', borderRadius: 'var(--radius-md)' }} />
        </div>
        {/* Top Authors Skeleton */}
        <div className="skeleton-shimmer" style={{ height: '160px', borderRadius: 'var(--radius-md)' }} />
      </div>
    );
  }

  if (!data) return null;

  const { dataset_overview, math_and_content_stats } = data;
  const mq = math_and_content_stats.math_quantiles;
  const wq = math_and_content_stats.word_quantiles;

  // Dynamic IQR Calculations (Task 3.1)
  const mP95 = mq.p95 || 500;
  const mLeft = `${Math.min(92, Math.max(3, (mq.p25 / mP95) * 100))}%`;
  const mWidth = `${Math.max(8, Math.min(90, ((mq.p75 - mq.p25) / mP95) * 100))}%`;
  const mMedian = `${Math.min(94, Math.max(3, (mq.median / mP95) * 100))}%`;

  const wP95 = wq.p95 || 15000;
  const wLeft = `${Math.min(92, Math.max(3, (wq.p25 / wP95) * 100))}%`;
  const wWidth = `${Math.max(8, Math.min(90, ((wq.p75 - wq.p25) / wP95) * 100))}%`;
  const wMedian = `${Math.min(94, Math.max(3, (wq.median / wP95) * 100))}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* SECTION HEADER: Real-Time EDA Mission Brief */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--accent-silver)',
            color: '#ffffff',
            padding: '3px 8px',
            borderRadius: '3px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            letterSpacing: '0.08em',
          }}>
            DUCKDB OLAP
          </div>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              Exploratory Data Analysis: 10,000 Scientific Papers
            </h2>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '2px' }}>
              SOURCE: CLOUDFLARE R2 SILVER PARQUET · ZERO-COPY VECTORIZED SCAN
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-muted)' }}>COVERAGE:</span>
          <strong style={{ color: 'var(--accent-emerald)' }}>
            {dataset_overview.earliest_publication} TO {dataset_overview.latest_publication}
          </strong>
        </div>
      </div>

      {/* 4 EXECUTIVE KPI CARDS: Doppelrand Architecture */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '12px',
      }}>
        {/* KPI 1: Total Volume */}
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
            padding: '18px 20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--accent-silver)', fontWeight: 700, letterSpacing: '0.06em' }}>
                [ METRIC 01 : TOTAL VOLUME ]
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {dataset_overview.total_papers.toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--accent-emerald)', marginTop: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              100% Curated Scientific Papers
            </div>
          </div>
        </div>

        {/* KPI 2: LaTeX Math Density */}
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
            padding: '18px 20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--accent-bronze)', fontWeight: 700, letterSpacing: '0.06em' }}>
                [ METRIC 02 : LATEX FORMULAS ]
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {(dataset_overview.total_math_formulas / 1_000_000).toFixed(2)}M
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--accent-bronze)', marginTop: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Avg {dataset_overview.avg_math_per_paper.toFixed(1)} equations / paper
            </div>
          </div>
        </div>

        {/* KPI 3: HTML5 Full-Text Enrichment */}
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
            padding: '18px 20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', fontWeight: 700, letterSpacing: '0.06em' }}>
                [ METRIC 03 : HTML5 ENRICHED ]
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {dataset_overview.enriched_html_papers.toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--accent-emerald)', marginTop: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {(dataset_overview.enrichment_ratio * 100).toFixed(1)}% High-Density ar5iv
            </div>
          </div>
        </div>

        {/* KPI 4: Mean Corpus Length */}
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
            padding: '18px 20px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)', fontWeight: 700, letterSpacing: '0.06em' }}>
                [ METRIC 04 : CORPUS LENGTH ]
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {dataset_overview.avg_words_per_paper.toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--accent-violet)', marginTop: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Mean Words Per Research Paper
            </div>
          </div>
        </div>
      </div>

      {/* TWO CORE SPLIT PANELS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '16px',
      }}>
        {/* PANEL A: Category Distribution Drilldown */}
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
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  RESEARCH CATEGORY DISTRIBUTION
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Click row to drill into formula volume &amp; word averages
                </span>
              </div>

              {/* Category Sort Controls */}
              <div style={{ display: 'flex', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCategorySort(categorySort === 'pct_desc' ? 'pct_asc' : 'pct_desc')}
                  style={{
                    background: categorySort.startsWith('pct') ? 'var(--bg-surface)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    color: categorySort.startsWith('pct') ? 'var(--accent-silver)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  title="Sort by percentage"
                >
                  % {categorySort === 'pct_desc' ? '▼' : '▲'}
                </button>
                <button
                  type="button"
                  onClick={() => setCategorySort('formulas_desc')}
                  style={{
                    background: categorySort === 'formulas_desc' ? 'var(--bg-surface)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    color: categorySort === 'formulas_desc' ? 'var(--accent-violet)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  title="Sort by formula count"
                >
                  MATH ▼
                </button>
                <button
                  type="button"
                  onClick={() => setCategorySort('name')}
                  style={{
                    background: categorySort === 'name' ? 'var(--bg-surface)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    color: categorySort === 'name' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  title="Sort by category name"
                >
                  A-Z
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {sortedCategories.map((cat, idx) => {
                const isSelected = selectedCategory === cat.category;
                const barWidth = `${Math.min(100, Math.max(8, (cat.percentage / maxCategoryPercentage) * 100))}%`;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.category)}
                    style={{
                      background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                      border: `1px solid ${isSelected ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
                      borderRadius: '4px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {cat.category}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ({cat.count.toLocaleString()} papers)
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>

                    {/* Proportional Distribution Bar (Mathematically Scaled) */}
                    <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: barWidth,
                        height: '100%',
                        background: isSelected
                          ? 'linear-gradient(90deg, var(--accent-silver), var(--accent-cyan))'
                          : 'linear-gradient(90deg, var(--accent-emerald), var(--accent-silver))',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>

                    {isSelected && (
                      <div style={{
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px dashed var(--border-subtle)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          FORMULAS: <strong style={{ color: 'var(--text-primary)' }}>{cat.total_math_formulas.toLocaleString()}</strong>
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          AVG WORDS: <strong style={{ color: 'var(--text-primary)' }}>{cat.avg_words.toLocaleString()}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL B: Math & Word Quantile Matrix + Chromatic Heatmap */}
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
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  STATISTICAL QUANTILE MATRIX
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Non-parametric percentile distribution across scientific corpus
                </span>
              </div>

              {/* Quantiles Table */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card-shell)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '9px 12px', color: 'var(--text-secondary)' }}>METRIC PROFILE</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right' }}>P25</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right', color: 'var(--accent-silver)' }}>MEDIAN</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right' }}>P75</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right', color: 'var(--accent-bronze)' }}>P95</th>
                      <th style={{ padding: '9px 10px', textAlign: 'right', color: 'var(--accent-emerald)' }}>MAX</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '11px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        LaTeX Formulas
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {mq.p25}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-silver)' }}>
                        {mq.median}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {mq.p75}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-bronze)' }}>
                        {mq.p95}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {mq.max.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '11px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Word Count
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {wq.p25.toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-silver)' }}>
                        {wq.median.toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {wq.p75.toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-bronze)' }}>
                        {wq.p95.toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {wq.max.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Visual IQR Box-Plot Gauges (Task 3.1: Dynamic) */}
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  INTERQUARTILE RANGE (IQR) PROJECTIONS:
                </div>
                {/* Formulas IQR */}
                <div style={{ background: 'var(--bg-card-shell)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>LaTeX Formulas IQR</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      P25: {mq.p25} · Median: {mq.median} · P75: {mq.p75}
                    </span>
                  </div>
                  <div style={{ position: 'relative', height: '10px', background: 'var(--border-subtle)', borderRadius: '5px' }}>
                    <div style={{ position: 'absolute', left: '2%', right: '5%', top: '4px', height: '2px', background: 'var(--border-highlight)' }} />
                    <div style={{ position: 'absolute', left: mLeft, width: mWidth, height: '100%', background: 'rgba(192, 132, 252, 0.35)', border: '1px solid var(--accent-violet)', borderRadius: '2px' }} />
                    <div style={{ position: 'absolute', left: mMedian, top: '-2px', height: '14px', width: '3px', background: '#ffffff', borderRadius: '1px' }} />
                  </div>
                </div>

                {/* Words IQR */}
                <div style={{ background: 'var(--bg-card-shell)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--accent-silver)', fontWeight: 700 }}>Word Count IQR</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      P25: {wq.p25.toLocaleString()} · Median: {wq.median.toLocaleString()} · P75: {wq.p75.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ position: 'relative', height: '10px', background: 'var(--border-subtle)', borderRadius: '5px' }}>
                    <div style={{ position: 'absolute', left: '2%', right: '5%', top: '4px', height: '2px', background: 'var(--border-highlight)' }} />
                    <div style={{ position: 'absolute', left: wLeft, width: wWidth, height: '100%', background: 'rgba(96, 165, 250, 0.35)', border: '1px solid var(--accent-silver)', borderRadius: '2px' }} />
                    <div style={{ position: 'absolute', left: wMedian, top: '-2px', height: '14px', width: '3px', background: '#ffffff', borderRadius: '1px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Chromatic Category Co-occurrence Heatmap Matrix (Task 3.2) */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  CHROMATIC CO-OCCURRENCE MATRIX:
                </span>
                {hoveredHeatmapCell && (
                  <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--accent-silver)', fontWeight: 700 }}>
                    [{hoveredHeatmapCell.catA} × {hoveredHeatmapCell.catB}]: {hoveredHeatmapCell.count.toLocaleString()} papers
                  </span>
                )}
              </div>

              {heatmapData && (
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '6px', background: 'var(--bg-surface)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: 'var(--text-muted)' }}>CAT</th>
                        {heatmapData.categories.map((c) => (
                          <th key={c} style={{ padding: '4px 6px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {c.replace('cs.', '')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.categories.map((rowCat) => (
                        <tr key={rowCat}>
                          <td style={{ padding: '4px 6px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {rowCat.replace('cs.', '')}
                          </td>
                          {heatmapData.categories.map((colCat) => {
                            const isDiagonal = rowCat === colCat;
                            const count = isDiagonal ? 0 : (heatmapData.pairMap.get(`${rowCat}|${colCat}`) || 0);
                            const intensity = count > 0 ? count / heatmapData.maxCount : 0;
                            const bg = isDiagonal
                              ? 'var(--bg-card-shell)'
                              : count > 0
                              ? `rgba(96, 165, 250, ${Math.max(0.12, intensity * 0.85)})`
                              : 'transparent';

                            return (
                              <td
                                key={colCat}
                                onMouseEnter={() => {
                                  if (!isDiagonal && count > 0) {
                                    setHoveredHeatmapCell({ catA: rowCat, catB: colCat, count });
                                  }
                                }}
                                onMouseLeave={() => setHoveredHeatmapCell(null)}
                                style={{
                                  padding: '5px 4px',
                                  textAlign: 'center',
                                  background: bg,
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: '2px',
                                  color: count > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                                  fontWeight: count > 0 ? 700 : 400,
                                  cursor: count > 0 ? 'pointer' : 'default',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {isDiagonal ? '-' : count > 0 ? count : '·'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOP SCIENTIFIC AUTHORS ROW */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                TOP PROLIFIC SCIENTIFIC AUTHORS
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Ranked by volume of indexed papers within 10,000 ArXiv dataset
              </span>
            </div>

            {/* Author Sorting Controls (Task 3.3) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>SORT:</span>
              <button
                type="button"
                onClick={() => setAuthorSort('rank')}
                style={{
                  background: authorSort === 'rank' ? 'var(--bg-surface)' : 'transparent',
                  border: `1px solid ${authorSort === 'rank' ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
                  borderRadius: '3px',
                  padding: '3px 8px',
                  color: authorSort === 'rank' ? 'var(--accent-silver)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: authorSort === 'rank' ? 700 : 500,
                }}
              >
                DEFAULT RANK
              </button>
              <button
                type="button"
                onClick={() => setAuthorSort(authorSort === 'papers_desc' ? 'papers_asc' : 'papers_desc')}
                style={{
                  background: authorSort.startsWith('papers') ? 'var(--bg-surface)' : 'transparent',
                  border: `1px solid ${authorSort.startsWith('papers') ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
                  borderRadius: '3px',
                  padding: '3px 8px',
                  color: authorSort.startsWith('papers') ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: authorSort.startsWith('papers') ? 700 : 500,
                }}
              >
                PAPERS {authorSort === 'papers_desc' ? '▼' : '▲'}
              </button>
              <button
                type="button"
                onClick={() => setAuthorSort('name')}
                style={{
                  background: authorSort === 'name' ? 'var(--bg-surface)' : 'transparent',
                  border: `1px solid ${authorSort === 'name' ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
                  borderRadius: '3px',
                  padding: '3px 8px',
                  color: authorSort === 'name' ? 'var(--accent-silver)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: authorSort === 'name' ? 700 : 500,
                }}
              >
                NAME A-Z
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
          }}>
            {sortedAuthors.map((author, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card-shell)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {author.author}
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                    RANK #{author.originalRank}
                  </div>
                </div>
                <span style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  color: 'var(--accent-silver)',
                  background: 'var(--bg-card-core)',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  border: '1px solid var(--border-subtle)',
                }}>
                  {author.paper_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
