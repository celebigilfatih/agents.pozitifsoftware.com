import { NextResponse } from "next/server";

import { pool } from "@/db";

export async function GET() {
  try {
    await pool.query("select 1");
    return NextResponse.json({ status: "ready", database: "ready" });
  } catch {
    return NextResponse.json(
      { status: "not_ready", database: "unavailable" },
      { status: 503 },
    );
  }
}
