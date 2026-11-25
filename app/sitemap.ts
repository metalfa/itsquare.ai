import type { MetadataRoute } from "next"
import { blogPosts } from "@/lib/blog-posts"

const siteUrl = "https://itsquare.ai"

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/healthcare", "/safe-ai", "/risk-assessment", "/readiness-check", "/partners", "/about", "/blog", "/contact", "/privacy", "/terms"]
  return [
    ...routes.map((route) => ({ url: `${siteUrl}${route}`, changeFrequency: "monthly" as const, priority: route === "" ? 1 : 0.7 })),
    ...blogPosts.map((post) => ({ url: `${siteUrl}/blog/${post.slug}`, changeFrequency: "yearly" as const, priority: 0.6 })),
  ]
}
