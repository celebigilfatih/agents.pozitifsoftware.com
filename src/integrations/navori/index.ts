import { env } from "@/env";
import { MockNavoriAdapter } from "@/integrations/navori/mock-adapter";
import { RealNavoriAdapter } from "@/integrations/navori/real-adapter";
import type { NavoriAdapter } from "@/integrations/navori/types";

let adapter: NavoriAdapter | null = null;

export function getNavoriAdapter(): NavoriAdapter {
  adapter ??= env.NAVORI_API_ENABLED
    ? new RealNavoriAdapter()
    : new MockNavoriAdapter();
  return adapter;
}

export type * from "@/integrations/navori/types";
