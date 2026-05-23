import BookClient, { type StudySearchParams } from "./book-client";

type BookPageProps = {
  searchParams?: Promise<StudySearchParams>;
};

export default async function BookPage({ searchParams }: BookPageProps): Promise<React.ReactElement> {
  return <BookClient searchParams={await searchParams} />;
}
