"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormEvent, useState } from "react";
import axios from "axios";

type Source = {
  source: string;
  chunkId: number;
};

type AskResult = {
  answer: string;
  sources: Source[];
  confidence: number;
};

type IngestResult = {
  ok: boolean;
  docsCount: number;
  chunksCount: number;
  source: string;
};

type FormData = {
  source: string;
  text: string;
};

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000";

const LightRag = () => {
  const [formData, setFromData] = useState<FormData>({
    source: "",
    text: "",
  });

  const [ingesting, setIngesting] = useState(false);
  const [reseting, setReseting] = useState(false);

  const [ingestRes, setIngestRes] = useState<IngestResult | null>(null);

  async function handleIngestion(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formData.text || formData.text.length < 50) return;
    setIngesting(true);
    try {
      const ingestRes = await axios.post<IngestResult>(
        `${SERVER_URL}/api/user/ingest`,
        formData
      );
      setIngestRes(ingestRes.data);
    } catch (error) {
      console.log("Error from handleIngest :: ", error);
      setFromData({ source: "", text: "" });
    } finally {
      setIngesting(false);
    }
  }

  async function handleReset() {
    setReseting(true);
    try {
      const res = await axios.get(`${SERVER_URL}/api/user/reset`);
      setFromData({ source: "", text: "" });
      setIngestRes(null);
      setQueryRes(null)
    } catch (error) {
      console.log("Error in handleReset :: ", error);
    } finally {
      setReseting(false);
    }
  }

  const [query, setQuery] = useState("");

  const [queryRes, setQueryRes] = useState<AskResult | null>(null);

  const [quering, setQuerying] = useState(false);

  async function handleAsk(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query || query.length < 5) return;
    setQuerying(true);
    try {
      const askRes = await axios.post<AskResult>(
        `${SERVER_URL}/api/user/query`,
        { query, k: 2 }
      );
      setQueryRes(askRes.data);
    } catch (error) {
      console.log("Error in handleAsk :: ", error);
    } finally {
      setQuerying(false);
      setQuery("");
    }
  }

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Knowledge Base(KB)
        </h1>
        <p className="text-sm text-muted-foreground">
          Light RAG Demo. Add your own docs, then ask questions. Model will
          answer from what you have ingested.
        </p>
      </header>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* left/top content */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold ml-1">
              Add to Knowledge Base(KB)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form className="flex flex-col gap-4" onSubmit={handleIngestion}>
              {/* source Input */}
              <div className="flex flex-col">
                <Label
                  className="text-muted-foreground text-xs font-medium m-1"
                  htmlFor="sourceInput"
                >
                  Source Label
                </Label>
                <Input
                  type="text"
                  id="sourceInput"
                  placeholder="Source"
                  className="text-xs font-mono"
                  onChange={(e) =>
                    setFromData({ ...formData, source: e.target.value })
                  }
                  value={formData.source}
                />
              </div>
              {/* text */}
              <div className="flex flex-col">
                <Label
                  className="text-muted-foreground text-xs font-medium m-1"
                  htmlFor="docs"
                >
                  Text / Markdown
                </Label>
                <Textarea
                  id="docs"
                  placeholder="Paste docs, policy text or any onborading notes..."
                  className="text-xs font-mono min-h-50 resize-y leading-relaxed"
                  onChange={(e) =>
                    setFromData({ ...formData, text: e.target.value })
                  }
                  value={formData.text}
                />
              </div>
              {/* submit */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={"secondary"}
                  disabled={reseting}
                  onClick={handleReset}
                  className="cursor-pointer"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={ingesting}
                  className="cursor-pointer"
                >
                  {ingesting ? "Ingesting...." : "Ingest to KB"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className={`${!ingestRes ? "hidden" : ""}`}>
            <div className="px-3flex flex-col w-full py-2">
              <p className="leading-tight text-base font-semibold text-gray-800">
                Document Ingested{" "}
              </p>
              <p className="leading-tight text-sm text-gray-600">
                # Documnet Count: {ingestRes?.docsCount}
              </p>
              <p className="leading-tight text-sm text-gray-600">
                # Chunk Count: {ingestRes?.chunksCount}
              </p>
              <p className="leading-tight text-sm text-gray-600">
                # Source: {ingestRes?.source}
              </p>
            </div>
          </CardFooter>
        </Card>
        {/* right/bottom content */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold ml-1">
              Ask question from KB
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form className="flex flex-col gap-4" onSubmit={handleAsk}>
              {/* query */}
              <div className="flex flex-col">
                <Label
                  className="text-muted-foreground text-xs font-medium m-1"
                  htmlFor="query"
                >
                  Query KB
                </Label>
                <Input
                  type="text"
                  id="query"
                  placeholder="Ask question from the ingested document"
                  className="text-xs font-mono"
                  onChange={(e) => setQuery(e.target.value)}
                  value={query}
                />
              </div>
              {/* submit */}
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={quering}
                >
                  Ask
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className={`${!queryRes ? "hidden" : ""}`}>
            <div className="px-3 flex flex-col w-full py-2">
              {/* Answer */}
              <div className="flex flex-col gap-1 mb-2">
                <p className="text-base font-semibold text-gray-800 font-mono">
                  Answer:
                </p>
                <p className="leading-relaxed text-sm text-gray-600 font-mono">
                  {queryRes?.answer}
                </p>
              </div>
              {/* Chunks */}
              <div className="flex flex-col gap-1 mb-2">
                <p className="leading-tight text-base font-semibold font-mono text-gray-800">
                  Chunks:
                </p>
                <div className="flex flex-col gap-1">
                  {queryRes?.sources?.map((data, index) => (
                    <p
                      key={index}
                      className="text-base leading-tight text-gray-600 font-mono"
                    >
                      # ChunkID:<span>{String(data.chunkId)}</span>
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 mb-2">
                <p className="leading-tight text-base font-semibold font-mono text-gray-800">
                  Cofidence:
                  <span className="text-base leading-tight text-gray-600 font-mono font-normal">
                    {queryRes?.confidence}
                  </span>
                </p>
              </div>
            </div>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
};

export default LightRag;
