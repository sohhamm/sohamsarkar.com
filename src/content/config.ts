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

export const collections = {
  projects: projectsCollection,
}
