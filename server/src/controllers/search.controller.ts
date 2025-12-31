import {Request, Response} from 'express'
import { success } from 'zod';
import { runSearch } from '../search_tool/searchChain';
import { searchInputSchema } from '../utils/schemas';
export const searchController = async (req:Request, res:Response) => {
  try {
    const {q} = req.body;
    if(!q || typeof q !== 'string' || q.length < 5) return res.status(400).json({error:'please search valid question and be specific'})
    const input = searchInputSchema.parse({q:q.trim()});
    const result = await runSearch(input);
    return res.status(200).json(result);
  } catch (e) {
    const errorMessage = (e as Error)?.message || 'unknown error'
    res.status(400).json({error:errorMessage});
  }
}