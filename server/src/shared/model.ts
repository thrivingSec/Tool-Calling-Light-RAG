import { env } from './env';
import {ChatOpenAI} from '@langchain/openai';
import {ChatGoogleGenerativeAI} from '@langchain/google-genai';
import {ChatGroq} from '@langchain/groq';
import type {BaseChatModel} from '@langchain/core/language_models/chat_models';

// temperature low ->stability, crisp summary

type ModelOpts = {
  temperature?: number;
  maxTokens?: number
}

export function getChatModel(opts:ModelOpts = {}):BaseChatModel {
  const temp = opts?.temperature ?? 0.2;
  //const tokens = opts?.maxTokens ?? 1000
  switch (env.PROVIDER) {
    case 'gemini':
      return new ChatGoogleGenerativeAI({
        apiKey:env.GOOGLE_API_KEY,
        model:env.GOOGLE_MODEL,
        temperature:temp,
        //maxOutputTokens:tokens
      })
    case 'groq':
      return new ChatGroq({
        apiKey:env.GROQ_API_KEY,
        model:env.GROQ_MODEL,
        temperature:temp,
        //maxTokens:tokens
      })
    case 'openai':
      default:
      return new ChatOpenAI({
        apiKey:env.OPENAI_API_KEY,
        model:env.OPENAI_MODEL,
        temperature:temp,
        //maxTokens:tokens
      })
  }
}