import "dotenv/config";
import fs from "node:fs";
import path from "node:path";


const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((arg) => {
      const [key, ...value] = arg.replace(/^--/, "").split("=");
      return [key, value.join("=")];
    })
);

const instrument = args.instrument ?? "EUR_USD";
const granularity = args.granularity ?? "M5";
const from = args.from;
const to = args.to;
const name = args.name;

if (!from || !to || !name) {
  throw new Error(
    "Required: --name=discovery --from=2024-01-01 --to=2025-01-01"
  );
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

const databaseEnv =
  `CLOUDFLARE_D1_${instrument.toUpperCase()}_DATABASE_ID`;

const databaseId = process.env[databaseEnv];

if (!accountId) {
  throw new Error("Missing CLOUDFLARE_ACCOUNT_ID");
}

if (!apiToken) {
  throw new Error("Missing CLOUDFLARE_API_TOKEN");
}

if (!databaseId) {
  throw new Error(`Missing ${databaseEnv}`);
}

const fromMs = Date.parse(`${from}T00:00:00Z`);
const toMs = Date.parse(`${to}T00:00:00Z`);

if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
  throw new Error("Invalid date range");
}

if (fromMs >= toMs) {
  throw new Error("from must be before to");
}

const dataDir = path.resolve("data");

fs.mkdirSync(dataDir, {
  recursive: true,
});

const csvPath = path.join(
  dataDir,
  `${name}.csv`
);

const metaPath = path.join(
  dataDir,
  `${name}.meta.json`
);

const columns = [
  "time",
  "volume",

  "bid_open",
  "bid_high",
  "bid_low",
  "bid_close",

  "ask_open",
  "ask_high",
  "ask_low",
  "ask_close",

  "mid_open",
  "mid_high",
  "mid_low",
  "mid_close",
];

const output = fs.createWriteStream(
  csvPath,
  { encoding: "utf8" }
);

output.write(`${columns.join(",")}\n`);

async function queryD1(sql, params) {
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}` +
    `/d1/database/${databaseId}/query`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      sql,
      params,
    }),
  });

  const body = await response.json();

  if (!response.ok || body.success === false) {
    throw new Error(
      `D1 query failed:\n${JSON.stringify(body, null, 2)}`
    );
  }

  return body.result[0]?.results ?? [];
}

let cursor = fromMs;
let candleCount = 0;

const PAGE_SIZE = 5000;

console.log(
  `Exporting ${instrument} ${granularity} ${from} → ${to}`
);

while (cursor < toMs) {
  const rows = await queryD1(
    `
      SELECT
        time,
        volume,

        bid_open,
        bid_high,
        bid_low,
        bid_close,

        ask_open,
        ask_high,
        ask_low,
        ask_close,

        mid_open,
        mid_high,
        mid_low,
        mid_close

      FROM candles

      WHERE instrument = ?
        AND granularity = ?
        AND time >= ?
        AND time < ?

      ORDER BY time ASC

      LIMIT ?
    `,
    [
      instrument,
      granularity,
      cursor,
      toMs,
      PAGE_SIZE,
    ]
  );

  if (rows.length === 0) {
    break;
  }

  for (const row of rows) {
    output.write(
      `${columns.map((column) => row[column]).join(",")}\n`
    );
  }

  candleCount += rows.length;

  const lastTime =
    Number(rows[rows.length - 1].time);

  cursor = lastTime + 1;

  console.log(
    `Exported ${candleCount.toLocaleString()} candles`
  );

  if (rows.length < PAGE_SIZE) {
    break;
  }
}

output.end();

await new Promise((resolve, reject) => {
  output.on("finish", resolve);
  output.on("error", reject);
});

const metadata = {
  schemaVersion: 1,

  instrument,
  timeframe: granularity,

  source: "D1",
  volumeType: "tick",

  priceTypes: [
    "bid",
    "ask",
    "mid",
  ],

  from,
  toExclusive: to,

  candleCount,

  exportedAt:
    new Date().toISOString(),
};

fs.writeFileSync(
  metaPath,
  JSON.stringify(metadata, null, 2)
);

console.log("");
console.log("Export complete");
console.log(`CSV:  ${csvPath}`);
console.log(`Meta: ${metaPath}`);
console.log(`Candles: ${candleCount.toLocaleString()}`);