import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const categoryColors = ["#3b5bdb", "#e8590c", "#0ca678", "#ae3ec9", "#f08c00", "#c2255c", "#087f5b", "#5f3dc4", "#495057"];
const statusColors = { "Pending Review": "#f59f00", Verified: "#2f9e44", "Under Investigation": "#1971c2", Resolved: "#495057", Rejected: "#e03131" };

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/reports/stats").then(({ data }) => setStats(data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-1">Welcome back, {user?.name} 👋</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Here's an overview of scam activity across the platform.</p>

      {!stats ? (
        <p className="text-gray-500 dark:text-gray-400">Loading stats...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard label="Total Reports" value={stats.totalReports} color="bg-brand-50 text-brand-700" />
            <StatCard label="Total Loss Reported" value={`₹${stats.totalLoss.toLocaleString()}`} color="bg-red-50 text-danger" />
            <StatCard label="Categories" value={stats.byCategory.length} color="bg-purple-50 text-purple-700" />
            <StatCard label="Statuses" value={stats.byStatus.length} color="bg-green-50 text-safe" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold mb-3">By Category</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.byCategory.map((item) => ({ name: item._id, value: item.count }))} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>
                      {stats.byCategory.map((item, index) => <Cell key={item._id} fill={categoryColors[index % categoryColors.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ color: "#6b7280", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold mb-3">By Status</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byStatus.map((item) => ({ name: item._id, reports: item.count }))} layout="vertical" margin={{ left: 12, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke="#9ca3af" fontSize={12} />
                    <YAxis type="category" dataKey="name" width={112} stroke="#9ca3af" fontSize={11} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="reports" radius={[0, 3, 3, 0]}>
                      {stats.byStatus.map((item) => <Cell key={item._id} fill={statusColors[item._id] || "#3b5bdb"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className={`rounded-xl p-4 ${color}`}>
    <p className="text-xs font-medium opacity-80">{label}</p>
    <p className="text-xl md:text-2xl font-bold mt-1">{value}</p>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"><p className="font-semibold">{label || payload[0].name}</p><p className="mt-1 text-gray-600 dark:text-gray-300">Reports: {payload[0].value}</p></div>;
};

export default Dashboard;
