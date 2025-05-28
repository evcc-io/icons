const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DOCS_DIR = path.join(__dirname, "..", "docs");

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DOCS_DIR, req.url === "/" ? "index.html" : req.url);

  // Security check - prevent directory traversal
  if (!filePath.startsWith(DOCS_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404);
        res.end("File not found");
      } else {
        res.writeHead(500);
        res.end("Server error: " + err.code);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`📖 Documentation server running at http://localhost:${PORT}`);
  console.log("Press Ctrl+C to stop");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please try a different port.`
    );
  } else {
    console.error("Server error:", err);
  }
});
