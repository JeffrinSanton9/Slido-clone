"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type PollOption = {
  id: string;
  text: string;
  votes: number;
};

type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
};

export default function PollsList({ initialPoll }: { initialPoll: Poll | null }) {
  const [poll, setPoll] = useState<Poll | null>(initialPoll);
  const [votedPolls, setVotedPolls] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);

  useEffect(() => {
    const saved = localStorage.getItem("votedPolls");
    if (saved) {
      setVotedPolls(JSON.parse(saved));
    }
  }, []);

  const refreshPoll = async () => {
    const res = await fetch("/api/polls");
    const data = await res.json();
    if (data.poll) setPoll(data.poll);
  };

  const handleVote = async (optionId: string) => {
    if (!poll) return;

    // optimistic UI
    const updatedOptions = poll.options.map((opt) =>
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );
    setPoll({ ...poll, options: updatedOptions, totalVotes: poll.totalVotes + 1 });
    
    const newVoted = [...votedPolls, poll.id];
    setVotedPolls(newVoted);
    localStorage.setItem("votedPolls", JSON.stringify(newVoted));

    const res = await fetch(`/api/polls/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollId: poll.id, optionId, voterId: getVoterId() }),
    });

    if (!res.ok) {
      // rollback if failed
      refreshPoll();
    }
  };

  const handleCreatePoll = async () => {
    const validOptions = newOptions.filter((o) => o.trim() !== "");
    if (!newQuestion.trim() || validOptions.length < 2) return;

    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQuestion, options: validOptions }),
    });

    if (res.ok) {
      setIsCreating(false);
      setNewQuestion("");
      setNewOptions(["", ""]);
      refreshPoll();
    }
  };

  if (isCreating) {
    return (
      <div className="space-y-5 rounded-3xl bg-surface p-8 shadow-sm ring-1 ring-black/5">
        <h2 className="text-2xl font-bold tracking-tight">Launch a Poll</h2>
        <input
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="What would you like to ask?"
          className="w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-medium outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-brand"
        />
        <div className="space-y-3">
          {newOptions.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={opt}
                onChange={(e) => {
                  const opts = [...newOptions];
                  opts[i] = e.target.value;
                  setNewOptions(opts);
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-2xl bg-background px-5 py-3 text-sm font-medium outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-brand"
              />
              {i >= 2 && (
                <button
                  onClick={() => setNewOptions(newOptions.filter((_, idx) => idx !== i))}
                  className="px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 hover:ring-1 hover:ring-red-100 rounded-2xl transition-all"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setNewOptions([...newOptions, ""])}
          className="text-sm font-semibold text-brand hover:text-brand-strong transition-colors"
        >
          + Add Option
        </button>
        <div className="flex gap-3 pt-6 border-t mt-6">
          <button
            onClick={handleCreatePoll}
            className="rounded-full bg-brand px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-strong hover:shadow"
          >
            Launch Poll
          </button>
          <button
            onClick={() => setIsCreating(false)}
            className="rounded-full px-8 py-3 text-sm font-bold text-muted hover:bg-background ring-1 ring-black/5 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="rounded-full bg-surface px-5 py-2.5 text-sm font-bold text-brand shadow-sm ring-1 ring-black/5 hover:bg-brand-soft transition-all hover:shadow"
        >
          + New Poll
        </button>
      </div>

      {!poll ? (
        <p className="rounded-3xl border border-dashed p-12 text-center text-sm text-muted">
          No active polls right now.
        </p>
      ) : (
        <div className="rounded-3xl bg-surface p-8 shadow-sm ring-1 ring-black/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-brand" />
          <h2 className="text-2xl font-bold mb-8 text-foreground tracking-tight">{poll.question}</h2>
          
          <div className="space-y-4">
            {poll.options.map((opt) => {
              const hasVoted = votedPolls.includes(poll.id);
              const percentage = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
              
              if (hasVoted) {
                return (
                  <div key={opt.id} className="relative overflow-hidden rounded-2xl bg-background ring-1 ring-black/5">
                    <div 
                      className="absolute inset-y-0 left-0 bg-brand-soft transition-all duration-1000 ease-out" 
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between px-6 py-4">
                      <span className="text-[15px] font-semibold text-foreground">{opt.text}</span>
                      <span className="text-[15px] font-bold text-brand-strong">{percentage}%</span>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleVote(opt.id)}
                  className="w-full rounded-2xl border-2 border-transparent bg-background px-6 py-4 text-left text-[15px] font-semibold text-foreground transition-all ring-1 ring-black/5 hover:border-brand hover:bg-brand-soft/30 hover:shadow-sm"
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex justify-end">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-muted bg-background px-3 py-1.5 rounded-full ring-1 ring-black/5">
              <span className="flex h-2 w-2 rounded-full bg-brand"></span>
              {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
