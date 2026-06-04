"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { runAgent } from "./agent/actions";
import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";

// Parse markdown table syntax and render as React component
function parseAndRenderMarkdownTables(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Detect table start (line starts with |)
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      let j = i;

      // Collect all consecutive table lines
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        tableLines.push(lines[j].trim());
        j++;
      }

      if (tableLines.length >= 2) {
        // Parse table
        const headerRow = parseTableRow(tableLines[0]);
        const rows: string[][] = [];

        // Skip separator row (usually index 1) and parse data rows
        for (let k = 2; k < tableLines.length; k++) {
          const row = parseTableRow(tableLines[k]);
          if (row.length > 0) {
            rows.push(row);
          }
        }

        if (headerRow.length > 0) {
          result.push(
            <div key={`table-${i}`} className="mb-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-amber-300 bg-white">
                <thead className="bg-amber-100">
                  <tr>
                    {headerRow.map((cell, idx) => (
                      <th
                        key={idx}
                        className="border border-amber-300 px-3 py-2 text-left text-sm font-semibold text-amber-900"
                      >
                        {cell.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border border-amber-200 hover:bg-amber-50"
                    >
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="border border-amber-200 px-3 py-2 text-sm text-zinc-700"
                        >
                          {cell.trim()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>,
          );
          i = j;
          continue;
        }
      }
    }

    // Non-table content
    if (line.length > 0) {
      result.push(
        <div key={`text-${i}`}>
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => <p className="mb-2" {...props} />,
              ul: ({ node, ...props }) => (
                <ul className="list-disc space-y-1 pl-5 mb-2" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal space-y-1 pl-5 mb-2" {...props} />
              ),
              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
              code: ({ className, children, ...props }) => {
                const isBlock =
                  typeof className === "string" &&
                  className.includes("language-");

                return isBlock ? (
                  <code
                    className="block bg-zinc-100 p-3 rounded-lg overflow-x-auto font-mono text-xs mb-2"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono text-xs"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-amber-300 pl-4 italic text-zinc-600 mb-2"
                  {...props}
                />
              ),
              h1: ({ node, ...props }) => (
                <h1 className="text-lg font-bold mb-2" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-base font-bold mb-2" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-sm font-bold mb-1" {...props} />
              ),
            }}
          >
            {line}
          </ReactMarkdown>
        </div>,
      );
    }

    i++;
  }

  return result;
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0 && cell !== "---" && !cell.match(/^-+$/));
}

export default function Home() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">(
    "ready",
  );
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const value = input.trim();
    if (!value || status !== "ready") {
      return;
    }

    if (!apiKey.trim()) {
      setError("Please enter your EHR API key before sending a message.");
      return;
    }

    setInput("");
    setError(null);
    setTokenExpired(false);
    setStatus("submitted");

    const userMessage: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: value }],
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    try {
      setStatus("streaming");
      const result = await runAgent(nextMessages, apiKey.trim());

      if (!result.ok) {
        if (result.code === "token_expired") {
          setTokenExpired(true);
        }
        setError(result.message);
        return;
      }

      const assistantMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        parts: [{ type: "text", text: result.text }],
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the response.",
      );
    } finally {
      setStatus("ready");
    }
  };

  const isStreaming = status === "submitted" || status === "streaming";

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_#fef3c7,_#fff7ed_35%,_#fffbeb_70%)] px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-amber-200/70 bg-white/85 shadow-[0_20px_70px_rgba(180,83,9,0.18)] backdrop-blur">
        <header className="flex items-center justify-between border-b border-amber-200/80 bg-gradient-to-r from-amber-100 via-orange-50 to-amber-50 px-5 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              EHR Chat Assistant
            </h1>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                setTokenExpired(false);
                setError(null);
              }}
              autoComplete="off"
              className={`rounded-lg text-sm w-full max-w-md h-10 px-4 my-2 border ${tokenExpired
                  ? "border-red-500 bg-red-50"
                  : "border-amber-300 bg-white"
                }`}
              placeholder="EHR API key"
            />
            {tokenExpired ? (
              <p className="text-sm font-medium text-red-600">
                Current token is expired. Enter a new API key to continue.
              </p>
            ) : null}
            <p className="text-sm text-amber-800/85">
              Clinical context copilot with server-side responses
            </p>
          </div>
          <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-amber-900">
            {status}
          </span>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-6 text-sm text-amber-900/90">
              Ask a question about a patient timeline, meds, or summary to begin
              the conversation.
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${message.role === "user"
                    ? "ml-auto bg-zinc-900 text-zinc-100"
                    : "mr-auto border border-amber-200 bg-white text-zinc-900"
                  }`}
              >
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider opacity-70">
                  {message.role === "user" ? "You" : "Assistant"}
                </p>
                <div className="space-y-2 text-sm leading-relaxed">
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <div
                          key={`${message.id}-${index}`}
                          className="space-y-2"
                        >
                          {parseAndRenderMarkdownTables(part.text)}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </article>
            ))
          )}

          {isStreaming && (
            <article className="mr-auto max-w-[85%] rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-sm">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider opacity-70">
                Assistant
              </p>

              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-amber-500" />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-amber-500"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-amber-500"
                  style={{ animationDelay: "300ms" }}
                />
                <span className="ml-2 text-sm text-zinc-500">Thinking...</span>
              </div>
            </article>
          )}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={submit}
          className="border-t border-amber-200 bg-amber-50/60 p-3 sm:p-4"
        >
          <div className="flex items-end gap-2 sm:gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={2}
              placeholder="Type your message..."
              className="min-h-20 flex-1 resize-none rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none ring-amber-300 transition focus:ring"
              disabled={status !== "ready"}
            />

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={status !== "ready" || input.trim().length === 0}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
              <button
                type="button"
                disabled={!isStreaming}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Stop
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
