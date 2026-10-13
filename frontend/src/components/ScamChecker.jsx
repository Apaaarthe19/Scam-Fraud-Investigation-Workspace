import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const getRiskLevel = (score, found) => {
  if (!found) return { label: "No known reports", tone: "safe", summary: "We found no matching scam reports in the community database." };
  if (score >= 70) return { label: "High risk", tone: "danger", summary: "This contact has strong signals associated with reported scams." };
  if (score >= 35) return { label: "Medium risk", tone: "warn", summary: "There are warning signals. Verify independently before responding." };
  return { label: "Low risk", tone: "safe", summary: "A small number of reports were found, so keep normal precautions in place." };
};

const formatDate = (date) => new Date(date).toLocaleDateString(undefined, {
  year: "numeric", month: "short", day: "numeric",
});

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const isPhoneValue = (contactValue) => /^\\+?[0-9 ()-]{7,}$/.test(contactValue.trim());
const isUpiValue = (contactValue) => /^[^\\s@]+@[^\\s@]+$/.test(contactValue.trim());

const hashPassword = async (password) => {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-1", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
};

const ScamChecker = () => {
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [checkMode, setCheckMode] = useState("contact");
  const [messageText, setMessageText] = useState("");
  const [messageResult, setMessageResult] = useState(null);
  const [password, setPassword] = useState("");
  const [passwordResult, setPasswordResult] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [channel, setChannel] = useState("email");
  const [frequency, setFrequency] = useState("instant");
  const [subscriptions, setSubscriptions] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);

  const loadSubscriptions = async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/alerts");
      setSubscriptions(data);
    } catch {
      setSubscriptions([]);
    }
  };

  const subscribeToAlerts = async () => {
    const contactType = isPhoneValue(value) ? "phone" : "upiId";
    const destination = channel === "email" ? user.email : "";
    if (channel === "sms") {
      const phone = window.prompt("Enter your phone number in international format, for example +919876543210");
      if (!phone) return;
      setAlertLoading(true);
      try {
        const { data } = await api.post("/alerts", { contactType, contactValue: value.trim(), channel, frequency, destination: phone.trim() });
        setSubscriptions((current) => [data.subscription, ...current]);
        setAlertMessage(data.activeReportCount ? `Alert enabled. ${data.activeReportCount} active report(s) already match this contact.` : "Alert enabled for new active reports.");
      } catch (err) {
        setAlertMessage(err.response?.data?.message || "Could not enable this alert.");
      } finally {
        setAlertLoading(false);
      }
      return;
    }

    setAlertLoading(true);
    try {
      const { data } = await api.post("/alerts", { contactType, contactValue: value.trim(), channel, frequency, destination });
      setSubscriptions((current) => [data.subscription, ...current]);
      setAlertMessage(data.activeReportCount ? `Alert enabled. ${data.activeReportCount} active report(s) already match this contact.` : "Alert enabled for new active reports.");
    } catch (err) {
      setAlertMessage(err.response?.data?.message || "Could not enable this alert.");
    } finally {
      setAlertLoading(false);
    }
  };

  const removeAlert = async (subscriptionId) => {
    try {
      await api.delete(`/alerts/${subscriptionId}`);
      setSubscriptions((current) => current.filter((subscription) => subscription._id !== subscriptionId));
    } catch {
      setAlertMessage("Could not remove this alert.");
    }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/reports/lookup", { params: { value: value.trim() } });
      setResult(data);
      setAlertMessage("");
      await loadSubscriptions();
    } catch {
      setResult(null);
      setError("The safety check could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMessageCheck = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/reports/text-check", { text: messageText });
      setMessageResult(data);
    } catch (err) {
      setMessageResult(null);
      setError(err.response?.data?.message || "The message check could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordCheck = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    setPasswordResult(null);
    try {
      const hash = await hashPassword(password);
      const prefix = hash.slice(0, 5);
      const suffix = hash.slice(5);
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { "Add-Padding": "true" },
      });
      if (!response.ok) throw new Error("Password safety service unavailable");
      const match = (await response.text())
        .split("\n")
        .map((line) => line.trim().split(":"))
        .find(([hashSuffix]) => hashSuffix === suffix);
      setPasswordResult({ count: Number(match?.[1] || 0) });
      setPassword("");
    } catch {
      setError("The password check could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const risk = result && getRiskLevel(result.riskScore, result.found);

  return (
    <section className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Safety intelligence</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">Check a contact before you trust it</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Search a phone number, email, website or UPI ID against community reports.</p>
            </div>
            <span className="hidden sm:block text-2xl" aria-hidden="true">⌕</span>
          </div>
          <div className="flex gap-2 mt-5 border-b border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setCheckMode("contact")} className={`pb-2 text-sm font-semibold ${checkMode === "contact" ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500"}`}>Check contact</button>
            <button type="button" onClick={() => setCheckMode("message")} className={`pb-2 text-sm font-semibold ${checkMode === "message" ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500"}`}>Check message</button>
            <button type="button" onClick={() => setCheckMode("password")} className={`pb-2 text-sm font-semibold ${checkMode === "password" ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500"}`}>Check password</button>
          </div>
          {checkMode === "contact" ? <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-2 mt-5">
          <input
            placeholder="Enter phone / email / website / UPI ID"
            aria-label="Contact to check"
            className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            value={value} onChange={(e) => setValue(e.target.value)}
          />
          <button disabled={loading} className="bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-60">
            {loading ? "Checking..." : "Check"}
          </button>
          </form> : checkMode === "message" ? <form onSubmit={handleMessageCheck} className="mt-5 space-y-2">
            <textarea rows={4} placeholder="Paste a suspicious SMS, email, or chat message" aria-label="Message to check" className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-3" value={messageText} onChange={(e) => setMessageText(e.target.value)} />
            <button disabled={loading} className="bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-60">{loading ? "Analyzing..." : "Analyze message"}</button>
          </form> : <form onSubmit={handlePasswordCheck} className="mt-5 space-y-2">
            <input
              type="password"
              required
              autoComplete="off"
              placeholder="Enter a password to check"
              aria-label="Password to check"
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Your password is hashed in this browser. Only a partial hash is sent to HIBP.</p>
            <button disabled={loading} className="bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-60">{loading ? "Checking..." : "Check password"}</button>
          </form>}
          {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
        </div>

        {passwordResult && (
          <div className={`border-t p-5 sm:p-7 ${passwordResult.count ? "bg-red-50 border-red-100" : "bg-[#e8f5f3] border-[#b9ded8] dark:bg-[#173b3d] dark:border-[#2c6664]"}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Password exposure result</p>
            {passwordResult.count ? (
              <p className="text-sm text-red-800 mt-2">
                This password appeared in known data breaches <strong>{passwordResult.count.toLocaleString()}</strong> times. Change it immediately and do not reuse it.
              </p>
            ) : (
              <p className="text-sm text-[#075c5b] dark:text-[#b7e7df] mt-2">
                No exposure was found in the HIBP corpus. Continue using a unique password for every account.
              </p>
            )}
          </div>
        )}

        {messageResult && <div className="border-t border-gray-200 dark:border-gray-700 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-gray-500">Heuristic assessment</p><p className="text-xl font-bold mt-1">{messageResult.label}</p></div><span className="text-2xl font-bold text-brand-700">{messageResult.score}/100</span></div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{messageResult.advice}</p>
          {messageResult.signals.length > 0 && <ul className="mt-4 list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">{messageResult.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul>}
        </div>}

        {result && (
          <div className={`border-t ${risk.tone === "danger" ? "bg-red-50/70 border-red-100" : risk.tone === "warn" ? "bg-amber-50/70 border-amber-100" : "bg-emerald-50/70 border-emerald-100"} p-5 sm:p-7`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Assessment for</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 break-all mt-1">{result.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{risk.summary}</p>
              </div>
              <div className={`shrink-0 rounded-xl px-4 py-3 text-center ${risk.tone === "danger" ? "bg-red-100 text-red-800" : risk.tone === "warn" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                <p className="text-2xl font-bold">{result.riskScore}/100</p>
                <p className="text-xs font-bold uppercase tracking-wide">{risk.label}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[
                ["Reports", result.reportCount],
                ["Confirmations", result.totalUpvotes],
                ["Reported loss", formatCurrency(result.totalLoss)],
                ["Categories", result.categories.length],
              ].map(([label, statistic]) => (
                <div key={label} className="bg-white/80 dark:bg-gray-900/70 border border-white dark:border-gray-700 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100 mt-1">{statistic}</p>
                </div>
              ))}
            </div>

            {result.liveSignals?.length > 0 && <div className="mt-6 border-t border-gray-200/70 dark:border-gray-700 pt-5">
              <p className="font-semibold text-gray-800 dark:text-gray-200">Live intelligence signals</p>
              <div className="mt-2 space-y-2">{result.liveSignals.map((signal) => <div key={`${signal.source}-${signal.type}-${signal.lastSeen}`} className="bg-white/80 dark:bg-gray-900/70 border border-white dark:border-gray-700 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"><p className="text-sm font-semibold">{signal.title}</p><span className="text-xs text-gray-500">{signal.source} · {signal.confidence}% confidence</span></div>
                {signal.description && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{signal.description}</p>}
                <p className="text-xs text-gray-500 mt-1">Risk score {signal.riskScore}/100 · Seen {formatDate(signal.lastSeen)}</p>
              </div>)}</div>
            </div>}

            <div className="grid md:grid-cols-2 gap-4 mt-6 text-sm">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">Signals found</p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Categories: {result.categories.join(", ") || "None"}</p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Statuses: {result.statuses.join(", ") || "None"}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">What to do next</p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">Never share OTPs or send money based only on an incoming message or call.</p>
              </div>
            </div>

            {user && (isPhoneValue(result.value) || isUpiValue(result.value)) ? (
              <div className="mt-6 border-t border-gray-200/70 dark:border-gray-700 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Get alerts for this contact</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">We will notify you when an active report matches this phone or UPI ID.</p>
                  </div>
                  <select value={channel} onChange={(event) => setChannel(event.target.value)} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 rounded-lg px-3 py-2 text-sm">
                    <option value="email">Email: {user.email}</option>
                    <option value="sms">SMS</option>
                  </select>
                  <select value={frequency} onChange={(event) => setFrequency(event.target.value)} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 rounded-lg px-3 py-2 text-sm" aria-label="Alert frequency">
                    <option value="instant">Instant alerts</option>
                    <option value="daily">Daily alerts</option>
                  </select>
                  <button type="button" onClick={subscribeToAlerts} disabled={alertLoading || !value.trim()} className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
                    {alertLoading ? "Enabling..." : "Enable alert"}
                  </button>
                </div>
                {alertMessage && <p className="mt-2 text-xs text-brand-700 dark:text-brand-300">{alertMessage}</p>}
                {subscriptions.length > 0 && <div className="mt-3 space-y-1">
                  {subscriptions.map((subscription) => <div key={subscription._id} className="flex items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-300">
                    <span className="break-all">{subscription.channel.toUpperCase()} alerts: {subscription.contactValue}</span>
                    <button type="button" onClick={() => removeAlert(subscription._id)} className="text-danger hover:underline shrink-0">Remove</button>
                  </div>)}
                </div>}
              </div>
            ) : user ? null : <p className="mt-6 border-t border-gray-200/70 dark:border-gray-700 pt-5 text-sm text-gray-600 dark:text-gray-300"><Link to="/login" className="text-brand-700 font-semibold hover:underline">Log in</Link> to receive email or SMS alerts for this contact.</p>}

            {result.reports.length > 0 && <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-800 dark:text-gray-200">Matching reports</p>
                <span className="text-xs text-gray-500">All {result.reports.length} result(s)</span>
              </div>
              <div className="space-y-2">
                {result.reports.map((report) => (
                  <Link key={report._id} to={`/reports/${report._id}`} className="block bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg p-3 hover:border-brand-300 hover:shadow-sm transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="font-semibold text-brand-700">{report.title}</p>
                      <span className="text-xs text-gray-500">{formatDate(report.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                      <span className="dark:text-gray-300">{report.category}</span><span className="dark:text-gray-300">{report.status}</span><span className="dark:text-gray-300">{report.upvotes?.length || 0} confirmations</span><span className="dark:text-gray-300">{formatCurrency(report.amountLost)} lost</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      {report.location && <span>Location: {typeof report.location === "string" ? report.location : report.location.text || "Pinned location"}</span>}
                      {Object.entries(report.scamContact || {}).filter(([, contactValue]) => contactValue).map(([contactType, contactValue]) => (
                        <span key={contactType}>{contactType}: {contactValue}</span>
                      ))}
                    </div>
                    {report.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{report.description}</p>}
                  </Link>
                ))}
              </div>
            </div>}
          </div>
        )}
      </div>
    </section>
  );
};

export default ScamChecker;
