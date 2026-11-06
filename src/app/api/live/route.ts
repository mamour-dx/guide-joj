// Direct en cours sur la chaîne suivie la plus prioritaire (voir lib/live.ts), ou null.
// `check` (clé présente, sources joignables, réponse de l'API) sert à diagnostiquer en production.
import { currentLive } from "@/lib/live";

export async function GET() {
  return Response.json(await currentLive());
}
