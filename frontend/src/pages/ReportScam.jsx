import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import LocationPicker from "../components/LocationPicker.jsx";

const categories = [
  "Phishing", "UPI/Payment Fraud", "Job Scam", "Investment/Ponzi",
  "OTP/SIM Swap", "Fake Website/App", "Loan App Harassment", "Social Media Scam", "Other",
];

const ReportScam = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", category: "Other",
    amountLost: "", location: { text: "", lat: null, lng: null },
    scamContact: { phone: "", email: "", website: "", upiId: "" },
    isAnonymous: false,
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContactChange = (field, value) =>
    setForm({ ...form, scamContact: { ...form.scamContact, [field]: value } });

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 5);
    setFiles(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("amountLost", form.amountLost || 0);
      fd.append("location", JSON.stringify(form.location));
      fd.append("isAnonymous", form.isAnonymous);
      fd.append("scamContact", JSON.stringify(form.scamContact));
      files.forEach((f) => fd.append("evidence", f));

      const { data } = await api.post("/reports", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/reports/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit report. Please login first.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-1">🚨 Report a Scam</h2>
      <p className="text-gray-500 text-sm mb-6">Help protect others by sharing details of the scam you encountered.</p>

      {error && <p className="text-danger text-sm mb-4 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
        <input required placeholder="Title (e.g. Fake job offer scam)"
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <textarea required rows={4} minLength={10} placeholder="Describe what happened..."
          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select className="w-full border rounded-lg px-3 py-2"
            value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input type="number" min="0" placeholder="Amount lost (₹)"
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
            value={form.amountLost} onChange={(e) => setForm({ ...form, amountLost: e.target.value })} />
        </div>

        <LocationPicker location={form.location} onChange={(location) => setForm({ ...form, location })} />

        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <legend className="text-sm font-medium text-gray-600 dark:text-gray-300 px-1">Scammer Contact Info (if known)</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <input placeholder="Phone number" className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
              value={form.scamContact.phone} onChange={(e) => handleContactChange("phone", e.target.value)} />
            <input placeholder="Email" className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
              value={form.scamContact.email} onChange={(e) => handleContactChange("email", e.target.value)} />
            <input placeholder="Website/App" className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
              value={form.scamContact.website} onChange={(e) => handleContactChange("website", e.target.value)} />
            <input placeholder="UPI ID" className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
              value={form.scamContact.upiId} onChange={(e) => handleContactChange("upiId", e.target.value)} />
          </div>
        </fieldset>

        <div>
          <label className="text-sm font-medium text-gray-600">Evidence (screenshots/PDF, up to 5 files, 5MB each)</label>
          <input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileChange}
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 mt-1 text-sm" />
          {files.length > 0 && (
            <ul className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {files.map((f) => <li key={f.name}>📎 {f.name}</li>)}
            </ul>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input type="checkbox" checked={form.isAnonymous}
            onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} />
          Report anonymously
        </label>

        <button disabled={loading} className="w-full bg-brand-600 text-white py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-60">
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
};

export default ReportScam;
