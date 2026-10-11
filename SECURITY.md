# Security Policy

## Reporting a Vulnerability

Report suspected vulnerabilities privately through GitHub's
[security advisories](https://github.com/grarizki/stocksX/security/advisories/new)
for this repository. Do not open a public issue for an unreported vulnerability.

Include the affected endpoint or screen, reproduction steps, and the impact you
believe is possible. Expect an initial acknowledgement, then an assessment of
whether the report is accepted; accepted reports are fixed on `master` and noted
in the advisory.

## Account and Session Model

- Accounts live in Cloudflare D1 (`accounts`). Passwords are hashed in the Worker
  with PBKDF2-HMAC-SHA256 over `HMAC-SHA256(pepper, password)`, at 100,000
  iterations, with a random 16-byte salt per account and a 32-byte derived key.
  Derived keys are compared with a timing-safe primitive. Plaintext passwords
  are never stored or returned.
- The iteration count is the maximum the platform accepts: Cloudflare's runtime
  rejects PBKDF2 above 100,000 iterations for both WebCrypto and `node:crypto`
  (a workerd DoS guard, not a plan limit), and WASM code generation is disabled
  on Workers, which rules out Argon2id and scrypt. The pepper is what restores
  the lost margin: hashes are useless without the Worker secret, so a D1 dump
  alone does not permit offline cracking.
- `PASSWORD_PEPPER` is a Worker secret of at least 32 characters, identical
  across every instance of the deployment, and never written to the repository.
  When it is absent or too short, registration and login fail closed with `503`
  rather than hashing an unpeppered password. Rotating it invalidates all stored
  hashes; deletions or rotations therefore require a password reset for every
  account, and an operator-held copy is the only way to recover the value, since
  Workers secrets cannot be read back.
- Sessions are opaque 32-byte random tokens. D1 stores only the SHA-256 digest,
  the account ID, and the seven-day expiry. There is no rolling extension.
- The production session cookie is the host-only `__Host-stocksx_session`
  (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, no `Domain`). Local HTTP
  development uses the distinct `stocksx_session_dev` name.
- Roles are resolved from D1 on every authenticated request. Public registration
  always creates the `user` role; promotion requires a trusted operator command
  against D1 (`UPDATE accounts SET role = ...`), never a public endpoint.
- Browser authentication mutations require an exact same-origin `Origin` and
  reject cross-origin, absent, or opaque origins with `403`. JSON bodies are
  capped at 8 KiB.
- Registration and login are rate limited with Cloudflare rate-limiting bindings
  (5 registrations per minute per client IP; 10 logins per minute per client IP
  and per canonical-email hash) before password hashing runs. Over-limit requests
  receive `429` with `Retry-After: 60`. Limits are approximate and per Cloudflare
  location, and clients sharing an IP share the allowance.
- Authentication and account responses are sent with `Cache-Control: no-store`,
  including error responses, so credentials and profile data are not cached in
  shared storage.

## Legacy Authentication

Firebase, Google sign-in, the browser-signed demo JWT, and the external
authentication backend were removed. On first load the client deletes the old
`StoxLyz-auth-token` localStorage entry, any `firebase:authUser:*` entries, and
the legacy `stoxlyz_token` cookie while preserving watchlist, price-alert, and
preference keys. No path accepts Firebase tokens, demo JWTs, or legacy cookies;
credential import is impossible because Firebase password hashes are not
readable from the application.

## Secrets

Application secrets are not committed. The `CLOUDFLARE_API_TOKEN` used by CI
lives in GitHub Actions secrets. `TRUSTED_ORIGIN` is an optional non-secret
extra origin accepted alongside the origin each request is served from; browser
authentication mutations stay same-origin when it is unset. The Anthropic API
key stays unprovisioned on Cloudflare: AI endpoints accept anonymous requests
and will incur charges if the key is configured. Never place secrets in public runtime configuration or build
variables.

## Reporting Scope

Only the code in this repository is in scope. The deployment's own Cloudflare
account configuration, D1 data contents, and third-party market-data providers
are out of scope.