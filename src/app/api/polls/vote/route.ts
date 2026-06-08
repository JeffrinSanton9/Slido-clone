import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { pollId, optionId, voterId } = await req.json();

    if (!pollId || !optionId || !voterId) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("poll_votes")
      .insert({ poll_id: pollId, option_id: optionId, voter_id: voterId })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
