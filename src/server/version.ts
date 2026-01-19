import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getAppPaths } from "./appPaths.js";

export function readAppVersion(): string {
  const env = process.env.PHIRA_MP_VERSION?.trim();
  if (env) return env;
  try {
    const { appDir } = getAppPaths();
    const pkgPath = join(appDir, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

