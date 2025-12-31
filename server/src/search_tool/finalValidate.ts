import { RunnableLambda } from "@langchain/core/runnables";
import { candidate } from "./types";
import { searchOutputSchema } from "../utils/schemas";
import { getChatModel } from "../shared/model";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// finalvalidate
export const finalValidateAndPolish = RunnableLambda.from(
  async(candiate:candidate) => {
    const finalDraft = {
      answer:candiate.answer,
      sources:candiate.sources?? []
    }
    const parsed1 = searchOutputSchema.safeParse(finalDraft)
    if(parsed1.success) return parsed1.data;

    // one shot restructure
    const result = repairSearchAns(finalDraft);
    const parsed2 = searchOutputSchema.safeParse(result);
    if(parsed2.success) return parsed2.data
  }
)

async function repairSearchAns(obj:any): Promise<{answer:string; sources:string[]}>{
  const model = getChatModel({temperature: 0.2})

  const res = await model.invoke([
    new SystemMessage([
      'You fix json objects to match a given schema',
      'Respond only with valid json objects.',
      'Schema: {answer:string, sources:string[](urls as strings)}'
    ].join('\n')),
    new HumanMessage([
      'Make this exactly to the schema. Ensure sources is an array of URL strings.',
      'Input JSON:',
      JSON.stringify(obj)
    ].join('\n\n'))
  ])
  const result = typeof res.content === 'string'? res.content : String(res.content)
  const json = parseJson(result);
  return {
    answer:(json?.answer ?? '').trim(),
    sources:Array.isArray(json?.sources) ? json?.sources.map(String) : []
  }
}

function parseJson(input:string){
  const start= input.indexOf("{");
  const end = input.indexOf("}");
  if(start === -1 || end === -1 || end <= start) return {};

  try {
    return JSON.parse(input.slice(start, end + 1))
  } catch (error) {
    return {}
  }
}