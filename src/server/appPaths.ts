import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type AppPaths = {
  rootDir: string;
  configPath: string;
  localesDir: string;
  logsDir: string;
};

let cached: AppPaths | null = null;

export function getAppPaths(): AppPaths {
  if (cached) return cached;

  const envHome = process.env.PHIRA_MP_HOME?.trim();
  const cwd = process.cwd();

  if (envHome && envHome.length > 0) {
    cached = {
      rootDir: envHome,
      configPath: join(envHome, "server_config.yml"),
      localesDir: join(envHome, "locales"),
      logsDir: join(envHome, "logs")
    };
    return cached;
  }

  if (existsSync(join(cwd, "locales"))) {
    cached = {
      rootDir: cwd,
      configPath: join(cwd, "server_config.yml"),
      localesDir: join(cwd, "locales"),
      logsDir: join(cwd, "logs")
    };
    return cached;
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const nearCandidates = [join(here, "..", ".."), join(here, "..", "..", "..")];
  for (const rootDir of nearCandidates) {
    if (!existsSync(join(rootDir, "locales"))) continue;
    cached = {
      rootDir,
      configPath: join(rootDir, "server_config.yml"),
      localesDir: join(rootDir, "locales"),
      logsDir: join(rootDir, "logs")
    };
    return cached;
  }

  const rootDir = dirname(process.execPath);

  cached = {
    rootDir,
    configPath: join(rootDir, "server_config.yml"),
    localesDir: join(rootDir, "locales"),
    logsDir: join(rootDir, "logs")
  };

  return cached;
}

