import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-surface px-6">
      <div className="max-w-3xl w-full rounded-3xl bg-background p-10 shadow-xl ring-1 ring-black/5">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Townhall Live</h1>
            <p className="mt-1 text-sm text-muted">A live Q&amp;A + polling experience for events and streams.</p>
          </div>
          <div className="flex items-center gap-3">
            <img src="/globe.svg" alt="logo" className="h-10 w-10 rounded-full" />
            <span className="text-xs font-medium text-muted">#TOWNhall2026</span>
          </div>
        </header>

        <main className="space-y-6">
          <p className="text-sm text-muted">Bring your audience closer to the stage — let viewers ask improved questions, upvote the best ones, and participate in live polls. Built with a lightweight server-rendered UI and realtime-feeling client components.</p>

          <ul className="space-y-3 text-sm">
            <li>• Ask questions and have the community upvote the best ones.</li>
            <li>• Launch live polls and view results in real time.</li>
            <li>• Improve question wording with an AI-powered "Improve" button.</li>
            <li>• Surprise feature: highlight a random audience question during the session.</li>
          </ul>

          <div className="pt-4">
            <Link href="/session" className="inline-flex items-center gap-3 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-strong">
              Enter Live Session
            </Link>
            <a href="/session" className="sr-only">Go to session</a>
          </div>

          <footer className="pt-6 text-xs text-muted border-t mt-6 flex items-center justify-between">
            <span>Made for engaging events • Live since 2026</span>
            <div className="flex gap-3">
              <a href="#" className="text-muted hover:text-foreground">Docs</a>
              <a href="#" className="text-muted hover:text-foreground">Privacy</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}