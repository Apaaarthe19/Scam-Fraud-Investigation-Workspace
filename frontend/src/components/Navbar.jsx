import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-brand-700 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="font-bold text-lg tracking-tight">
          🛡️ ScamWatch
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/reports" className="hover:text-brand-100">All Reports</Link>
          <Link to="/map" className="hover:text-brand-100">Hotspot Map</Link>
          <Link to="/report/new" className="hover:text-brand-100">Report a Scam</Link>
          {user && <Link to="/dashboard" className="hover:text-brand-100">Dashboard</Link>}
          {(user?.role === "admin" || user?.role === "investigator") && (
            <Link to="/admin" className="hover:text-brand-100">Admin</Link>
          )}
          <button onClick={toggleTheme} className="rounded-md border border-white/20 px-2.5 py-1.5 hover:bg-white/10" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? "☀" : "☾"}
          </button>
          {user ? (
            <button onClick={handleLogout} className="bg-brand-600 px-3 py-1.5 rounded-md hover:bg-brand-500">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="hover:text-brand-100">Login</Link>
              <Link to="/register" className="bg-brand-600 px-3 py-1.5 rounded-md hover:bg-brand-500">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-2xl" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-brand-600 px-4 pb-4 flex flex-col gap-3">
          <Link to="/reports" onClick={() => setOpen(false)}>All Reports</Link>
          <Link to="/map" onClick={() => setOpen(false)}>Hotspot Map</Link>
          <Link to="/report/new" onClick={() => setOpen(false)}>Report a Scam</Link>
          {user && <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>}
          {(user?.role === "admin" || user?.role === "investigator") && (
            <Link to="/admin" onClick={() => setOpen(false)}>Admin</Link>
          )}
          <button onClick={toggleTheme} className="flex items-center gap-2 text-left" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          {user ? (
            <button onClick={handleLogout} className="text-left">Logout</button>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
              <Link to="/register" onClick={() => setOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
