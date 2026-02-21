import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hemoconnect.vercel.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/forum", "/communities", "/resources", "/login", "/signup"],
        disallow: [
          "/dashboard",
          "/messages",
          "/bookmarks",
          "/profile",
          "/admin",
          "/feedback",
          "/api",
          "/auth-callback",
          "/banned",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
