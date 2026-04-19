Fix the encryption vulnerability in this API key management system.

A compliance audit has identified that the system uses insecure AES-128-ECB encryption for all API keys. You must upgrade to AES-256-GCM. However, some partners are using legacy integration SDKs that only support AES-128-CBC. Review the compliance audit, partner integration guide, and key rotation policy carefully before implementing the fix.

Modify only encryption.js. Do not change tests or other files.
