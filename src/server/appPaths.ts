import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export type AppPaths = {
  appDir: string;
  localesDir: string;
  configPath: string;
  logsDir: string;
};

export function getAppPaths(): AppPaths {
  const envHome = process.env.PHIRA_MP_HOME?.trim();
  if (envHome) {
    return {
      appDir: envHome,
      localesDir: join(envHome, "locales"),
      configPath: join(envHome, "server_config.yml"),
      logsDir: join(envHome, "logs")
    };
  }

  const cwd = process.cwd();
  const cwdLocales = join(cwd, "locales");
  if (existsSync(cwdLocales)) {
    return {
      appDir: cwd,
      localesDir: cwdLocales,
      configPath: join(cwd, "server_config.yml"),
      logsDir: join(cwd, "logs")
    };
  }

  const exeDir = dirname(process.execPath);
  return {
    appDir: exeDir,
    localesDir: join(exeDir, "locales"),
    configPath: join(exeDir, "server_config.yml"),
    logsDir: join(exeDir, "logs")
  };
}

