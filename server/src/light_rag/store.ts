// embeddings + vector store
// kb brain -> knowledge base
// pick an embedding model: openai | gemini
// store ur embedding in the ram
// lets us insert chunks and later run search based on those chunks

import { TaskType } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";

// core concepts 
// embedding models
// turn text into array of numbers called vectors(represented in a vector space)
// different providers use different vector spaces(like dimesions, distributions etc..).

// vector store
// searchable index
// 'This is my query'-> find me the closest chunks.

type Provider = 'openai' | 'google'

export function getProvider():Provider{
  const getCurrentProvider = (process.env.RAG_MODEL_PROVIDER ?? 'gemini').toLowerCase();
  return getCurrentProvider === 'gemini'? 'google':'openai'
}

// Invoking google genAI embedding model later used in creating embeddings and store in memoryVector store 
export function makeGoogleEmbeddings(){
  const key = process.env.GOOGLE_API_KEY ?? '';
  if(!key){
    throw new Error('Error from makeGoogleEmbeddings :: Google api key is missing');
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey:key,
    model:'gemini-embedding-001',
    taskType:TaskType.RETRIEVAL_DOCUMENT
  })
}

// Invoking openai embedding model later used in creating embeddings and store in memoryVector store 
export function makeOpenaiEmbeddings(){
  const key = process.env.OPENAI_API_KEY ?? '';
  if(!key){
    throw new Error('Error from makeOpenaiEmbeddings :: Google api key is missing');
  }
  return new OpenAIEmbeddings({
    apiKey:key,
    model:'text-embedding-3-large'
  })
}

export function makeEmbeddingProvider(provider:Provider){
  return provider === 'google'? makeGoogleEmbeddings() : makeOpenaiEmbeddings()
}

let store: MemoryVectorStore | null = null;
let currentSetProvider: Provider | null = null;

export function getVectorStore():MemoryVectorStore{
  // get the provider
  const provider = getProvider();

  // same provider, and store return same store
  if(currentSetProvider === provider && store){
    return store
  }

  // if the provider changes or store never existed -> brand new store
  currentSetProvider = provider
  store = new MemoryVectorStore(makeEmbeddingProvider(provider));
  return store
}

// Now the store is configured and has access tot he embedding model
// Now we need to pass the array of chunks which are of type Document to the store using its methods
// Which would be stored in the in-ram vector memory 

          // pageContent:slice,
          // metadata:{
          //   source,
          //   chunkId
          // }

export async function addChunk(docs:Document[]):Promise<number>{
  if(!Array.isArray(docs) || docs.length === 0) return 0

  const store = getVectorStore();
  await store.addDocuments(docs);

  return docs.length
}


export function resetStore(){
  currentSetProvider = null;
  store = null;
}