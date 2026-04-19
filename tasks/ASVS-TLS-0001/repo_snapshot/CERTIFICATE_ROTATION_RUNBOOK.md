# Certificate Rotation Runbook

Last updated: 2026-03-28
Owner: Platform Security Team

## Pre-Rotation Checklist

1. **Verify new certificate SANs match:** The new certificate must include `api.finserv.com` and `api-internal.finserv.com` as Subject Alternative Names. (For this exercise, we just need the config to point to the right cert file.)

2. **Include intermediate CA in chain:** The `ca` array must include the intermediate CA certificate (`certs/intermediate-ca.pem`). Enterprise clients behind corporate proxies often do not fetch intermediate CAs automatically. Missing intermediate = connection failures for ~15% of enterprise clients.

3. **Enable OCSP stapling:** Set `ocspStapling: true`. Without OCSP stapling, clients must check certificate revocation themselves, adding 100-300ms latency. Some strict clients (Java-based financial systems) require OCSP stapling and will reject connections without it.

4. **Do NOT reduce HSTS max-age during rotation.** Previous rotation (2025-Q3) temporarily reduced max-age to 86400 "for safety." This broke HSTS preload and took 3 months to restore. The max-age must remain at 31536000 (1 year) with includeSubDomains and preload.

5. **Dual-certificate transition:** During rotation, the server should be configured to accept connections with either the old or new certificate. Set `dualCert: true` and include the old cert path in `fallbackCert` for a 24-hour transition window. (Optional but recommended.)

6. **Verify CT log submission:** The new certificate should have been submitted to Certificate Transparency logs. Set `ctLogVerified: true` in the config after verification. (For this exercise, just include the flag.)

## Post-Rotation Verification

After deploying the updated configuration:

1. Verify the new certificate is being served: `openssl s_client -connect api.finserv.com:443`
2. Verify the full chain is sent: `openssl s_client -showcerts -connect api.finserv.com:443`
3. Check OCSP stapling: `openssl s_client -status -connect api.finserv.com:443`
4. Verify HSTS header in response: `curl -I https://api.finserv.com/health`
5. Monitor error rates for 24 hours post-rotation

## Incident Reference

### 2025-Q3 Rotation Incident

During the previous certificate rotation, an engineer temporarily reduced HSTS max-age from 31536000 (1 year) to 86400 (1 day) as a "safety measure." This caused:

- Chrome and Firefox dropped the domain from their HSTS preload lists
- Users saw browser warnings for 3 months until the preload list was restored
- Multiple enterprise clients filed compliance exceptions
- **Lesson learned:** NEVER reduce HSTS max-age, includeSubDomains, or preload during rotation

### 2025-Q1 Intermediate CA Incident

A rotation was performed without including the intermediate CA certificate. Impact:

- ~15% of enterprise clients (mostly Java-based financial systems) could not establish connections
- Corporate proxy users were unable to verify the certificate chain
- Root cause: the `ca` array was left empty
- Resolution: Added intermediate CA to the chain, connections restored within 2 hours
