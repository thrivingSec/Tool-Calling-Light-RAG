"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/lib/config";
import axios from "axios";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";


type SearchResponse = {
  answer: string;
  sources: string[];
};

type CurrentChatTurn =
  | {
      role: "user";
      content: string;
    }
  | {
      role: "agent";
      content: string;
      sources: string[];
      time: number;
      error?: string;
    };

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<CurrentChatTurn[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat]);

  async function runSearch(prompt: string) {
    setLoading(true);
    setChat((old) => [...old, { role: "user", content: prompt }]);
    const t0 = performance.now();
    try {
      const response = await axios.post<SearchResponse>(
        `${API_URL}/api/user/search`,
        { q: prompt },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const timeDiff = Math.round(performance.now() - t0);
      const data = response?.data;
      setChat((old) => [
        ...old,
        {
          role: "agent",
          content: data.answer,
          sources: data.sources,
          time: timeDiff,
        },
      ]);
    } catch (e) {
      console.log(e);
      const timeDiff = Math.round(performance.now() - t0);
      const errorMsg = (e as Error)?.message ?? "Request failed";
      setChat((old) => [
        ...old,
        {
          role: "agent",
          content: "Something went wrong",
          sources: [],
          time: timeDiff,
          error: errorMsg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }
  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    const prompt = query.trim();
    if (!prompt || loading) return;
    setQuery("");
    await runSearch(prompt);
  }

  return (
    <div className="flex h-dvh flex-col bg-[#f9fafb] text-gray-900">
      {/* header */}
      <header className="border-b bg-white text-sm flex items-center justify-between px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-shadow-gray-800">
            Search V1 (LCEL Web Agent)
          </span>
          <span className="text-[12px] text-gray-500 font-medium">
            Answer with sources. Some queries will browse the web some don't.
          </span>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto space-y-6 px-4 py-6">
        {/* no chat */}
        {chat.length === 0 && (
          <div className="mx-auto w-full max-w-2xl text-center text-sm ">
            <div className="font-medium text-gray-800 text-base mb-1">
              Ask Anything
            </div>
            <div className="text-[14px] leading-relaxed">
              Examples:
              <br />
              <code className="bg-gray-100 text-[12px] rounded px-1 py-2">
                top 10 engineering colleges in india in 2025
              </code>
              <br />
              <code className="bg-gray-100 text-[12px] rounded px-1 py-2">
                what is devops
              </code>
            </div>
          </div>
        )}
        {/* chat data */}
        {chat.map((turn, idx) => {
          if (turn.role === "user") {
            // user prompts
            return (
              <div
                key={idx}
                className="mx-auto max-w-2xl flex justify-end text-right"
              >
                <div className="inline-block rounded-2xl px-4 py-3 bg-gray-900 max-w-2xl shadow-md text-sm text-white">
                  <div className="whitespace-pre-wrap wrap-break-word">
                    {turn.content}
                  </div>
                </div>
              </div>
            );
          }
          // agent response
          return (
            <div
              key={idx}
              className="mx-auto max-w-2xl flex justify-start text-left gap-2"
            >
              <div className="w-8 h-8 flex flex-none items-center justify-center rounded-md text-[11px] text-white font-semibold bg-gray-800">
                AI
              </div>
              <div className="flex-1 space-y-3">
                {/* content */}
                <div className="inline-block rounded-2xl px-3 py-2 bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 whitespace-pre-wrap wrap-break-word">
                  {turn.content}
                </div>
                {/* time/error */}
                <div className="text-[11px] text-gray-500 flex flex-wrap items-center gap-x-2">
                  {typeof turn.time === "number" && (
                    <span>answered in {turn.time} time</span>
                  )}
                  {turn?.error && <span>{turn.error}</span>}
                </div>
                {/* sources */}
                <div>
                  {turn.sources && turn.sources.length > 0 && (
                    <div className="rounded-lg bg-white px-3 py-2 text-[12px] shadow-sm ring-1 ring-gray-200">
                      <div className="text-[11px] font-medium text-gray-600 mb-1">
                        Sources:
                      </div>
                      <ul className="space-y-1">
                        {turn.sources.map((source, idx) => (
                          <li key={idx} className="truncate">
                            <Link
                              href={source}
                              className="text-blue-500 underline underline-offset-4 break-all"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {" "}
                              {source}{" "}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="mx-auto max-w-2xl flex text-left items-start gap-3 " >
            <div className="flex h-8 w-8 rounded-md flex-none items-center justify-center bg-gray-700 text-white text-[11px] font-semibold" >...</div>
            <p className="inline-block rounded-2xl px-3 py-2 bg-white text-gray-900 shadow-sm ring-1 ring-gray-200">Thinking</p>
          </div>
        )}
        {/* footer */}
        <footer className="border-t bg-white px-4 py-6">
          <form
            onSubmit={handleFormSubmit}
            className="mx-auto w-full max-w-2xl flex"
          >
            <div className="flex gap-5 items-center justify-between w-full">
              <Input
                className="w-full resize-none"
                placeholder="Ask agent..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || query.trim().length < 5}
                className="shrink-0"
              >
                {loading ? "..." : "Ask"}
              </Button>
            </div>
          </form>
        </footer>
      </main>
    </div>
  );
}
