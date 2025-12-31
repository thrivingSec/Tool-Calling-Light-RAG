import { createChunk } from "./chunk";
import { addChunk } from "./store";

// inout type for ingest
export type IngestTextInput = {
  text: string;
  source: string
}

// create our KB
export async function ingest(input:IngestTextInput){
  const raw = (input.text ?? "").trim()
  
  if(!raw) {throw new Error('No file to ingest')}
  
  const source = input.source ?? 'pasted-text'

  // array of documents -> each document is a chunk with page content and metadata
  const docs = createChunk(raw, source);

  // embed all chunks and add it to the vector memory
  const totalChunks = await addChunk(docs)
  
  return {
    docsCount:1,
    chunksCount:totalChunks,
    source
  }
}