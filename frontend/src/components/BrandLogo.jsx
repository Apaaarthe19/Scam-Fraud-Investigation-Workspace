const BrandLogo = ({ className = "", showName = true }) => (
  <span className={`brand-logo ${className}`}>
    <span className="brand-logo-mark" aria-hidden="true">
      <svg viewBox="0 0 40 44" role="img">
        <path className="brand-logo-shield" d="M20 2.5 36 8v11.2c0 10.1-6.3 18.2-16 22.3C10.3 37.4 4 29.3 4 19.2V8l16-5.5Z" />
        <path className="brand-logo-check" d="m11.5 22 5.2 5.2L28.8 15" />
        <path className="brand-logo-spark" d="m29.7 7.8.8 2.3 2.2.8-2.2.8-.8 2.3-.8-2.3-2.2-.8 2.2-.8.8-2.3Z" />
      </svg>
    </span>
    {showName && <span className="brand-logo-name">ScamWatch</span>}
  </span>
);

export default BrandLogo;
