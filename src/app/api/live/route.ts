// Direct en cours sur la chaîne suivie la plus prioritaire (voir lib/live.ts), ou null.
import { currentLive } from "@/lib/live";

export async function GET() {
  return Response.json({ live: await currentLive() });
}
