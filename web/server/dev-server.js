import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "..", "..");

const discoveryCsv = path.join(
  repoRoot,
  "data",
  "discovery.csv"
);

const eventsJson = path.join(
  repoRoot,
  "engine",
  "outputs",
  "discovery",
  "AAA_TESTING_every_100th_candle.events.json"
);

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.url === "/api/dataset/discovery") {
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
    });

    fs.createReadStream(discoveryCsv).pipe(res);
    return;
  }

  if (
    req.url ===
    "/api/events/AAA_TESTING_every_100th_candle"
  ) {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
    });

    fs.createReadStream(eventsJson).pipe(res);
    return;
  }

  res.writeHead(404, {
    "Content-Type": "application/json",
  });

  res.end(
    JSON.stringify({
      error: "Not found",
    })
  );
});

server.listen(3001, () => {
  console.log(
    "Research API running at http://localhost:3001"
  );
});