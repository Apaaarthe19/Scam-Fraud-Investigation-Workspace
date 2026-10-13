import { Link } from "react-router-dom";
import ScamChecker from "../components/ScamChecker.jsx";

const Home = () => (
  <div>
    <section className="hero-grid text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
        <div className="max-w-2xl">
          <p className="hero-label text-xs font-bold uppercase">Community intelligence / 2026</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] mt-4">Make the next scam harder to send.</h1>
          <p className="mt-6 text-[#c8e3de] max-w-xl text-base md:text-lg leading-relaxed">
            Search suspicious contacts, share what happened, and give your community the context it needs to act before money moves.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/report/new" className="bg-[#e05d46] text-white font-semibold px-5 py-3 rounded-md hover:bg-[#ef765e] transition-colors text-center">
              Report a scam
            </Link>
            <Link to="/reports" className="border border-white/40 px-5 py-3 rounded-md hover:bg-white/10 transition-colors text-center">
              Explore reports
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-2 text-sm text-[#b7d5d0]">
            <span><strong className="text-white">01</strong> Search first</span>
            <span><strong className="text-white">02</strong> Report clearly</span>
            <span><strong className="text-white">03</strong> Protect others</span>
          </div>
        </div>
        <div className="status-panel rounded-2xl p-6 md:p-7 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/15 pb-5">
            <span className="text-xs uppercase tracking-[0.16em] text-[#9bd8cf]">Network status</span>
            <span className="flex items-center gap-2 text-xs text-[#b7e7df]"><i className="h-2 w-2 rounded-full bg-[#65d6a3]" /> Live</span>
          </div>
          <p className="mt-7 text-4xl font-bold">One check can change a decision.</p>
          <p className="mt-3 text-sm leading-relaxed text-[#b7d5d0]">Our community turns scattered warnings into a searchable record of suspicious numbers, links, accounts, and patterns.</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="border border-white/15 rounded-lg p-3"><p className="text-2xl font-bold">24/7</p><p className="text-xs text-[#b7d5d0] mt-1">Open reporting</p></div>
            <div className="border border-white/15 rounded-lg p-3"><p className="text-2xl font-bold">1st</p><p className="text-xs text-[#b7d5d0] mt-1">Check before trust</p></div>
          </div>
        </div>
      </div>
    </section>

    <ScamChecker />

    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087f78]">Built for useful action</p>
          <h2 className="text-3xl font-bold mt-2">A clearer way to stay one step ahead.</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">From the first search to the final follow-up, every part of ScamWatch is designed to reduce uncertainty.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
      {[
        { number: "01", title: "Easy reporting", desc: "Submit scam details with evidence in minutes." },
        { number: "02", title: "Community verification", desc: "Others confirm reports to surface repeat scammers." },
        { number: "03", title: "Live dashboard", desc: "Track scam trends by category, region and status." },
        { number: "04", title: "Investigator tools", desc: "Admins verify, escalate and resolve cases." },
      ].map((f) => (
        <div key={f.title} className="feature-row flex gap-5 py-5">
          <div className="text-sm font-bold text-[#e05d46] pt-1">{f.number}</div>
          <div><h3 className="font-semibold text-lg">{f.title}</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{f.desc}</p></div>
        </div>
      ))}
      </div>
    </section>
  </div>
);

export default Home;
