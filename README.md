# StocksX 📈

A modern, full-featured Indonesian stock market information platform built for retail investors. Explore real-time market data, track your favorite stocks, analyze broker activities, and stay informed with the latest financial news.

> **⚠️ Demo Project** — This is a demonstration application with static/mock data for educational purposes only. Not affiliated with any licensed broker or financial institution.

![Nuxt](https://img.shields.io/badge/Nuxt-4.3-00DC82?logo=nuxt.js)
![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)

## ✨ Key Features

### 📊 Market Analysis
- **Live Stock Data** — Real-time price tracking with interactive charts
- **Technical Indicators** — RSI, MACD, Bollinger Bands, and more
- **Broker Activity** — Track institutional buying and selling patterns
- **Foreign vs Domestic** — Monitor capital flow between foreign and local investors
- **Market Heatmap** — Visualize sector performance at a glance
- **Order Book** — Real-time bid/ask depth analysis

### 📰 News & Information
- **News Feed** — Curated financial news categorized by Market, Stocks, Economy, and Education
- **Economic Indicators** — Indonesian macro data (inflation, GDP, interest rates, etc.)
- **Sector Analysis** — Industry-specific performance metrics

### 🔐 User Features
- **Watchlist** — Save and track your favorite stocks with localStorage persistence
- **Price Alerts** — Set custom price notifications for stocks
- **User Authentication** — Cloudflare-native registration/login with D1-backed server sessions
- **Role-based Access** — User, Admin, and Super Admin roles resolved from D1 on every request
- **Profile Management** — Server-authoritative profile backed by the account record

### 🎨 User Experience
- **Responsive Design** — Mobile-first approach with adaptive layouts
- **Dark/Light Mode** — System-aware theme switching
- **Internationalization** — Bahasa Indonesia and English support
- **Search** — Quick command palette for finding stocks
- **Accessibility** — WCAG 2.1 compliant components

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Nuxt 4.3, Vue 3, TypeScript |
| **Styling** | Tailwind CSS v3, shadcn-vue (New York / zinc) |
| **State Management** | Pinia, localStorage |
| **Charts** | Chart.js, vue-chartjs |
| **Icons** | Lucide Vue Next |
| **Date Handling** | v-calendar |
| **Internationalization** | @nuxtjs/i18n |
| **Code Quality** | Biome (formatter + linter), Vitest |
| **Data** | Cloudflare D1 (accounts, sessions, ownership records) |
| **Deployment** | Cloudflare Workers with static assets and Nitro APIs |

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/stocksX.git
cd stocksX

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

Account flows need two bindings. The D1 database is created by the migration
command below, and password hashing needs a pepper of at least 32 characters.
Copy `.env.example` to `.dev.vars` for `wrangler dev`, or pass the same values
with `--var PASSWORD_PEPPER:<value>`:

```bash
npx wrangler d1 migrations apply DB --local
printf 'PASSWORD_PEPPER=local-development-pepper-value-000000000000\n' > .dev.vars
```

Production uses a different pepper, provisioned as a Worker secret. Never reuse
the development value in production.

### Available Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run deploy       # Build and deploy to Cloudflare Workers
npm run generate     # Generate static site → .output/public/
npm run preview      # Preview production build
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
npm test             # Run unit tests
npm run test:integration  # Build the Worker, then run the D1/Workers integration suite
npm run test:all     # Unit + integration suites

```

## 📁 Project Structure

```
stocksX/
├── app/
│   ├── pages/                   # File-based routing
│   │   ├── index.vue            # Home / Dashboard
│   │   ├── watchlist.vue        # User watchlist
│   │   ├── indicators.vue       # Economic indicators
│   │   ├── settings.vue         # App settings
│   │   ├── stocks/
│   │   │   └── [ticker]/        # Stock detail pages
│   │   │       └── index.vue    # Stock overview, charts, broker activity
│   │   ├── news/
│   │   │   ├── index.vue        # News feed
│   │   │   └── [id].vue         # Article detail
│   │   ├── auth/
│   │   │   ├── login.vue        # Login page
│   │   │   └── register.vue     # Registration page
│   │   ├── profile.vue          # User profile
│   │   └── admin/
│   │       └── index.vue        # Admin dashboard (role-protected)
│   │
│   ├── components/              # Auto-imported components
│   │   ├── home/                # Dashboard widgets
│   │   │   ├── MarketOverview.vue
│   │   │   ├── TopMovers.vue
│   │   │   ├── SectorHeatmap.vue
│   │   │   └── TrendingStocks.vue
│   │   ├── stock/               # Stock detail components
│   │   │   ├── Chart.vue
│   │   │   ├── ChartPro.vue     # Advanced TradingView-style chart
│   │   │   ├── BrokerActivity.vue
│   │   │   ├── BrokerSummary.vue
│   │   │   ├── ForeignDomestic.vue
│   │   │   ├── Orderbook.vue
│   │   │   ├── TradeBook.vue
│   │   │   ├── HistoricalData.vue
│   │   │   └── PriceAlert.vue
│   │   ├── watchlist/
│   │   ├── news/
│   │   ├── indicators/
│   │   ├── layout/              # Layout components
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppSidebar.vue
│   │   │   └── AppBottomNav.vue
│   │   ├── shared/              # Reusable components
│   │   │   ├── SearchCommand.vue
│   │   │   ├── PriceChange.vue
│   │   │   └── StockTicker.vue
│   │   └── ui/                  # shadcn-vue primitives
│   │
│   ├── composables/             # Composition API utilities
│   │   ├── useStocks.ts
│   │   ├── useNews.ts
│   │   ├── useIndicators.ts
│   │   ├── useApiFetch.ts
│   │   └── useRoleVariant.ts
│   │
│   ├── stores/                  # Pinia stores
│   │   ├── watchlist.ts         # Watchlist state management
│   │   └── user.ts              # User authentication state
│   │
│   ├── data/                    # Static mock data
│   │   ├── stocks.ts
│   │   ├── stockHistory.ts
│   │   ├── brokerActivity.ts
│   │   ├── news.ts
│   │   ├── indicators.ts
│   │   └── sectors.ts
│   │
│   ├── lib/                     # Utility functions
│   │   └── legacy-auth.ts       # One-time purge of pre-migration client auth state
│   │
│   ├── plugins/
│   │   └── auth.client.ts       # Purges legacy state, then restores the server session
│   │
│   ├── middleware/              # Route middleware
│   │   ├── auth.global.ts       # Server-verified session guard
│   │   └── admin.ts             # Admin role guard for /admin
│   │
│   └── layouts/                 # Layout templates
│       ├── default.vue
│       └── blank.vue
│
├── server/                      # Nitro API routes and utilities
│   ├── api/
│   │   ├── auth/                # register, login, logout, session
│   │   ├── admin/               # Role-protected account listing
│   │   └── stocks/[ticker]/     # Market + ownership endpoints
│   ├── utils/accounts.ts        # Password hashing, sessions, rate limits, queries
│   └── types/cloudflare.d.ts    # D1, rate-limit, and Workers context types
│
├── migrations/                  # D1 schema migrations
│   └── 0001_initial_schema.sql
│
├── i18n/                        # Internationalization
│   └── locales/
│       ├── id.json              # Bahasa Indonesia (default)
│       └── en.json              # English
│
├── public/                      # Static assets
├── nuxt.config.ts               # Nuxt configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── components.json              # shadcn-vue configuration
```
## 🔐 Authentication & Authorization

Accounts and sessions are owned entirely by the Cloudflare deployment: Nitro API routes on the Worker, state in Cloudflare D1. There is no Firebase, Google, or external authentication backend, and no browser-side JWT.

### Authentication Flow
1. `POST /api/auth/register` creates an account and returns `201` with a success result. It never creates a session; the register page redirects to the localized login page with a registration notice.
2. `POST /api/auth/login` verifies the password in the Worker and issues an opaque session token, sent as an `HttpOnly` cookie and stored in D1 only as a SHA-256 digest.
3. `GET /api/auth/session` is the authoritative profile source. Route middleware and the auth plugin restore from it; expired or revoked sessions return `401`.
4. `POST /api/auth/logout` deletes the presented session row and clears the cookie. Replaying the old token fails; a logout without a session stays idempotent.

### Credential and Session Rules
- Passwords are hashed in the Worker with PBKDF2-HMAC-SHA256 at 100,000 iterations over `HMAC-SHA256(pepper, password)`, with a random 16-byte salt per account and a 32-byte derived key. Unknown emails run the same verification path against a fixed dummy hash, so both failure modes return one `INVALID_CREDENTIALS` response.
- The iteration count is the platform maximum, not a preference: Cloudflare's runtime rejects PBKDF2 above 100,000 iterations for WebCrypto and `node:crypto` alike (`Pbkdf2 failed: iteration counts above 100000 are not supported`, a DoS guard in workerd that Workers customers cannot raise), and WASM compilation is disabled on Workers, so Argon2id and scrypt are unavailable too. The `PASSWORD_PEPPER` secret compensates by making a stolen D1 dump useless on its own, because the pre-hash input cannot be reconstructed without the Worker secret.
- `PASSWORD_PEPPER` must be at least 32 characters and must be identical across every Worker instance serving the deployment. When it is missing or too short, registration and login fail closed with `503 SERVICE_UNAVAILABLE` instead of hashing without a pepper. Rotating it invalidates every stored password hash, so treat it as permanent: a rotation requires a password reset for all accounts.
- Passwords are 15–128 Unicode code points (maximum 512 UTF-8 bytes). Names are non-empty and at most 100 characters. Emails are trimmed, lowercased, at most 254 characters, and unique by database constraint.
- Session tokens are 32 random bytes. Only their SHA-256 digest, the account ID, and the seven-day expiry are stored in D1.
- The production cookie is the host-only `__Host-stocksx_session` (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, no `Domain`). Requests served over local HTTP (`localhost`/`127.0.0.1`) use the distinct `stocksx_session_dev` name so local development works over HTTP.
- Browser authentication mutations require an exact same-origin `Origin`; cross-origin, absent, or opaque origins get `403`. Requests are JSON with an 8 KiB body cap.
- Public registration always creates the `user` role. The role is read from D1 on every authenticated request, so promotions take effect without a re-login and stale browser state cannot grant access.
- Authentication and account responses are sent with `Cache-Control: no-store`, including error responses.

### Rate Limiting
Cloudflare rate-limiting bindings guard the expensive paths before hashing: five registrations per minute per client IP (`REGISTER_LIMITER`) and ten logins per minute per client IP plus ten per canonical-email hash (`LOGIN_LIMITER`). Over-limit requests return `429` with `Retry-After: 60`. Limits are approximate and scoped per Cloudflare location, so they are abuse mitigation, not an exact counter; clients behind a shared IP share the registration allowance.

### User Roles
- **User** — Public features plus the dashboard, stock details, and ownership data
- **Admin** — User privileges plus the read-only `GET /api/admin/accounts` listing (bounded pages, real totals)
- **Super Admin** — Admin privileges with elevated permissions

Promote an operator account with a trusted command — never through a public endpoint:

```bash
npx wrangler d1 execute DB --remote \
  --command "UPDATE accounts SET role = 'admin' WHERE email = 'operator@example.com';"
```

### Endpoints

| Endpoint | Auth | Success | Failures |
|----------|------|---------|----------|
| `POST /api/auth/register` | Same-origin | `201` + account ID, no cookie | `400` invalid input, `409` duplicate or already signed in, `403` cross-origin, `429` rate limited, `413` oversized body |
| `POST /api/auth/login` | Same-origin | `200` + safe profile, sets cookie | `401` invalid credentials, `400` invalid input, `403` cross-origin, `429` rate limited |
| `GET /api/auth/session` | Session cookie | `200` + safe profile | `401` unauthenticated, `503` D1 unavailable |
| `POST /api/auth/logout` | Same-origin | `200` (idempotent) | `403` cross-origin |
| `GET /api/admin/accounts` | Admin session | `200` + paged accounts and totals | `401`, `403`, `503` |
| `GET /api/stocks/[ticker]/ownership` | Session cookie | `200` + ownership records array | `401`, `503` |

Safe profile responses contain the account ID, display name, canonical email, and stored role only — never password metadata, session digests, or raw tokens.

### Migration from Legacy Auth

The previous Firebase/Google sign-in and the browser-signed demo JWT are gone. There is no credential import: Firebase's stored passwords cannot be read, so returning users register again with email and password. On first load the client removes the old `StoxLyz-auth-token` localStorage entry, any `firebase:authUser:*` entries, and the legacy `stoxlyz_token` cookie, while preserving watchlist, price-alert, and preference keys. No old-token acceptance path remains; pre-migration Firebase and demo sessions cannot authorize the new endpoints.

## 🌐 Internationalization

The app supports multiple languages using `@nuxtjs/i18n`:

- **Bahasa Indonesia** (id) — Default language
- **English** (en)

Language can be switched from the settings page or app header.

## 🎨 Theming

Three theme modes are available:
- **Light Mode** — High contrast for daylight viewing
- **Dark Mode** — Reduced eye strain for low-light environments
- **System Mode** — Automatically matches OS preference

Theme preference is persisted in localStorage.

## 📱 Responsive Design

The application is fully responsive with:
- **Mobile** (< 768px) — Bottom navigation, stacked layouts
- **Tablet** (768px - 1024px) — Adaptive grid layouts
- **Desktop** (> 1024px) — Sidebar navigation, multi-column layouts

## 🚢 Deployment

Deploy the Nuxt application and its Nitro API routes to Cloudflare Workers. Static-only generation does not include the server APIs.

Production URL: https://stocksx.nightdelaluna.workers.dev

`wrangler.json` defines the Worker name, account, the `DB` D1 binding, and the `REGISTER_LIMITER`/`LOGIN_LIMITER` rate-limit bindings. Rate-limit `namespace_id` values are integers that are unique per Cloudflare account and share counters across Workers that reuse them; the registration and login limiters use distinct ids. The Cloudflare Nitro preset generates `.output/server/wrangler.json` and `.wrangler/deploy/config.json` during the build. Keep these generated files out of version control.

### Database Migrations

Schema changes live in `migrations/` and are applied with Wrangler:

```bash
# Apply migrations to the remote D1 database (CI runs this before every deploy)
npx wrangler d1 migrations apply DB --remote

# Local development database used by `wrangler dev`
npx wrangler d1 migrations apply DB --local
```

Current schema: `accounts`, `sessions`, and `ownership_records` (`migrations/0001_initial_schema.sql`).

### Manual Deployment

```bash
# Authenticate with the target Cloudflare account
npx --yes wrangler@4.149.0 login

# One-time: provision the password-hashing pepper (see Production Requirements)
openssl rand -hex 32 | npx wrangler secret put PASSWORD_PEPPER

# Apply migrations, then build the Worker and static assets and deploy
npx wrangler d1 migrations apply DB --remote
npm run deploy
```

### Automatic Deployment

`.github/workflows/deploy.yml` runs the unit and integration suites, applies D1 migrations, and deploys on pushes to `master`; it also supports manual runs. Configure a GitHub Actions secret named `CLOUDFLARE_API_TOKEN`, scoped to this account with Workers Scripts Edit, D1 Edit, and Account Settings Read permissions. Local OAuth login credentials are not copied to GitHub. No application environment variables are required — authentication needs no external provider configuration.

### Production Requirements

- Password hashing needs the `PASSWORD_PEPPER` secret. Provision it once per account before serving traffic; deploys never create or rotate it, and the auth endpoints stay at `503 SERVICE_UNAVAILABLE` until it exists:
  ```bash
  openssl rand -hex 32 | npx wrangler secret put PASSWORD_PEPPER
  ```
  Keep the value with your other production secrets. Losing it locks out every account; changing it invalidates every password hash. Store an operator copy outside Cloudflare, since Workers secrets cannot be read back.
- Password hashing is bounded by the platform, not by the account's CPU allowance: PBKDF2 is capped at 100,000 iterations and WASM is disabled on Workers, which is why the deployment pairs the maximum iteration count with the pepper instead of the spec's 600,000-iteration PBKDF2 alone.
- Rate-limit bindings require a Workers plan that supports them; registration and login degrade to unthrottled handling only if the bindings are absent.
- `app/middleware/auth.global.ts` requires a server-verified session for dashboard and stock-detail screens. Unauthenticated visitors see the landing and authentication pages, and public market APIs stay reachable.
- Ownership records are served from `ownership_records` in D1 and are empty until seeded; seed them with `npx wrangler d1 execute DB --remote --file <seed.sql>`.
- The Anthropic key is intentionally not provisioned on Cloudflare. AI endpoints accept anonymous requests and can incur charges if enabled. Do not put the key in public configuration or build variables.
- The Yahoo Finance runtime adapter in `server/runtime/yahooDeno.ts` provides the platform and terminal detection used by the client without loading the full Node Deno shim, whose filesystem globals are incompatible with Workers.

## 🧪 Testing

```bash
# Unit tests (fast, no build required)
npm test

# D1/Workers integration suite: builds the Worker, runs it in workerd with a real
# local D1 database, and exercises register/login/session/logout, cookie and
# no-store behavior, origin and rate-limit rejections, and admin/ownership access
npm run test:integration

# Both suites, in the order CI runs them
npm run test:all

# Unit tests in watch mode
npm run test:watch
```

The integration suite runs the built Worker under `workerd` with real D1 and rate-limit bindings — D1 is never mocked. Run `npm run build` first (the `test:integration` script does it for you).

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use Biome for linting and formatting
- Follow Vue 3 Composition API best practices
- Write TypeScript with strict type checking
- Add tests for new features

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## ⚠️ Legal Disclaimer

**StocksX is a demonstration application for educational purposes only.**

- All stock prices, charts, and financial data are **mock data**
- **Not affiliated** with OJK (Otoritas Jasa Keuangan), IDX (Indonesia Stock Exchange), or any licensed financial institution
- **Not a licensed broker** or financial advisor
- **Do not use** for actual investment decisions
- **No warranty** provided for accuracy or reliability of any information

Always consult with licensed financial advisors and conduct your own research before making investment decisions.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Made with ❤️ using Nuxt and Vue
