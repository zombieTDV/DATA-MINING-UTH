import { useState, useEffect, type FC } from 'react';
import type { EdaResponse } from '../api/types';
import { fetchEdaSummary } from '../api/client';

export const EdaView: FC = () => {
  const [data, setData] = useState<EdaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEdaSummary()
      .then((res) => {
        setData(res);
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
        [ TELEMETRY ] READING SILVER PARQUET VIA DUCKDB ENGINE...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '32px', fontFamily: 'var(--font-mono)', color: '#ef4444' }}>
        [ ERROR ] FAILED TO RETRIEVE EDA METRICS: {error}
      </div>
    );
  }

  const { dataset_overview, category_distribution, top_authors, category_cooccurrence, math_and_content_stats } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview Metric Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1px',
          background: 'var(--border-subtle)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ background: 'var(--bg-surface)', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            [ 01 // TOTAL VOLUME ]
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {dataset_overview.total_papers.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            100% Curated Parquet
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            [ 02 // LATEX FORMULAS ]
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {dataset_overview.total_math_formulas.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            Avg {dataset_overview.avg_math_per_paper} / paper
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            [ 03 // FULL-TEXT ENRICHED ]
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {dataset_overview.enriched_html_papers.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {(dataset_overview.enrichment_ratio * 100).toFixed(1)}% Section Density
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            [ 04 // TOTAL CORPUS WORDS ]
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {(dataset_overview.total_words / 1_000_000).toFixed(2)}M
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            Avg {dataset_overview.avg_words_per_paper.toFixed(0)} words
          </div>
        </div>
      </div>

      {/* Main Grid: Categories & Top Authors */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Category Breakdown */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              [ TAXONOMY // PRIMARY CATEGORY DISTRIBUTION ]
            </h3>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              TOP {category_distribution.length} SUBFIELDS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {category_distribution.map((cat) => (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cat.category}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {cat.count.toLocaleString()} papers ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-subtle)' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, cat.percentage * 2.8)}%`,
                      background: cat.category.startsWith('cs.AI')
                        ? 'var(--accent-emerald)'
                        : cat.category.startsWith('cs.LG')
                        ? '#3b82f6'
                        : cat.category.startsWith('cs.CV')
                        ? '#f59e0b'
                        : '#8b5cf6',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Prolific Researchers */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              [ CONTRIBUTORS // TOP PROLIFIC AUTHORS ]
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {top_authors.slice(0, 10).map((author, idx) => (
              <div
                key={author.author}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: idx === 0 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: idx < 3 ? '#ef4444' : 'var(--text-secondary)', fontWeight: 700 }}>
                    #{idx + 1}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{author.author}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {author.paper_count} papers
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Math Density Quantiles & Category Co-occurrences */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Quantiles */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '16px' }}>
            [ METRICS // MATH DENSITY & WORD QUANTILES ]
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            {['P25', 'MEDIAN', 'P75', 'P95', 'MAX'].map((q) => {
              const key = q.toLowerCase() as 'p25' | 'median' | 'p75' | 'p95' | 'max';
              return (
                <div key={q} style={{ border: '1px solid var(--border-subtle)', padding: '10px 4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{q} MATH</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px', color: '#f59e0b' }}>
                    {math_and_content_stats.math_quantiles[key]}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px' }}>{q} WORDS</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px', color: '#3b82f6' }}>
                    {math_and_content_stats.word_quantiles[key]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Co-occurrences */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginBottom: '16px' }}>
            [ CO-OCCURRENCE // CROSS-DISCIPLINARY INTERSECTIONS ]
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {category_cooccurrence.slice(0, 12).map((pair) => (
              <div
                key={`${pair.category_a}-${pair.category_b}`}
                style={{
                  border: '1px solid var(--border-subtle)',
                  padding: '6px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-canvas)',
                }}
              >
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{pair.category_a}</span>
                <span style={{ color: 'var(--text-secondary)' }}>&times;</span>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{pair.category_b}</span>
                <span style={{ marginLeft: '4px', background: 'var(--border-subtle)', padding: '2px 5px', borderRadius: '2px' }}>
                  {pair.cooccurrence_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
