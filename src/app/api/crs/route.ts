import { NextRequest, NextResponse } from "next/server";
import { calculateCrs, type CrsInput } from "@/lib/crs";

function isValidLanguageScores(obj: unknown): obj is { reading_clb: number; writing_clb: number; speaking_clb: number; listening_clb: number } {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.reading_clb === "number" &&
    typeof o.writing_clb === "number" &&
    typeof o.speaking_clb === "number" &&
    typeof o.listening_clb === "number"
  );
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request: body must be valid JSON" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request: body must be a JSON object" },
        { status: 400 }
      );
    }

    const input = body as CrsInput;

    if (typeof input.has_spouse !== "boolean") {
      return NextResponse.json(
        { error: "Invalid input: has_spouse must be a boolean" },
        { status: 400 }
      );
    }
    if (typeof input.age !== "number" || input.age < 0 || input.age > 100) {
      return NextResponse.json(
        { error: "Invalid input: age must be a number between 0 and 100" },
        { status: 400 }
      );
    }
    if (!isValidLanguageScores(input.first_official_language)) {
      return NextResponse.json(
        { error: "Invalid input: first_official_language must have reading_clb, writing_clb, speaking_clb, listening_clb (numbers)" },
        { status: 400 }
      );
    }
    if (!input.french || typeof input.french !== "object") {
      return NextResponse.json(
        { error: "Invalid input: french is required" },
        { status: 400 }
      );
    }
    if (!input.education_in_canada || typeof input.education_in_canada !== "object") {
      return NextResponse.json(
        { error: "Invalid input: education_in_canada is required" },
        { status: 400 }
      );
    }

    const output = calculateCrs(input);
    return NextResponse.json(output);
  } catch (err) {
    console.error("CRS API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to calculate CRS" },
      { status: 500 }
    );
  }
}
