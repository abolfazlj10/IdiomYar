import CardsClient, { type StudySearchParams } from "./cards-client";

type CardsPageProps = {
  searchParams?: Promise<StudySearchParams>;
};

export default async function CardsPage({ searchParams }: CardsPageProps): Promise<React.ReactElement> {
  return <CardsClient searchParams={await searchParams} />;
}
