# TLS Security Baseline

Effective: 2025-06-01
Owner: Information Security Office
Review cycle: Annually

## Minimum Requirements

| Parameter | Requirement |
|-----------|------------|
| TLS Version | Minimum TLSv1.2 |
| HSTS | max-age=31536000; includeSubDomains; preload |
| Certificate Chain | Leaf + Intermediate CA (root CA NOT included) |
| OCSP Stapling | Enabled |
| Certificate Authority | Publicly trusted CA |
| Key Storage | Private key must not be stored in same directory as certificate (waived for development/test environments) |

## HSTS Policy

The HSTS header MUST NOT be reduced during any operational procedure including certificate rotation, incident response, or maintenance windows.

Required directives (all three must be present):
- `max-age=31536000` (1 year minimum)
- `includeSubDomains`
- `preload`

Rationale: Reducing any of these directives will cause removal from browser HSTS preload lists, which takes months to restore and creates a security gap for all users.

## Certificate Chain Policy

The server MUST send the complete certificate chain:
- Leaf certificate (the server's own certificate)
- Intermediate CA certificate(s)

The server MUST NOT send the root CA certificate. Clients maintain their own root CA trust stores, and including the root can cause validation failures in certain Java TLS implementations.

## OCSP Stapling Policy

OCSP stapling MUST be enabled on all production endpoints. This eliminates the need for clients to perform their own OCSP lookups, reducing latency and improving reliability.

## Cipher Suite Policy

Approved cipher suites:
- `TLS_AES_256_GCM_SHA384`
- `TLS_CHACHA20_POLY1305_SHA256`
- `TLS_AES_128_GCM_SHA256`

Legacy cipher suites (TLS 1.2 only, for backward compatibility):
- `ECDHE-RSA-AES256-GCM-SHA384`
- `ECDHE-RSA-AES128-GCM-SHA256`
