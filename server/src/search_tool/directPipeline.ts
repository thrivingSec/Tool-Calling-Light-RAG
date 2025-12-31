import { RunnableLambda } from "@langchain/core/runnables";
import { candidate } from "./types";
import { getChatModel } from "../shared/model";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export const directPath = RunnableLambda.from(
  async(input:{q:string, mode:'web'|'direct'}):Promise<candidate> => {
    const model = getChatModel({temperature:0.2});
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
      sources:[],
      mode:'direct'
    }
  }
)