import { Request, Response } from "express";
import {
  IngestBody,
  IngestBodyType,
  queryIngest,
  queryIngestType,
} from "../utils/rag.schemas";
import { ingest } from "../light_rag/ingest";
import { askKB } from "../light_rag/ask";
import { resetStore } from "../light_rag/store";

export const ingestController = async (req: Request, res: Response) => {
  try {
    const body = IngestBody.parse(req.body) as IngestBodyType;
    const ingestRes = await ingest({
      text: body.text,
      source: body.source ?? "system source",
    });
    return res.status(200).json({ ok: true, ...ingestRes });
  } catch (error) {
    console.log("Error from ingestController :: ", error);
    res.status(400).json({ error: "some error occured while ingesting data" });
  }
};

export const queryKB = async (req: Request, res: Response) => {
  try {
    const body = queryIngest.parse(req.body) as queryIngestType;
    const queryRes = await askKB(body.query, body.k ?? 2);
    return res
      .status(200)
      .json({
        answer: queryRes.answer,
        sources: queryRes.sources,
        confidence: queryRes.confidence,
      });
  } catch (error) {
    console.log("Error from queryKB controller :: ", error);
    res
      .status(400)
      .json({ error: "some error occoured while querying the knowledge base" });
  }
};

export const resetKB = async (req:Request, res:Response) => {
  try {
    resetStore();
    return res.status(200).json({ok:true})
  } catch (error) {
    return res.status(400).json({error:'something went wrong'});
  }
}
