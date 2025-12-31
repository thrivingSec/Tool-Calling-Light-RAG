import {z} from 'zod';

// legal contract between backend, AI models, frontend

export const webSearchResultSchema = z.object({
  title:z.string().min(1),
  url:z.url(),
  snippet:z.string().optional().default('')
})

export const WebSearchResultsSchema = z.array(webSearchResultSchema).max(10);

export type webSerchResult = z.infer<typeof webSearchResultSchema>


export const openUrlOutputSchema = z.object({
  url: z.url(),
  content: z.string().min(1)
})
export const openUrlInputSchema = z.object({
  url: z.url()
})


export const summaryInputSchema = z.object({
  text:z.string().min(50, 'Need a bit more text to summarize')
})

export const summaryOutputSchema = z.object({
  summary:z.string().min(1)
})


export const searchInputSchema = z.object({
  q: z.string().min(5, 'Please be specific.')
})

export type searchInputSchemaType = z.infer<typeof searchInputSchema>; 

export const searchOutputSchema = z.object({
  answer:z.string().min(1),
  sources:z.array(z.url()).default([])
})

export type searchOutputSchemaType = z.infer<typeof searchOutputSchema>