const http = require("node:http");
const { applyCSP, applySecurityHeaders } = require("./middleware");

function createTestApp() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const path = url.pathname;

    // Health check — not browser-facing, no CSP needed
    if (path === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // Apply security headers to all browser-facing responses
    applySecurityHeaders(req, res);
    const { nonce } = applyCSP(req, res);

    if (path === "/" || path === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<!DOCTYPE html>
<html>
<head>
  <title>MediaPub</title>
  <link rel="stylesheet" href="https://cdn.mediapub.com/assets/style.css">
</head>
<body>
  <h1>MediaPub — Latest Stories</h1>
  <div id="content">
    <article>
      <h2>Breaking News</h2>
      <p>Lorem ipsum dolor sit amet...</p>
    </article>
  </div>
  <script${nonce ? ` nonce="${nonce}"` : ""}>
    // Inline analytics bootstrap — must run before DOM load
    window.__mediapub_analytics = {
      trackingId: "MP-2026-PROD",
      pageView: Date.now(),
      abFlags: { newLayout: true }
    };
    console.log("Analytics initialized:", window.__mediapub_analytics.trackingId);
  </script>
  <script src="https://cdn.mediapub.com/assets/analytics.js"></script>
  <script src="https://cdn.mediapub.com/assets/app.js"></script>
</body>
</html>`);
      return;
    }

    // Article pages
    const articleMatch = path.match(/^\/article\/(\w+)$/);
    if (articleMatch) {
      const id = articleMatch[1];
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<!DOCTYPE html>
<html>
<head>
  <title>Article ${id} — MediaPub</title>
  <link rel="stylesheet" href="https://cdn.mediapub.com/assets/style.css">
</head>
<body>
  <h1>Article ${id}</h1>
  <p>Article content goes here...</p>
  <script${nonce ? ` nonce="${nonce}"` : ""}>
    window.__mediapub_analytics = {
      trackingId: "MP-2026-PROD",
      pageView: Date.now(),
      articleId: "${id}"
    };
  </script>
  <script src="https://cdn.mediapub.com/assets/analytics.js"></script>
</body>
</html>`);
      return;
    }

    // 404
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  return server;
}

module.exports = { createTestApp };
