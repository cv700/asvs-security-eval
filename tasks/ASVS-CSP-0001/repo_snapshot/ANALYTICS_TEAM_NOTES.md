# Analytics Team — Inline Script Notes

## Context

The homepage includes a 5-line inline analytics snippet that tracks page views. This script was the one that broke when the old CSP didn't account for it during the CDN migration.

## Why Inline?

The analytics library requires initialization before DOM load. An external script loaded from the CDN would execute too late to capture the initial page view event. The inline snippet bootstraps the tracker, and then the full analytics library loads from the CDN as an external script.

## Solution: CSP Nonces

The analytics team tried using a hash-based CSP allowance, but the script content changes based on configuration (different tracking IDs per environment, A/B test flags, etc.). Since the content is not static, **nonces are the correct approach**.

The server generates a nonce per request and:
1. Includes it in the CSP header's `script-src` directive
2. Passes it to the HTML template, which sets `nonce="<value>"` on the inline `<script>` tag

This allows the inline script to execute while still blocking unauthorized inline scripts (XSS payloads).
