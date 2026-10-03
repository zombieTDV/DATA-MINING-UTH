// StorageInspector component

export interface LakehouseLayer {
  zone: 'BRONZE' | 'SILVER' | 'GOLD';
  name: string;
  storageType: string;
  format: string;
  itemsCount: string;
  sizeBytes: string;
  r2Location: string;
  color: string;
  description: string;
}

export const LAYERS: LakehouseLayer[] = [
  {
    zone: 'BRONZE',
    name: 'Raw arXiv HTML5 Papers',
    storageType: 'Cloudflare R2 Object Store',
    format: 'W3C HTML5 (.html)',
    itemsCount: '9,022 files',
    sizeBytes: '2.821 GB',
    r2Location: 's3://uth-scientific-lakehouse/bronze/html/year=2026/',
    color: 'var(--accent-bronze)',
    description: 'Raw web-crawled HTML5 documents from ar5iv containing full sections, tables, math tags, and bibliography.'
  },
  {
    zone: 'BRONZE',
    name: 'OAI-PMH Harvest Batches',
    storageType: 'Cloudflare R2 Object Store',
    format: 'Compressed JSON Bundles',
    itemsCount: '12 batch bundles',
    sizeBytes: '20.83 MB',
    r2Location: 's3://uth-scientific-lakehouse/bronze/oai_batches/',
    color: 'var(--accent-bronze)',
    description: 'Raw metadata harvesting batches retrieved through arXiv OAI-PMH protocol across 5 core AI/DS categories.'
  },
  {
    zone: 'SILVER',
    name: 'Curated Canonical Papers',
    storageType: 'Local Disk & Cloudflare R2',
    format: 'Apache Parquet (Snappy)',
    itemsCount: '10,000 papers (8,989 enriched)',
    sizeBytes: '231.73 MB',
    r2Location: 's3://uth-scientific-lakehouse/silver/year=2026/papers.parquet',
    color: 'var(--accent-silver)',
    description: 'Cleaned and structured schema containing parsed sections, abstracts, authors, and 2.22M extracted LaTeX formulas.'
  },
  {
    zone: 'GOLD',
    name: 'Contextual Vector Lakehouse',
    storageType: 'LanceDB Multi-Modal Table',
    format: 'Lance Columnar (.lance)',
    itemsCount: '143,523 chunks',
    sizeBytes: '2.456 GB',
    r2Location: 's3://uth-scientific-lakehouse/gold/lancedb/',
    color: 'var(--accent-gold)',
    description: 'Semantically contextualized chunks paired with 768-dimensional Nomic embeddings for sub-50ms cosine ANN search.'
  }
];

export function StorageInspector() {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Cloudflare R2 & Medallion Storage Breakdown
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Bucket: <code className="mono" style={{ color: 'var(--text-primary)' }}>uth-scientific-lakehouse</code> (Zero Egress Fees)
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)'
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Total Stored: <strong style={{ color: 'var(--text-primary)' }}>5.524 GB</strong></span>
          <span style={{ color: 'var(--text-muted)' }}>Free Quota: <strong style={{ color: 'var(--accent-emerald)' }}>10.00 GB</strong></span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
          textAlign: 'left'
        }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid var(--border-muted)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '10px 14px' }}>Zone</th>
              <th style={{ padding: '10px 14px' }}>Dataset Name</th>
              <th style={{ padding: '10px 14px' }}>Format</th>
              <th style={{ padding: '10px 14px' }}>Count</th>
              <th style={{ padding: '10px 14px' }}>Size</th>
              <th style={{ padding: '10px 14px' }}>Lakehouse Prefix</th>
            </tr>
          </thead>
          <tbody>
            {LAYERS.map((layer, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: idx < LAYERS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <td style={{ padding: '12px 14px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: layer.color,
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    {layer.zone}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {layer.name}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {layer.description}
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {layer.format}
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {layer.itemsCount}
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: layer.color }}>
                  {layer.sizeBytes}
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {layer.r2Location}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
