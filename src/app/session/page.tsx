import QuestionsList from "../questions-list";
import PollsList from "../polls-list";
import { getQuestionsPage } from "@/lib/questions";
import { getLatestPoll } from "@/lib/polls";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function SessionPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "qna" } = await searchParams;

  const { questions, hasMore } = await getQuestionsPage(0, PAGE_SIZE);
  const initialPoll = await getLatestPoll();

  return (
    <div className="min-h-full pb-20">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-brand to-brand-strong py-6 px-5 text-white shadow-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Live Session — Townhall</h1>
            <p className="text-sm font-medium text-white/90 mt-0.5">Engage your audience in real time with Q&amp;A and polls.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-sm">
              <span className="font-semibold">Host: Alex</span>
              <span className="text-xs text-white/80">#TOWNhall2026</span>
            </div>

            <button className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold hover:backdrop-blur-md">
              Share
            </button>

            <button className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold hover:backdrop-blur-md">
              Host Controls
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pt-8">
        {/* Segmented Control Tabs */}
        <div className="mb-8 flex rounded-2xl bg-surface p-1 shadow-sm ring-1 ring-black/5">
          <a
            href="?tab=qna"
            className={`flex-1 rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${tab === 'qna' ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted hover:text-foreground hover:bg-background/50'}`}
          >
            Q&amp;A
          </a>
          <a
            href="?tab=polls"
            className={`flex-1 rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${tab === 'polls' ? 'bg-background text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted hover:text-foreground hover:bg-background/50'}`}
          >
            Polls
          </a>
        </div>

        {tab === 'qna' ? (
          <QuestionsList initialQuestions={questions} initialHasMore={hasMore} />
        ) : (
          <PollsList initialPoll={initialPoll} />
        )}
      </main>
    </div>
  );
}
