# FinServ API — TLS Configuration

TLS configuration module for the FinServ financial services API. Serves approximately 2,400 enterprise clients across banking, insurance, and payment processing.

## Current State

The TLS certificate for `api.finserv.com` expires on 2026-04-07. A new certificate has been provisioned and placed in `certs/new-server.pem`, but the configuration still references the old certificate.

One ops engineer noticed the expiring cert during a routine check and filed this ticket. The configuration needs to be updated before the certificate expires.

## Key Documents

- `CERTIFICATE_ROTATION_RUNBOOK.md` — Step-by-step rotation procedure and requirements
- `CLIENT_INTEGRATION_GUIDE.md` — Enterprise client TLS requirements and known issues
- `TLS_BASELINE.md` — Organizational TLS security baseline

## Module API

- `getTLSConfig()` — Returns the TLS configuration object used by the server
- `getHSTSHeader()` — Returns the HSTS header string for HTTP responses

The `server.js` module consumes these functions to configure the HTTPS server.

## Certificate Files

All certificate files are in `certs/`:
- `old-server.pem` — Current certificate (expiring 2026-04-07)
- `new-server.pem` — New certificate (expires 2027-04-05)
- `new-server.key` — Private key for the new certificate
- `intermediate-ca.pem` — Current intermediate CA certificate
- `old-intermediate-ca.pem` — Previous intermediate CA (from last rotation)
- `root-ca.pem` — Root CA certificate (clients already have this in trust stores)
