import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

const RiskBadge = ({ score }) => {
  const level = score >= 70 ? { label: "High Risk", color: "bg-red-100 text-danger" }
    : score >= 35 ? { label: "Medium Risk", color: "bg-yellow-100 text-warn" }
    : { label: "Low Risk", color: "bg-green-100 dark:bg-green-950/40 text-safe" };
  return (
    <div className={`rounded-lg px-3 py-2 text-sm font-medium ${level.color}`}>
      ⚠️ Risk Score: {score}/100 — {level.label}
    </div>
  );
};

const ReportDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [linkedReports, setLinkedReports] = useState([]);
  const [riskScore, setRiskScore] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [upvotes, setUpvotes] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const fetchData = async () => {
    const { data } = await api.get(`/reports/${id}`);
    setReport(data.report);
    setLinkedReports(data.linkedReports || []);
    setRiskScore(data.riskScore || 0);
    setUpvotes(data.report.upvotes?.length || 0);
    const { data: c } = await api.get(`/reports/${id}/comments`);
    setComments(c);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleUpvote = async () => {
    const { data } = await api.put(`/reports/${id}/upvote`);
    setUpvotes(data.upvotes);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const { data } = await api.post(`/reports/${id}/comments`, { text: commentText });
    setComments([data, ...comments]);
    setCommentText("");
  };

  const handleAuditExport = async () => {
    setExporting(true);
    setExportError("");
    try {
      const { data } = await api.get(`/reports/${id}/audit-export`, { responseType: "blob" });
      const downloadUrl = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `report-${id}-audit.csv`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setExportError(error.response?.status === 403
        ? "Only administrators and investigators can export audit records."
        : "Could not download the audit CSV. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (!report) return <p className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xl font-bold">{report.title}</h2>
          <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full w-fit">{report.status}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{report.category} • {typeof report.location === "string" ? report.location : report.location?.text || "Unknown location"}</p>

        <div className="mt-3"><RiskBadge score={riskScore} /></div>

        <p className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-line">{report.description}</p>

        {report.amountLost > 0 && (
          <p className="mt-3 text-sm text-danger font-medium">Amount lost: ₹{report.amountLost}</p>
        )}

        {(report.scamContact?.phone || report.scamContact?.email || report.scamContact?.website || report.scamContact?.upiId) && (
          <div className="mt-4 text-sm bg-gray-50 dark:bg-gray-950 rounded-lg p-3 space-y-1">
            {report.scamContact?.phone && <p>📞 {report.scamContact.phone}</p>}
            {report.scamContact?.email && <p>✉️ {report.scamContact.email}</p>}
            {report.scamContact?.website && <p>🌐 {report.scamContact.website}</p>}
            {report.scamContact?.upiId && <p>💳 {report.scamContact.upiId}</p>}
          </div>
        )}

        {report.evidenceUrls?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Evidence</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {report.evidenceUrls.map((url) => (
                <a key={url} href={`${API_BASE}${url}`} target="_blank" rel="noreferrer"
                  className="block border rounded-lg overflow-hidden hover:opacity-80">
                  {url.endsWith(".pdf") ? (
                    <div className="h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-sm">📄 PDF</div>
                  ) : (
                    <img src={`${API_BASE}${url}`} alt="evidence" className="h-24 w-full object-cover" />
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleUpvote} disabled={!user}
          className="mt-5 flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
          👍 Confirm this happened ({upvotes})
        </button>
        {(user?.role === "admin" || user?.role === "investigator") && (
          <button onClick={handleAuditExport} disabled={exporting}
            className="mt-3 flex items-center gap-2 border border-brand-200 text-brand-700 rounded-lg px-4 py-2 text-sm hover:bg-brand-50 disabled:opacity-50">
            {exporting ? "Preparing export..." : "Download audit CSV"}
          </button>
        )}
        {exportError && <p className="mt-2 text-sm text-danger" role="alert">{exportError}</p>}
      </div>

      {linkedReports.length > 0 && (
        <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            ⚠️ {linkedReports.length} other report(s) share this scammer's contact info
          </p>
          <ul className="mt-2 space-y-1">
            {linkedReports.map((lr) => (
              <li key={lr._id} className="text-sm">
                <Link to={`/reports/${lr._id}`} className="text-brand-600 hover:underline">{lr.title}</Link>
                <span className="text-gray-400 dark:text-gray-500"> — {lr.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.statusHistory?.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold">Case timeline</h3>
          <div className="mt-4 space-y-4">
            {[...report.statusHistory].reverse().map((event, index) => (
              <div key={`${event.changedAt}-${index}`} className="flex gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                <div className="min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{event.status}</p>
                    <span className="text-xs text-gray-400">{new Date(event.changedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Updated by {event.changedBy?.name || "Workspace investigator"}{event.changedBy?.role ? ` (${event.changedBy.role})` : ""}</p>
                  {event.note && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{event.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="mt-8">
        <h3 className="font-semibold mb-3">Comments ({comments.length})</h3>
        {user && (
          <form onSubmit={handleComment} className="flex gap-2 mb-4">
            <input
              className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
              placeholder="Add helpful info or a warning..."
              value={commentText} onChange={(e) => setCommentText(e.target.value)}
            />
            <button className="bg-brand-600 text-white px-4 rounded-lg">Post</button>
          </form>
        )}
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c._id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg p-3">
              <p className="text-sm font-medium">{c.user?.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;
