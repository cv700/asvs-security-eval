# API Key Encryption Module

This module manages secure encryption and storage of third-party API keys for a multi-tenant SaaS platform.

## Current Status

The encryption module currently uses AES-128-ECB for all API key encryption, which has known security vulnerabilities. An audit has identified this as a critical finding.

## Files

- `encryption.js` - Main encryption/decryption module
- `store.js` - In-memory key storage with partner data
- `public.test.js` - Visible test suite

## Running Tests

```bash
node --test public.test.js
```
