const Footer = () => (
  <footer className="bg-gray-900 dark:bg-black text-gray-300 text-sm mt-16">
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-2">
      <p>© {new Date().getFullYear()} ScamWatch — Scam & Fraud Investigation Workspace</p>
      <p className="text-gray-400">Report responsibly. Verify before you trust.</p>
    </div>
  </footer>
);

export default Footer;
