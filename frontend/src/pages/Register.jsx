import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <h2 className="text-xl font-bold mb-4">Create Account</h2>
        {error && <p className="text-danger text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required placeholder="Full Name"
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email" required placeholder="Email"
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password" required placeholder="Password" minLength={6}
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700">
            Sign Up
          </button>
        </form>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Already have an account? <Link to="/login" className="text-brand-600 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
