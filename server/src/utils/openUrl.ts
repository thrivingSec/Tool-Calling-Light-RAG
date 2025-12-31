// fetch each and every page
// llm itself can't traverse the web
// our code -> acts as the tool, decide exactly which content is safe and what we want the model to show

// verify url -> fetch url -> stripe all the unnecessary info, and keep exact article like content

import axios from "axios";
import { convert } from "html-to-text";
import { openUrlOutputSchema } from "./schemas";

export async function openUrl(url: string) {
  // Step 1: validate url
  const normalised = validateUrl(url);
  // Step 2: fetch normalised and llm can't browse
  let response;
  try {
    response = await axios.get(normalised, {
      headers: {
        "User-Agent": "agent-core 1.0 (+course-demo)",
      },
    });
  } catch (error: any) {
    throw new Error(
      `openUrl failed ${error.response.status} - ${error.message}`
    );
  }
  // Step 3:
  const contentType = response.headers["content-type"].toString().split(';')?.[0];
  const rawData = response.data;

  // Step 4 html -> text
  const selectorOptions = [
          {
            selector: "nav",
            format: "skip",
          },
          {
            selector: "header",
            format: "skip",
          },
          {
            selector: "footer",
            format: "skip",
          },
          {
            selector: "script",
            format: "skip",
          },
          {
            selector: "style",
            format: "skip",
          },
          {
            selector: "noscript",
            format: "skip",
          },
          {
            selector: "form",
            format: "skip",
          },
          {
            selector: "aside",
            format: "skip",
          },
        ]
  let text;
  if (contentType === "text/html") {
    text = convert(rawData, {
      wordwrap: false,
      baseElements: {
        selectors: ["article", "main", '[role="main"]'],
        orderBy: "selectors",
        returnDomByDefault: false,
      },
      selectors: selectorOptions,
    });
    // fallback
    if (text.trim().length < 500) {
      text = convert(rawData, {
        wordwrap: false,
        baseElements: {
          selectors: ["body"],
          returnDomByDefault: false,
        },
        selectors: selectorOptions,
      });
    }
  } else {
    text = rawData;
  }
  // Step 5: remove all the white spaces and clip to 8k characters
  const cleaned = collapseWhiteSpaces(text);
  const capped = cleaned.slice(0, 8000);

  return openUrlOutputSchema.parse({
    url: normalised,
    content: capped,
  });
}

function validateUrl(s: string) {
  try {
    const parsed = new URL(s);
    if (!/^https?:$/.test(parsed.protocol))
      throw new Error("only http/https supported");
    return parsed.toString();
  } catch {
    throw new Error("Invalid Url");
  }
}

function collapseWhiteSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}
