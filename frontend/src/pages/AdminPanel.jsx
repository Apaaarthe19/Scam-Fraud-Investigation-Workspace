import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const statuses = ["Pending Review", "Verified", "Under Investigation", "Resolved", "Rejected"];
const statusStyles = {
  "Pending Review": "bg-amber-50 text-amber-700",
  Verified: "bg-emerald-50 text-emerald-700",
  "Under Investigation": "bg-blue-50 text-blue-700",
  Resolved: "bg-slate-100 text-slate-700",
  Rejected: "bg-rose-50 text-rose-700",
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Pending Review");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [decisionId, setDecisionId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/reports/stats");
      setStats(data);
    } catch {
      setStats(null);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/reports", { params: { status: filterStatus, search, page, limit: 10 } });
      setReports(data.reports);
      setPages(Math.max(data.pages, 1));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => { fetchReports(); }, [filterStatus, page]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    fetchReports();
  };

  const handleReportSave = async (report) => {
    setSavingId(report._id);
    try {
      await api.put(`/reports/${report._id}/status`, {
        status: report.status,
        adminNote: noteDrafts[report._id] ?? report.adminNote ?? "",
      });
      setReports((prev) => prev.map((item) => (item._id === report._id ? { ...item, adminNote: noteDrafts[report._id] ?? item.adminNote } : item)));
    } finally {
      setSavingId(null);
    }
  };

  const handleDecision = async (report, status) => {
    setDecisionId(`${report._id}:${status}`);
    setError("");
    try {
      await api.put(`/reports/${report._id}/status`, {
        status,
        adminNote: noteDrafts[report._id] ?? report.adminNote ?? "",
      });
      setReports((prev) => filterStatus === "Pending Review"
        ? prev.filter((item) => item._id !== report._id)
        : prev.map((item) => item._id === report._id ? { ...item, status } : item));
      await fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${status === "Verified" ? "approve" : "reject"} this report.`);
    } finally {
      setDecisionId(null);
    }
  };

  if (user && user.role !== "admin" && user.role !== "investigator") {
    return <p className="text-center py-16 text-gray-500 dark:text-gray-400">Access denied — admins/investigators only.</p>;
  }

  return (
    <div className="admin-workspace max-w-7xl mx-auto px-4 py-8 md:py-10">
      <div className="admin-header flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-8">
        <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">Operations console</p><h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Report review queue</h2><p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Keep public scam intelligence accurate and actionable.</p></div>
        <span className="self-start md:self-auto rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">{user?.role === "admin" ? "Administrator" : "Investigator"}</span>
      </div>

      <div className="admin-metrics grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Metric label="Total reports" value={stats?.totalReports ?? "-"} detail="All submissions" />
        <Metric label="Awaiting review" value={stats?.byStatus?.find((item) => item._id === "Pending Review")?.count ?? 0} detail="Needs a decision" tone="amber" />
        <Metric label="Total reported loss" value={stats ? `₹${stats.totalLoss.toLocaleString()}` : "-"} detail="Across all reports" tone="rose" />
        <Metric label="Active categories" value={stats?.byCategory?.length ?? "-"} detail="Scam patterns tracked" tone="green" />
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
        <section className="admin-review-panel bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4"><div><h3 className="font-bold text-gray-900 dark:text-gray-100">Review requests</h3><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Approve trusted submissions or reject reports that need more evidence.</p></div><span className="text-xs text-gray-400">Page {page} of {pages}</span></div>
            <form onSubmit={submitSearch} className="flex flex-col sm:flex-row gap-2">
              <input className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Search reports..." value={search} onChange={(event) => setSearch(event.target.value)} />
              <button className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Search</button>
              <select className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm" value={filterStatus} onChange={(event) => { setPage(1); setFilterStatus(event.target.value); }}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
            </form>
          </div>

          {loading ? <p className="text-gray-500 dark:text-gray-400 p-8">Loading reports...</p> : error ? <p className="text-rose-600 p-8">{error}</p> : (
            <div className="overflow-x-auto">
              <table className="admin-review-table w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 text-left"><tr><th className="px-4 py-3 font-semibold">Report</th><th className="px-4 py-3 font-semibold">Reporter</th><th className="px-4 py-3 font-semibold">Impact</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Review note</th></tr></thead>
                <tbody>
                  {reports.map((report) => <tr key={report._id} className="border-t border-gray-100 dark:border-gray-800 align-top hover:bg-gray-50/70 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4 min-w-[220px]"><Link to={`/reports/${report._id}`} className="font-semibold text-brand-700 hover:underline">{report.title}</Link><p className="text-xs text-gray-400 mt-1">{report.category} · {new Date(report.createdAt).toLocaleDateString()}</p></td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{report.reportedBy?.name || "Anonymous"}</td>
                    <td className="px-4 py-4 whitespace-nowrap"><p className="font-semibold text-gray-800 dark:text-gray-200">₹{(report.amountLost || 0).toLocaleString()}</p><p className="text-xs text-gray-400">{report.upvotes?.length || 0} confirmations</p></td>
                    <td className="px-4 py-4 min-w-[190px]"><select className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${statusStyles[report.status] || "bg-gray-100 text-gray-700"} disabled:opacity-50`} value={report.status} disabled={savingId === report._id || decisionId?.startsWith(report._id)} onChange={(event) => setReports((prev) => prev.map((item) => item._id === report._id ? { ...item, status: event.target.value } : item))}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><button className="block text-xs text-brand-600 mt-2 hover:underline disabled:opacity-50" disabled={savingId === report._id || decisionId?.startsWith(report._id)} onClick={() => handleReportSave(report)}>{savingId === report._id ? "Saving..." : "Save status"}</button>{report.status === "Pending Review" && <div className="flex gap-2 mt-3"><button className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50" disabled={Boolean(decisionId)} onClick={() => handleDecision(report, "Verified")}>{decisionId === `${report._id}:Verified` ? "Approving..." : "Approve"}</button><button className="rounded-md bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50" disabled={Boolean(decisionId)} onClick={() => handleDecision(report, "Rejected")}>{decisionId === `${report._id}:Rejected` ? "Rejecting..." : "Reject"}</button></div>}</td>
                    <td className="px-4 py-4 min-w-[220px]"><textarea rows="2" className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-2.5 py-2 text-xs resize-none focus:border-brand-500 outline-none" placeholder="Add an internal note" value={noteDrafts[report._id] ?? report.adminNote ?? ""} onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [report._id]: event.target.value }))} /><button className="text-xs text-gray-500 dark:text-gray-400 mt-1 hover:text-brand-600 disabled:opacity-50" disabled={savingId === report._id} onClick={() => handleReportSave(report)}>Save note</button></td>
                  </tr>)}
                </tbody>
              </table>
              {reports.length === 0 && <p className="text-center text-gray-400 py-10">No reports match this queue.</p>}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 px-4 py-3"><button className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-700 disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>← Previous</button><button className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-700 disabled:opacity-40" disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)}>Next →</button></div>
        </section>

        <aside className="admin-queue-panel bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5"><h3 className="font-bold text-gray-900 dark:text-gray-100">Queue health</h3><p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-5">Current distribution by status.</p><div className="space-y-4">{statuses.map((status) => { const count = stats?.byStatus?.find((item) => item._id === status)?.count || 0; const percentage = stats?.totalReports ? (count / stats.totalReports) * 100 : 0; return <div key={status}><div className="flex justify-between text-xs mb-1.5"><span className="text-gray-600 dark:text-gray-300">{status}</span><span className="font-semibold text-gray-800 dark:text-gray-200">{count}</span></div><div className="h-2 bg-gray-100 dark:bg-gray-800 overflow-hidden"><div className="h-full bg-brand-500" style={{ width: `${percentage}%` }} /></div></div>; })}</div></aside>
      </div>
    </div>
  );
};

const Metric = ({ label, value, detail, tone = "blue" }) => {
  const tones = { blue: "border-brand-100 bg-brand-50", amber: "border-amber-100 bg-amber-50", rose: "border-rose-100 bg-rose-50", green: "border-emerald-100 bg-emerald-50" };
  return <div className={`admin-metric rounded-xl border p-4 ${tones[tone]}`}><p className="text-xs font-semibold text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900 mt-2 truncate">{value}</p><p className="text-xs text-gray-500 mt-1">{detail}</p></div>;
};

export default AdminPanel;
