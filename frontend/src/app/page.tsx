export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-xl font-bold">
          AI Career Copilot
        </div>

        <div className="flex gap-6 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#about" className="hover:text-white">
            About
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-24 text-center">
        <div className="inline-block rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-400 mb-8">
          AI-Powered Career Intelligence
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Your Career.
          <br />
          <span className="text-blue-500">
            Powered by AI.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto mt-8 text-lg text-zinc-400">
          AI Career Copilot helps you analyze your resume,
          discover skill gaps, find relevant opportunities,
          and prepare for interviews.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button className="rounded-full bg-white px-7 py-3 font-medium text-black hover:bg-zinc-200">
            Get Started
          </button>

          <button className="rounded-full border border-zinc-700 px-7 py-3 font-medium hover:bg-zinc-900">
            Explore Features
          </button>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-8 py-20"
      >
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need for your career
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            title="Resume Analysis"
            description="Upload your resume and let AI identify strengths, weaknesses, and improvements."
          />

          <FeatureCard
            title="Job Matching"
            description="Find jobs that match your skills, experience, interests, and career goals."
          />

          <FeatureCard
            title="Skill Gap Analysis"
            description="Discover the skills you need to learn for your target career or job."
          />

          <FeatureCard
            title="AI Interviewer"
            description="Practice realistic interviews and receive AI-powered feedback."
          />
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="max-w-4xl mx-auto px-8 py-20 text-center"
      >
        <h2 className="text-3xl font-bold mb-6">
          One Copilot for your entire career journey.
        </h2>

        <p className="text-zinc-400 text-lg leading-8">
          From understanding your current profile to identifying
          opportunities and preparing for interviews, AI Career
          Copilot brings everything together in one intelligent
          platform.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
        © 2026 AI Career Copilot. Built with Next.js, FastAPI,
        Machine Learning and Generative AI.
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-600 transition">
      <h3 className="text-xl font-semibold mb-3">
        {title}
      </h3>

      <p className="text-zinc-400 leading-7">
        {description}
      </p>
    </div>
  );
}