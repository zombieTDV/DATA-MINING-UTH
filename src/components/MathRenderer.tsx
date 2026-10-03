import type { FC } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Pure fallback formatter that converts common LaTeX expressions
 * into clean, readable Unicode and semantic HTML typography.
 */
function renderFallbackMath(latex: string, displayMode: boolean) {
  let cleaned = latex
    .trim()
    .replace(/^\\\[|\\\]$/g, '')
    .replace(/^\$\$|\$\$$/g, '')
    .replace(/^\$|\$$/g, '');

  // Common replacements for scientific diffusion & attention formulas
  cleaned = cleaned
    .replace(/\\mathcal\{L\}/g, 'ℒ')
    .replace(/\\mathbb\{E\}/g, '𝔼')
    .replace(/\\text\{([a-zA-Z0-9_]+)\}/g, '$1')
    .replace(/\\left\\\||\\right\\\||\\\|/g, '‖')
    .replace(/\\hat\{([a-zA-Z0-9_]+)\}/g, '$1̂')
    .replace(/\\nabla/g, '∇')
    .replace(/\\log/g, 'log')
    .replace(/\\theta/g, 'θ')
    .replace(/\\quad/g, '   ')
    .replace(/\\sqrt\{([a-zA-Z0-9_]+)\}/g, '√$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\cdot/g, '·')
    .replace(/\\le|\\leq/g, '≤')
    .replace(/\\ge|\\geq/g, '≥')
    .replace(/\^2/g, '²')
    .replace(/\^T/g, 'ᵀ')
    .replace(/_t\b/g, 'ₜ')
    .replace(/_s\b/g, 'ₛ')
    .replace(/_\{?distill\}?/g, '₍distill₎');

  return (
    <span
      style={{
        fontFamily: "'Cambria Math', 'STIX Two Math', 'Times New Roman', Georgia, serif",
        fontSize: displayMode ? '16px' : '14px',
        fontStyle: 'normal',
        letterSpacing: '0.02em',
      }}
    >
      {cleaned}
    </span>
  );
}

function getKaTeXHtml(latex: string, displayMode: boolean): string | null {
  try {
    const cleanMath = latex
      .trim()
      .replace(/^\\\[|\\\]$/g, '')
      .replace(/^\$\$|\$\$$/g, '')
      .replace(/^\$|\$$/g, '');
    return katex.renderToString(cleanMath, {
      displayMode,
      throwOnError: false,
    });
  } catch {
    return null;
  }
}

/**
 * Robust MathRenderer: Synchronously renders standard LaTeX via KaTeX,
 * falling back to semantic Unicode formatting on parse exceptions.
 */
export const MathRenderer: FC<MathRendererProps> = ({
  math,
  displayMode = false,
  className,
}) => {
  const html = getKaTeXHtml(math, displayMode);

  if (html) {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          display: displayMode ? 'block' : 'inline-block',
          margin: displayMode ? '10px 0' : '0 2px',
          textAlign: displayMode ? 'center' : 'inherit',
        }}
      />
    );
  }

  // Graceful fallback container
  return (
    <span
      className={className}
      style={{
        display: displayMode ? 'block' : 'inline-block',
        margin: displayMode ? '12px 0' : '0 3px',
        padding: displayMode ? '10px 16px' : '1px 4px',
        background: displayMode ? 'var(--bg-card-shell)' : 'rgba(96, 165, 250, 0.1)',
        border: displayMode ? '1px solid var(--border-subtle)' : '1px solid rgba(96, 165, 250, 0.25)',
        borderRadius: displayMode ? '6px' : '3px',
        color: displayMode ? 'var(--accent-silver)' : 'var(--text-primary)',
        textAlign: displayMode ? 'center' : 'inherit',
      }}
    >
      {renderFallbackMath(math, displayMode)}
    </span>
  );
};

interface FormattedTextWithMathProps {
  text: string;
}

/**
 * Parses a paragraph containing mixed text and LaTeX expressions ($...$ or $$...$$)
 * and renders both text and math cleanly.
 */
export const FormattedTextWithMath: FC<FormattedTextWithMathProps> = ({ text }) => {
  if (!text) return null;

  // Split text by display math $$...$$ and inline math $...$
  const tokens: Array<{ type: 'text' | 'inline-math' | 'block-math'; content: string }> = [];
  
  // First match $$...$$ (block math)
  const blockParts = text.split(/(\$\$[\s\S]*?\$\$)/g);
  
  blockParts.forEach((part) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      tokens.push({ type: 'block-math', content: part.slice(2, -2).trim() });
    } else {
      // Inside non-block parts, match inline math $...$
      const inlineParts = part.split(/(\$[^$\n]+?\$)/g);
      inlineParts.forEach((ip) => {
        if (ip.startsWith('$') && ip.endsWith('$') && ip.length > 2) {
          tokens.push({ type: 'inline-math', content: ip.slice(1, -1).trim() });
        } else if (ip) {
          tokens.push({ type: 'text', content: ip });
        }
      });
    }
  });

  return (
    <span>
      {tokens.map((token, i) => {
        if (token.type === 'block-math') {
          return (
            <MathRenderer
              key={i}
              math={token.content}
              displayMode={true}
            />
          );
        }
        if (token.type === 'inline-math') {
          return (
            <MathRenderer
              key={i}
              math={token.content}
              displayMode={false}
            />
          );
        }
        return <span key={i}>{token.content}</span>;
      })}
    </span>
  );
};
