import { Link } from "react-router-dom";
import ScamChecker from "../components/ScamChecker.jsx";

const Home = () => (
  <div>
    {/* Hero */}
    <section className="bg-gradient-to-br from-brand-700 to-brand-500 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          Spot. Report. Stop Scams Together.
        </h1>
        <p className="mt-4 text-brand-50 max-w-xl mx-auto text-sm md:text-base">
          A community-driven workspace to report, verify, and investigate scams &
          fraud — protecting people before they become victims.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/report/new" className="bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg hover:bg-brand-50 w-full sm:w-auto">
            🚨 Report a Scam
          </Link>
          <Link to="/reports" className="border border-white px-6 py-3 rounded-lg hover:bg-white/10 w-full sm:w-auto">
            🔍 Browse Reports
          </Link>
        </div>
      </div>
    </section>

    <ScamChecker />

    {/* Features */}
    <section className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { icon: "📝", title: "Easy Reporting", desc: "Submit scam details with evidence in minutes." },
        { icon: "✅", title: "Community Verification", desc: "Others confirm reports to flag repeat scammers." },
        { icon: "📊", title: "Live Dashboard", desc: "Track scam trends by category, region & status." },
        { icon: "🕵️", title: "Investigator Tools", desc: "Admins verify, escalate, and resolve cases." },
      ].map((f) => (
        <div key={f.title} className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 text-center">
          <div className="text-3xl">{f.icon}</div>
          <h3 className="font-semibold mt-2">{f.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{f.desc}</p>
        </div>
      ))}
    </section>
  </div>
);

export default Home;
