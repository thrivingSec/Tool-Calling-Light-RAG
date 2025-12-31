// utilise the knowledge base (KB) -> retrieve the related information
// User query: What is the refund policy for late payments
// Step 1: query -> chunk -> embedding(using same model as used to index the kb)
// Step 2: retrieve similar embeddigns from the vector store
// Step 3: Build a prompt(embeddings) -> ask the model -> generate grounded answer -> render the final answer
// Confidence -> 0 to 1
// Return [{answer:'', sources:[], confidence:0to1}]

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getChatModel } from "../shared/model";
import { getVectorStore } from "./store";

export type KBSource = {
  source:string;
  chunkId:number
}

export type KBAskAnswer = {
  answer:string;
  sources:KBSource[];
  confidence:number // 0 to 1
}

// context builder 
/** 
 * [#1] doc.txt #0
 * [#2] doc.txt #1
*/
function buldContext(chunks:{text:string, meta:any}[]){
  return chunks.map(({text, meta}, i) => [
    `[#${i+1}] ${String(meta.source?? 'unknown')} #${String(meta.chunkId ?? '?')}`,
    text
  ].join('\n')).join('\n\n---\n\n')
}

// build final answer from LLM
async function buildFinalAnswerFromLLM(query:string, context:string){
  const model = getChatModel({temperature:0.2})
  const res = await model.invoke([
    new SystemMessage([
      'You are a helpful assistant that answers only from the provided context.',
      'If the answer is not found in the current context, say so briefly',
      'Be concise (4-5 sentences), neutral and avoid any marketing info',
      'Do not fabricate sources or cite anything that is not in the context'
    ].join('\n')),
    new HumanMessage([
      `Question: \n${query}`,
      '',
      'Context (qouted chunks) -> ',
      context || 'no relevant context'
    ].join('\n'))
  ])
  const finalResult = typeof res.content === 'string' ? res.content : String(res.content)
  return finalResult.trim()
}

// build confidence
function buildConfidence(scores:number[]){
  const clamped = scores.map(score => Math.max(0,Math.min(1,score)))
  const avg = clamped.reduce((a,b) => a + b, 0);
  return Math.round(avg*100)/100 // rounde of to two places after decimal
}

export async function askKB(query:string, k = 2):Promise<KBAskAnswer>{
  const validateQuery = (query ?? '').trim()
  if(!validateQuery){
    throw new Error('Query field is empty!')
  }

  // bringing the store from memory
  const store = getVectorStore();

  // embed the query string using the store instance
  const embedQuery = await store.embeddings.embedQuery(validateQuery);

  const pair = await store.similaritySearchVectorWithScore(embedQuery, k)
  /**
   * pair = [
   * [Document {pagecontent:"",metadata:{}}, score],
   * [Document {pageContent:"", metadata:{}}, score]
   * ]
   */

  const chunks = pair.map(([doc]) => ({
    text:doc.pageContent || '',
    meta:doc.metadata || {}
  }))

  /**
   * chunk = [
   * {text:"string data", meta:{source:"string source", chunkId:numberic Id}},
   * {text:"string data", meta:{source:"string source", chunkId:numberic Id}}
   * ]
   */

  const score = pair.map((_,score) => Number(score) || 0)

  /**
   * score = [
   * number1, number2
   * ]
   */

  // call context builder
  const context = buldContext(chunks)

  // get final response from LLM
  const finalAnswerLLM = await buildFinalAnswerFromLLM(validateQuery, context)

  const sources: KBSource[] = chunks.map((c) => ({
    source:String(c.meta?.source ?? 'unknown'),
    chunkId:Number(c.meta?.chunkId) ?? 0
  }))

  const confidence = buildConfidence(score)

  return {
    answer:finalAnswerLLM,
    sources,
    confidence
  }
}