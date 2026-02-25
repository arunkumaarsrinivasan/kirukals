import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-fuchsia-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative text-center max-w-2xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Interactive Diary & Portfolio
        </div>

        <h1 className="text-5xl md:text-6xl font-logo text-white mb-4 leading-tight">
          Kirukal
        </h1>

        <p className="text-lg text-zinc-400 mb-10 leading-relaxed max-w-lg mx-auto">
          A living diary where your{' '}
          <span className="text-amber-400">hand-drawn sketches</span> connect to{' '}
          <span className="text-violet-400">real work</span>. Scan, link, and
          showcase your creative process.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/diary"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600
                       hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl
                       shadow-lg shadow-violet-500/25 transition-all hover:scale-105"
          >
            📓 Open Diary
          </Link>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-zinc-900 border border-zinc-700
                       hover:border-zinc-600 text-zinc-300 hover:text-white font-medium rounded-xl transition-all"
          >
            ✍️ Editor
          </Link>
        </div>
      </div>

      {/* Feature pills */}
      <div className="relative mt-16 flex flex-wrap justify-center gap-3 max-w-2xl">
        {[
          { icon: '📸', text: 'Scan physical pages' },
          { icon: '🤖', text: 'AI detects sketches (offline)' },
          { icon: '🔗', text: 'Link sketches to real work' },
          { icon: '✨', text: 'Hover to reveal connections' },
          { icon: '📖', text: 'Single & double page layouts' },
          { icon: '☁️', text: 'Free cloud sync (Supabase)' },
        ].map((f) => (
          <div key={f.text}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 border border-zinc-800 text-sm text-zinc-400">
            <span>{f.icon}</span>
            {f.text}
          </div>
        ))}
      </div>

      <footer className="relative mt-12 text-xs text-zinc-700">
        Open source · No subscription · AI runs locally on your device
      </footer>
    </main>
  );
}
