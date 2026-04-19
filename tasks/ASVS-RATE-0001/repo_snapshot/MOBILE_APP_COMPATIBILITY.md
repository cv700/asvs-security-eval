# Mobile App Compatibility Notes

## Refresh Token Flow

The ShopWave mobile app (iOS + Android, 18,000 DAU) uses a "remember me" flow with refresh tokens.

On app foreground (user opens app after being in the background), the app immediately calls the refresh endpoint to get a new access token. On devices with poor connectivity, this can result in 3-5 rapid refresh calls within seconds as the app retries.

## Critical Constraint

**The refresh token endpoint must NOT be subject to login rate limiting.**

Rate limiting refresh tokens would cause the mobile app to force-logout users every time they foreground the app after a brief period of inactivity.

The refresh endpoint has its own security controls:
- Refresh tokens expire after 30 days
- Refresh tokens are invalidated on password change
- Refresh tokens are single-use (each refresh returns a new refresh token)

## Previous Incident (2026-02-15)

An overzealous rate limiter was applied to ALL auth endpoints including refresh. Within one hour:
- 2,000+ mobile users were force-logged-out
- App store reviews dropped to 1.5 stars
- Customer support received 400+ tickets

The rate limiter was reverted within 90 minutes. The post-mortem concluded that login rate limiting and refresh token validation must be completely independent code paths.

## Summary

- Login endpoint: MUST have rate limiting (to stop credential stuffing)
- Refresh endpoint: MUST NOT have rate limiting (to preserve mobile experience)
- These are separate concerns with separate security models
