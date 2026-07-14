import Groq from "groq-sdk";
import { NextResponse } from "next/server";

type StoryRequest = {
  idioms?: string[];
  information?: string;
};

const DEFAULT_STORY_MODEL = "llama-3.1-8b-instant";
const MAX_IDIOMS_PER_STORY = 12;
const STORY_MODEL = process.env.GROQ_STORY_MODEL ?? DEFAULT_STORY_MODEL;
const STORY_TIMEOUT_MS = getPositiveInteger(process.env.GROQ_STORY_TIMEOUT_MS, 45_000);
const STORY_MAX_COMPLETION_TOKENS = getPositiveInteger(process.env.GROQ_STORY_MAX_COMPLETION_TOKENS, 900);
const STORY_JSON_EXAMPLE = `{
  "storyFa": [
    "پاراگراف فارسی اول با ترجمه طبیعی عبارت مشخص‌شده.",
    "پاراگراف فارسی دوم با ترجمه طبیعی عبارت مشخص‌شده."
  ],
  "storyEn": [
    "First English paragraph with the [selected idiom].",
    "Second English paragraph with the [selected idiom]."
  ]
}`;

function getPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

function removeAsterisks(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

function normalizeStoryText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join("\n\n");
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

function parseStructuredStory(text: string): { storyFa: string; storyEn: string } {
  try {
    const data = JSON.parse(extractJsonObject(text)) as Record<string, unknown>;
    const structured = {
      storyFa: removeAsterisks(normalizeStoryText(data.storyFa)),
      storyEn: removeAsterisks(normalizeStoryText(data.storyEn)),
    };

    return structured.storyFa && structured.storyEn ? structured : parseStory(text);
  } catch {
    return parseStory(text);
  }
}

function parseStory(text: string): { storyFa: string; storyEn: string } {
  let storyFa = "";
  let storyEn = "";
  let faMatch = text.match(/(?:Persian|Farsi):?\s*(?:\[FA\])?\s*([\s\S]*?)English:?\s*(?:\[EN\])?/i);
  let enMatch = text.match(/English:?\s*(?:\[EN\])?\s*([\s\S]*)/i);

  if (!faMatch || !enMatch) {
    faMatch = text.match(/\[FA\]([\s\S]*?)\[EN\]/i);
    enMatch = text.match(/\[EN\]([\s\S]*)/i);
  }

  if (!faMatch || !enMatch) {
    const faIndex = text.indexOf("[FA]");
    const enIndex = text.indexOf("[EN]");

    if (faIndex !== -1 && enIndex !== -1) {
      storyFa = text.substring(faIndex + 4, enIndex).trim();
      storyEn = text.substring(enIndex + 4).trim();
    }
  } else {
    storyFa = faMatch[1]?.trim() || "";
    storyEn = enMatch[1]?.trim() || "";
  }

  return {
    storyFa: removeAsterisks(storyFa).replace(/^(Persian|Farsi):?\s*/i, "").trim(),
    storyEn: removeAsterisks(storyEn).replace(/^English:?\s*/i, "").trim(),
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        status: false,
        error: "Story generation is not configured yet. Add GROQ_API_KEY to enable AI stories.",
      },
      { status: 500 }
    );
  }

  const body = (await request.json()) as StoryRequest;
  const idioms = Array.from(new Set((body.idioms ?? []).map((idiom) => idiom.trim()).filter(Boolean)));
  const additionalInformation = body.information?.trim().slice(0, 1000) ?? "";

  if (!idioms.length) {
    return NextResponse.json(
      {
        status: false,
        error: "Select at least one idiom before creating a story.",
      },
      { status: 400 }
    );
  }

  if (idioms.length > MAX_IDIOMS_PER_STORY) {
    return NextResponse.json(
      {
        status: false,
        error: `Select up to ${MAX_IDIOMS_PER_STORY} idioms for one story.`,
      },
      { status: 400 }
    );
  }

  const prompt = `Write a short bilingual story for an English learner who speaks Persian.

Return ONLY valid JSON in this exact shape:
${STORY_JSON_EXAMPLE}

Rules:
- Write exactly 3 aligned paragraphs in storyFa and exactly 3 aligned paragraphs in storyEn.
- Use every idiom naturally and exactly once in the English story.
- Put 3 to 4 selected idioms in each English paragraph when possible.
- The Persian and English arrays must have the same number of paragraphs.
- Keep paragraphs aligned by meaning: storyFa[0] should match storyEn[0], storyFa[1] should match storyEn[1], and so on.
- Each paragraph should be 1 to 2 short sentences.
- Keep the full English story under 220 words and the full Persian story under 220 words.
- Put each selected English idiom in [brackets] in the English story.
- Do not use brackets in the Persian story. Write the Persian translation naturally.
- Do not include labels like Persian, English, FA, EN, markdown, comments, or explanation outside the JSON.

Idioms: ${idioms.join(" - ")}.${additionalInformation ? `\nAdditional information: ${additionalInformation}` : ""}`;

  const startedAt = Date.now();

  try {
    const groq = new Groq({
      apiKey,
      maxRetries: 0,
      timeout: STORY_TIMEOUT_MS,
    });
    const completion = await groq.chat.completions.create({
      model: STORY_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You create short, clear bilingual learning stories. Follow the requested output format exactly and do not add markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: STORY_MAX_COMPLETION_TOKENS,
      response_format: { type: "json_object" },
      temperature: 0.4,
    });
    const durationMs = Date.now() - startedAt;
    const choice = completion.choices[0];

    if (choice?.finish_reason === "length") {
      return NextResponse.json(
        {
          status: false,
          error: `Story generation reached the ${STORY_MAX_COMPLETION_TOKENS} token limit. Increase GROQ_STORY_MAX_COMPLETION_TOKENS or reduce the story length.`,
          meta: {
            durationMs,
            maxCompletionTokens: STORY_MAX_COMPLETION_TOKENS,
            model: STORY_MODEL,
          },
        },
        { status: 500 }
      );
    }

    const generatedText = removeAsterisks(choice?.message?.content || "No story generated.");
    const parsed = parseStructuredStory(generatedText);
    const story =
      parsed.storyFa && parsed.storyEn
        ? `Persian:\n[FA]\n${parsed.storyFa}\n\nEnglish:\n[EN]\n${parsed.storyEn}`
        : generatedText;

    console.info("[story] generated", {
      durationMs,
      idiomCount: idioms.length,
      maxCompletionTokens: STORY_MAX_COMPLETION_TOKENS,
      model: STORY_MODEL,
    });

    return NextResponse.json({
      status: true,
      story,
      ...parsed,
      meta: {
        durationMs,
        maxCompletionTokens: STORY_MAX_COMPLETION_TOKENS,
        model: STORY_MODEL,
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : "Unknown story generation error.";
    const isTimeout = /timed?\s*out|timeout/i.test(message) || (error instanceof Error && error.name === "APIConnectionTimeoutError");

    console.error("[story] failed", {
      durationMs,
      error: message,
      idiomCount: idioms.length,
      model: STORY_MODEL,
    });

    return NextResponse.json(
      {
        status: false,
        error: isTimeout
          ? `Story generation took longer than ${Math.round(STORY_TIMEOUT_MS / 1000)} seconds. Try again or set GROQ_STORY_MODEL to a faster model.`
          : message,
        meta: {
          durationMs,
          model: STORY_MODEL,
        },
      },
      { status: 500 }
    );
  }
}
