import { Link } from "react-router-dom";

const statusColor = {
  "Pending Review": "bg-yellow-100 text-yellow-800",
  "Verified": "bg-blue-100 text-blue-800",
  "Under Investigation": "bg-purple-100 text-purple-800",
  "Resolved": "bg-green-100 text-green-800",
  "Rejected": "bg-red-100 text-red-800",
};

const ReportCard = ({ report }) => (
  <Link
    to={`/reports/${report._id}`}
    className="block bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition p-4 border border-gray-100 dark:border-gray-800"
  >
    <div className="flex items-start justify-between gap-2">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{report.title}</h3>
      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusColor[report.status] || "bg-gray-100"}`}>
        {report.status}
      </span>
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{report.category}</p>
    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">{report.description}</p>
    <div className="flex items-center justify-between mt-3 text-xs text-gray-400 dark:text-gray-500">
      <span>👍 {report.upvotes?.length || 0} confirmations</span>
      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
    </div>
  </Link>
);

export default ReportCard;
