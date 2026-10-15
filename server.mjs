import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const files = new Map([
  ["/", ["index.html", "text/html"]],
  ["/app.js", ["app.js", "text/javascript"]],
  ["/app.js.LEGAL.txt", ["app.js.LEGAL.txt", "text/plain"]],
  ["/style.css", ["style.css", "text/css"]],
  ["/fixtures.json", ["fixtures.json", "application/json"]],
]);
const port = Number(process.env.PORT || 4321);
createServer(async (req, res) => {
  const item = files.get(new URL(req.url, "http://localhost").pathname);
  if (!item || !["GET", "HEAD"].includes(req.method)) {
    res.writeHead(404).end("Not found");
    return;
  }
  try {
    const body = await readFile(
      new URL("./public/" + item[0], import.meta.url),
    );
    res.writeHead(200, {
      "Content-Type": item[1] + "; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Review: http://127.0.0.1:${port}/#monitor and /#planner`),
);
