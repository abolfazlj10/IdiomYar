import { Archive, Layers, Map } from "lucide-react";
import Link from "next/link";
import { HomeIdiomSearch, type HomeIdiomSearchItem } from "@/components/landing/HomeIdiomSearch";
import { loadBooks } from "@/lib/idiom-data.server";
import { getAllIdioms } from "@/lib/idioms";

const githubAccount = {
  name: "Abolfazl",
  profileUrl: "https://github.com/abolfazlj10",
};

const tools = [
  { href: "/book", label: "Lessons", icon: Map, description: "Study lessons and generate stories" },
  { href: "/cards", label: "Flash Cards", icon: Layers, description: "Study with interactive cards" },
  { href: "/archive", label: "Review", icon: Archive, description: "Review your saved idioms" },
];

export default async function Home(): Promise<React.ReactElement> {
  const allIdioms = getAllIdioms(await loadBooks());
  const homeSearchItems = allIdioms.map((idiom) => ({
    id: idiom.id,
    englishPhrase: idiom.english_phrase,
    persianPhrase: idiom.persian_phrase_meaning ?? null,
    level: idiom.level,
    levelLabel: idiom.levelLabel,
    lessonNumber: idiom.lessonNumber,
    href: `/book?level=${idiom.level}&lesson=${idiom.lessonNumber}&idiom=${encodeURIComponent(idiom.id)}`,
    searchText: [
      idiom.english_phrase,
      idiom.persian_phrase_meaning,
      idiom.english_definition,
      idiom.persian_definition_meaning,
      idiom.english_explanation,
      idiom.persian_explanation_meaning,
      idiom.levelLabel,
      `lesson ${idiom.lessonNumber}`,
      String(idiom.lessonNumber),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  })) satisfies HomeIdiomSearchItem[];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-14 pb-20 pt-8">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight max-mobile:text-3xl">IdiomYar</h1>
        <p className="mt-2 text-sm font-semibold text-gray-500">Idioms that stay with you</p>
      </div>

      <div className="w-full max-w-2xl">
        <HomeIdiomSearch items={homeSearchItems} />
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-3 mobile:grid-cols-3 mobile:gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all duration-150 hover:-translate-y-1 hover:border-primaryColor/40 hover:shadow-md"
          >
            <tool.icon className="size-7 text-primaryColor" aria-hidden="true" />
            <span className="text-sm font-black">{tool.label}</span>
            <span className="text-xs font-semibold text-gray-500">{tool.description}</span>
          </Link>
        ))}
      </div>

      <a
        href={githubAccount.profileUrl}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 left-4 z-40 text-xs font-bold text-gray-500 transition-colors duration-150 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primaryColor/25"
        aria-label={`Open ${githubAccount.name}'s GitHub profile`}
      >
        Made by {githubAccount.name}
      </a>
    </div>
  );
}
