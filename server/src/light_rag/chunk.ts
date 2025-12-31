// why we chunk
// retrieval in rag works on the chunks having small stream of data,
// chunk small enough -> precision but long enough to hold the idea/defination
// slice it in small overlapping window -> store each slice with its metadata(like which part of the text this slice is refering, id etc)

import { Document } from '@langchain/core/documents'

const CHUNK_SIZE = 1000; // 1kb of text data is enough to contain answer for simple queries also small enough to fit multiple chunks into the prompt of llm
const CHUNK_OVERLAP = 150; // every next chunk starts bit earlier so that it has context from previous chunk


export function createChunk(text:string, source:string) : Document[]{
  const clean = (text ?? "").trim().replace(/\r\r/g, '\n');

  const docs :Document[] = [];

  if(!clean.trim()) return docs

  const step = Math.max(1, CHUNK_SIZE - CHUNK_OVERLAP);

  let start = 0
  let chunkId = 0

  while(start < clean.length){
    const end = Math.min(clean.length, start + CHUNK_SIZE);

    const slice = clean.slice(start, end).trim();

    if(slice.length > 0){
      docs.push(
        new Document({
          pageContent:slice,
          metadata:{
            source,
            chunkId
          }
        })
      )
      chunkId += 1
    }

    start += step;

  }

  return docs
}