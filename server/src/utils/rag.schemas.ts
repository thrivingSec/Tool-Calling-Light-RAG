import * as z from 'zod';

export const IngestBody = z.object({
  text:z.string().min(1,'Provide some text to ingest'),
  source:z.string().optional()
})

export type IngestBodyType = z.infer<typeof IngestBody>

export const queryIngest = z.object({
  query:z.string().min(5, 'Please provide a valid query'),
  k:z.number().int().min(1).max(10).optional()
})

export type queryIngestType = z.infer<typeof queryIngest>