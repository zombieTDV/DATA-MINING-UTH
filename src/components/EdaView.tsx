import { useState, useEffect, type FC } from 'react';
import type { EdaResponse } from '../api/types';
import { fetchEdaSummary } from '../api/client';

export const EdaView: FC = () => {
  const [data, setData] = useState<EdaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>
            [ TELEMETRY ] SCANNING SILVER PARQUET VIA DUCKDB ENGINE...
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Aggregating 10,000 papers, 2.22M LaTeX formulas, and section metadata
          </span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { dataset_overview, category_distribution, top_authors, category_cooccurrence, math_and_content_stats } = data;

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
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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

        {/* KPI 4: Total Corpus Words */}
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
                {(dataset_overview.total_words / 1_000_000).toFixed(2)}M
              </div>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--accent-violet)', marginTop: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Avg {dataset_overview.avg_words_per_paper.toFixed(0)} words / paper
            </div>
          </div>
        </div>
      </div>

      {/* SPLIT VIEW: Category Distribution & Quantiles Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '14px' }}>
        
        {/* PANEL A: Category Spectrum Distribution */}
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
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  PRIMARY RESEARCH CATEGORIES
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Distribution across 10,000 ArXiv papers
                </span>
              </div>
              <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                CLICK TO INSPECT
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {category_distribution.map((cat) => {
                const isSelected = selectedCategory === cat.category;
                return (
                  <div
                    key={cat.category}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.category)}
                    style={{
                      background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-card-shell)',
                      border: isSelected ? '1px solid var(--accent-silver)' : '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          fontWeight: 800,
                          color: isSelected ? 'var(--accent-silver)' : 'var(--text-primary)',
                        }}>
                          {cat.category}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {cat.count.toLocaleString()} papers
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {cat.percentage.toFixed(1)}%
                      </span>
                    </div>

                    {/* Proportional Distribution Bar */}
                    <div style={{ width: '100%', height: '5px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${cat.percentage * 3}%`,
                        maxWidth: '100%',
                        height: '100%',
                        background: isSelected ? 'var(--accent-silver)' : 'var(--accent-emerald)',
                        borderRadius: '2px',
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

        {/* PANEL B: Math & Word Quantile Matrix */}
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
              <div style={{ marginBottom: '16px' }}>
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
                        {math_and_content_stats.math_quantiles.p25}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-silver)' }}>
                        {math_and_content_stats.math_quantiles.median}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {math_and_content_stats.math_quantiles.p75}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-bronze)' }}>
                        {math_and_content_stats.math_quantiles.p95}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {math_and_content_stats.math_quantiles.max.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '11px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Word Count
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {math_and_content_stats.word_quantiles.p25.toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-silver)' }}>
                        {math_and_content_stats.word_quantiles.median.toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {math_and_content_stats.word_quantiles.p75.toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-bronze)' }}>
                        {math_and_content_stats.word_quantiles.p95.toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {math_and_content_stats.word_quantiles.max.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross-Discipline Co-occurrence Chips */}
            <div style={{ marginTop: '18px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                PRIMARY CROSS-DISCIPLINARY CO-OCCURRENCES:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {category_cooccurrence.map((co, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-card-shell)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ color: 'var(--accent-silver)', fontWeight: 700 }}>
                      {co.category_a} &amp; {co.category_b}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                      {co.cooccurrence_count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
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
            <span style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              background: 'var(--bg-card-shell)',
              padding: '3px 8px',
              borderRadius: '3px',
              color: 'var(--accent-emerald)',
              fontWeight: 700,
            }}>
              100% DISAMBIGUATED
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px',
          }}>
            {top_authors.map((author, idx) => (
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
                    RANK #{idx + 1}
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
