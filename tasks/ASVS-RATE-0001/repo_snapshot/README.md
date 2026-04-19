# ShopWave API -- Auth Module

Backend authentication for the ShopWave e-commerce platform. Approximately 45,000 active users, including 18,000 mobile app users.

## Current State

The platform was hit by a credential stuffing attack on 2026-03-20. Attackers used credential lists from a third-party breach and rotated through 50+ IP addresses. No customer accounts were compromised, but the lack of rate limiting allowed 45,000 login attempts in 15 minutes.

Rate limiting must be added to the login endpoint. A previous attempt to add rate limiting (2026-02-15) broke the mobile app's refresh token flow and was reverted.

## Key Documents

- `RATE_LIMIT_PLAN.md` -- The rate limiting strategy (keying, thresholds, backoff)
- `MOBILE_APP_COMPATIBILITY.md` -- Mobile app refresh token requirements
- `INCIDENT_TIMELINE.md` -- The credential stuffing attack timeline

## Module API

- `login(username, password, ip, store)` -- Authenticate and return tokens
- `refreshToken(token, store)` -- Validate refresh token and return new access token
- `getLoginAttempts(username, ip, store)` -- Return rate limit info for a username+ip

The `store` parameter is an object created by `store.js` with `users`, `rateLimits`, and `sessions` Maps.
