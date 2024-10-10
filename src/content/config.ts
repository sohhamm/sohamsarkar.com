import {defineCollection, z} from 'astro:content'

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    link: z.string(),
    image: z.string(),
    tags: z.array(z.string()),
    sourceCode: z.string(),
    order: z.number(),
  }),
})

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }),
})

export const collections = {
  projects: projectsCollection,
  blogs: blogCollection,
}
