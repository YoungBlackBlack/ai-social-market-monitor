import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const mode = process.argv.includes("--full") ? "full" : "monitor";
const startedAt = new Date();

const workflows = {
  monitor: [
    ["Probe Exa Websets monitor access", "scripts/exa-websets-monitor.mjs"],
    ["Monitor latest Exa movement", "scripts/exa-monitor.mjs"],
    ["Refresh derived display fields", "scripts/refresh-derived.mjs"],
    ["Export CSV attachments", "scripts/export-csv.mjs"],
    ["Export SQLite database", "scripts/export-sqlite.mjs"],
    ["Export completion audit", "scripts/export-completion-audit.mjs"],
    ["Export original objective audit", "scripts/export-objective-audit.mjs"],
    ["Export current state lock", "scripts/export-current-state.mjs"],
    ["Export latest monitor run receipt", "scripts/export-monitor-receipt.mjs"],
    ["Export standalone HTML report", "scripts/export-standalone-html.mjs"],
    ["Validate page data", "scripts/validate-brief.mjs"],
    ["Validate frontend structure", "scripts/validate-frontend.mjs"],
    ["Validate standalone deliverable", "scripts/validate-deliverable.mjs"],
    ["Save timestamped snapshot", "scripts/snapshot-current.mjs"],
    ["Validate latest snapshot", "scripts/validate-snapshot.mjs"],
  ],
  full: [
    ["Run Exa category research", "scripts/exa-research.mjs"],
    ["Run Exa structured synthesis", "scripts/exa-synthesis.mjs"],
    ["Run official/social evidence pass", "scripts/exa-social-profiles.mjs"],
    ["Run official/social gap deep-dive", "scripts/exa-official-gap-deep-dive.mjs"],
    ["Run broad discovery blind-spot scan", "scripts/exa-discovery-scan.mjs"],
    ["Run company background deep-dive", "scripts/exa-company-background-deep-dive.mjs"],
    ["Run language growth/channel deep-dive", "scripts/exa-language-growth-channel-deep-dive.mjs"],
    ["Run language official/social deep-dive", "scripts/exa-language-official-social-deep-dive.mjs"],
    ["Build source-linkage candidate pool", "scripts/refresh-derived.mjs"],
    ["Run candidate deep-dive补证", "scripts/exa-candidate-deep-dive.mjs"],
    ["Run LingoPraxis targeted deep-dive", "scripts/exa-lingopraxis-deep-dive.mjs"],
    ["Run residual signal deep-dive", "scripts/exa-residual-signal-deep-dive.mjs"],
    ["Probe Exa Websets monitor access", "scripts/exa-websets-monitor.mjs"],
    ["Run Exa monitor", "scripts/exa-monitor.mjs"],
    ["Refresh final derived display fields", "scripts/refresh-derived.mjs"],
    ["Export CSV attachments", "scripts/export-csv.mjs"],
    ["Export SQLite database", "scripts/export-sqlite.mjs"],
    ["Export completion audit", "scripts/export-completion-audit.mjs"],
    ["Export original objective audit", "scripts/export-objective-audit.mjs"],
    ["Export current state lock", "scripts/export-current-state.mjs"],
    ["Export latest monitor run receipt", "scripts/export-monitor-receipt.mjs"],
    ["Export standalone HTML report", "scripts/export-standalone-html.mjs"],
    ["Validate page data", "scripts/validate-brief.mjs"],
    ["Validate frontend structure", "scripts/validate-frontend.mjs"],
    ["Validate standalone deliverable", "scripts/validate-deliverable.mjs"],
    ["Save timestamped snapshot", "scripts/snapshot-current.mjs"],
    ["Validate latest snapshot", "scripts/validate-snapshot.mjs"],
  ],
};

if (!existsSync(new URL("../.env", import.meta.url))) {
  throw new Error("Missing .env. Add EXA_API_KEY before running Exa workflows.");
}

function runStep([label, script]) {
  return new Promise((resolve, reject) => {
    const stepStartedAt = Date.now();
    console.log(`\n▶ ${label}`);
    console.log(`  node ${script}`);

    const child = spawn(process.execPath, [script], {
      cwd: new URL("..", import.meta.url),
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      const seconds = ((Date.now() - stepStartedAt) / 1000).toFixed(1);
      if (code !== 0) {
        reject(new Error(`${label} failed with exit code ${code} after ${seconds}s`));
        return;
      }
      console.log(`✓ ${label} completed in ${seconds}s`);
      resolve();
    });
  });
}

console.log(JSON.stringify({
  ok: true,
  mode,
  startedAt: startedAt.toISOString(),
  steps: workflows[mode].map(([label, script]) => ({ label, script })),
}, null, 2));

for (const step of workflows[mode]) {
  await runStep(step);
}

console.log(JSON.stringify({
  ok: true,
  mode,
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  elapsedSeconds: Number(((Date.now() - startedAt.getTime()) / 1000).toFixed(1)),
}, null, 2));
