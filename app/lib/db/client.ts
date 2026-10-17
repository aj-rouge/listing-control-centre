import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

export async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as any).DB as D1Database | undefined;
  if (!db) throw new Error("D1 binding 'DB' is missing from Cloudflare env.");
  return db;
}
