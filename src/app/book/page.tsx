import BookClient, { type StudySearchParams } from "./book-client";
import { loadBook, loadLevelSummaries } from "@/lib/idiom-data.server";
import { isLevelId } from "@/lib/idioms";
import type { LevelId } from "@/types/types";

type BookPageProps = {
  searchParams?: Promise<StudySearchParams>;
};

export default async function BookPage({ searchParams }: BookPageProps): Promise<React.ReactElement> {
  const resolvedSearchParams = await searchParams;
  const rawLevel = Array.isArray(resolvedSearchParams?.level) ? resolvedSearchParams.level[0] : resolvedSearchParams?.level;
  const rawIdiom = Array.isArray(resolvedSearchParams?.idiom) ? resolvedSearchParams.idiom[0] : resolvedSearchParams?.idiom;
  let idiomLevel: string | undefined;

  try {
    idiomLevel = rawIdiom ? decodeURIComponent(rawIdiom).split(":", 1)[0] : undefined;
  } catch {
    idiomLevel = undefined;
  }

  const initialLevel: LevelId = isLevelId(idiomLevel) ? idiomLevel : isLevelId(rawLevel) ? rawLevel : "elementary";
  const [initialBook, levelSummaries] = await Promise.all([loadBook(initialLevel), loadLevelSummaries()]);

  return (
    <BookClient
      initialBook={initialBook}
      initialLevel={initialLevel}
      levelSummaries={levelSummaries}
      searchParams={resolvedSearchParams}
    />
  );
}
