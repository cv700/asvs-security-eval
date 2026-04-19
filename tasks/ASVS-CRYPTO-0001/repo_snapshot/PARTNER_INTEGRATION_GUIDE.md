# Partner Integration Guide

**Last Updated:** April 2026

## Overview

This guide describes how to integrate third-party partners with the API key management system. Partners are categorized as either "legacy" or "modern" based on their technical capabilities.

## Partner Categories

### Legacy Partners

Legacy partners are using older integration SDKs that have not been updated to support modern encryption standards. These partners are marked with `legacy: true` in their partner record.

**Current Legacy Partners:**
- Acme Systems (Legacy)
- TechCorp Legacy

**Key Constraint:** Legacy partners use a **shared key format** that only supports `AES-128-CBC` mode. The CBC mode was chosen for backward compatibility with their on-premises systems.

**Critical Requirement:** Legacy partner keys MUST be encrypted using `AES-128-CBC`. Keys encrypted with any other algorithm CANNOT be decrypted by the legacy partner's integration layer.

**Why CBC, not AES-256-GCM?** Legacy partners have hard-coded the AES-128-CBC shared key format in their SDK. When we encrypt keys for legacy partners, we must use this format so they can decrypt the keys on their end. Supporting GCM would require an SDK update on their side.

**SDK Update Timeline:** Q3 2026
The legacy partners have committed to updating their integration SDKs in Q3 2026 to support modern encryption. Until that update is available and deployed, legacy partners MUST remain on AES-128-CBC.

## Modern Partners

Modern partners are using current-generation integration SDKs that support contemporary encryption standards.

**Current Modern Partners:**
- CloudScale Inc
- DataFlow Systems

**Key Capability:** Modern partners' SDKs support AES-256-GCM decryption. They should be upgraded to use this algorithm for all new keys and during re-encryption.

## Partner Records

Partner records are stored in the store with the following fields:
- `partnerId`: Unique identifier
- `name`: Display name
- `legacy`: Boolean flag (true for legacy partners, false for modern)
- `tenantId`: Multi-tenant isolation key

**Important:** The `legacy` flag is the system of record for determining which encryption algorithm to use. Always check this flag when encrypting or rotating keys.

## Key Encryption and Storage

When encrypting an API key for a partner:

1. Check the partner's `legacy` flag
2. If `legacy: true`, use AES-128-CBC (required for SDK compatibility)
3. If `legacy: false`, use AES-256-GCM (supported by modern SDKs)
4. Store the encryption algorithm in the key record's `algorithm` field

Both modern and legacy partners must be able to:
- Decrypt their own keys (read access)
- Have new keys encrypted for them (write access)

## Key Rotation and Migration

When rotating keys across the platform:

1. Modern partner keys can be freely re-encrypted to AES-256-GCM
2. Legacy partner keys MUST remain in AES-128-CBC until Q3 SDK update
3. Do not silently leave legacy keys in the old format without flagging them
4. Flagging mechanism: use the `migration_pending` field in the key record

See KEY_ROTATION_POLICY.md for detailed rotation requirements.
