export const blogPost = {
  name: "blogPost",
  title: "Blog post",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: (Rule: { required: () => unknown }) => Rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 } },
    { name: "excerpt", title: "Excerpt", type: "text", rows: 3 },
    { name: "body", title: "Body", type: "array", of: [{ type: "block" }] },
    { name: "featuredImage", title: "Featured image", type: "image", options: { hotspot: true } },
    { name: "publishedAt", title: "Published at", type: "datetime" },
    { name: "source", title: "Source", type: "string", initialValue: "wordpress" },
    { name: "sourceId", title: "Source ID", type: "string" },
    { name: "sourceUrl", title: "Source URL", type: "url" },
  ],
}
