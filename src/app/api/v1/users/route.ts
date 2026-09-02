import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { user } from "@/db/schema";
import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  requireApiActor,
} from "@/lib/api";
import { auth } from "@/lib/auth";
import { appRoles } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/audit";

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  role: z.enum(appRoles).default("viewer"),
});

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    await requireApiActor(request, "manageUsers");
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(asc(user.name));
    return Response.json({ users, requestId });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    assertSameOrigin(request);
    const actor = await requireApiActor(request, "manageUsers");
    const parsed = createUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        400,
        "INVALID_USER",
        "Kullanıcı bilgileri geçerli değil.",
      );
    }

    const result = await auth.api.createUser({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });
    await db
      .update(user)
      .set({ role: parsed.data.role })
      .where(eq(user.id, result.user.id));
    await writeAudit({
      actorId: actor.id,
      eventType: "user.created",
      payload: {
        userId: result.user.id,
        email: parsed.data.email,
        role: parsed.data.role,
      },
      requestId,
    });

    return Response.json(
      {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: parsed.data.role,
        },
        requestId,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
