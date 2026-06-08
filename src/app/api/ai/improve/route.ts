import { NextResponse } from "next/server";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-pro";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "no text provided" }, { status: 400 });

    const API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const DEFAULT_GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const GEMINI_ENDPOINT = process.env.GEMINI_API_ENDPOINT || DEFAULT_GEMINI_ENDPOINT;

    // If there's no API key available, avoid trying the remote call and return a local fallback.
    if (!API_KEY) {
      console.warn("GEMINI_API_KEY not set — using local fallback improvement.");
      const improvedLocal = localImprove(text);
      return NextResponse.json({ improved: improvedLocal, fallback: true });
    }

    // Construct a prompt that asks the model to only return the improved question text
    const prompt = `Improve the clarity, grammar, and conciseness of the following attendee question. Preserve the original meaning and tone. Return only the improved question without extra commentary:\n\n"""${text}"""`;

    // Try calling external AI service. If it fails for any reason, fall back to a local lightweight improvement.
    try {
      const body = {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.2,
        }
      };

      const res = await fetch(`${GEMINI_ENDPOINT}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const textBody = await res.text();

      if (!res.ok) {
        // include remote body for diagnostics in server logs and fall back
        console.error("AI improve remote error", res.status, textBody);
        throw new Error(`remote AI call failed: ${res.status}`);
      }

      let data;
      try {
        data = JSON.parse(textBody);
      } catch (e) {
        // remote returned non-json — treat as raw text
        const improvedRaw = textBody.trim();
        if (improvedRaw) return NextResponse.json({ improved: improvedRaw });
      }

      const improved = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (improved) return NextResponse.json({ improved: String(improved).trim() });

      // If response didn't contain text as expected, log and fall back
      console.error("AI improve unexpected response shape", data);
      throw new Error("unexpected response from AI provider");
    } catch (remoteErr) {
      // remote call failed — create a safe local fallback improvement to avoid 500
      console.warn("Falling back to local improvement due to:", (remoteErr as Error).message);

      const improvedLocal = localImprove(text);
      return NextResponse.json({ improved: improvedLocal, fallback: true });
    }
  } catch (e) {
    console.error("AI improve handler error:", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

function localImprove(input: string) {
  // Very small deterministic improvements: trim, collapse spaces, fix spacing around punctuation,
  // capitalise first letter and ensure punctuation (question mark) at end when appropriate.
  let s = input.replace(/\s+/g, " ").trim();
  // fix common double punctuation
  s = s.replace(/\s+([,.!?;:])/g, "$1");
  // ensure first letter is uppercase
  if (s.length > 0) s = s[0].toUpperCase() + s.slice(1);
  // if it looks like a question but doesn't end with ?, add it
  const interrogatives = ["who", "what", "when", "where", "why", "how", "do", "does", "did", "can", "could", "would", "should", "is", "are", "will", "won't", "shall"];
  const lower = s.toLowerCase();
  const startsWithInterrogative = interrogatives.some(w => lower.startsWith(w + " "));
  if (startsWithInterrogative && !/[?]$/.test(s)) s = s + "?";

  return s;
}
