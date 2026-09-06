import { revalidatePath } from "next/cache";

import { getSite, mutateSite } from "@/lib/site";
import type { LandingRole, LandingRoleContent } from "@/lib/site-types";
import { LANDING_EDITABLE, LANDING_ROLES } from "@/lib/site-types";
import { writesBlocked } from "../../../_lib/guard";
import { fail, ok, serverError } from "../../../_lib/respond";

export const dynamic = "force-dynamic";

// `params` is a Promise in this Next version and must be awaited.
type Context = { params: Promise<{ role: string }> };

function isRole(value: string): value is LandingRole {
  return (LANDING_ROLES as readonly string[]).includes(value);
}

/** GET /api/site/landing/:role — landing copy for one audience. */
export async function GET(_request: Request, { params }: Context) {
  try {
    const { role } = await params;
    if (!isRole(role)) {
      return fail(404, `Unknown role "${role}"`, { roles: LANDING_ROLES });
    }

    const site = await getSite();
    return ok({
      role,
      content: site.landing.roles[role],
      introMinimizeDelayMs: site.landing.introMinimizeDelayMs,
      stripeStaggerSeconds: site.landing.stripeStaggerSeconds,
    });
  } catch (cause) {
    return serverError(cause);
  }
}

/**
 * PUT /api/site/landing/:role — partial update of one audience's copy.
 *
 * Accepts any subset of heroSub, heroTitle, heroDesc, bannerHeadline,
 * bannerDesc, videos. The whole store is validated before it hits disk.
 */
export async function PUT(request: Request, { params }: Context) {
  const blocked = writesBlocked();
  if (blocked) return blocked;

  try {
    const { role } = await params;
    if (!isRole(role)) {
      return fail(404, `Unknown role "${role}"`, { roles: LANDING_ROLES });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400, "Body must be valid JSON");
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return fail(400, "Body must be a JSON object");
    }

    const patch = body as Record<string, unknown>;
    const unknownKeys = Object.keys(patch).filter(
      (key) => !(LANDING_EDITABLE as readonly string[]).includes(key),
    );
    if (unknownKeys.length > 0) {
      return fail(400, `Unsupported field(s): ${unknownKeys.join(", ")}`, {
        editable: LANDING_EDITABLE,
      });
    }

    // Read-modify-write inside the store lock. Note this is a shallow merge:
    // `heroTitle` is replaced wholesale, never deep-merged.
    const saved = await mutateSite((current) => {
      const updated: LandingRoleContent = {
        ...current.landing.roles[role],
        ...(patch as Partial<LandingRoleContent>),
      };

      return {
        ...current,
        landing: {
          ...current.landing,
          roles: { ...current.landing.roles, [role]: updated },
        },
      };
    });

    // The landing page renders this copy.
    revalidatePath("/");

    return ok({ role, content: saved.landing.roles[role] });
  } catch (cause) {
    return serverError(cause);
  }
}
