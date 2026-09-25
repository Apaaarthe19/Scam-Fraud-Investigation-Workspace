# Scam & Fraud Investigation Workspace (MERN)

A community-driven platform to report, verify, and track scams/fraud cases.

## Tech Stack
- MongoDB + Mongoose
- Express.js
- React (Vite) + Tailwind CSS
- Node.js, JWT Auth

## Folder Structure
```
scam-fraud-workspace/
├── backend/
│   ├── config/db.js
│   ├── models/ (User, Report, Comment)
│   ├── controllers/ (auth, report, comment)
│   ├── routes/ (auth, reports, comments)
│   ├── middleware/ (auth, errorHandler)
│   ├── utils/generateToken.js
│   └── server.js
└── frontend/
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/ (Navbar, Footer, ReportCard, ProtectedRoute, LocationPicker)
        └── pages/ (Home, Login, Register, ReportScam, AllReports, ReportDetails, Dashboard, MapView)
```

## Setup

### Deploy with Render
The repository includes a `render.yaml` blueprint for a Render API service and a Render static frontend. Before deploying:

1. Create a MongoDB Atlas cluster and allow the deployment service to connect. Copy its connection string for `MONGO_URI`.
2. Push this repository to GitHub and create a new Render Blueprint from the repository.
3. Set the secret environment values requested by Render: `MONGO_URI`, `DEMO_ADMIN_EMAIL`, and `DEMO_ADMIN_PASSWORD`. Add SMTP or Twilio values only if alerts are needed.
4. Deploy both services. The frontend uses `https://scamwatch-api.onrender.com/api` and the API allows `https://scamwatch-web.onrender.com` as configured in `render.yaml`.
5. After deployment, run the admin seed against the hosted API's database from a secure local shell, or create the admin directly in the production database. Never use the documented demo password in production.

Evidence files currently use local disk storage. On hosts with ephemeral filesystems, uploaded evidence can disappear after a restart or redeploy; configure Cloudinary/S3 before relying on evidence in production.

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill MONGO_URI and JWT_SECRET
npm run dev
```

To enable delivery for contact alerts, copy the optional SMTP or Twilio settings from `backend/.env.example` into `backend/.env` and restart the backend. Email alerts require SMTP credentials. SMS alerts require a Twilio account, auth token, and sender number. Without provider settings, users can still create and manage subscriptions, but no message is sent.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Local demo admin
The public registration form creates regular users only. For local review testing, start MongoDB and run:

```bash
cd backend
npm run seed:admin
```

Demo login:

- Email: `admin@scamwatch.local`
- Password: `Admin@12345`

These defaults are for local development only. Set `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD` in the backend environment before using the seed command anywhere else.

### PWA placeholder icons
The frontend currently uses `frontend/public/pwa-192x192.svg` and `frontend/public/pwa-512x512.svg` as placeholder install icons. Replace these with branded production icons and update the paths in `frontend/vite.config.js` before release.

## Core Features
- JWT auth (register/login), role-based (user / investigator / admin), with rate-limited auth routes
- Create scam report with category, scammer contact info, amount lost, location
- **Evidence upload** — up to 5 images/PDFs per report (Multer, 5MB limit each), served via `/uploads`
- Browse + search + filter reports, pagination
- Community upvote/confirm on reports (flags repeat scammers)
- Comments on each report
- **Auto risk scoring (0-100)** — heuristic based on repeat reports, upvotes, and amount lost, shown on report detail page
- **Linked/duplicate reports** — reports sharing the same phone/email/website/UPI are auto-surfaced as "same scammer"
- **Public Quick Scam Check** — anyone can look up a phone/email/website/UPI on the homepage without login, no auth required
- **Phone/UPI alerts** — authenticated users can subscribe to email or SMS notifications when new active reports match a searched phone or UPI ID
- **Case timeline** — report submissions and investigator/admin status changes are recorded with timestamps, actor, and review notes
- **Audit exports** — admins and investigators can download a CSV containing report details, review notes, and the complete case timeline
- **Admin/Investigator panel** — table view to review and change report status in one click
- Dashboard with stats (by category, by status, total loss)
- Dark mode with saved/system theme preference
- Responsive Recharts dashboard visualizations
- **Leaflet hotspot map** — reports with pinned coordinates appear on an India-centered map, with category popups and links to full report details
- Installable PWA with offline caching for previously loaded reports and evidence
- **Security hardening** — express-validator on inputs, express-mongo-sanitize (NoSQL injection guard), rate limiting on report submission & auth
- Fully responsive UI (mobile menu, grid layouts, stacked forms on small screens)

### Using phone/UPI alerts
1. Log in and search a phone number or UPI ID with **Quick Scam Check** on the homepage.
2. Choose email or SMS and select **Enable alert**. Email uses the account email; SMS requires an international number such as `+919876543210`.
3. Alerts are sent when a matching report is created with `Pending Review`, `Verified`, or `Under Investigation` status. Existing active matches are also sent when the subscription is created.
4. Remove subscriptions from the same Quick Scam Check panel.

### Using the hotspot map
1. Open **Hotspot Map** from the main navigation.
2. Reports with latitude and longitude selected through the report location picker appear as clickable markers.
3. Select a marker to view the report title, category, and link to its full case details. Reports with only text-based locations remain available in the report list.

### Exporting an audit trail
1. Sign in as an administrator or investigator and open a report's details page.
2. Select **Download audit CSV** to export the report metadata, current status, admin review note, and every recorded status change.
3. Use the CSV for police complaints or internal investigations. Access is restricted to administrators and investigators.

## Feature Ideas to Extend Further
1. **Cloud storage** — move evidence uploads from local disk to Cloudinary/S3 for production.
2. **Map analytics** — add marker clustering, category/status filters, and regional hotspot summaries as the report volume grows.
3. **Notification preferences** — add digest frequency, browser push notifications, and per-contact status filters.
4. **AI scam-text checker** — paste an SMS/email, get a phishing-likelihood score (LLM call or heuristic model).
5. **Bulk audit exports** — export filtered investigation queues and multiple case timelines in one package.
6. **CAPTCHA on report/signup** — extra layer against bot abuse alongside rate limiting.
7. **Multi-language support** — Hindi/regional language toggle for wider reach in India.
8. **Export as PDF** — generate a formatted case report for police complaint (FIR) filing.
9. **Refresh tokens** — move beyond a single long-lived JWT for better session security.
10. **Unit/integration tests** — Jest + Supertest for backend, React Testing Library for frontend.
