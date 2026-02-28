import HomeCtaButtons from '@/components/HomeCtaButtons';

const features = [
  { icon: '📸', text: 'Scan physical pages' },
  { icon: '🤖', text: 'AI detects sketches (offline)' },
  { icon: '🔗', text: 'Link sketches to real work' },
  { icon: '✨', text: 'Hover to reveal connections' },
  { icon: '📖', text: 'Single & double page layouts' },
  { icon: '☁️', text: 'Free cloud sync (Supabase)' },
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'grid',
        gridTemplateRows: '60px 1fr 40px',
        fontFamily: 'var(--font-mono)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Noise overlay */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Ghost watermark — top-left */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          fontFamily: 'var(--font-display)',
          fontSize: '10rem',
          color: 'rgba(255,255,255,0.015)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          letterSpacing: '-6px',
          top: '5%',
          left: '-3%',
          transform: 'rotate(-90deg)',
          userSelect: 'none',
          zIndex: 0,
        }}
      >
        KIRUKAL
      </div>

      {/* Ghost watermark — bottom-right */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          fontFamily: 'var(--font-display)',
          fontSize: '8rem',
          color: 'rgba(255,255,255,0.015)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          letterSpacing: '-4px',
          bottom: 0,
          right: '-2%',
          userSelect: 'none',
          zIndex: 0,
        }}
      >
        RAW
      </div>

      {/* ── Top Bar ── */}
      <header
        style={{
          gridRow: 1,
          borderBottom: '2px solid var(--color-border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          backgroundColor: 'var(--color-bg)',
          textTransform: 'uppercase',
          letterSpacing: '-1px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            letterSpacing: '-2px',
            color: 'var(--color-fg)',
          }}
        >
          KIRUKAL{' '}
          <span style={{ fontSize: '0.45em', fontFamily: 'var(--font-mono)', verticalAlign: 'middle', opacity: 0.5 }}>
            v.1.0
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.7rem', color: 'var(--color-muted)', letterSpacing: '1px' }}>
          <span>MEM: LOCAL</span>
          <span>NET: ON</span>
          <span>REC <span className="raw-blink">●</span></span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main
        style={{
          gridRow: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        {/* Registration marks */}
        <div aria-hidden style={{ position: 'absolute', inset: 20, border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center', maxWidth: '640px', padding: '0 24px' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              border: '1px solid var(--color-border-strong)',
              backgroundColor: 'transparent',
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: 'var(--color-muted)',
              marginBottom: '32px',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                backgroundColor: 'var(--color-accent)',
                display: 'inline-block',
                animation: 'raw-blink 1s infinite step-end',
              }}
            />
            Interactive Diary & Portfolio
          </div>

          {/* Brand */}
          <h1
            className="font-logo"
            style={{
              fontSize: 'clamp(3.5rem, 10vw, 6rem)',
              lineHeight: 1,
              color: 'var(--color-fg)',
              marginBottom: '24px',
              letterSpacing: '-2px',
            }}
          >
            Kirukal
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-muted)',
              marginBottom: '40px',
              lineHeight: 1.8,
              maxWidth: '480px',
              margin: '0 auto 40px',
            }}
          >
            A living diary where your{' '}
            <span style={{ color: 'var(--color-fg)', borderBottom: '1px solid var(--color-accent)' }}>hand-drawn sketches</span>{' '}
            connect to{' '}
            <span style={{ color: 'var(--color-fg)', borderBottom: '1px solid var(--color-border-strong)' }}>real work</span>.
            Scan, link, and showcase your creative process.
          </p>

          {/* CTAs */}
          <HomeCtaButtons />

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
            {features.map((f) => (
              <div
                key={f.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <span>{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Status Bar ── */}
      <footer
        style={{
          gridRow: 3,
          borderTop: '2px solid var(--color-border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          fontSize: '0.65rem',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          backgroundColor: 'var(--color-bg)',
          letterSpacing: '1px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <span>Open source · No subscription</span>
        <span>MODE: LANDING</span>
        <span>AI: LOCAL</span>
      </footer>
    </main>
  );
}
