// Web route -> browsing, openurl, summary
// Direct route -> LLM call 
// Shared shape -> candidate

export type candidate = {
  answer:string;
  sources: string[]; // [] for direct route
  mode: 'web'|'direct';
}
