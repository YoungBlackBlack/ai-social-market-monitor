import { access, cp, lstat, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootPath = resolve(fileURLToPath(new URL("..", import.meta.url)));

function filePath(relativePath) {
  return resolve(rootPath, relativePath);
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(path) {
  await mkdir(path, { recursive: true });
}

async function seedDirectory(sourcePath, targetPath) {
  if (!(await pathExists(sourcePath))) return;
  await ensureDirectory(targetPath);
  await cp(sourcePath, targetPath, {
    recursive: true,
    force: false,
    errorOnExist: false,
  });
}

async function ensureDirectoryLink(linkPath, targetPath) {
  try {
    const stats = await lstat(linkPath);
    if (stats.isSymbolicLink()) {
      const linkedPath = await realpath(linkPath);
      if (linkedPath === targetPath) return;
    }
    await rm(linkPath, { recursive: true, force: true });
  } catch {
    // No existing path.
  }
  await symlink(targetPath, linkPath, "dir");
}

async function ensureEnvFile() {
  const envPath = filePath(".env");
  const shouldSync = /^(1|true|yes)$/i.test(process.env.WRITE_ENV_FILE_FROM_PROCESS_ENV ?? "");
  if ((await pathExists(envPath)) && !shouldSync) {
    return { wroteEnvFile: false, envPath };
  }

  const pairs = [
    ["EXA_API_KEY", process.env.EXA_API_KEY],
    ["FEISHU_WEBHOOK_URL", process.env.FEISHU_WEBHOOK_URL],
    ["FEISHU_WEBHOOK_SECRET", process.env.FEISHU_WEBHOOK_SECRET],
  ].filter(([, value]) => typeof value === "string" && value.length > 0);

  if (pairs.length === 0) {
    return { wroteEnvFile: false, envPath };
  }

  const content = `${pairs.map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("\n")}\n`;
  await writeFile(envPath, content, "utf8");
  return { wroteEnvFile: true, envPath };
}

async function ensureStateLinks() {
  const configuredStateDir = process.env.STATE_DIR?.trim();
  if (!configuredStateDir) {
    return {
      linkedState: false,
      stateDirPath: null,
    };
  }

  const stateDirPath = resolve(configuredStateDir);
  const dataTargetPath = resolve(stateDirPath, "data");
  const exportTargetPath = resolve(stateDirPath, "exports");

  await ensureDirectory(stateDirPath);
  await seedDirectory(filePath("data"), dataTargetPath);
  await seedDirectory(filePath("exports"), exportTargetPath);
  await ensureDirectoryLink(filePath("data"), dataTargetPath);
  await ensureDirectoryLink(filePath("exports"), exportTargetPath);

  return {
    linkedState: true,
    stateDirPath,
    dataTargetPath,
    exportTargetPath,
  };
}

export async function bootstrapRuntime() {
  const env = await ensureEnvFile();
  const state = await ensureStateLinks();
  return {
    rootPath,
    ...env,
    ...state,
  };
}
