import { LandingHeader } from "@/components/landing/LandingHeader";
import { HomeIdiomSearch, type HomeIdiomSearchItem } from "@/components/landing/HomeIdiomSearch";
import { getAllIdioms } from "@/lib/idioms";

const githubProfileUrl = "https://github.com/abolfazlj10";
const githubRepoUrl = "https://github.com/abolfazlj10/essential-idioms-in-english";
const githubAvatarUrl = `${githubProfileUrl}.png?size=96`;

const allIdioms = getAllIdioms();
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

const navItems = [
  { href: "/cards", label: "Cards" },
  { href: "/book", label: "Lessons" },
  { href: "/story", label: "Stories" },
  { href: "/archive", label: "Review" },
];

export default function Home(): React.ReactElement {
  return (
    <LandingHeader
      navItems={navItems}
      githubRepoUrl={githubRepoUrl}
      githubProfileUrl={githubProfileUrl}
      githubAvatarUrl={githubAvatarUrl}
      searchSlot={<HomeIdiomSearch items={homeSearchItems} variant="navbar" />}
    />
  );
}
