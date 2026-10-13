import { createClient } from "@sanity/client"

export const sanityProjectId = "3kl4ln37"
export const sanityDataset = "production"

export const sanityClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: "2026-10-13",
  useCdn: true,
})

export const sanityWriteClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: "2026-10-13",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
  perspective: "drafts",
})

export type SanityBlogPost = {
  _id: string
  title: string
  slug: string
  excerpt?: string
  body?: unknown[]
  publishedAt?: string
  sourceUrl?: string
}

export async function getSanityPosts(limit = 6) {
  return sanityClient.fetch<SanityBlogPost[]>(
    `*[_type == "blogPost" && defined(slug) && (!defined(publishedAt) || publishedAt <= now())] | order(publishedAt desc)[0...$limit]{_id,title,slug,excerpt,body,publishedAt,sourceUrl}`,
    { limit },
    { next: { revalidate: 300, tags: ["blog-posts"] } },
  )
}

export async function getSanityPost(slug: string) {
  return sanityClient.fetch<SanityBlogPost | null>(
    `*[_type == "blogPost" && slug == $slug][0]{_id,title,slug,excerpt,body,publishedAt,sourceUrl}`,
    { slug },
    { next: { revalidate: 300, tags: ["blog-posts", `blog-post-${slug}`] } },
  )
}
