import { getLatestPoll, createPoll } from "@/lib/polls";

export async function GET() {
  try {
    const poll = await getLatestPoll();
    return Response.json({ poll });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { question, options } = await req.json();

    if (!question || !options || options.length < 2) {
      return Response.json({ error: "Invalid poll data" }, { status: 400 });
    }

    const poll = await createPoll(question, options);
    return Response.json(poll);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
