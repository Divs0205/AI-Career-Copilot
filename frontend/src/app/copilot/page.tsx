"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

const API_URL = "http://127.0.0.1:8000";

type Resume = {
  id: number;
  filename: string;
  uploaded_at: string;
};

type Conversation = {
  id: number;
  user_id: number;
  resume_id: number | null;
  title: string | null;
};

type Message = {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
};

export default function CopilotPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);

  const [resume, setResume] = useState<Resume | null>(null);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCopilot();
  }, []);

  async function loadCopilot() {
  try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please log in first.");
      return;
    }

    const response = await fetch(
      `${API_URL}/resumes/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load resumes");
    }

    const resumes: Resume[] = await response.json();

    if (resumes.length === 0) {
      setError("No resume found. Please upload a resume first.");
      return;
    }

    const latestResume = resumes.reduce(
      (latest, current) =>
        new Date(current.uploaded_at) >
        new Date(latest.uploaded_at)
          ? current
          : latest
    );

    setResume(latestResume);

    await loadConversations();
    } catch (err) {
    setError("Unable to load your resume.");
    }
  }

  async function loadConversations() {
    try {
      setLoadingConversations(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please log in first.");
        return;
      }

      const response = await fetch(
        `${API_URL}/conversations/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }

      const data = await response.json();
      setConversations(data);

      if (data.length > 0) {
        selectConversation(data[0]);
      }
    } catch (err) {
      setError("Unable to load conversations.");
    } finally {
      setLoadingConversations(false);
    }
  }

  async function selectConversation(
    conversation: Conversation
  ) {
    try {
      setActiveConversation(conversation);
      setMessages([]);

      const token = localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/conversations/${conversation.id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError("Unable to load conversation.");
    }
  }

  async function createConversation() {
    try {
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please log in first.");
        return;
      }

      if (!resume) {
        setError("No active resume found.");
        return;
      }

      const response = await fetch(
        `${API_URL}/conversations/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resume_id: resume?.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const conversation = await response.json();

      setConversations((previous) => [
        conversation,
        ...previous,
      ]);

      setActiveConversation(conversation);
      setMessages([]);
    } catch (err) {
      setError("Unable to create conversation.");
    }
  }

  async function sendQuestion() {
    if (!question.trim() || !activeConversation || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please log in first.");
        return;
      }

      if (!resume) {
        setError("No active resume found.");
        return;
      }

      const response = await fetch(
        `${API_URL}/rag/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: question.trim(),
            resume_id: resume.id,
            conversation_id: activeConversation.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      const newUserMessage: Message = {
        id: Date.now(),
        conversation_id: activeConversation.id,
        role: "user",
        content: data.question,
      };

      const newAssistantMessage: Message = {
        id: Date.now() + 1,
        conversation_id: activeConversation.id,
        role: "assistant",
        content: data.answer,
      };

      setMessages((previous) => [
        ...previous,
        newUserMessage,
        newAssistantMessage,
      ]);

      setQuestion("");

      await loadConversations();
    } catch (err) {
      setError("Unable to get an answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendQuestion();
    }
  }

  return (
    <main className="flex h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <aside className="flex w-72 flex-col border-r border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 p-5">
          <h1 className="text-xl font-bold">
            AI Career Copilot
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Your personal career assistant
          </p>
        </div>

        <div className="p-4">
          <button
            onClick={createConversation}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            + New Chat
          </button>
        </div>

        <div className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Conversations
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          {loadingConversations ? (
            <p className="px-3 py-4 text-sm text-zinc-500">
              Loading...
            </p>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-4 text-sm text-zinc-500">
              No conversations yet.
            </p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() =>
                  selectConversation(conversation)
                }
                className={`mb-1 w-full rounded-lg px-3 py-3 text-left text-sm transition ${
                  activeConversation?.id === conversation.id
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <div className="truncate font-medium">
                  {conversation.title || "New Conversation"}
                </div>

                <div className="mt-1 text-xs text-zinc-600">
                  Resume #{conversation.resume_id}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-zinc-800 p-4 text-xs text-zinc-600">
          AI Career & Placement Copilot
        </div>
      </aside>

      {/* Main Chat */}
      <section className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-800 px-8 py-5">
          <div>
            <h2 className="font-semibold">
              {activeConversation?.title ||
                "Career Copilot"}
            </h2>

            <p className="text-sm text-zinc-500">
              {resume ? `Resume #${resume.id}` : "Loading resume..."}
            </p>
          </div>

          <div className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
            RAG Enabled
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="border-b border-red-900 bg-red-950/40 px-8 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {!activeConversation ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="text-3xl">✦</div>
              </div>

              <h2 className="text-3xl font-bold">
                Your Career Copilot
              </h2>

              <p className="mt-3 max-w-lg text-zinc-500">
                Ask questions about your resume, skills,
                career direction, job preparation, and
                learning goals.
              </p>

              <button
                onClick={createConversation}
                className="mt-7 rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-zinc-200"
              >
                Start a conversation
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <h2 className="text-2xl font-semibold">
                How can I help with your career?
              </h2>

              <p className="mt-3 text-zinc-500">
                Ask me anything based on your resume.
              </p>

              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                {[
                  "What are my strongest technical skills?",
                  "What backend skills should I improve?",
                  "What roles suit my profile?",
                  "How can I prepare for interviews?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuestion(suggestion)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                      message.role === "user"
                        ? "bg-white text-black"
                        : "border border-zinc-800 bg-zinc-900 text-zinc-200"
                    }`}
                  >
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-50">
                      {message.role === "user"
                        ? "You"
                        : "Copilot"}
                    </div>

                    <div className="prose prose-invert max-w-none text-sm leading-7">
                        <ReactMarkdown>
                        {message.content}
                        </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 text-sm text-zinc-500">
                    Copilot is thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800 p-5">
          <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-3">
            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your career..."
              rows={1}
              className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
            />

            <button
              onClick={sendQuestion}
              disabled={
                loading ||
                !question.trim() ||
                !activeConversation
              }
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-zinc-700">
            Press Enter to send · Shift + Enter for a new line
          </p>
        </div>
      </section>
    </main>
  );
}