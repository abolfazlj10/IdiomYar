import { NextResponse } from "next/server";
import { loadBook } from "@/lib/idiom-data.server";
import { isLevelId } from "@/lib/idioms";

type LevelRouteProps = {
  params: Promise<{ level: string }>;
};

export async function GET(_request: Request, { params }: LevelRouteProps) {
  const { level } = await params;

  if (!isLevelId(level)) {
    return NextResponse.json({ error: "Unknown idiom level." }, { status: 404 });
  }

  return NextResponse.json(await loadBook(level));
}
