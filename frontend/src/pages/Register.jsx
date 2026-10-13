import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell from "../components/AuthShell.jsx";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthShell
      eyebrow="Join the watch"
      title="Create your account"
      description="Build a safer internet with better information, one report at a time."
      footerText="Already have an account?"
      footerLink="/login"
      footerLabel="Sign in"
    >
      {error && <p className="auth-error" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="register-name">Full name</label>
        <input
          id="register-name"
          required
          autoComplete="name"
          placeholder="Your full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <label htmlFor="register-email">Email address</label>
        <input
          id="register-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <label htmlFor="register-password">Create a password</label>
        <div className="auth-password-wrap">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <p className="auth-form-note">Use a unique password to keep your account protected.</p>
        <button className="auth-submit" type="submit">
          Create account <span aria-hidden="true">→</span>
        </button>
      </form>
    </AuthShell>
  );
};

export default Register;
