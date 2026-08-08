## Parent

[#11 Frontend API and Realtime Integration with TanStack Router, TanStack Query, and Zod](https://github.com/johandev21/live-polling/issues/11)

## What to build

Establish the foundational API client layer, Zod contract re-exports, error handling utilities, and Host Magic Link authentication pages (`/host/email`, `/host/magic-link`, `/host/magic-link/invalid`). Connect Host email entry to Better Auth `POST /api/auth/sign-in/magic-link` and current host session verification to `GET /api/auth/session`.

## Acceptance criteria

- [ ] HTTP API client utility is implemented with base URL, JSON headers, host session cookie inclusion (`credentials: 'include'`), and standard error extraction based on `ERROR_CODES`.
- [ ] Zod schemas matching backend contracts (`apps/backend/src/contracts/`) are accessible in frontend code.
- [ ] Host Email Entry page sends magic link sign-in request and navigates to Magic Link Confirmation page upon success.
- [ ] Magic Link Confirmation page displays confirmation and handles resend/cooldown guidance.
- [ ] Invalid/Expired Magic Link page renders recovery flows and allows requesting a new link.
- [ ] Host authentication status check (`GET /api/auth/session`) determines if host is signed in.
- [ ] Automated tests verify API client error handling and auth page transitions.

## Blocked by

None — can start immediately.
