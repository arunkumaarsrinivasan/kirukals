'use client';

import Link from 'next/link';

export default function HomeCtaButtons() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '48px',
            }}
        >
            <Link
                href="/diary"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    backgroundColor: 'var(--color-fg)',
                    color: 'var(--color-bg)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.1s linear',
                    borderLeft: '4px solid var(--color-accent)',
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-accent)';
                    (e.currentTarget as HTMLElement).style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-fg)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-bg)';
                }}
            >
                📓 OPEN DIARY
            </Link>

            <Link
                href="/editor"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 28px',
                    backgroundColor: 'transparent',
                    color: 'var(--color-fg)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontWeight: 400,
                    textDecoration: 'none',
                    border: '1px solid var(--color-border-strong)',
                    transition: 'all 0.1s linear',
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-fg)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-bg)';
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-fg)';
                }}
            >
                ✍️ EDITOR
            </Link>
        </div>
    );
}
