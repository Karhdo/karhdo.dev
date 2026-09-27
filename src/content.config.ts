import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Mirrors v1 `contentlayer.config.ts`, so frontmatter migrates 1:1.
 * The glob loader's entry `id` is the file name without extension, i.e. the v1 slug:
 * `/blog/{id}` keeps every v1 post URL.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    lastmod: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    summary: z.string().optional(),
    images: z.union([z.string(), z.array(z.string())]).optional(),
    authors: z.array(z.string()).default(['default']),
    layout: z.enum(['PostLayout', 'PostSimple', 'PostBanner']).optional(),
    bibliography: z.string().optional(),
    canonicalUrl: z.url().optional(),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
    avatar: z.string().optional(),
    occupation: z.string().optional(),
    company: z.string().optional(),
    email: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    // Never set `layout:` in MDX frontmatter: Astro MDX treats it as a layout import (it broke the build for resume.mdx).
    layout: z.string().optional(),
  }),
});

export const collections = { blog, authors };
