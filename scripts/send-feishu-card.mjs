import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

// Sends the prebuilt Feishu alert card to a custom-bot webhook.
// Reads FEISHU_WEBHOOK_URL (and optional FEISHU_WEBHOOK_SECRET for signature
// verification) from .env, and the card body/meta produced by
// scripts/build-feishu-card.mjs.
//
// Usage:
//   node scripts/send-feishu-card.mjs           # only sends when meta.shouldSend
//   node scripts/send-feishu-card.mjs --force    # always sends (for testing)

const force = process.argv.includes("--force");

const envText = await readFile(new URL("../.env", import.meta.url), "utf8").catch(() => "");
function envValue(key) {
  return envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith(`${key}=`))
    ?.slice(key.length + 1)
    ?.replace(/^"|"$/g, "");
}

const meta = JSON.parse(await readFile(new URL("../exports/feishu-card-meta.json", import.meta.url), "utf8"));
const body = await readFile(new URL("../exports/feishu-alert-digest.md", import.meta.url), "utf8");

if (!meta.shouldSend && !force) {
  console.log(JSON.stringify({
    ok: true,
    sent: false,
    reason: "meta.shouldSend is false (no new URLs or grade-A candidates). Use --force to send anyway.",
  }, null, 2));
  process.exit(0);
}

const webhookUrl = process.env.FEISHU_WEBHOOK_URL || envValue("FEISHU_WEBHOOK_URL");
const secret = process.env.FEISHU_WEBHOOK_SECRET || envValue("FEISHU_WEBHOOK_SECRET");

if (!webhookUrl) {
  throw new Error("Missing FEISHU_WEBHOOK_URL in .env or process env (Feishu custom-bot webhook).");
}

// Feishu header template colors must be from the supported palette.
const ALLOWED_COLORS = new Set([
  "blue", "wathet", "turquoise", "green", "yellow", "orange",
  "red", "carmine", "violet", "purple", "indigo", "grey",
]);
const template = ALLOWED_COLORS.has(meta.color) ? meta.color : "blue";

const elements = [{ tag: "markdown", content: body }];
if (meta.buttonText && meta.buttonUrl) {
  elements.push({
    tag: "action",
    actions: [
      {
        tag: "button",
        text: { tag: "plain_text", content: meta.buttonText },
        url: meta.buttonUrl,
        type: "primary",
      },
    ],
  });
}

const card = {
  config: { wide_screen_mode: true },
  header: {
    title: { tag: "plain_text", content: meta.title || "AI 社交监控" },
    template,
  },
  elements,
};

const payload = { msg_type: "interactive", card };

// Signature verification (only if the bot has "签名校验" enabled).
if (secret) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const stringToSign = `${timestamp}\n${secret}`;
  const sign = createHmac("sha256", stringToSign).update("").digest("base64");
  payload.timestamp = timestamp;
  payload.sign = sign;
}

const response = await fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const text = await response.text();
let result;
try {
  result = JSON.parse(text);
} catch {
  result = { raw: text };
}

// Feishu returns { code: 0, msg: "success", ... } on success.
const ok = response.ok && (result.code === 0 || result.StatusCode === 0);
console.log(JSON.stringify({
  ok,
  sent: ok,
  httpStatus: response.status,
  feishuCode: result.code ?? result.StatusCode,
  feishuMsg: result.msg ?? result.StatusMessage,
  title: meta.title,
  signed: Boolean(secret),
}, null, 2));

if (!ok) process.exit(1);
