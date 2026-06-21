import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import cron from "node-cron";
import { bootstrapRuntime } from "./scripts/bootstrap-runtime.mjs";

const runtime = await bootstrapRuntime();
const port = Number(process.env.PORT ?? 3000);
const timezone = process.env.SCHEDULE_TIMEZONE || "Asia/Shanghai";
const monitorSchedule = process.env.MONITOR_CRON || "0 9 * * *";
const fullRebuildSchedule = process.env.FULL_REBUILD_CRON || "30 9 * * 1";
const enableScheduler = !/^(0|false|no)$/i.test(process.env.ENABLE_SCHEDULER ?? "true");
const runMonitorOnStartup = !/^(0|false|no)$/i.test(process.env.RUN_MONITOR_ON_STARTUP ?? "true");
const enableFullRebuild = !/^(0|false|no)$/i.test(process.env.ENABLE_FULL_REBUILD ?? "true");

let activeRun = null;
let lastRun = null;
let lastSuccessfulRun = null;
let lastFailedRun = null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".sqlite": "application/vnd.sqlite3",
  ".txt": "text/plain; charset=utf-8",
};

function workspacePath(relativePath) {
  return resolve(runtime.rootPath, relativePath);
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveRequestPath(urlPath) {
  if (urlPath === "/" || urlPath === "") {
    const standalonePath = workspacePath("exports/exa-ai-social-report.html");
    if (await fileExists(standalonePath)) return standalonePath;
    return workspacePath("index.html");
  }

  if (urlPath === "/healthz") return null;
  if (urlPath === "/statusz") return null;

  const safePath = resolve(runtime.rootPath, `.${urlPath}`);
  if (!safePath.startsWith(runtime.rootPath)) return undefined;
  return safePath;
}

function runWorkflow(mode, trigger) {
  if (activeRun) {
    return Promise.resolve({
      ok: false,
      skipped: true,
      reason: `A ${activeRun.mode} run started at ${activeRun.startedAt} is still active.`,
    });
  }

  return new Promise((resolvePromise) => {
    const startedAt = new Date().toISOString();
    activeRun = { mode, trigger, startedAt };
    const args = ["scripts/run-all.mjs"];
    if (mode === "full") args.push("--full");

    const child = spawn(process.execPath, args, {
      cwd: runtime.rootPath,
      env: process.env,
      stdio: "inherit",
    });

    child.on("close", (code) => {
      const finishedAt = new Date().toISOString();
      lastRun = {
        mode,
        trigger,
        startedAt,
        finishedAt,
        exitCode: code ?? 1,
      };
      if (code === 0) lastSuccessfulRun = lastRun;
      else lastFailedRun = lastRun;
      activeRun = null;
      resolvePromise({
        ok: code === 0,
        exitCode: code ?? 1,
        mode,
        trigger,
        startedAt,
        finishedAt,
      });
    });

    child.on("error", (error) => {
      const finishedAt = new Date().toISOString();
      lastRun = {
        mode,
        trigger,
        startedAt,
        finishedAt,
        exitCode: 1,
        error: String(error),
      };
      lastFailedRun = lastRun;
      activeRun = null;
      resolvePromise({
        ok: false,
        exitCode: 1,
        mode,
        trigger,
        startedAt,
        finishedAt,
        error: String(error),
      });
    });
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJsonFile(relativePath, fallback = null) {
  try {
    return JSON.parse(await readFile(workspacePath(relativePath), "utf8"));
  } catch {
    return fallback;
  }
}

const server = createServer(async (request, response) => {
  const { url = "/" } = request;
  const path = new URL(url, "http://127.0.0.1").pathname;

  if (path === "/healthz") {
    sendJson(response, 200, {
      ok: true,
      activeRun,
      lastRun,
      scheduler: enableScheduler,
    });
    return;
  }

  if (path === "/statusz") {
    const latestMonitorRun = await readJsonFile("exports/latest-monitor-run.json", {});
    const currentState = await readJsonFile("exports/current-state.json", {});
    const latestFailure =
      lastFailedRun && (!lastSuccessfulRun || lastFailedRun.finishedAt > lastSuccessfulRun.finishedAt)
        ? lastFailedRun
        : null;
    sendJson(response, 200, {
      ok: true,
      rootPath: runtime.rootPath,
      stateDirPath: runtime.stateDirPath,
      linkedState: runtime.linkedState,
      wroteEnvFile: runtime.wroteEnvFile,
      persistence: {
        linkedState: runtime.linkedState,
        stateDirPath: runtime.stateDirPath,
        dataTargetPath: runtime.dataTargetPath,
        exportTargetPath: runtime.exportTargetPath,
        wroteEnvFile: runtime.wroteEnvFile,
      },
      activeRun,
      lastRun,
      lastSuccessfulRun,
      lastFailedRun,
      latestFailure,
      latestMonitor: {
        generatedAt: latestMonitorRun.monitorGeneratedAt ?? null,
        recentSignals: latestMonitorRun.summary?.recentResults ?? null,
        newAlerts: latestMonitorRun.summary?.newAlerts ?? null,
        alertClosure: latestMonitorRun.alertClosure ?? null,
      },
      validators: {
        strictCompletionStatus: currentState.strictCompletionStatus ?? null,
        presentationReady: currentState.strictCompletionPresentationReady ?? null,
        latestAlertPendingRows: currentState.counts?.latestAlertPendingRows ?? null,
        recentSignalPendingRows: currentState.counts?.recentSignalPendingRows ?? null,
      },
      monitorSchedule,
      fullRebuildSchedule: enableFullRebuild ? fullRebuildSchedule : null,
      timezone,
    });
    return;
  }

  const filePath = await resolveRequestPath(path);
  if (filePath === undefined) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(JSON.stringify({
    ok: true,
    service: "ai-social-market-monitor",
    port,
    scheduler: enableScheduler,
    timezone,
    monitorSchedule,
    fullRebuildSchedule: enableFullRebuild ? fullRebuildSchedule : null,
    linkedState: runtime.linkedState,
    stateDirPath: runtime.stateDirPath,
  }, null, 2));
});

if (enableScheduler) {
  cron.schedule(monitorSchedule, () => {
    void runWorkflow("monitor", "scheduled-monitor");
  }, { timezone });

  if (enableFullRebuild) {
    cron.schedule(fullRebuildSchedule, () => {
      void runWorkflow("full", "scheduled-full-rebuild");
    }, { timezone });
  }

  if (runMonitorOnStartup) {
    setTimeout(() => {
      void runWorkflow("monitor", "startup");
    }, 1000);
  }
}
