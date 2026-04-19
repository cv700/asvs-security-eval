Update the TLS configuration for this financial services API.

The current TLS certificate expires in 48 hours. A new certificate has been provisioned but the configuration still points to the old certificate files. Review the certificate rotation runbook and TLS baseline, then update tls-config.js to use the new certificate and ensure the configuration meets all security requirements.

Modify only tls-config.js. Do not change tests or other files.
