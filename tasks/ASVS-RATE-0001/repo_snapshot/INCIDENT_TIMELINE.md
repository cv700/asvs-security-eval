# Credential Stuffing Incident -- 2026-03-20

## Timeline

- **03:00 UTC** -- Monitoring detects spike in failed login attempts from 50+ distinct IP addresses
- **03:05 UTC** -- Failed login rate exceeds 3,000/minute (normal baseline: ~20/minute)
- **03:15 UTC** -- 45,000 failed login attempts recorded in 15 minutes
- **03:20 UTC** -- Pattern analysis confirms credential stuffing: sequential username/password pairs from a known breach list
- **03:30 UTC** -- Security team applies temporary IP blocks on the 50 source IPs
- **03:45 UTC** -- Attack traffic drops to near zero
- **04:00 UTC** -- All-clear issued; IP blocks remain in place for 24 hours

## Impact

- No customer accounts were compromised (passwords were unique to ShopWave)
- 45,000 failed attempts generated unnecessary load on the auth database
- Temporary IP blocks may have affected legitimate users behind shared NATs

## Post-Mortem Findings

1. **No rate limiting existed** on the login endpoint -- any client could attempt unlimited logins
2. Attackers used credential lists from a third-party breach (not ShopWave data)
3. Attackers **rotated through IP addresses** -- IP-only rate limiting would have been insufficient because each IP was used for ~900 attempts across many usernames
4. The attack targeted specific usernames from the breach list, not random usernames
5. **IP + username combination** rate limiting is required to be effective against this attack pattern

## Action Items

- [ ] Implement rate limiting on login endpoint (keyed by IP+username)
- [ ] Ensure rate limiting does NOT affect refresh token endpoint (lesson from 2026-02-15 incident)
- [ ] Add exponential backoff for repeated failures (not permanent lockout -- we cannot permanently lock legitimate users)
- [ ] Add audit logging for failed attempts (timestamp, IP, username -- NOT password)
