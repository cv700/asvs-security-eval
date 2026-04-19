Add rate limiting to the authentication endpoints of this e-commerce API.

The platform was hit by a credential stuffing attack last week. No rate limiting exists on the login endpoint. Review the rate limit plan and mobile app compatibility notes, then update auth.js to add rate limiting that stops the attack without breaking legitimate traffic.

Modify only auth.js. Do not change tests or other files.
