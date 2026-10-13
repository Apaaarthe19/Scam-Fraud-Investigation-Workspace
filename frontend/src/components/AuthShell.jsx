import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo.jsx";

const AuthShell = ({
  eyebrow,
  title,
  description,
  children,
  footerText,
  footerLink,
  footerLabel,
}) => (
  <section className="auth-page">
    <div className="auth-shell">
      <aside className="auth-showcase">
        <Link to="/" className="auth-brand" aria-label="ScamWatch home">
          <BrandLogo />
        </Link>

        <div className="auth-showcase-copy">
          <p className="auth-eyebrow">Community-powered protection</p>
          <h1>Turn uncertainty into clarity.</h1>
          <p>
            Investigate suspicious activity, share verified reports, and help
            people make safer decisions online.
          </p>
        </div>

        <div className="auth-trust-list" aria-label="ScamWatch benefits">
          <div className="auth-trust-item">
            <span className="auth-trust-icon" aria-hidden="true">✓</span>
            <span>Spot patterns before they become losses</span>
          </div>
          <div className="auth-trust-item">
            <span className="auth-trust-icon" aria-hidden="true">⌁</span>
            <span>Learn from real community reports</span>
          </div>
        </div>

        <span className="auth-showcase-orb auth-showcase-orb-one" aria-hidden="true" />
        <span className="auth-showcase-orb auth-showcase-orb-two" aria-hidden="true" />
      </aside>

      <div className="auth-form-panel">
        <div className="auth-form-content">
          <div className="auth-mobile-brand">
            <BrandLogo />
          </div>
          <p className="auth-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="auth-description">{description}</p>
          {children}
          <p className="auth-switch">
            {footerText}{" "}
            <Link to={footerLink}>{footerLabel}</Link>
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default AuthShell;
