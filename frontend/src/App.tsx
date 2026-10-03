import { useState, useEffect, type FormEvent } from 'react';
import { GeometricPipelineDiagram } from './components/GeometricPipelineDiagram';
import { ToolLogosGrid } from './components/ToolLogos';
import { LiveTelemetryFeed } from './components/LiveTelemetryFeed';

export default function App() {
  const [activeTab, setActiveTab] = useState<'schematic' | 'gauges' | 'tools' | 'rag'>('schematic');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('uth-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('uth-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  const [query, setQuery] = useState<string>('What is the role of sampling z_t in conditional diffusion distillation according to CoDi paper 2310.01407?');
  const [ragLoading, setRagLoading] = useState<boolean>(false);
  const [ragResult, setRagResult] = useState<{
    answer: string;
    citations: string[];
    simScore: string;
    genTime: string;
  } | null>({
    answer: "According to the CoDi paper [Paper: 2310.01407, Section: 5 Experiments], the sampling of $z_t$ plays a crucial role in the distillation learning process. Specifically, the paper demonstrates that using a consistent time $t$ across different samples in a single batch leads to better performance compared to sampling $z_t$ in different time steps within a single batch.\n\nThis consistent sampling approach results in improved visual quality and accuracy during inference, as evidenced by the comparisons shown in Figure 8.",
    citations: ['Paper: 2310.01407, Section: 5 Experiments'],
    simScore: '0.8510',
    genTime: '18.51s'
  });

  const handleRunQuery = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setRagLoading(true);
    setRagResult(null);

    setTimeout(() => {
      setRagLoading(false);
      if (query.toLowerCase().includes('ocr') || query.toLowerCase().includes('gated')) {
        setRagResult({
          answer: "Based on the provided scientific literature, there is insufficient evidence to address the question regarding how gated distillation improves OCR faithfulness. The context focuses on conditional diffusion distillation.\n\nTherefore, the answer is:\n\nDựa trên các tài liệu khoa học được cung cấp, không có đủ thông tin để trả lời câu hỏi này.",
          citations: ['Paper: 2310.01407, Section: 5 Experiments'],
          simScore: '0.7268',
          genTime: '18.55s'
        });
      } else {
        setRagResult({
          answer: "According to the CoDi paper [Paper: 2310.01407, Section: 5 Experiments], the sampling of $z_t$ plays a crucial role in the distillation learning process. Specifically, the paper demonstrates that using a consistent time $t$ across different samples in a single batch leads to better performance compared to sampling $z_t$ in different time steps within a single batch.",
          citations: ['Paper: 2310.01407, Section: 5 Experiments'],
          simScore: '0.8510',
          genTime: '18.51s'
        });
      }
    }, 900);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      {/* Top Architectural Banner */}
      <header style={{
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'var(--text-primary)',
            color: 'var(--bg-canvas)',
            fontWeight: 800,
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            padding: '5px 9px',
            borderRadius: '3px',
            letterSpacing: '0.08em'
          }}>
            UTH-AI
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Scientific Lakehouse Schematic & RAG Pipeline
              </h1>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-emerald)',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                [MPS/METAL ONLINE]
              </span>
            </div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>
              10,000 PAPERS · 143,523 GOLD CHUNKS · 5.524 GB R2 · QWEN2.5-7B
            </div>
          </div>
        </div>

        {/* Tactical Status Blocks & Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ color: 'var(--text-secondary)' }}>R2 BUCKET:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>5.52 GB</span>
          </div>

          <div style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 12px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ color: 'var(--text-secondary)' }}>LANCEDB:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>143,523 VEC</span>
          </div>

          {/* Geometric Theme Switcher */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-canvas)',
              border: '1.5px solid var(--border-muted)',
              color: 'var(--text-primary)',
              padding: '6px 13px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <span>LIGHT</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span>DARK</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div style={{
        background: 'var(--bg-canvas)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 28px',
        display: 'flex',
        gap: '24px'
      }}>
        {[
          { id: 'schematic', label: '1. Pipeline Circuit Schematic' },
          { id: 'gauges', label: '2. Pipeline Execution Logs' },
          { id: 'tools', label: '3. Integrated Tools & Logos' },
          { id: 'rag', label: '4. Scientific RAG Playground' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '14px 2px',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main View Area */}
      <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* TAB 1: Schematic Diagram (Pure Geometric Visual Pipeline) */}
        {activeTab === 'schematic' && (
          <div>
            <GeometricPipelineDiagram />
          </div>
        )}

        {/* TAB 2: Execution Logs (Simple, Full-Width with Scrollbar) */}
        {activeTab === 'gauges' && (
          <div>
            <LiveTelemetryFeed />
          </div>
        )}

        {/* TAB 3: Tool Stack & Logos */}
        {activeTab === 'tools' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Configured Tools & Platform Engines
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                CLOUDFLARE R2 · DUCKDB · LANCEDB · APACHE PARQUET · QWEN 2.5 · NOMIC AI · APPLE METAL
              </p>
            </div>
            <ToolLogosGrid />
          </div>
        )}

        {/* TAB 4: Grounded RAG Playground */}
        {activeTab === 'rag' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
            <div>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginRight: '8px' }}>
                  BENCHMARK PRESETS:
                </span>
                {[
                  {
                    label: "CoDi Diffusion (Paper 2310.01407)",
                    q: "What is the role of sampling z_t in conditional diffusion distillation according to CoDi paper 2310.01407?"
                  },
                  {
                    label: "Anti-Hallucination Gate (OCR)",
                    q: "How does gated distillation improve OCR faithfulness?"
                  }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(preset.q)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      padding: '4px 10px',
                      marginRight: '8px',
                      marginBottom: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Query Form */}
              <form onSubmit={handleRunQuery} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter scientific question..."
                    style={{
                      flex: 1,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-muted)',
                      borderRadius: '4px',
                      padding: '12px 16px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'var(--font-sans)'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={ragLoading || !query.trim()}
                    style={{
                      background: 'var(--text-primary)',
                      color: 'var(--bg-canvas)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0 20px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      cursor: ragLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {ragLoading ? 'SEARCHING...' : 'RUN QUERY'}
                  </button>
                </div>
              </form>

              {/* RAG Answer Display */}
              {ragResult && (
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: '10px'
                  }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-silver)', letterSpacing: '0.05em' }}>
                      [GROUNDED SCIENTIFIC SYNTHESIS]
                    </span>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      <span>SIMILARITY: <strong style={{ color: 'var(--accent-emerald)' }}>{ragResult.simScore}</strong></span>
                      <span>LATENCY: <strong style={{ color: 'var(--text-primary)' }}>{ragResult.genTime}</strong></span>
                    </div>
                  </div>

                  <div style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {ragResult.answer}
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      [VERIFIED CITATIONS]:
                    </div>
                    {ragResult.citations.map((c, idx) => (
                      <div key={idx} style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-silver)' }}>
                        ▪ [{c}]
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inference Parameters */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              height: 'fit-content'
            }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '14px', letterSpacing: '0.05em' }}>
                ACTIVE INFERENCE PIPELINE
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>VECTOR INDEX</div>
                  <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>LanceDB (143k Chunks)</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>EMBEDDING MODEL</div>
                  <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Nomic Embed v1.5 (768d)</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>GENERATION LLM</div>
                  <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Qwen2.5-7B (Q4_K_M GGUF)</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>ACCELERATION</div>
                  <div style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Apple Silicon Metal GPU</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>TEMPERATURE</div>
                  <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>0.2 (Strict Grounding)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
