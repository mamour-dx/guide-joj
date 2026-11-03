import type { MetadataRoute } from "next";
import { absoluteUrl, indexable } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/data/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
