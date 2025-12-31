
// top 10 engineering colleges in india in 2025
// search the web
// open all pages retrive usable content
// summarize
// return candidate -> answer, sources, mode

import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { webSearch } from "../utils/webSearch";
import { openUrl } from "../utils/openUrl";
import { summarize } from "../utils/summarize";
import { candidate } from "./types";
import { getChatModel } from "../shared/model";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const setTopResults = 3;

export const webSearchStep = RunnableLambda.from(
  async (input:{q:string, mode:'web' | 'direct'}) => {
    const results = await webSearch(input.q)
    return {
      ...input,
      results
    }
  }
)

export const openUrlAndSummariseStep = RunnableLambda.from(
  async (input:{q:string, mode: 'web' | 'direct', results: any[]}) => {
    
    if(!Array.isArray(input.results) || input.results.length === 0){
      return {
        ...input,
        pageSummaries:[],
        fallBack: 'no-results' as const
      }
    }

    const extractTopResults = input.results.slice(0,setTopResults);

    const settledUrls = await Promise.allSettled(
      extractTopResults.map( async (result:any) => {
        const opened = await openUrl(result.url)
        const summarizedContent = await summarize(opened.content);
        return {
          url:opened.url,
          summary: summarizedContent.summary
        }
      })
    )
    const settledResultPageSummaries = settledUrls.filter(
      settledResults => settledResults.status === 'fulfilled'
    ).map(s => s.value)
    // edge case: allSettled every case fails
    if(settledResultPageSummaries.length === 0){
      const fallBackSnippetSummaries = extractTopResults.map((result:any) => ({
        url:result.url,
        summary:String(result.snippet || result.title || '').trim()
      })).filter((x:any) => x.summary.length > 0)

      return {
        ...input,
        pageSummaries: fallBackSnippetSummaries,
        fallBack: 'snippets' as const
      }
    }
    
    return {
      ...input,
      pageSummaries:settledResultPageSummaries,
      fallBack: 'none' as const
    }
  }
)

// compose

export const composeStep = RunnableLambda.from(
  async (input:{
    q:string,
    pageSummaries: Array<{url:string; summary:string}>,
    fallBack : 'no-results' | 'snippets' | 'none'
  }): Promise<candidate> => {
    const model = getChatModel({temperature:0.2});
    if(!input.pageSummaries || input.pageSummaries.length === 0){
      const directResponseFromModel = await model.invoke([
        new SystemMessage([
          'You answer briefly and clearly for beginners.',
          'If not sure say so.'
        ].join('\n')),
        new HumanMessage(input.q)
      ])
      const directAnswer = typeof directResponseFromModel.content === 'string' ? directResponseFromModel.content : String(directResponseFromModel.content).trim();
      return {
        answer:directAnswer,
        sources: [],
        mode:'direct'
      }
    }
    const webResponseFromModel = await model.invoke([
      new SystemMessage([
        'You concisely answer question using provided page summaries.',
        'Rules:',
        '- Be accurate and neutral.',
        '- 5-8 sentences max',
        '- Use only the provided summaries; Do NOt invent new facts'
      ].join('\n')),
      new HumanMessage([
        `Question: ${input.q}`,
        'Summaries:',
        JSON.stringify(input.pageSummaries, null, 2)
      ].join('\n'))
    ])

    const webAnswer = typeof webResponseFromModel.content === 'string'? webResponseFromModel.content : String(webResponseFromModel.content);

    const extractSources = input.pageSummaries.map(x => x.url)

    return {
      answer:webAnswer,
      sources:extractSources,
      mode:'web'
    }
  }
)

// LCEL: webSearchStep -> openUrlAndSummariesStep -> composeStep

export const webPath = RunnableSequence.from([
  webSearchStep, openUrlAndSummariseStep, composeStep
])