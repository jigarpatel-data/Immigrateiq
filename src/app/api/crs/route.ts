import { NextRequest, NextResponse } from "next/server";
import { calculateCrs, type CrsInput } from "@/lib/crs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
    if (!input.first_official_language || typeof input.first_official_language !== "object") {
      return NextResponse.json(
        { error: "Invalid input: first_official_language is required" },
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
