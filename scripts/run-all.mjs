import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { bootstrapRuntime } from "./bootstrap-runtime.mjs";

await bootstrapRuntime();

const mode = process.argv.includes("--full") ? "full" : "monitor";
const startedAt = new Date();
const enableBrowserValidation = /^(1|true|yes)$/i.test(process.env.ENABLE_BROWSER_VALIDATION ?? "");

function step(label, script, options = {}) {
  return { label, script, ...options };
}

const workflows = {
  monitor: [
    step("Probe Exa Websets monitor access", "scripts/exa-websets-monitor.mjs"),
    step("Monitor latest Exa movement", "scripts/exa-monitor.mjs"),
    step("Refresh derived display fields", "scripts/refresh-derived.mjs"),
    step("Triage monitor alerts into promotion queue", "scripts/triage-alerts.mjs"),
    step("Build Feishu alert card", "scripts/build-feishu-card.mjs"),
    step("Export CSV attachments", "scripts/export-csv.mjs"),
    step("Export SQLite database", "scripts/export-sqlite.mjs"),
    step("Export completion audit", "scripts/export-completion-audit.mjs"),
    step("Export original objective audit", "scripts/export-objective-audit.mjs"),
    step("Export current state lock", "scripts/export-current-state.mjs"),
    step("Export latest monitor run receipt", "scripts/export-monitor-receipt.mjs"),
    step("Export standalone HTML report", "scripts/export-standalone-html.mjs"),
    step("Validate page data", "scripts/validate-brief.mjs", { softFail: true }),
    step("Validate frontend structure", "scripts/validate-frontend.mjs", { softFail: true }),
    step("Validate standalone deliverable", "scripts/validate-deliverable.mjs", {
      softFail: true,
      enabled: enableBrowserValidation,
    }),
    step("Save timestamped snapshot", "scripts/snapshot-current.mjs"),
    step("Validate latest snapshot", "scripts/validate-snapshot.mjs", { softFail: true }),
    step("Send Feishu alert card", "scripts/send-feishu-card.mjs"),
  ],
  full: [
    step("Run Exa category research", "scripts/exa-research.mjs"),
    step("Run Exa structured synthesis", "scripts/exa-synthesis.mjs"),
    step("Run official/social evidence pass", "scripts/exa-social-profiles.mjs"),
    step("Run official/social gap deep-dive", "scripts/exa-official-gap-deep-dive.mjs"),
    step("Run broad discovery blind-spot scan", "scripts/exa-discovery-scan.mjs"),
    step("Run company background deep-dive", "scripts/exa-company-background-deep-dive.mjs"),
    step("Run language growth/channel deep-dive", "scripts/exa-language-growth-channel-deep-dive.mjs"),
    step("Run language official/social deep-dive", "scripts/exa-language-official-social-deep-dive.mjs"),
    step("Build source-linkage candidate pool", "scripts/refresh-derived.mjs"),
    step("Run candidate deep-dive补证", "scripts/exa-candidate-deep-dive.mjs"),
    step("Run LingoPraxis targeted deep-dive", "scripts/exa-lingopraxis-deep-dive.mjs"),
    step("Run residual signal deep-dive", "scripts/exa-residual-signal-deep-dive.mjs"),
    step("Probe Exa Websets monitor access", "scripts/exa-websets-monitor.mjs"),
    step("Run Exa monitor", "scripts/exa-monitor.mjs"),
    step("Refresh final derived display fields", "scripts/refresh-derived.mjs"),
    step("Triage monitor alerts into promotion queue", "scripts/triage-alerts.mjs"),
    step("Build Feishu alert card", "scripts/build-feishu-card.mjs"),
    step("Export CSV attachments", "scripts/export-csv.mjs"),
    step("Export SQLite database", "scripts/export-sqlite.mjs"),
    step("Export completion audit", "scripts/export-completion-audit.mjs"),
    step("Export original objective audit", "scripts/export-objective-audit.mjs"),
    step("Export current state lock", "scripts/export-current-state.mjs"),
    step("Export latest monitor run receipt", "scripts/export-monitor-receipt.mjs"),
    step("Export standalone HTML report", "scripts/export-standalone-html.mjs"),
    step("Validate page data", "scripts/validate-brief.mjs", { softFail: true }),
    step("Validate frontend structure", "scripts/validate-frontend.mjs", { softFail: true }),
    step("Validate standalone deliverable", "scripts/validate-deliverable.mjs", {
      softFail: true,
      enabled: enableBrowserValidation,
    }),
    step("Save timestamped snapshot", "scripts/snapshot-current.mjs"),
    step("Validate latest snapshot", "scripts/validate-snapshot.mjs", { softFail: true }),
    step("Send Feishu alert card", "scripts/send-feishu-card.mjs"),
  ],
};

if (!existsSync(new URL("../.env", import.meta.url))) {
  throw new Error("Missing .env. Add EXA_API_KEY before running Exa workflows.");
}

function runStep({ label, script }) {
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
  steps: workflows[mode]
    .filter((item) => item.enabled !== false)
    .map(({ label, script, softFail = false }) => ({ label, script, softFail })),
}, null, 2));

const softFailures = [];

for (const step of workflows[mode]) {
  if (step.enabled === false) {
    console.log(`\n↷ Skipping ${step.label} (ENABLE_BROWSER_VALIDATION is off)`);
    continue;
  }

  try {
    await runStep(step);
  } catch (error) {
    if (step.softFail) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⚠ ${step.label} failed but was marked non-blocking: ${message}`);
      softFailures.push({
        label: step.label,
        script: step.script,
        message,
      });
      continue;
    }
    throw error;
  }
}

console.log(JSON.stringify({
  ok: softFailures.length === 0,
  mode,
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  elapsedSeconds: Number(((Date.now() - startedAt.getTime()) / 1000).toFixed(1)),
  softFailures,
}, null, 2));
