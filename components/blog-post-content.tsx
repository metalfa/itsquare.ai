"use client"

import { PortableText, type PortableTextComponents } from "@portabletext/react"

type BlogPostContentProps = { value: unknown }

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="mt-16 scroll-mt-24 border-t border-border pt-8 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-10 text-xl font-semibold tracking-tight text-foreground md:text-2xl">{children}</h3>,
    normal: ({ children }) => <p className="text-pretty text-lg leading-8 text-foreground/80 md:text-xl md:leading-9">{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className="my-6 list-disc space-y-3 pl-6 text-lg leading-8 text-foreground/80">{children}</ul>,
    number: ({ children }) => <ol className="my-6 list-decimal space-y-3 pl-6 text-lg leading-8 text-foreground/80">{children}</ol>,
  },
  marks: {
    link: ({ children, value }) => <a href={value?.href} className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">{children}</a>,
  },
}

export function BlogPostContent({ value }: BlogPostContentProps) {
  return <div className="space-y-6"><PortableText value={value as never} components={components} /></div>
}
