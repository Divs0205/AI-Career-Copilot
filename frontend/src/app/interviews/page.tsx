"use client";

import { useEffect, useMemo, useState } from "react";

type Question = {
  id: number;
  question_number: number;
  question: string;
  answer?: string | null;
  score?: number | null;
  feedback?: string | null;
};

type Interview = {
  id: number;
  resume_id: number;
  job_id?: number | null;
  mode: string;
  status: string;
  score?: number | null;
  questions: Question[];
};

const API_URL = "http://127.0.0.1:8000";


export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] =
    useState<Interview | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "active" | "cancelled" >("all");


  const cancelInterview = async (interviewId: number) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this interview?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/interviews/${interviewId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to cancel interview."
        );
      }

      setInterviews((current) =>
        current.map((interview) =>
          interview.id === interviewId
            ? { ...interview, status: "cancelled" }
            : interview
        )
      );

      if (selectedInterview?.id === interviewId) {
        setSelectedInterview({
          ...selectedInterview,
          status: "cancelled",
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to cancel interview."
      );
    }
  };

  useEffect(() => {
    const loadInterviews = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await fetch(`${API_URL}/interviews/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to load interview history."
          );
        }

        setInterviews(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load interview history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, []);

  const getScoreLabel = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return "Not scored";
    }

    if (score >= 80) {
      return "Excellent";
    }

    if (score >= 60) {
      return "Good";
    }

    if (score >= 40) {
      return "Needs Improvement";
    }

    return "Needs Practice";
  };

  const getScoreClass = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return "text-zinc-500";
    }

    if (score >= 80) {
      return "text-emerald-400";
    }

    if (score >= 60) {
      return "text-blue-400";
    }

    if (score >= 40) {
      return "text-yellow-400";
    }

    return "text-red-400";
  };

  const getStatusClass = (status: string) => {
    if (status === "completed") {
      return "bg-emerald-950 text-emerald-400 border-emerald-900";
    }

    if (status === "cancelled") {
    return "bg-red-950 text-red-400 border-red-900";
    }

    return "bg-yellow-950 text-yellow-400 border-yellow-900";
  };

  const getAnsweredCount = (interview: Interview) => {
    return interview.questions.filter(
      (question) =>
        question.answer && question.answer.trim() !== ""
    ).length;
  };

  const completedInterviews = interviews.filter(
    (interview) => interview.status === "completed"
  );

  const activeInterviews = interviews.filter(
    (interview) => interview.status == "active"
  );
  const cancelledInterviews = interviews.filter(
    (interview) => interview.status == "cancelled"
  );

  const averageScore =
    completedInterviews.length > 0
      ? Math.round(
          completedInterviews.reduce(
            (total, interview) => total + (interview.score ?? 0),
            0
          ) / completedInterviews.length
        )
      : null;

  const bestScore =
    completedInterviews.length > 0
      ? Math.max(
          ...completedInterviews.map(
            (interview) => interview.score ?? 0
          )
        )
      : null;

  const filteredInterviews = useMemo(() => {
    if (filter === "completed") {
      return interviews.filter(
        (interview) => interview.status === "completed"
      );
    }

    if (filter === "active") {
      return interviews.filter(
        (interview) => interview.status === "active"
      );
    }

    if (filter === "cancelled") {
      return interviews.filter(
        (interview) => interview.status === "cancelled"
      );
    }

    // All interviews
    return [...interviews].sort((a, b) => {
      const statusOrder: Record<string, number> = {
        active: 0,
        completed: 1,
        cancelled: 2,
      };

      const statusDifference =
        (statusOrder[a.status] ?? 3) -
        (statusOrder[b.status] ?? 3);

      if (statusDifference !== 0) {
        return statusDifference;
      }

      return b.id - a.id;
    });
  }, [interviews, filter]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded bg-zinc-800" />
            <div className="h-4 w-96 rounded bg-zinc-800" />
            <div className="grid md:grid-cols-4 gap-4 mt-8">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-zinc-900 border border-zinc-800"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-sm text-zinc-500 mb-2">
            AI Career Copilot
          </p>

          <h1 className="text-4xl font-bold">
            Interview History
          </h1>

          <p className="text-zinc-400 mt-2 max-w-2xl">
            Review your mock interviews, scores, answers, and AI
            feedback to track your interview preparation.
          </p>
        </div>

        {/* Error */} 
        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {!error && interviews.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">
                Total Interviews
              </p>
              <p className="text-3xl font-bold mt-2">
                {interviews.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">
                Completed
              </p>
              <p className="text-3xl font-bold mt-2">
                {completedInterviews.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">
                Average Score
              </p>
              <p className="text-3xl font-bold mt-2">
                {averageScore !== null ? (
                  <>
                    {averageScore}
                    <span className="text-base text-zinc-500">
                      /100
                    </span>
                  </>
                ) : (
                  "--"
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">
                Best Score
              </p>
              <p className="text-3xl font-bold mt-2">
                {bestScore !== null ? (
                  <>
                    {bestScore}
                    <span className="text-base text-zinc-500">
                      /100
                    </span>
                  </>
                ) : (
                  "--"
                )}
              </p>
            </div>

          </div>
        )}

        {/* Filters */}
        {interviews.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">

            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === "all"
                  ? "bg-white text-black"
                  : "border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              All ({interviews.length})
            </button>

            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === "completed"
                  ? "bg-white text-black"
                  : "border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              Completed ({completedInterviews.length})
            </button>

            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === "active"
                  ? "bg-white text-black"
                  : "border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              Active ({activeInterviews.length})
            </button>

            <button
              onClick={() => setFilter("cancelled")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === "cancelled"
                  ? "bg-white text-black"
                  : "border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              Cancelled ({cancelledInterviews.length})
            </button>

          </div>
        )}

        {/* Empty state */}
        {!error && interviews.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">

            <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-2xl">
              🎯
            </div>

            <h2 className="text-xl font-semibold">
              No interviews yet
            </h2>

            <p className="text-zinc-400 mt-2 max-w-md mx-auto">
              Start your first AI mock interview to practice
              answering questions and receive personalized feedback.
            </p>

            <button
              onClick={() => {
                window.location.href = "/interview";
              }}
              className="mt-6 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-zinc-200"
            >
              Start Interview
            </button>

          </div>
        )}

        {/* No results after filter */}
        {interviews.length > 0 && filteredInterviews.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
            <h2 className="text-xl font-semibold">
              No {filter} interviews
            </h2>

            <p className="text-zinc-400 mt-2">
              There are no interviews matching this filter yet.
            </p>
          </div>
        )}

        {/* Interview list */}
        {filteredInterviews.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6">

            {filteredInterviews.map((interview) => {
              const answeredCount = getAnsweredCount(interview);

              return (
                <div
                  key={interview.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition"
                >

                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-sm text-zinc-500">
                        Interview #{interview.id}
                      </p>

                      <h2 className="text-xl font-semibold mt-1">
                        {interview.mode} Interview
                      </h2>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full border capitalize ${getStatusClass(
                        interview.status
                      )}`}
                    >
                      {interview.status}
                    </span>

                  </div>

                  {/* Score */}
                  <div className="mt-7 flex items-end justify-between">

                    <div>
                      <p className="text-sm text-zinc-500">
                        Overall Score
                      </p>

                      <p
                        className={`text-4xl font-bold mt-1 ${getScoreClass(
                          interview.score
                        )}`}
                      >
                        {interview.score ?? "--"}

                        {interview.score !== null &&
                          interview.score !== undefined && (
                            <span className="text-lg text-zinc-500">
                              /100
                            </span>
                          )}
                      </p>
                    </div>

                    <p className="text-sm text-zinc-400">
                      {interview.status === "cancelled"
                        ? "Interview cancelled"
                        : getScoreLabel(interview.score)}
                    </p>

                  </div>

                  {/* Progress */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                      <span>Interview Progress</span>
                      <span>
                        {answeredCount}/{interview.questions.length} answered
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{
                          width:
                            interview.questions.length > 0
                              ? `${Math.min(
                                  100,
                                  (answeredCount /
                                    interview.questions.length) *
                                    100
                                )}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-6 pt-5 border-t border-zinc-800 grid grid-cols-2 gap-4">

                    <div>
                      <p className="text-xs text-zinc-500">
                        Questions
                      </p>

                      <p className="text-sm font-medium mt-1">
                        {interview.questions.length}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Resume
                      </p>

                      <p className="text-sm font-medium mt-1">
                        #{interview.resume_id}
                      </p>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <button
                      onClick={() =>
                        setSelectedInterview(interview)
                      }
                      className="w-full border border-zinc-700 rounded-xl py-3 font-medium hover:bg-zinc-800 transition"
                    >
                      View Details
                    </button>

                    {interview.status !== "completed" &&
                      interview.status !== "cancelled" && (
                        <button
                          onClick={() => cancelInterview(interview.id)}
                          className="w-full border border-red-900 text-red-400 rounded-xl py-3 font-medium hover:bg-red-950/40 transition"
                        >
                          Cancel Interview
                        </button>
                      )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

        {/* Interview Details Modal */}
        {selectedInterview && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedInterview(null)}
          >

            <div
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >

              {/* Modal Header */}
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-7 py-5 flex items-center justify-between">

                <div>
                  <p className="text-sm text-zinc-500">
                    Interview #{selectedInterview.id}
                  </p>

                  <h2 className="text-2xl font-bold mt-1">
                    {selectedInterview.mode} Interview
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedInterview(null)}
                  className="text-zinc-400 hover:text-white text-2xl"
                >
                  ×
                </button>

              </div>

              {/* Modal Content */}
              <div className="p-7">

                {/* Overall Score */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 mb-6">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm text-zinc-500">
                        Overall Score
                      </p>

                      <p
                        className={`text-5xl font-bold mt-2 ${getScoreClass(
                          selectedInterview.score
                        )}`}
                      >
                        {selectedInterview.score ?? "--"}

                        {selectedInterview.score !== null &&
                          selectedInterview.score !== undefined && (
                            <span className="text-xl text-zinc-500">
                              /100
                            </span>
                          )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-zinc-500">
                        Result
                      </p>

                      <p className="font-medium mt-1">
                        {getScoreLabel(selectedInterview.score)}
                      </p>
                    </div>

                  </div>

                </div>

                {/* Questions */}
                <div className="space-y-5">

                  {selectedInterview.questions.map((question) => (
                    <div
                      key={question.id}
                      className="border border-zinc-800 rounded-xl p-6"
                    >

                      <p className="text-sm text-zinc-500 mb-3">
                        Question {question.question_number}
                      </p>

                      <h3 className="text-lg font-medium leading-relaxed">
                        {question.question}
                      </h3>

                      {/* Answer */}
                      {question.answer ? (
                        <div className="mt-5">
                          <p className="text-sm text-zinc-500 mb-2">
                            Your Answer
                          </p>

                          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {question.answer}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3">
                          <p className="text-sm text-zinc-500">
                            No answer submitted for this question.
                          </p>
                        </div>
                      )}

                      {/* Score + Feedback */}
                      {question.score !== null &&
                        question.score !== undefined && (
                          <div className="mt-5 pt-5 border-t border-zinc-800">

                            <div className="flex items-center justify-between">

                              <p className="text-sm text-zinc-500">
                                AI Score
                              </p>

                              <p
                                className={`text-xl font-bold ${getScoreClass(
                                  question.score
                                )}`}
                              >
                                {question.score}/100
                              </p>

                            </div>

                            {question.feedback && (
                              <div className="mt-4">
                                <p className="text-sm text-zinc-500 mb-2">
                                  AI Feedback
                                </p>

                                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                  {question.feedback}
                                </p>
                              </div>
                            )}

                          </div>
                        )}

                    </div>
                  ))}

                </div>

                {/* Close */}
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="mt-7 w-full bg-white text-black rounded-xl py-3 font-semibold hover:bg-zinc-200"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

        {/* Start New Interview */}
        <div className="mt-10 text-center">

          <button
            onClick={() => {
              window.location.href = "/interview";
            }}
            className="bg-white text-black px-7 py-3 rounded-xl font-semibold hover:bg-zinc-200"
          >
            Start New Interview
          </button>

        </div>

      </div>
    </main>
  );
}