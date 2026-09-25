import { useEffect, useState } from "react";
import api from "../api/axios.js";
import ReportCard from "../components/ReportCard.jsx";

const categories = [
  "All", "Phishing", "UPI/Payment Fraud", "Job Scam", "Investment/Ponzi",
  "OTP/SIM Swap", "Fake Website/App", "Loan App Harassment", "Social Media Scam", "Other",
];

const AllReports = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const params = { page };
        if (search) params.search = search;
        if (category !== "All") params.category = category;
        const { data } = await api.get("/reports", { params });
        setReports(data.reports);
        setPages(data.pages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [search, category, page]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6">All Scam Reports</h2>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          placeholder="Search reports..."
          className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 sm:w-56"
          value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No reports found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => <ReportCard key={r._id} report={r} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm ${p === page ? "bg-brand-600 text-white" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:text-gray-200"}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllReports;
