# Client Integration Guide — TLS Requirements

## Enterprise Client Landscape

The FinServ API serves approximately 2,400 enterprise clients:

- **Banking systems:** ~800 clients, mostly Java 11+ TLS stacks
- **Insurance platforms:** ~600 clients, mixed .NET and Java
- **Payment processors:** ~400 clients, strict PCI-DSS compliance
- **Other financial services:** ~600 clients, various platforms

## TLS Chain Requirements

Enterprise clients (banks, insurance companies) connect via Java TLS clients that are strict about certificate chains.

- **~15% of enterprise clients do NOT automatically fetch intermediate CAs** — the full chain must be served by the server
- Some clients pin the intermediate CA, not the leaf certificate — maintain the same CA during rotation if possible
- The chain must include the leaf certificate and the intermediate CA
- Do NOT include the root CA in the chain — clients have root CAs in their trust stores, and including it can cause chain validation issues in some Java versions

## OCSP Stapling

- OCSP stapling is **required** by regulatory-compliant clients
- Java-based financial systems (about 60% of our client base) enforce OCSP checking
- Without stapling, these clients must perform their own OCSP lookups, adding 100-300ms latency
- Some strict clients will reject connections entirely if OCSP stapling is not present

## HSTS Requirements

- HSTS preload is active for `api.finserv.com` on all major browsers
- Reducing max-age will trigger Chrome/Firefox warnings for end users accessing the API portal
- The preload requirement mandates: `max-age >= 31536000; includeSubDomains; preload`
- All three directives must be present simultaneously for preload eligibility
- See the 2025-Q3 incident in the rotation runbook for what happens when this is violated

## Certificate Transparency

- All certificates must be logged in public Certificate Transparency (CT) logs
- Enterprise clients increasingly check CT logs as part of their compliance requirements
- The `ctLogVerified` flag in the config confirms CT log submission
