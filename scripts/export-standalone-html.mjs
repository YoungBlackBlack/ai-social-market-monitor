import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const outputUrl = new URL("../exports/exa-ai-social-report.html", import.meta.url);

async function readText(path) {
  return readFile(new URL(path, root), "utf8");
}

function escapeInlineScript(value) {
  return value
    .replaceAll("</script", "<\\/script")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

async function readTextOptional(path) {
  try {
    return await readText(path);
  } catch {
    return null;
  }
}

const [html, css, app, brief, monitor, history, ledger, digest, triage] = await Promise.all([
  readText("index.html"),
  readText("styles.css"),
  readText("app.js"),
  readText("data/brief.json"),
  readText("data/monitor.json"),
  readText("data/monitor-history.json"),
  readText("data/monitor-ledger.json"),
  readText("data/monitor-digest.json"),
  readTextOptional("data/alert-triage.json"),
]);

const reportData = {
  brief: JSON.parse(brief),
  monitor: JSON.parse(monitor),
  history: JSON.parse(history),
  ledger: JSON.parse(ledger),
  digest: JSON.parse(digest),
  triage: triage ? JSON.parse(triage) : null,
};

const dataScript = `window.__EXA_REPORT_DATA__ = ${escapeInlineScript(JSON.stringify(reportData))};`;
const standalone = html
  .replace(/<link rel="stylesheet" href="styles\.css(?:\?[^"]*)?" \/>/, `<style>\n${css}\n</style>`)
  .replace(/<script src="app\.js(?:\?[^"]*)?"><\/script>/, `<script>\n${dataScript}\n</script>\n<script>\n${escapeInlineScript(app)}\n</script>`);

if (standalone === html) {
  throw new Error("Standalone export did not replace CSS/JS references.");
}

await mkdir(new URL("../exports/", import.meta.url), { recursive: true });
await writeFile(outputUrl, standalone);

console.log(JSON.stringify({
  ok: true,
  output: "exports/exa-ai-social-report.html",
  bytes: Buffer.byteLength(standalone),
  products: reportData.brief.clusters.reduce((count, cluster) => count + cluster.items.length, 0),
  timelineEvents: reportData.brief.fundingTimeline.length,
  monitorRecentItems: reportData.monitor.recentItems.length,
}, null, 2));
