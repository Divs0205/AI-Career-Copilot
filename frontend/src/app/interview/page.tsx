"use client";

import { useEffect, useState } from "react";

type Resume = {
  id: number;
  filename: string;
};

type Job = {
  id: number;
  title: string;
  company: string;
};

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

type Evaluation = {
  score: number;
  feedback: string;
  next_question?: string | null;
};

const API_URL = "http://127.0.0.1:8000";

export default function InterviewPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [selectedResume, setSelectedResume] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedMode, setSelectedMode] = useState("Technical");

  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
    null
  );

  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // Load resumes and jobs
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const [resumeResponse, jobResponse] = await Promise.all([
          fetch(`${API_URL}/resumes/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/jobs/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (resumeResponse.ok) {
          const resumeData = await resumeResponse.json();
          setResumes(resumeData);

          if (resumeData.length > 0) {
            setSelectedResume(String(resumeData[0].id));
          }
        }

        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          setJobs(jobData);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load resumes or jobs.");
      }
    };

    loadData();
  }, []);

  // Start interview
  const startInterview = async () => {
    if (!selectedResume) {
      setError("Please select a resume.");
      return;
    }

    setLoading(true);
    setError("");
    setEvaluation(null);
    setFinished(false);
    setFinalScore(null);

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/interviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resume_id: Number(selectedResume),
          job_id: selectedJob ? Number(selectedJob) : null,
          mode: selectedMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to start interview.");
      }

      setInterview(data);

      if (data.questions && data.questions.length > 0) {
        setCurrentQuestion(data.questions[0]);
      }

      setAnswer("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start interview."
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = async () => {
    if (!interview || !currentQuestion) {
      return;
    }

    if (!answer.trim()) {
      setError("Please enter an answer before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/interviews/${interview.id}/questions/${currentQuestion.id}/answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answer: answer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to submit answer.");
      }

      setEvaluation(data);

      // Create the next question object
      if (data.next_question) {
        setCurrentQuestion({
            id: data.next_question_id,
            question_number: data.next_question_number,
            question: data.next_question,
        });

        setAnswer("");
      }else {
        // Question 5 has been answered.
        // Complete the interview automatically.
        await completeInterview();
      }

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit answer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Finish interview
  const completeInterview = async () => {
    if (!interview) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `${API_URL}/interviews/${interview.id}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to complete interview.");
      }

      setFinalScore(data.score);
      setFinished(true);
      setInterview(data);
      setCurrentQuestion(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete interview."
      );
    } finally {
      setLoading(false);
    }
  };

  // Finished screen
  if (finished) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-bold">
              Interview Complete 🎉
            </h1>
            <p className="text-zinc-400 mt-2">
              Here is your final mock interview result.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-zinc-400 text-lg">
              Overall Score
            </p>

            <div className="text-7xl font-bold mt-4">
              {finalScore ?? 0}
              <span className="text-3xl text-zinc-500">/100</span>
            </div>

            <p className="text-zinc-400 mt-6">
              Mode: {selectedMode}
            </p>

            <button
              onClick={() => {
                setInterview(null);
                setCurrentQuestion(null);
                setEvaluation(null);
                setAnswer("");
                setFinished(false);
                setFinalScore(null);
              }}
              className="mt-8 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200"
            >
              Start Another Interview
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            AI Mock Interviewer
          </h1>

          <p className="text-zinc-400 mt-2">
            Practice realistic interviews personalized to your resume and target role.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {/* Interview setup */}
        {!interview && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">
              Configure Your Interview
            </h2>

            <div className="grid md:grid-cols-2 gap-6">

              {/* Resume */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Resume
                </label>

                <select
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
                >
                  <option value="">Select a resume</option>

                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.filename}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Target Job (Optional)
                </label>

                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 outline-none"
                >
                  <option value="">No specific job</option>

                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {job.company}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode */}
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-3">
                  Interview Mode
                </label>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["HR", "Technical", "DSA", "AI/ML"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`rounded-xl border px-4 py-4 font-medium transition ${
                        selectedMode === mode
                          ? "border-white bg-white text-black"
                          : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={startInterview}
              disabled={loading}
              className="mt-8 w-full bg-white text-black rounded-xl py-3 font-semibold hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Starting Interview..." : "Start Interview"}
            </button>
          </div>
        )}

        {/* Active interview */}
        {interview && currentQuestion && (
          <div className="space-y-6">

            {/* Interview header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">
                  Interview #{interview.id}
                </p>

                <h2 className="text-xl font-semibold mt-1">
                  {selectedMode} Interview
                </h2>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                    <span>Interview Progress</span>
                    <span>
                      {Math.min(currentQuestion.question_number, 5)} / 5
                    </span>
                  </div>

                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (currentQuestion.question_number / 5) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={completeInterview}
                disabled={loading}
                className="border border-zinc-700 px-5 py-2 rounded-xl text-zinc-300 hover:bg-zinc-900"
              >
                Finish Interview
              </button>
            </div>

            {/* Question */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7">
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-zinc-500">
                  Question {currentQuestion.question_number} of 5
                </span>

                <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-400">
                  {selectedMode}
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-medium leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Answer */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7">
              <label className="block text-sm text-zinc-400 mb-3">
                Your Answer
              </label>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={8}
                disabled={submitting}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-4 resize-none outline-none focus:border-zinc-400"
              />

              <button
                onClick={submitAnswer}
                disabled={submitting}
                className="mt-4 w-full bg-white text-black rounded-xl py-3 font-semibold hover:bg-zinc-200 disabled:opacity-50"
              >
                {submitting
                  ? "AI is evaluating..."
                  : currentQuestion.question_number === 5
                  ? "Submit Final Answer"
                : "Submit Answer"}
              </button>
            </div>

            {/* Evaluation */}
            {evaluation && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-semibold">
                    AI Feedback
                  </h3>

                  <div className="text-3xl font-bold">
                    {evaluation.score}
                    <span className="text-lg text-zinc-500">
                      /100
                    </span>
                  </div>
                </div>

                <p className="text-zinc-300 leading-relaxed">
                  {evaluation.feedback}
                </p>

                {evaluation.next_question && (
                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <p className="text-sm text-zinc-500 mb-2">
                      Next Question
                    </p>

                    <p className="text-zinc-200">
                      {evaluation.next_question}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}