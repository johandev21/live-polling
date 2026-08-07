## Parent

[#1 Build backend MVP for live polling platform](https://github.com/johandev21/live-polling/issues/1)

## What to build

Enable hosts to request and consume passwordless magic links, verify their email ownership, establish an authenticated host session, and retrieve the current host identity.

## Acceptance criteria

- [ ] A host can request a magic link for an email address.
- [ ] Magic links are single-use and short-lived.
- [ ] Invalid and expired links return a consistent machine-readable error.
- [ ] Consuming a valid link creates an authenticated host session.
- [ ] Host email verification is required before host-owned resources can be created.
- [ ] The current authenticated host can be retrieved.
- [ ] Host authentication guards reject unauthenticated and unverified host requests.
- [ ] Magic-link requests are rate-limited.
- [ ] Magic-link values, session credentials, and sensitive authentication data are excluded from logs and responses.
- [ ] Mail delivery is accessed through a mockable mailer boundary and works with local mail capture.
- [ ] Vitest integration tests cover the public authentication flow.

## Blocked by

- #2 — Backend foundation, persistence, and Vitest harness
