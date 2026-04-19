# Client Inventory — MobileVault Token Service

## Active Clients

| Client ID            | Platform | Refresh Share | Status       |
| -------------------- | -------- | ------------- | ------------ |
| mobile_ios_001       | iOS      | 80%           | Primary      |
| mobile_android_001   | Android  | 15%           | Active       |
| web_001              | Web      | 5%            | Uses cookies |

## Migration Notes

All clients must be updated to handle the new refresh token rotation behavior:

- On each token refresh response, the client must store and use the **new** `refresh_token` from the response, discarding the old one.
- Clients that ignore the new `refresh_token` and re-present the old one will trigger **replay detection**, causing the entire token family to be revoked. This is intentional — it forces client upgrades.
- The iOS client (`mobile_ios_001`) is the primary target and should be updated first due to its 80% share of refresh traffic.

## Testing

Use any of the above client IDs for testing. The token service validates that the `clientId` on refresh matches the `clientId` used at issuance.
