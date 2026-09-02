import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(request: Request) {
  if (new URL(request.url).pathname.endsWith("/sign-up/email")) {
    return NextResponse.json(
      {
        code: "SELF_REGISTRATION_DISABLED",
        message: "Kullanıcıları yalnızca Admin oluşturabilir.",
      },
      { status: 403 },
    );
  }
  return handler.POST(request);
}
