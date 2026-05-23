import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

type StoryRequest = {
  idioms?: string[];
  information?: string;
};

function removeAsterisks(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

function parseStory(text: string): { storyFa: string; storyEn: string } {
  let storyFa = "";
  let storyEn = "";
  let faMatch = text.match(/Persian:?\s*\[FA\]([\s\S]*?)English:?/i);
  let enMatch = text.match(/English:?\s*\[EN\]([\s\S]*)/i);

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
    storyFa: removeAsterisks(storyFa),
    storyEn: removeAsterisks(storyEn),
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        status: false,
        error: "Story generation is not configured yet. Add GEMINI_API_KEY to enable AI stories.",
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

  const prompt = `Write a story using these idioms for a language learner. First, provide the story in Persian (Farsi) and then its English translation, each clearly labeled.
In both the Persian and English stories, put the exact translation or equivalent of each idiom in [brackets] so it can be highlighted.
Idioms: ${idioms.join(" - ")}.${body.information ? `\nAdditional information: ${body.information}` : ""}
Output format:
Persian:
[FA]
English:
[EN]`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const story = removeAsterisks(response.text || "No story generated.");
    const parsed = parseStory(story);

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
