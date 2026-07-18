import CardsClient, { type StudySearchParams } from "./cards-client";
import { loadBook, loadLevelSummaries } from "@/lib/idiom-data.server";
import { isLevelId } from "@/lib/idioms";
import type { LevelId } from "@/types/types";

type CardsPageProps = {
  searchParams?: Promise<StudySearchParams>;
};

export default async function CardsPage({ searchParams }: CardsPageProps): Promise<React.ReactElement> {
  const resolvedSearchParams = await searchParams;
  const rawLevel = Array.isArray(resolvedSearchParams?.level) ? resolvedSearchParams.level[0] : resolvedSearchParams?.level;
  const initialLevel: LevelId = isLevelId(rawLevel) ? rawLevel : "elementary";
  const [initialBook, levelSummaries] = await Promise.all([loadBook(initialLevel), loadLevelSummaries()]);

  return (
    <CardsClient
      initialBook={initialBook}
      initialLevel={initialLevel}
      levelSummaries={levelSummaries}
      searchParams={resolvedSearchParams}
    />
  );
}
