import { Router } from "express";
import { searchController } from "../controllers/search.controller";
import { ingestController, queryKB, resetKB } from "../controllers/rag.controller";

const route = Router();

// @api dsc: search user query
// @api method: POST
// @api endpoint: /api/user/search
route.post('/search', searchController);

// @api dsc: create knowledge base: ingest
// @api method: POST
// @api endpoint: /api/user/ingest
route.post('/ingest', ingestController);

// @api dsc: query knowledge base
// @api method: POST
// @api endpoint: /api/user/query
route.post('/query', queryKB);

// @api dsc: reset knowledge base
// @api method: GET
// @api endpoint: /api/user/reset
route.get('/reset', resetKB);

export default route;

