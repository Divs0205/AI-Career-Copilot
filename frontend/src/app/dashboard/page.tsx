"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

type Resume = {
  id: number;
  filename: string;
  uploaded_at: string;
};

type ResumeAnalysis = {
  skills: string[];
  strengths: string[];
  skill_gaps: string[];
  suitable_roles: string[];
  recommendations: string[];
};

type Job = {
  id: number;
  title: string;
  company: string | null;
};

type JobMatch = {
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
};

type SkillGap = {
  skill: string;
  importance: string;
  current_level: string;
  required_level: string;
  reason: string;
  learning_focus: string[];
};

type LearningItem = {
  topic: string;
  description: string;
  estimated_hours: number;
};

type LearningPlan = {
  skill: string;
  priority: string;
  goal: string;
  items: LearningItem[];
};

export default function DashboardPage() {
  const router = useRouter();

  const [resume, setResume] = useState<Resume | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [jobMatch, setJobMatch] = useState<JobMatch | null>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [learningPlans, setLearningPlans] = useState<LearningPlan[]>([]);

  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [resumeAnalysisLoading, setResumeAnalysisLoading] = useState(false);
  const [error, setError] = useState("");

  
  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }

      // Load user's resumes
      const resumesResponse = await fetch(
        `${API_URL}/resumes/`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
      );

      if (!resumesResponse.ok) {
        throw new Error("Failed to load resumes");
      }

      const resumesData: Resume[] = await resumesResponse.json();

      if (resumesData.length === 0) {
        throw new Error("No resumes found");
      }

      // Use the most recently uploaded resume
      const latestResume = resumesData.reduce(
        (latest, current) =>
            new Date(current.uploaded_at) > new Date(latest.uploaded_at)
            ? current
            : latest
      );

      setResume(latestResume);

      // Load overall resume analysis
      const analysisResponse = await fetch(
        `${API_URL}/resumes/${latestResume.id}/analysis`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (analysisResponse.ok) {
        const analysisData: ResumeAnalysis = await analysisResponse.json();
        setResumeAnalysis(analysisData);
      } else {
        setResumeAnalysis(null);
      }

      /*
       * Load jobs belonging to the logged-in user.
       */
      const jobsResponse = await fetch(
        `${API_URL}/jobs/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!jobsResponse.ok) {
        throw new Error("Failed to load jobs");
      }

      const jobsData = await jobsResponse.json();
      setJobs(jobsData);

      

      /*
       * Automatically select the first job.
       */
      if (jobsData.length > 0) {
        setSelectedJob(jobsData[0]);
        await loadAnalysis(jobsData[0], latestResume);
      }
    } catch (err) {
      setError("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function generateResumeAnalysis() {
  try {
    setResumeAnalysisLoading(true);
    setError("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!resume) {
      setError("No active resume found.");
      return;
    }

    const response = await fetch(
      `${API_URL}/resumes/${resume.id}/analyze`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate resume analysis");
    }

    const analysisData: ResumeAnalysis = await response.json();

    setResumeAnalysis(analysisData);
    } catch (err) {
    setError("Unable to generate resume analysis.");
    } finally {
    setResumeAnalysisLoading(false);
    }
  }

  async function loadAnalysis(job: Job, activeResume?: Resume) {
    try {
      setSelectedJob(job);
      setAnalysisLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        router.push("/login");
        return;
      }
      
      const currentResume = activeResume ?? resume;

      if (!resume) {
        setError("No active resume found.");
        return;
      }

      const resumeId = resume.id;


      /*
       * Load job match
       */
      const matchResponse = await fetch(
        `${API_URL}/jobs/${job.id}/match/${resumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (matchResponse.ok) {
        const matchData = await matchResponse.json();
        setJobMatch(matchData);
      } else {
        setJobMatch(null);
      }

      /*
       * Load skill gaps
       */
      const gapsResponse = await fetch(
        `${API_URL}/jobs/${job.id}/skill-gaps/${resumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (gapsResponse.ok) {
        const gapsData = await gapsResponse.json();
        setSkillGaps(gapsData.skill_gaps || []);
      } else {
        setSkillGaps([]);
      }

      /*
       * Load learning plan
       */
      const learningResponse = await fetch(
        `${API_URL}/jobs/${job.id}/learning-plan/${resumeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (learningResponse.ok) {
        const learningData = await learningResponse.json();
        setLearningPlans(learningData.plans || []);
      } else {
        setLearningPlans([]);
      }
    } catch (err) {
      setError("Unable to load career analysis.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function generateJobAnalysis(job: Job) {
  try {
    setAnalysisLoading(true);
    setError("");

    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!resume) {
      setError("No active resume found.");
      return;
    }

    const resumeId = resume.id;

    // 1. Generate Job Match
    const matchResponse = await fetch(
      `${API_URL}/jobs/${job.id}/match/${resumeId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!matchResponse.ok) {
      throw new Error("Failed to generate job match");
    }

    // 2. Generate Skill Gaps
    const gapsResponse = await fetch(
      `${API_URL}/jobs/${job.id}/skill-gaps/${resumeId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!gapsResponse.ok) {
      throw new Error("Failed to generate skill gaps");
    }

    // 3. Generate Learning Plan
    const learningResponse = await fetch(
      `${API_URL}/jobs/${job.id}/learning-plan/${resumeId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!learningResponse.ok) {
      throw new Error("Failed to generate learning plan");
    }

    // Reload all saved analysis
    await loadAnalysis(job);

    } catch (err) {
    setError("Unable to generate job analysis.");
    } finally {
    setAnalysisLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-zinc-500">
          Loading your career dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

          <div>
            <h1 className="text-2xl font-bold">
              AI Career Copilot
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Your personalized career dashboard
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={() => router.push("/interview")}
              className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              AI Mock Interview
            </button>

            <button
              onClick={() => router.push("/interviews")}
              className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Interview History
            </button>

            <button
              onClick={() => router.push("/copilot")}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Open AI Copilot
            </button>

          </div>

        </div>
      </header>


      {/* Main */}
      <div className="mx-auto max-w-7xl px-8 py-10">

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}


        {/* Resume + Jobs */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Resume */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Resume
              </h2>

              <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
                {resume ? `Resume #${resume.id}` : "No resume"}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">

              <p className="text-sm text-zinc-500">
                Active Resume
              </p>

              <p className="mt-2 font-medium">
                {resume?.filename}
              </p>

              <button
                onClick={() => router.push("/copilot")}
                className="mt-5 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
              >
                Ask Copilot About Resume
              </button>

            </div>

          </section>


          {/* Jobs */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-lg font-semibold">
                Target Jobs
              </h2>

              <span className="text-sm text-zinc-500">
                {jobs.length} job{jobs.length !== 1 ? "s" : ""}
              </span>

            </div>

            {jobs.length === 0 ? (

              <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">

                <p className="text-zinc-500">
                  No jobs added yet.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {jobs.map((job) => (

                  <button
                    key={job.id}
                    onClick={() => loadAnalysis(job)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedJob?.id === job.id
                        ? "border-zinc-500 bg-zinc-800"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                    }`}
                  >

                    <p className="font-medium">
                      {job.title}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {job.company || "Company not specified"}
                    </p>

                  </button>

                ))}

              </div>

            )}

          </section>

        </div>

        {/* Resume Analysis */}
        <section className="mt-8">
          <div className="mb-6">
            <p className="text-sm text-zinc-500">
              Overall Resume Assessment
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Resume Analysis
            </h2>
          </div>

          {!resumeAnalysis ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm text-zinc-500">
                No resume analysis available yet.
              </p>
              <button
                onClick={generateResumeAnalysis}
                disabled={resumeAnalysisLoading}
                className="mt-5 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50">
                {resumeAnalysisLoading
                  ? "Generating Analysis..."
                  : "Generate Resume Analysis"}
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Strengths */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="text-lg font-semibold">
                  Strengths
                </h3>

                <div className="mt-5 space-y-2">
                  {resumeAnalysis.strengths.map((strength) => (
                    <div
                      key={strength}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300"
                    >
                      {strength}
                    </div>
                  ))}
                </div>
              </div>

              {/* Suitable Roles */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="text-lg font-semibold">
                  Suitable Roles
                </h3>

                <div className="mt-5 flex flex-wrap gap-2">
                  {resumeAnalysis.suitable_roles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Resume Skill Gaps */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="text-lg font-semibold">
                  Resume Skill Gaps
                </h3>

                <div className="mt-5 flex flex-wrap gap-2">
                  {resumeAnalysis.skill_gaps.map((gap) => (
                    <span
                      key={gap}
                      className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300"
                    >
                      {gap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="text-lg font-semibold">
                  AI Recommendations
                </h3>

                <div className="mt-5 space-y-3">
                  {resumeAnalysis.recommendations.map((recommendation) => (
                    <div
                      key={recommendation}
                      className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-400"
                    >
                      {recommendation}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </section>
        
        {/* Selected Job */}
        {selectedJob && (

          <section className="mt-8">

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">

              <div>
                <p className="text-sm text-zinc-500">
                  Selected Opportunity
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  {selectedJob.title}
                </h2>

                <p className="mt-1 text-zinc-500">
                  {selectedJob.company || "Company not specified"}
                </p>
              </div>

              <button
                onClick={() => generateJobAnalysis(selectedJob)}
                disabled={analysisLoading}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50">
                {analysisLoading
                  ? "Generating Analysis..."
                  : "Generate Job Analysis"}
              </button>

            </div>


            {analysisLoading ? (

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">

                <p className="text-zinc-500">
                  Loading AI career analysis...
                </p>

              </div>

            ) : (

              <>

                {/* Match Score */}
                <div className="grid gap-6 md:grid-cols-3">

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                    <p className="text-sm text-zinc-500">
                      Job Match
                    </p>

                    <p className="mt-3 text-4xl font-bold">
                      {jobMatch
                        ? `${jobMatch.match_percentage}%`
                        : "—"}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Resume compatibility
                    </p>

                  </div>


                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                    <p className="text-sm text-zinc-500">
                      Matched Skills
                    </p>

                    <p className="mt-3 text-4xl font-bold">
                      {jobMatch
                        ? jobMatch.matched_skills.length
                        : "—"}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Relevant skills demonstrated
                    </p>

                  </div>


                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                    <p className="text-sm text-zinc-500">
                      Skill Gaps
                    </p>

                    <p className="mt-3 text-4xl font-bold">
                      {skillGaps.length}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Skills to improve
                    </p>

                  </div>

                </div>


                {/* Matched + Missing Skills */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                    <h3 className="text-lg font-semibold">
                      Matched Skills
                    </h3>

                    <div className="mt-5 flex flex-wrap gap-2">

                      {jobMatch?.matched_skills.map((skill) => (

                        <span
                          key={skill}
                          className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300"
                        >
                          {skill}
                        </span>

                      ))}

                    </div>

                  </div>


                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                    <h3 className="text-lg font-semibold">
                      Missing Skills
                    </h3>

                    <div className="mt-5 flex flex-wrap gap-2">

                      {jobMatch?.missing_skills.map((skill) => (

                        <span
                          key={skill}
                          className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300"
                        >
                          {skill}
                        </span>

                      ))}

                    </div>

                  </div>

                </div>


                {/* Skill Gaps */}
                <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                  <h3 className="text-xl font-semibold">
                    Skill Gap Analysis
                  </h3>

                  <div className="mt-6 space-y-4">

                    {skillGaps.length === 0 ? (

                      <p className="text-sm text-zinc-500">
                        No skill gaps found.
                      </p>

                    ) : (

                      skillGaps.map((gap,index) => (

                        <div
                          key={`${gap.skill}-${index}`}
                          className="rounded-xl border border-zinc-800 bg-zinc-950 p-5"
                        >

                          <div className="flex flex-wrap items-center justify-between gap-3">

                            <h4 className="font-semibold">
                              {gap.skill}
                            </h4>

                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
                              {gap.importance}
                            </span>

                          </div>

                          <p className="mt-3 text-sm text-zinc-400">
                            {gap.reason}
                          </p>

                          <p className="mt-3 text-sm text-zinc-500">
                            Current: {gap.current_level}
                            {" · "}
                            Required: {gap.required_level}
                          </p>

                        </div>

                      ))

                    )}

                  </div>

                </section>


                {/* Learning Plan */}
                <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">

                  <h3 className="text-xl font-semibold">
                    Personalized Learning Plan
                  </h3>

                  <div className="mt-6 space-y-6">

                    {learningPlans.length === 0 ? (

                      <p className="text-sm text-zinc-500">
                        No learning plan available yet.
                      </p>

                    ) : (

                      learningPlans.map((plan) => (

                        <div
                          key={plan.skill}
                          className="rounded-xl border border-zinc-800 bg-zinc-950 p-5"
                        >

                          <div className="flex flex-wrap items-center justify-between gap-3">

                            <h4 className="text-lg font-semibold">
                              {plan.skill}
                            </h4>

                            <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
                              {plan.priority}
                            </span>

                          </div>

                          <p className="mt-3 text-sm text-zinc-400">
                            {plan.goal}
                          </p>

                          <div className="mt-5 space-y-3">

                            {plan.items.map((item) => (

                              <div
                                key={item.topic}
                                className="rounded-lg border border-zinc-800 p-4"
                              >

                                <div className="flex items-center justify-between gap-3">

                                  <p className="font-medium">
                                    {item.topic}
                                  </p>

                                  <span className="text-xs text-zinc-500">
                                    {item.estimated_hours}h
                                  </span>

                                </div>

                                <p className="mt-2 text-sm text-zinc-500">
                                  {item.description}
                                </p>

                              </div>

                            ))}

                          </div>

                        </div>

                      ))

                    )}

                  </div>

                </section>


                {/* Copilot CTA */}
                <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">

                  <h3 className="text-2xl font-bold">
                    Need help with your career?
                  </h3>

                  <p className="mx-auto mt-3 max-w-xl text-zinc-500">
                    Ask your AI Career Copilot questions about your
                    resume, skills, career direction, and interview
                    preparation.
                  </p>

                  <button
                    onClick={() => router.push("/copilot")}
                    className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Open AI Career Copilot
                  </button>

                </section>

              </>

            )}

          </section>

        )}

      </div>

    </main>
  );
}