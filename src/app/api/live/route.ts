// Directs en cours sur les chaînes suivies (voir lib/live.ts), pour le bandeau « En direct ».
import { liveStreams } from "@/lib/live";

export async function GET() {
  return Response.json({ live: await liveStreams() });
}
