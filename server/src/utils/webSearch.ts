
// tool to search on web/internet
// it will take a natural language query (user's query)
// call tavily under the hood
// return data of the format webSearchResultsSchema

import {env} from '../shared/env'
import axios from 'axios';
import { webSearchResultSchema, WebSearchResultsSchema } from './schemas';

export async function webSearch(q:string){
  const query = (q ?? '').trim();
  if(!query) return []
  return await searchTavilyUtils(query);
}

export async function searchTavilyUtils(query:string){
  if(!env.TAVILY_API_KEY) throw new Error('provide TAVILY_API_KEY');
  let response;
  try {
    response = await axios.post('https://api.tavily.com/search', {
    query,
    search_depth:"basic",
    max_results:5,
    include_answer:false,
    include_images:false
  },{
    headers:{
      'Content-Type':'application/json',
      Authorization:`Bearer ${env.TAVILY_API_KEY}`
    }
  })
  } catch (error:any) {
    const text = error.message ?? '';
    throw new Error(`Tavily error, ${error.response.status}-${text}`)
  }
  const data = response.data;
  const results = Array.isArray(data?.results) ? data.results : [];

  const normalised = results.slice(0,5).map((r:any) => webSearchResultSchema.parse({
    title:String(r?.title ?? '').trim() || 'Untitled',
    url:String(r?.url ?? '').trim(),
    snippet:String(r?.content ?? '').trim().slice(0,220)
  }))

  return WebSearchResultsSchema.parse(normalised)
}