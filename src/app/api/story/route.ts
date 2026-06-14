import Groq from "groq-sdk";
import { NextResponse } from "next/server";

type StoryRequest = {
  idioms?: string[];
  information?: string;
};

const STORY_MODEL = "llama-3.3-70b-versatile";
const STORY_JSON_EXAMPLE = `{
  "storyFa": [
    "پاراگراف فارسی اول با [عبارت مشخص‌شده].",
    "پاراگراف فارسی دوم با [عبارت مشخص‌شده]."
  ],
  "storyEn": [
    "First English paragraph with the [selected idiom].",
    "Second English paragraph with the [selected idiom]."
  ]
}`;

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
  const idioms = body.idioms?.filter(Boolean) ?? [];

  if (!idioms.length) {
    return NextResponse.json(
      {
        status: false,
        error: "Select at least one idiom before creating a story.",
      },
      { status: 400 }
    );
  }

  const prompt = `Write a short bilingual story for an English learner who speaks Persian.

Return ONLY valid JSON in this exact shape:
${STORY_JSON_EXAMPLE}

Rules:
- Use every idiom naturally in the story.
- The Persian and English arrays must have the same number of paragraphs.
- Keep paragraphs aligned by meaning: storyFa[0] should match storyEn[0], storyFa[1] should match storyEn[1], and so on.
- Each paragraph should be 1 to 3 short sentences.
- Put each selected English idiom in [brackets] in the English story.
- Put the Persian equivalent or natural translation of each idiom in [brackets] in the Persian story.
- Do not include labels like Persian, English, FA, EN, markdown, comments, or explanation outside the JSON.

Idioms: ${idioms.join(" - ")}.${body.information ? `\nAdditional information: ${body.information}` : ""}`;

  try {
    const groq = new Groq({ apiKey });
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
    });
    const generatedText = removeAsterisks(completion.choices[0]?.message?.content || "No story generated.");
    const parsed = parseStructuredStory(generatedText);
    const story =
      parsed.storyFa && parsed.storyEn
        ? `Persian:\n[FA]\n${parsed.storyFa}\n\nEnglish:\n[EN]\n${parsed.storyEn}`
        : generatedText;

    return NextResponse.json({
      status: true,
      story,
      ...parsed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        error: error instanceof Error ? error.message : "Unknown story generation error.",
      },
      { status: 500 }
    );
  }
}
