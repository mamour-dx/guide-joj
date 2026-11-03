import type { MetadataRoute } from "next";
import { meta, sessions, venues } from "@/lib/data";
import { absoluteUrl as url } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = meta.generatedAt;
  return [
    { url: url("/"), lastModified, changeFrequency: "hourly", priority: 1 },
    { url: url("/programme"), lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: url("/sites"), lastModified, changeFrequency: "daily", priority: 0.7 },
    { url: url("/a-propos"), lastModified, changeFrequency: "monthly", priority: 0.3 },
    ...venues.map((v) => ({ url: url(`/sites/${v.id}`), lastModified, changeFrequency: "daily" as const, priority: 0.6 })),
    ...sessions.map((s) => ({ url: url(`/session/${s.id}`), lastModified, changeFrequency: "daily" as const, priority: 0.5 })),
  ];
}
