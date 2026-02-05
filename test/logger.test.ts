import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Logger } from "../src/server/logger.js";

function makeTempDir(name: string): string {
  const dir = join(tmpdir(), "phira-mp-nodejs-logger-tests", name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function tryForceTty(value: boolean): () => void {
  const desc = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
  try {
    Object.defineProperty(process.stdout, "isTTY", { value, configurable: true });
    return () => {
      try {
        if (desc) Object.defineProperty(process.stdout, "isTTY", desc);
        else delete (process.stdout as any).isTTY;
      } catch {
      }
    };
  } catch {
    return () => {};
  }
}

describe("Logger", () => {
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  let restoreTty: (() => void) | null = null;
  let prevNoColor: string | undefined;
  let prevTerm: string | undefined;

  beforeEach(() => {
    stdoutChunks.length = 0;
    stderrChunks.length = 0;

    vi.spyOn(process.stdout, "write").mockImplementation(((chunk: any) => {
      stdoutChunks.push(String(chunk));
      return true;
    }) as any);
    vi.spyOn(process.stderr, "write").mockImplementation(((chunk: any) => {
      stderrChunks.push(String(chunk));
      return true;
    }) as any);

    prevNoColor = process.env.NO_COLOR;
    prevTerm = process.env.TERM;
    delete process.env.NO_COLOR;
    process.env.TERM = "xterm-256color";

    restoreTty = tryForceTty(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (restoreTty) restoreTty();
    if (prevNoColor === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = prevNoColor;
    if (prevTerm === undefined) delete process.env.TERM;
    else process.env.TERM = prevTerm;
  });

  test("debug 为蓝色、info 为绿色、mark 为灰色、warn 为黄色、error 为红色", () => {
    const logsDir = makeTempDir("logger-colors");
    const logger = new Logger({ logsDir, minLevel: "DEBUG", consoleMinLevel: "DEBUG" });
    logger.debug("d");
    logger.info("i");
    logger.mark("m");
    logger.warn("w");
    logger.error("e");
    logger.close();

    const stdoutLines = stdoutChunks.join("").split("\n").filter(Boolean);
    const stderrLines = stderrChunks.join("").split("\n").filter(Boolean);

    const debugLine = stdoutLines.find((l) => l.includes("[DEBUG] d"));
    const infoLine = stdoutLines.find((l) => l.includes("[INFO] i"));
    const markLine = stdoutLines.find((l) => l.includes("[MARK] m"));
    const warnLine = stderrLines.find((l) => l.includes("[WARN] w"));
    const errorLine = stderrLines.find((l) => l.includes("[ERROR] e"));
    expect(debugLine).toBeTruthy();
    expect(infoLine).toBeTruthy();
    expect(markLine).toBeTruthy();
    expect(warnLine).toBeTruthy();
    expect(errorLine).toBeTruthy();

    expect(debugLine!).toContain("\x1b[34m");
    expect(infoLine!).toContain("\x1b[32m");
    expect(markLine!).toContain("\x1b[90m");
    expect(warnLine!).toContain("\x1b[33m");
    expect(errorLine!).toContain("\x1b[31m");
  });

  test("minLevel=INFO 时不输出 debug", () => {
    const logsDir = makeTempDir("logger-minlevel");
    const logger = new Logger({ logsDir, minLevel: "INFO", consoleMinLevel: "DEBUG" });
    logger.debug("d2");
    logger.info("i2");
    logger.close();

    const stdout = stdoutChunks.join("");
    expect(stdout.includes("[DEBUG] d2")).toBe(false);
    expect(stdout.includes("[INFO] i2")).toBe(true);
  });
});

