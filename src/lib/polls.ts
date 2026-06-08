import { supabase } from "@/lib/supabase";

export async function getLatestPoll() {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, question, created_at, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pollError) {
    // If the table doesn't exist yet, gracefully return null
    if (pollError.code === "PGRST204" || pollError.message.includes("schema cache") || pollError.message.includes("relation \"public.polls\" does not exist")) {
      console.warn("Polls table not found. Did you run polls_schema.sql?");
      return null;
    }
    throw new Error(pollError.message);
  }
  
  if (!poll) return null;

  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .select("id, text")
    .eq("poll_id", poll.id)
    .order("created_at", { ascending: true });

  if (optionsError) throw new Error(optionsError.message);

  const { data: votes, error: votesError } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", poll.id);

  if (votesError) throw new Error(votesError.message);

  const voteCounts: Record<string, number> = {};
  options?.forEach((opt) => (voteCounts[opt.id] = 0));
  votes?.forEach((vote) => {
    if (voteCounts[vote.option_id] !== undefined) {
      voteCounts[vote.option_id]++;
    }
  });

  return {
    ...poll,
    options: options?.map((opt) => ({
      ...opt,
      votes: voteCounts[opt.id] || 0,
    })),
    totalVotes: votes?.length || 0,
  };
}

export async function createPoll(question: string, options: string[]) {
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({ question })
    .select()
    .single();

  if (pollError) throw new Error(pollError.message);

  const optionsToInsert = options.map((text) => ({ poll_id: poll.id, text }));
  const { error: optionsError } = await supabase
    .from("poll_options")
    .insert(optionsToInsert);

  if (optionsError) throw new Error(optionsError.message);

  return poll;
}
