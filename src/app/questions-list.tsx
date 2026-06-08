"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type Question = {
  id: string;
  body: string;
  votes: number;
};

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
}: {
  initialQuestions: Question[];
  initialHasMore: boolean;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  // Debounced search: wait 300ms after typing stops; each keystroke cancels
  // the previous timer, so "deploying" fires one request, not nine.
  useEffect(() => {
    const id = setTimeout(async () => {
      const url = query
        ? `/api/questions?q=${encodeURIComponent(query)}`
        : `/api/questions`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.questions);
      setHasMore(data.hasMore);
    }, 300);

    return () => clearTimeout(id); // cancel the pending timer on each keystroke
  }, [query]);

  async function submit() {
    if (!draft.trim()) return;

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    const created = await res.json();

    setQuestions((qs) => [{ ...created, votes: 0 }, ...qs]);
    setDraft("");
  }

  async function upvote(id: string) {
    // optimistic: assume success, update the UI now
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, votes: q.votes + 1 } : q))
    );

    const res = await fetch(`/api/questions/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: getVoterId() }),
    });

    // server said no (already voted) — roll back
    if (!res.ok) {
      setQuestions((qs) =>
        qs.map((q) => (q.id === id ? { ...q, votes: q.votes - 1 } : q))
      );
    }
  }

  async function loadMore() {
    setLoading(true);
    const res = await fetch(`/api/questions?offset=${questions.length}`);
    const data = await res.json();
    setQuestions((qs) => [...qs, ...data.questions]);
    setHasMore(data.hasMore);
    setLoading(false);
  }

  async function improveDraft() {
    if (!draft.trim()) return;
    setImproving(true);
    try {
      const res = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft }),
      });
      const data = await res.json();
      if (data?.improved) setDraft(data.improved);
    } catch (e) {
      // ignore
    }
    setImproving(false);
  }

  function highlightRandom() {
    if (questions.length === 0) return;
    const idx = Math.floor(Math.random() * questions.length);
    setHighlightedId(questions[idx].id);
    // remove highlight after a few seconds
    setTimeout(() => setHighlightedId(null), 5000);
  }

  return (
    <div className="space-y-5">
      {/* Ask box */}
      <div className="relative shadow-sm transition-shadow focus-within:shadow-md rounded-full bg-surface p-1.5 ring-1 ring-black/5 flex items-center">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ask the speaker a question..."
          className="flex-1 rounded-full bg-transparent px-5 py-3 text-sm outline-none placeholder:text-muted focus:ring-0"
        />
        <button
          onClick={improveDraft}
          disabled={Boolean(!draft.trim() || improving)}
          className="mr-2 rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground ring-1 ring-black/5 hover:bg-background/90 disabled:opacity-50"
        >
          {improving ? "Improving…" : "Improve"}
        </button>
        <button
          onClick={submit}
          disabled={Boolean(!draft.trim())}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-strong disabled:opacity-50 disabled:hover:bg-brand"
        >
          Send
        </button>
      </div>

      {/* Search + hydration status */}
      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="w-full flex-1 rounded-xl border-none bg-surface px-4 py-2.5 text-sm shadow-sm ring-1 ring-black/5 outline-none placeholder:text-muted focus:ring-2 focus:ring-brand"
        />
        <button onClick={highlightRandom} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">Highlight</button>
        <span className="shrink-0 text-xs text-muted">
          {hydrated ? "Interactive ✓" : "Loading interactivity…"}
        </span>
      </div>

      {/* Questions */}
      <ul className="space-y-4">
        {questions.map((q) => (
          <li
            key={q.id}
            className={`flex items-start gap-4 rounded-2xl p-5 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md hover:ring-black/10 ${highlightedId === q.id ? 'ring-2 ring-brand-strong scale-[1.01] bg-brand-soft/10' : 'bg-surface'}`}
          >
            <button
              onClick={() => upvote(q.id)}
              className="group flex shrink-0 flex-col items-center gap-1 rounded-xl bg-background px-3 py-2 text-muted transition-colors hover:bg-brand hover:text-white"
            >
              <span className="text-xs transition-transform group-hover:-translate-y-0.5">▲</span>
              <span className="text-sm font-bold leading-none tabular-nums">
                {q.votes}
              </span>
            </button>
            <div className="min-w-0 flex-1 pt-1">
              <p className="leading-relaxed text-foreground font-medium">{q.body}</p>
            </div>
          </li>
        ))}
      </ul>

      {questions.length === 0 && (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted">
          No questions yet — be the first to ask.
        </p>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={Boolean(loading)}
            className="rounded-xl border bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
